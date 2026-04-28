"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Camera, CheckCircle2, Search, TriangleAlert } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { parseTicketQrInput } from "@/lib/qr";

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

function getBadgeClass(value: string | boolean | null) {
  if (value === true || value === "active" || value === "paid") {
    return "border-primary/30 bg-primary/[0.04] text-primary";
  }

  if (value === "used" || value === false) {
    return "border-white/[0.08] bg-white/[0.025] text-white/60";
  }

  return "border-red-400/25 bg-red-400/[0.035] text-red-100";
}

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
      setMessage({ type: "error", text: parsedInput.error });
      return;
    }

    const lookupTicketCode = parsedInput.ticketCode;

    if (!lookupTicketCode) {
      setMessage({ type: "error", text: "Invalid QR payload." });
      return;
    }

    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured." });
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
        throw new Error(ticketError.message);
      }

      if (!ticketData) {
        setMessage({ type: "error", text: "Ticket not found or access denied." });
        return;
      }

      if (parsedInput.eventId && parsedInput.eventId !== ticketData.event_id) {
        setMessage({ type: "error", text: "Invalid QR payload." });
        return;
      }

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id,title")
        .eq("id", ticketData.event_id)
        .maybeSingle();

      if (eventError || !eventData) {
        setMessage({ type: "error", text: "Event details could not be loaded." });
        return;
      }

      const nextTicket = {
        ...ticketData,
        event_title: (eventData as EventRow).title
      };

      setTicket(nextTicket);

      if (nextTicket.checked_in || nextTicket.status === "used") {
        setMessage({ type: "warning", text: "This ticket has already been checked in." });
      } else if (nextTicket.status !== "active" || nextTicket.payment_status !== "paid") {
        setMessage({ type: "warning", text: "Only active, paid tickets can be checked in." });
      } else {
        setMessage({ type: "success", text: "Ticket is valid for check-in." });
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Ticket could not be validated." });
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
        setScannerStatus("error");
        setScannerMessage("Invalid QR payload.");
        return;
      }

      const scannedTicketCode = parsedInput.ticketCode;

      if (!scannedTicketCode) {
        setScannerStatus("error");
        setScannerMessage("Invalid QR payload.");
        return;
      }

      setTicketCode(scannedTicketCode);
      setScannerStatus("detected");
      setScannerMessage("QR detected");
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
      setScannerMessage("Camera not supported, use manual input");
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
        throw new Error("Camera preview is not available.");
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
        } catch {
          setScannerStatus("error");
          setScannerMessage("Camera scan failed, use manual input");
          stopScanner();
          return;
        }

        scanFrameRef.current = window.requestAnimationFrame(scan);
      };

      scanFrameRef.current = window.requestAnimationFrame(scan);
    } catch {
      setScannerOpen(false);
      setScannerStatus("error");
      setScannerMessage("Camera not supported, use manual input");
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
        throw new Error(error.message);
      }

      const updatedTicket = data?.[0];

      if (!updatedTicket) {
        throw new Error("Ticket could not be checked in.");
      }

      setTicket(mapCheckInResult(updatedTicket));
      setMessage({ type: "success", text: "Ticket checked in." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Check-in failed." });
    } finally {
      setCheckingIn(false);
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[0.72fr_1fr]">
      <form onSubmit={validateTicket} className="border-y border-white/[0.05] bg-[#020202] py-8">
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
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
            {loading ? "Validating" : "Validate"}
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
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Ticket code", ticket.ticket_code],
                ["Status", ticket.status],
                ["Payment status", ticket.payment_status],
                ["Checked in", ticket.checked_in ? "yes" : "no"]
              ].map(([label, value]) => (
                <div key={label} className="border border-white/[0.05] bg-[#030303] p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">{label}</p>
                  <span className={`mt-2 inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${getBadgeClass(value === "yes" ? true : value === "no" ? false : value)}`}>
                    {value}
                  </span>
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
              {checkingIn ? "Checking in" : "Check in"}
            </button>
          </div>
        ) : (
          <div className="border border-white/[0.05] bg-[#030303] p-6">
            <p className="text-xl font-black uppercase text-white">No ticket selected</p>
            <p className="mt-3 text-sm leading-6 text-white/45">Validate a ticket code to see event and check-in status.</p>
          </div>
        )}
      </div>
    </section>
  );
}
