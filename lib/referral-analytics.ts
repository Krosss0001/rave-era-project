export type ReferralAnalyticsReferralRow = {
  id?: string;
  event_id: string | null;
  code: string;
  source: string | null;
  label: string | null;
  clicks: number;
  telegram_starts: number;
  registrations?: number;
  confirmed?: number;
  paid?: number;
  checked_in?: number;
};

export type ReferralAnalyticsRegistrationRow = {
  id: string;
  event_id: string;
  referral_code: string | null;
  status: string | null;
};

export type ReferralAnalyticsTicketRow = {
  registration_id: string | null;
  event_id: string;
  payment_status: string | null;
  status: string | null;
  checked_in_at: string | null;
};

export type ReferralMetric = {
  key: string;
  eventId: string;
  code: string;
  source: string;
  label: string | null;
  clicks: number;
  telegramStarts: number;
  starts: number;
  registrations: number;
  confirmed: number;
  paid: number;
  checkedIn: number;
  conversionRate: number;
};

function metricKey(eventId: string, code: string) {
  return `${eventId}:${code}`;
}

function cleanCode(value: string | null | undefined) {
  const code = value?.trim();
  return code ? code : null;
}

function emptyMetric(eventId: string, code: string): ReferralMetric {
  return {
    key: metricKey(eventId, code),
    eventId,
    code,
    source: "registration",
    label: null,
    clicks: 0,
    telegramStarts: 0,
    starts: 0,
    registrations: 0,
    confirmed: 0,
    paid: 0,
    checkedIn: 0,
    conversionRate: 0
  };
}

function finalizeMetric(metric: ReferralMetric) {
  metric.starts = metric.clicks + metric.telegramStarts;
  metric.conversionRate = Math.round((metric.registrations / Math.max(metric.starts, 1)) * 1000) / 10;
  return metric;
}

export function buildReferralMetrics(
  referrals: ReferralAnalyticsReferralRow[],
  registrations: ReferralAnalyticsRegistrationRow[],
  tickets: ReferralAnalyticsTicketRow[]
) {
  const metrics = new Map<string, ReferralMetric>();
  const ticketsByRegistration = tickets.reduce<Map<string, ReferralAnalyticsTicketRow[]>>((items, ticket) => {
    if (!ticket.registration_id) {
      return items;
    }

    items.set(ticket.registration_id, [...(items.get(ticket.registration_id) ?? []), ticket]);
    return items;
  }, new Map());

  for (const referral of referrals) {
    const eventId = referral.event_id;
    const code = cleanCode(referral.code);

    if (!eventId || !code) {
      continue;
    }

    metrics.set(metricKey(eventId, code), {
      ...emptyMetric(eventId, code),
      source: referral.label || referral.source || "referral",
      label: referral.label,
      clicks: referral.clicks ?? 0,
      telegramStarts: referral.telegram_starts ?? 0
    });
  }

  for (const registration of registrations) {
    const code = cleanCode(registration.referral_code);

    if (!registration.event_id || !code) {
      continue;
    }

    const key = metricKey(registration.event_id, code);
    const metric = metrics.get(key) ?? emptyMetric(registration.event_id, code);
    const registrationTickets = ticketsByRegistration.get(registration.id) ?? [];

    metric.registrations += 1;
    metric.confirmed += registration.status === "confirmed" ? 1 : 0;
    metric.paid += registrationTickets.some((ticket) => ticket.payment_status === "paid") ? 1 : 0;
    metric.checkedIn += registrationTickets.some((ticket) => ticket.status === "used" || ticket.checked_in_at !== null) ? 1 : 0;
    metrics.set(key, metric);
  }

  return Array.from(metrics.values()).map(finalizeMetric);
}

export function getReferralMetricsByKey(metrics: ReferralMetric[]) {
  return metrics.reduce<Record<string, ReferralMetric>>((items, metric) => {
    items[metric.key] = metric;
    return items;
  }, {});
}

export function sortReferralMetricsByRegistrations(metrics: ReferralMetric[]) {
  return [...metrics].sort(
    (first, second) =>
      second.registrations - first.registrations ||
      second.confirmed - first.confirmed ||
      second.paid - first.paid ||
      second.starts - first.starts ||
      first.code.localeCompare(second.code)
  );
}

export function sortReferralMetricsByConversion(metrics: ReferralMetric[]) {
  return [...metrics]
    .filter((metric) => metric.starts > 0 || metric.registrations > 0)
    .sort(
      (first, second) =>
        second.conversionRate - first.conversionRate ||
        second.registrations - first.registrations ||
        second.starts - first.starts ||
        first.code.localeCompare(second.code)
    );
}

export function formatReferralConversion(value: number) {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}
