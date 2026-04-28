"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { generateTicketQrDataUrl, type QrTicketSource } from "@/lib/qr";

type TicketQrProps = {
  ticket: QrTicketSource;
  locked?: boolean;
  lockedMessage?: string;
};

export function TicketQr({ ticket, locked = false, lockedMessage = "QR unlocks after payment is confirmed." }: TicketQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (locked) {
      setDataUrl(null);
      setErrorMessage(null);
      return;
    }

    generateTicketQrDataUrl(ticket)
      .then((nextDataUrl) => {
        if (mounted) {
          setDataUrl(nextDataUrl);
          setErrorMessage(null);
        }
      })
      .catch(() => {
        if (mounted) {
          setDataUrl(null);
          setErrorMessage("QR could not be generated.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [locked, ticket]);

  if (locked) {
    return (
      <div className="flex min-h-40 items-center justify-center border border-white/[0.06] bg-black p-4 text-center">
        <div>
          <QrCode className="mx-auto h-8 w-8 text-white/25" aria-hidden="true" />
          <p className="mt-3 text-sm leading-6 text-white/45">{lockedMessage}</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="border border-red-400/25 bg-red-400/[0.035] p-4 text-sm text-red-100" aria-live="polite">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="flex min-h-40 items-center justify-center border border-white/[0.06] bg-black p-4">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR code for ticket ${ticket.ticket_code}`} className="h-40 w-40 bg-white p-2" />
      ) : (
        <div className="h-40 w-40 border border-white/[0.05] bg-white/[0.03] motion-safe:animate-pulse" aria-label="Generating QR code" />
      )}
    </div>
  );
}
