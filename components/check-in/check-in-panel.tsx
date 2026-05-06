"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { Camera, CheckCircle2, Search, TriangleAlert } from "lucide-react";
import jsQR from "jsqr";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { parseTicketQrInput } from "@/lib/qr";
import { StatusBadge, getStatusBadgeVariant } from "@/components/shared/status-badge";
import { useLanguage } from "@/lib/i18n/use-language";

type TicketRow = Pick<
  Database["public"]["Tables"]["tickets"]["Row"],
  "id" | "event_id" | "ticket_code" | "status" | "payment_status" | "checked_in" | "checked_in_at"
>;
type EventRow = Pick<Database["public"]["Tables"]["events"]["Row"], "id" | "title">;
type CheckInResult = Database["public"]["Functions"]["check_in_ticket"]["Returns"][number];

type ValidatedTicket = TicketRow & {
  event_title: string;
};

type NativeBarcodeDetector = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type NativeBarcodeDetectorConstructor = new (options?: { formats?: string[] }) => NativeBarcodeDetector;

function mapCheckInResult(result: CheckInResult): ValidatedTicket {
  return {
    id: result.ticket_id,
    event_id: result.event_id,
    event_title: result.event_title,
    ticket_code: result.ticket_code,
    status: result.status,
    payment_status: result.payment_status,
    checked_in: result.checked_in,
    checked_in_at: result.checked_in_at
  };
}

function getBarcodeDetector() {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as Window & { BarcodeDetector?: NativeBarcodeDetectorConstructor }).BarcodeDetector ?? null;
}

function waitForScannerVideo(videoRef: RefObject<HTMLVideoElement>, timeoutMs = 1200) {
  const startedAt = Date.now();

  return new Promise<HTMLVideoElement | null>((resolve) => {
    const check = () => {
      if (videoRef.current) {
        resolve(videoRef.current);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(null);
        return;
      }

      window.requestAnimationFrame(check);
    };

    check();
  });
}

function createNativeQrDetector() {
  const BarcodeDetector = getBarcodeDetector();

  if (!BarcodeDetector) {
    return null;
  }

  try {
    return new BarcodeDetector({ formats: ["qr_code"] });
  } catch (error) {
    logCheckInIssue("Native BarcodeDetector unavailable for QR format", {
      reason: error instanceof Error ? error.message : "unknown"
    });
    return null;
  }
}

function logCheckInIssue(message: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, details);
  }
}

function getCheckInErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("ticket_not_found") || normalized.includes("not found")) {
    return "Квиток не знайдено або доступ заборонено.";
  }

  if (normalized.includes("access_denied")) {
    return "У вас немає доступу до цієї події.";
  }

  if (normalized.includes("ticket_already_used") || normalized.includes("ticket_already_checked_in")) {
    return "Цей квиток уже використано для входу.";
  }

  if (normalized.includes("ticket_not_active_paid")) {
    return "Для входу доступні лише активні підтверджені квитки.";
  }

  return "Не вдалося підтвердити вхід.";
}

