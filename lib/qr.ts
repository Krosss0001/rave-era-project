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

function parseTicketPayloadObject(
  payload: { ticket_code?: unknown; event_id?: unknown; qr_payload?: unknown },
  depth: number
): ParsedTicketQrInput {
  const ticketCode = typeof payload.ticket_code === "string" ? payload.ticket_code.trim().toUpperCase() : "";
  const eventId = typeof payload.event_id === "string" && payload.event_id.trim() ? payload.event_id.trim() : null;

  if (ticketCode) {
    return { ticketCode, eventId, error: null };
  }

  if (typeof payload.qr_payload === "string" && payload.qr_payload.trim() && depth < 2) {
    return parseTicketQrInputValue(payload.qr_payload, depth + 1);
  }

  return { ticketCode: null, eventId: null, error: "Некоректний QR-код." };
}

function parseTicketQrInputValue(value: string, depth: number): ParsedTicketQrInput {
  const input = value.trim();

  if (!input) {
    return { ticketCode: null, eventId: null, error: "Введіть код квитка." };
  }

  if (!input.startsWith("{")) {
    return { ticketCode: input.toUpperCase(), eventId: null, error: null };
  }

  try {
    return parseTicketPayloadObject(JSON.parse(input) as { ticket_code?: unknown; event_id?: unknown; qr_payload?: unknown }, depth);
  } catch {
    return { ticketCode: null, eventId: null, error: "Некоректний QR-код." };
  }
}

export function parseTicketQrInput(value: string): ParsedTicketQrInput {
  return parseTicketQrInputValue(value, 0);
}
