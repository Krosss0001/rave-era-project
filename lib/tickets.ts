export function generateTicketCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);

  crypto.getRandomValues(bytes);

  const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `RAV-${suffix}`;
}

export function buildQrPayload(ticketCode: string, eventId: string, userId: string | null) {
  return JSON.stringify({
    ticket_code: ticketCode,
    event_id: eventId,
    user_id: userId
  });
}