export function CheckInPanel() {
  const { language } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const scanActiveRef = useRef(false);
  const [ticketCode, setTicketCode] = useState("");
  const [ticket, setTicket] = useState<ValidatedTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<"idle" | "starting" | "scanning" | "detected" | "unsupported" | "error">("idle");
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const copy =
    language === "ua"
      ? {
          lookup: "Перевірка квитка",
          lookupCopy: "Скануйте QR або введіть код квитка вручну.",
          ticketCode: "Код квитка",
          scanQr: "Сканувати QR",
          stopScan: "Зупинити",
          validate: "Перевірити",
          checking: "Перевірка",
          starting: "Запуск камери",
          scanning: "Сканування",
          cameraUnsupported: "Камера не підтримується, введіть код вручну",
          invalidQr: "Некоректний QR-код.",
          qrDetected: "QR знайдено",
          scanFailed: "Не вдалося просканувати, введіть код вручну",
          previewUnavailable: "Попередній перегляд камери недоступний.",
          eventTitle: "Подія",
          ticketStatus: "Статус квитка",
          payment: "Оплата",
          doorEntry: "Вхід",
          checkedIn: "check-in виконано",
          notCheckedIn: "без check-in",
          confirming: "Підтвердження",
          confirm: "Підтвердити вхід",
          noTicket: "Квиток не вибрано",
          noTicketCopy: "Перевірте код квитка, щоб побачити подію, оплату та статус входу."
        }
      : {
          lookup: "Ticket lookup",
          lookupCopy: "Scan a QR code or enter a ticket code manually.",
          ticketCode: "Ticket code",
          scanQr: "Scan QR",
          stopScan: "Stop scan",
          validate: "Validate",
          checking: "Checking",
          starting: "Starting camera",
          scanning: "Scanning",
          cameraUnsupported: "Camera is not supported. Enter the code manually.",
          invalidQr: "Invalid QR code.",
          qrDetected: "QR detected",
          scanFailed: "Could not scan the QR. Enter the code manually.",
          previewUnavailable: "Camera preview is unavailable.",
          eventTitle: "Event title",
          ticketStatus: "Ticket status",
          payment: "Payment",
          doorEntry: "Door entry",
          checkedIn: "checked in",
          notCheckedIn: "not checked in",
          confirming: "Confirming",
          confirm: "Confirm check-in",
          noTicket: "No ticket selected",
          noTicketCopy: "Validate a ticket code to see the event, payment state, and door status."
        };

  const canCheckIn = ticket?.status === "active" && ticket.payment_status === "paid" && !ticket.checked_in && !ticket.checked_in_at;

  const stopScanner = useCallback((preserveStatus = false) => {
    scanActiveRef.current = false;

    if (scanFrameRef.current !== null) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerOpen(false);
    if (!preserveStatus) {
      setScannerStatus("idle");
    }
  }, []);

  const validateTicketInput = useCallback(async (input: string) => {
    setMessage(null);
    setTicket(null);

    const parsedInput = parseTicketQrInput(input);

    if (parsedInput.error) {
      logCheckInIssue("Check-in QR parse failed", { reason: parsedInput.error });
      setMessage({ type: "error", text: parsedInput.error });
      return;
    }

    const lookupTicketCode = parsedInput.ticketCode;

    if (!lookupTicketCode) {
      setMessage({ type: "error", text: "Некоректний QR-код." });
      return;
    }

    if (!supabase) {
      setMessage({ type: "error", text: "Supabase не налаштовано." });
      return;
    }

    setLoading(true);

    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("id,event_id,ticket_code,status,payment_status,checked_in,checked_in_at")
        .eq("ticket_code", lookupTicketCode)
        .maybeSingle();

      if (ticketError) {
        logCheckInIssue("Check-in ticket lookup failed", {
          ticketCode: lookupTicketCode,
          reason: ticketError.message
        });
        throw new Error(ticketError.message);
      }

      if (!ticketData) {
        logCheckInIssue("Check-in ticket not found", { ticketCode: lookupTicketCode });
        setMessage({ type: "error", text: "Квиток не знайдено або доступ заборонено." });
        return;
      }

      if (parsedInput.eventId && parsedInput.eventId !== ticketData.event_id) {
        logCheckInIssue("Check-in QR event mismatch", {
          ticketCode: lookupTicketCode,
          qrEventId: parsedInput.eventId,
          ticketEventId: ticketData.event_id
        });
        setMessage({ type: "error", text: "Некоректний QR-код." });
        return;
      }

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id,title")
        .eq("id", ticketData.event_id)
        .maybeSingle();

      if (eventError || !eventData) {
        logCheckInIssue("Check-in event lookup failed", {
          ticketCode: lookupTicketCode,
          eventId: ticketData.event_id,
          reason: eventError?.message
        });
        setMessage({ type: "error", text: "Не вдалося завантажити дані події." });
        return;
      }

      const nextTicket = {
        ...ticketData,
        event_title: (eventData as EventRow).title
      };

      setTicket(nextTicket);

      if (nextTicket.checked_in || nextTicket.checked_in_at || nextTicket.status === "used") {
        setMessage({ type: "warning", text: "Цей квиток уже використано для входу." });
      } else if (nextTicket.status !== "active" || nextTicket.payment_status !== "paid") {
        setMessage({ type: "warning", text: "Для входу доступні лише активні підтверджені квитки." });
      } else {
        setMessage({ type: "success", text: "Квиток дійсний для входу." });
      }
    } catch (error) {
      logCheckInIssue("Check-in validation failed", {
        reason: error instanceof Error ? error.message : "unknown"
      });
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Не вдалося перевірити квиток." });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  async function validateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await validateTicketInput(ticketCode);
  }

  const handleScannedValue = useCallback(
    async (value: string) => {
      const parsedInput = parseTicketQrInput(value);

      if (parsedInput.error) {
        logCheckInIssue("Check-in scanned QR parse failed", { reason: parsedInput.error });
        setScannerStatus("error");
        setScannerMessage(copy.invalidQr);
        return;
      }

      const scannedTicketCode = parsedInput.ticketCode;

      if (!scannedTicketCode) {
        setScannerStatus("error");
        setScannerMessage(copy.invalidQr);
        return;
      }

      setTicketCode(scannedTicketCode);
      setScannerStatus("detected");
      setScannerMessage(copy.qrDetected);
      stopScanner(true);
      await validateTicketInput(value);
    },
    [copy.invalidQr, copy.qrDetected, stopScanner, validateTicketInput]
  );

  const startScanner = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerOpen(false);
      setScannerStatus("unsupported");
      setScannerMessage(copy.cameraUnsupported);
      return;
    }

    setScannerOpen(true);
    setScannerStatus("starting");
    setScannerMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });

      streamRef.current = stream;

      const videoElement = await waitForScannerVideo(videoRef);

      if (!videoElement) {
        throw new Error(copy.previewUnavailable);
      }

      videoElement.srcObject = stream;
      await videoElement.play();

      const detector = createNativeQrDetector();
      scanActiveRef.current = true;
      setScannerStatus("scanning");
      setScannerMessage(detector ? "Scanning..." : "Scanning with fallback...");

      const scan = async () => {
        if (!scanActiveRef.current || !videoRef.current) {
          return;
        }

        try {
          let rawValue: string | undefined;

          if (detector) {
            const codes = await detector.detect(videoRef.current);
            rawValue = codes.find((code) => typeof code.rawValue === "string" && code.rawValue.trim())?.rawValue;
          } else {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const width = video.videoWidth;
            const height = video.videoHeight;

            if (canvas && width > 0 && height > 0) {
              canvas.width = width;
              canvas.height = height;

              const context = canvas.getContext("2d", { willReadFrequently: true });

              if (context) {
                context.drawImage(video, 0, 0, width, height);
                const imageData = context.getImageData(0, 0, width, height);
                rawValue = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth"
                })?.data;
              }
            }
          }

          if (rawValue) {
            scanActiveRef.current = false;
            await handleScannedValue(rawValue);
            return;
          }
        } catch (error) {
          logCheckInIssue("Check-in camera scan failed", {
            reason: error instanceof Error ? error.message : "unknown"
          });
          setScannerStatus("error");
          setScannerMessage(copy.scanFailed);
          stopScanner();
          return;
        }

        scanFrameRef.current = window.requestAnimationFrame(scan);
      };

      scanFrameRef.current = window.requestAnimationFrame(scan);
    } catch (error) {
      logCheckInIssue("Check-in camera start failed", {
        reason: error instanceof Error ? error.message : "unknown"
      });
      setScannerOpen(false);
      setScannerStatus("error");
      setScannerMessage(copy.cameraUnsupported);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [copy.cameraUnsupported, copy.previewUnavailable, copy.scanFailed, handleScannedValue, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  async function checkInTicket() {
    if (!supabase || !ticket || !canCheckIn) {
      return;
    }

    setCheckingIn(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.rpc("check_in_ticket", {
        ticket_code_input: ticket.ticket_code
      });

      if (error) {
        logCheckInIssue("Check-in RPC failed", {
          ticketCode: ticket.ticket_code,
          reason: error.message
        });
        throw new Error(error.message);
      }

      const updatedTicket = data?.[0];

      if (!updatedTicket) {
        logCheckInIssue("Check-in RPC returned no ticket", { ticketCode: ticket.ticket_code });
        throw new Error("Не вдалося підтвердити вхід за квитком.");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (accessToken) {
        fetch("/api/referrals/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            ticketId: updatedTicket.ticket_id,
            source: "check_in",
            action: "checked_in"
          }),
          keepalive: true
        }).catch(() => undefined);
      }

      setTicket(mapCheckInResult(updatedTicket));
      setMessage({ type: "success", text: "Вхід за квитком підтверджено." });
    } catch (error) {
      logCheckInIssue("Check-in action failed", {
        ticketCode: ticket.ticket_code,
        reason: error instanceof Error ? error.message : "unknown"
      });
      setMessage({ type: "error", text: error instanceof Error ? getCheckInErrorMessage(error.message) : "Не вдалося підтвердити вхід." });
    } finally {
      setCheckingIn(false);
    }
  }

  return (
    <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1fr)] lg:gap-8">
      <form onSubmit={validateTicket} className="border-y border-white/[0.05] bg-[#020202] py-6 sm:py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary sm:tracking-[0.22em]">{copy.lookup}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{copy.lookupCopy}</p>
          </div>
          <StatusBadge label={scannerStatus} variant={scannerStatus === "error" ? "danger" : scannerStatus === "scanning" ? "success" : "neutral"} size="sm" />
        </div>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{copy.ticketCode}</span>
          <input
            type="text"
            value={ticketCode}
            onChange={(event) => setTicketCode(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            className="mt-2 min-h-14 w-full border border-white/[0.08] bg-black px-3 font-mono text-base uppercase text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
          />
        </label>
        <div className="mt-4 grid gap-2 min-[380px]:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              if (scannerOpen) {
                stopScanner();
              } else {
                void startScanner();
              }
            }}
            className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 border border-primary/35 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-300 hover:bg-primary hover:text-black active:scale-[0.98]"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {scannerOpen ? copy.stopScan : copy.scanQr}
          </button>
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {loading ? copy.checking : copy.validate}
          </button>
        </div>

        {scannerOpen ? (
          <div className="relative mt-4 overflow-hidden border border-primary/25 bg-black shadow-[0_0_54px_rgba(0,255,136,0.075)]">
            <span className="visual-scan-line pointer-events-none absolute inset-x-0 top-0 z-10 h-20 opacity-70" aria-hidden="true" />
            <span className="pointer-events-none absolute inset-3 z-10 border border-primary/10" aria-hidden="true" />
            <div className="aspect-square max-h-[58vh] w-full bg-[#030303] sm:aspect-[4/3] sm:max-h-[70vh]">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline aria-label="QR scanner camera preview" />
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                {scannerStatus === "starting" ? copy.starting : copy.scanning}
              </p>
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(0,255,136,0.55)] motion-safe:animate-pulse" aria-hidden="true" />
            </div>
          </div>
        ) : null}

        {scannerMessage ? (
          <p
            className={
              scannerStatus === "detected"
                ? "mt-3 border border-primary/30 bg-primary/[0.04] px-3 py-2 text-sm text-primary"
                : "mt-3 border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-sm text-white/65"
            }
            aria-live="polite"
          >
            {scannerMessage}
          </p>
        ) : null}
      </form>

      <div className="border-y border-white/[0.05] bg-[#020202] py-6 sm:py-8">
        {message ? (
          <div
            className={
              message.type === "success"
                ? "mb-5 border border-primary/30 bg-primary/[0.04] p-4 text-sm text-primary"
                : message.type === "warning"
                  ? "mb-5 border border-white/[0.08] bg-white/[0.025] p-4 text-sm text-white/65"
                  : "mb-5 border border-red-400/25 bg-red-400/[0.035] p-4 text-sm text-red-100"
            }
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              {message.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : message.type === "warning" ? (
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : null}
              <span>{message.text}</span>
            </div>
          </div>
        ) : null}

        {ticket ? (
          <div className="grid gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{copy.eventTitle}</p>
              <p className="mt-2 break-words text-2xl font-black uppercase leading-tight text-white">{ticket.event_title}</p>
            </div>
            <div className="grid gap-3 min-[380px]:grid-cols-2">
              {[
                [copy.ticketCode, ticket.ticket_code, ticket.ticket_code],
                [copy.ticketStatus, ticket.status, ticket.status],
                [copy.payment, ticket.payment_status, ticket.payment_status],
                [copy.doorEntry, ticket.checked_in ? copy.checkedIn : copy.notCheckedIn, ticket.checked_in]
              ].map(([label, value, badgeValue]) => (
                <div key={String(label)} className="border border-white/[0.05] bg-[#030303] p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">{label}</p>
                  <StatusBadge label={String(value)} variant={getStatusBadgeVariant(badgeValue)} size="sm" className="mt-2" />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={checkInTicket}
              disabled={!canCheckIn || checkingIn}
              aria-busy={checkingIn}
            className="focus-ring min-h-12 bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {checkingIn ? copy.confirming : copy.confirm}
            </button>
          </div>
        ) : (
          <div className="border border-white/[0.05] bg-[#030303] p-6">
            <p className="text-xl font-black uppercase text-white">{copy.noTicket}</p>
            <p className="mt-3 text-sm leading-6 text-white/45">{copy.noTicketCopy}</p>
          </div>
        )}
      </div>
    </section>
  );
}
