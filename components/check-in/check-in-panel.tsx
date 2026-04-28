"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Camera, CheckCircle2, Search, TriangleAlert } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { parseTicketQrInput } from "@/lib/qr";
import { StatusBadge, getStatusBadgeVariant } from "@/components/shared/status-badge";

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

  if (normalized.includes("ticket_already_used")) {
    return "Цей квиток уже використано для входу.";
  }

  if (normalized.includes("ticket_not_active_paid")) {
    return "Для входу доступні лише активні підтверджені квитки.";
  }

  return "Не вдалося підтвердити вхід.";
}

export function CheckInPanel() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  const canCheckIn = ticket?.status === "active" && ticket.payment_status === "paid" && !ticket.checked_in;

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

      if (nextTicket.checked_in || nextTicket.status === "used") {
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
        setScannerMessage("Некоректний QR-код.");
        return;
      }

      const scannedTicketCode = parsedInput.ticketCode;

      if (!scannedTicketCode) {
        setScannerStatus("error");
        setScannerMessage("Некоректний QR-код.");
        return;
      }

      setTicketCode(scannedTicketCode);
      setScannerStatus("detected");
      setScannerMessage("QR знайдено");
      stopScanner(true);
      await validateTicketInput(value);
    },
    [stopScanner, validateTicketInput]
  );

  const startScanner = useCallback(async () => {
    const BarcodeDetector = getBarcodeDetector();

    if (!navigator.mediaDevices?.getUserMedia || !BarcodeDetector) {
      setScannerOpen(false);
      setScannerStatus("unsupported");
      setScannerMessage("Камера не підтримується, введіть код вручну");
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

      if (!videoRef.current) {
        throw new Error("Попередній перегляд камери недоступний.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      scanActiveRef.current = true;
      setScannerStatus("scanning");
      setScannerMessage("Scanning...");

      const scan = async () => {
        if (!scanActiveRef.current || !videoRef.current) {
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          const rawValue = codes.find((code) => typeof code.rawValue === "string" && code.rawValue.trim())?.rawValue;

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
          setScannerMessage("Не вдалося просканувати, введіть код вручну");
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
      setScannerMessage("Камера не підтримується, введіть код вручну");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [handleScannedValue, stopScanner]);

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
    <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:gap-8">
      <form onSubmit={validateTicket} className="border-y border-white/[0.05] bg-[#020202] py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Ticket lookup</p>
            <p className="mt-2 text-sm leading-6 text-white/48">Scan a QR code or enter a ticket code manually.</p>
          </div>
          <StatusBadge label={scannerStatus} variant={scannerStatus === "error" ? "danger" : scannerStatus === "scanning" ? "success" : "neutral"} size="sm" />
        </div>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Ticket code</span>
          <input
            type="text"
            value={ticketCode}
            onChange={(event) => setTicketCode(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 font-mono text-sm uppercase text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 border border-primary/35 px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-500 hover:bg-primary hover:text-black active:scale-[0.98]"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {scannerOpen ? "Stop scan" : "Scan QR"}
          </button>
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 bg-primary px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-500 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {loading ? "Checking" : "Validate"}
          </button>
        </div>

        {scannerOpen ? (
          <div className="mt-4 overflow-hidden border border-white/[0.06] bg-black">
            <div className="aspect-[4/3] w-full bg-[#030303]">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline aria-label="QR scanner camera preview" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                {scannerStatus === "starting" ? "Starting camera" : "Scanning"}
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

      <div className="border-y border-white/[0.05] bg-[#020202] py-8">
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
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Event title</p>
              <p className="mt-2 text-2xl font-black uppercase text-white">{ticket.event_title}</p>
            </div>
            <div className="grid gap-3 min-[380px]:grid-cols-2">
              {[
                ["Ticket code", ticket.ticket_code, ticket.ticket_code],
                ["Ticket status", ticket.status, ticket.status],
                ["Payment", ticket.payment_status, ticket.payment_status],
                ["Door entry", ticket.checked_in ? "checked in" : "not checked in", ticket.checked_in]
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
              className="focus-ring min-h-11 bg-primary px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-500 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {checkingIn ? "Confirming" : "Confirm check-in"}
            </button>
          </div>
        ) : (
          <div className="border border-white/[0.05] bg-[#030303] p-6">
            <p className="text-xl font-black uppercase text-white">No ticket selected</p>
            <p className="mt-3 text-sm leading-6 text-white/45">Validate a ticket code to see the event, payment state, and door status.</p>
          </div>
        )}
      </div>
    </section>
  );
}
