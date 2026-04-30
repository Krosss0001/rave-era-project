"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { generateTicketQrDataUrl, type QrTicketSource } from "@/lib/qr";

type TicketQrProps = {
  ticket: QrTicketSource;
  locked?: boolean;
  lockedMessage?: string;
};

export function TicketQr({ ticket, locked = false, lockedMessage = "QR відкриється після підтвердження квитка." }: TicketQrProps) {
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
          setErrorMessage("Не вдалося створити QR.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [locked, ticket]);

  if (locked) {
    return (
      <div className="flex min-h-48 items-center justify-center border border-white/[0.06] bg-black p-5 text-center sm:min-h-56">
        <div>
          <QrCode className="mx-auto h-9 w-9 text-primary/70" aria-hidden="true" />
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/58">{lockedMessage}</p>
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
    <div className="flex min-h-48 items-center justify-center border border-white/[0.06] bg-black p-4 sm:min-h-56">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR квитка ${ticket.ticket_code}`} className="h-44 w-44 bg-white p-2 sm:h-52 sm:w-52" />
      ) : (
        <div className="h-44 w-44 border border-white/[0.05] bg-white/[0.03] motion-safe:animate-pulse sm:h-52 sm:w-52" aria-label="Створення QR" />
      )}
    </div>
  );
}
