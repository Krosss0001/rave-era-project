export function formatEventDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date TBA";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsedDate);
}

export function formatPrice(price: number, currency: string) {
  const safePrice = Number.isFinite(price) ? price : 0;
  return `${new Intl.NumberFormat("en-US").format(safePrice)} ${currency || "UAH"}`;
}

export function isFreePrice(price: number) {
  return Number.isFinite(price) && price <= 0;
}

export function formatPriceForLanguage(price: number, currency: string, language: "ua" | "en") {
  if (isFreePrice(price)) {
    return language === "ua" ? "БЕЗКОШТОВНО" : "FREE";
  }

  return `${new Intl.NumberFormat(language === "ua" ? "uk-UA" : "en-US").format(price)} ${currency || "UAH"}`;
}

export function getCapacityPercent(registered: number, capacity: number) {
  if (!Number.isFinite(registered) || !Number.isFinite(capacity) || capacity <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(Math.round((registered / capacity) * 100), 100));
}
