export const PAYMENT_PLACEHOLDER_UA =
  "Оплата буде підключена наступним етапом. Після підтвердження оплати QR стане активним.";

export const PAYMENT_PLACEHOLDER_EN =
  "Payment will be connected in the next stage. After payment confirmation, QR will become active.";

export function getPaymentPlaceholderCopy(language: "ua" | "en") {
  return language === "ua" ? PAYMENT_PLACEHOLDER_UA : PAYMENT_PLACEHOLDER_EN;
}
