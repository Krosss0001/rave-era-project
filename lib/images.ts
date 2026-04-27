export const FALLBACK_EVENT_IMAGE = "/placeholder.jpg";

export function getSafeImageSrc(value: string | null | undefined, fallback = FALLBACK_EVENT_IMAGE) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const candidate = value.trim();

  if (candidate.startsWith("/")) {
    return candidate;
  }

  try {
    const url = new URL(candidate);

    if (url.protocol !== "https:" || !isValidHostname(url.hostname)) {
      return fallback;
    }

    return candidate;
  } catch {
    return fallback;
  }
}

export function isFallbackImage(value: string, fallback = FALLBACK_EVENT_IMAGE) {
  return value === fallback;
}

function isValidHostname(hostname: string) {
  if (!hostname || hostname.length > 253 || hostname.includes("_")) {
    return false;
  }

  const labels = hostname.split(".");

  if (labels.length < 2) {
    return false;
  }

  return labels.every((label) => {
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label);
  });
}
