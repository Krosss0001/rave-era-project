import QRCode from "qrcode";

export type QrTicketSource = {
  qr_payload?: string | null;
  ticket_code: string;
};

export type ParsedTicketQrInput =
  | {
      ticketCode: string;
      eventId: string | null;
      error: null;
    }
  | {
      ticketCode: null;
      eventId: null;
      error: string;
    };

export async function generateTicketQrDataUrl(ticket: QrTicketSource) {
  const payload = ticket.qr_payload || ticket.ticket_code;

  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 6
  });
}

export function parseTicketQrInput(value: string): ParsedTicketQrInput {
  const input = value.trim();

  if (!input) {
    return { ticketCode: null, eventId: null, error: "Введіть код квитка." };
  }

  if (!input.startsWith("{")) {
    return { ticketCode: input.toUpperCase(), eventId: null, error: null };
  }

  try {
    const payload = JSON.parse(input) as { ticket_code?: unknown; event_id?: unknown };
    const ticketCode = typeof payload.ticket_code === "string" ? payload.ticket_code.trim().toUpperCase() : "";
    const eventId = typeof payload.event_id === "string" && payload.event_id.trim() ? payload.event_id.trim() : null;

    if (!ticketCode) {
      return { ticketCode: null, eventId: null, error: "Некоректний QR-код." };
    }

    return { ticketCode, eventId, error: null };
  } catch {
    return { ticketCode: null, eventId: null, error: "Некоректний QR-код." };
  }
}
