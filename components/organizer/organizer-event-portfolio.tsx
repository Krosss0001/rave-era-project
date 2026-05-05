"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Archive, Copy, CreditCard, ExternalLink, Gauge, QrCode, Share2, Trash2, Users } from "lucide-react";
import type { RaveeraEvent } from "@/data/events";
import { getCurrentRole } from "@/lib/auth/get-role";
import { canManagePlatform } from "@/lib/auth/roles";
import { calculateEventStatsFromRows } from "@/lib/event-stats";
import { useLanguage } from "@/lib/i18n/use-language";
import { formatEventDate } from "@/lib/format";
import { getPaymentPlaceholderCopy } from "@/lib/payment-placeholder";
import {
  buildReferralMetrics,
  formatReferralConversion,
  sortReferralMetricsByRegistrations
} from "@/lib/referral-analytics";
import { slugify } from "@/lib/slugify";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { EVENT_SELECT_FIELDS } from "@/lib/supabase/event-fields";
import { mapDatabaseEvent } from "@/lib/supabase/event-mapper";
import type { BroadcastAudience, Database, EventStatus, PaymentStatus, RegistrationStatus, TicketStatus } from "@/lib/supabase/types";
import { TelegramBroadcastPanel } from "@/components/shared/telegram-broadcast-panel";
import { StatusBadge, getStatusBadgeVariant } from "@/components/shared/status-badge";

type RegistrationRow = Pick<
  Database["public"]["Tables"]["registrations"]["Row"],
  "id" | "event_id" | "name" | "email" | "phone" | "instagram_nickname" | "telegram_username" | "referral_code" | "status" | "created_at"
>;
type TicketRow = Pick<
  Database["public"]["Tables"]["tickets"]["Row"],
  "id" | "registration_id" | "event_id" | "status" | "payment_status" | "checked_in" | "checked_in_at"
>;
type ReferralRow = Pick<
  Database["public"]["Tables"]["referrals"]["Row"],
  "id" | "event_id" | "code" | "source" | "label" | "clicks" | "telegram_starts" | "registrations" | "confirmed" | "paid" | "checked_in"
>;
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
type OrganizerEvent = RaveeraEvent & { dbStatus?: EventStatus };
type RegistrationFilter = "all" | "confirmed" | "pending" | "paid" | "checked-in";
type RegistrationAction = "confirm_registration" | "cancel_registration" | "mark_payment_paid" | "mark_ticket_active" | "reset_check_in";
type EventForm = typeof initialForm;
type EventValidationResult =
  | { error: string }
  | { title: string; slug: string; capacity: number; price: number };

const eventStatusOptions: EventStatus[] = ["draft", "published", "live", "limited", "soon", "archived", "cancelled"];
const registrationFilters: Array<{ value: RegistrationFilter; label: { ua: string; en: string } }> = [
  { value: "all", label: { ua: "Усі", en: "All" } },
  { value: "confirmed", label: { ua: "Підтверджені", en: "Confirmed" } },
  { value: "pending", label: { ua: "Очікують", en: "Pending" } },
  { value: "paid", label: { ua: "Оплачені", en: "Paid" } },
  { value: "checked-in", label: { ua: "Check-in", en: "Checked-in" } }
];
const campaignAudienceOptions: Array<{ value: BroadcastAudience; label: string }> = [
  { value: "event_registered", label: "Registered" },
  { value: "event_confirmed", label: "Confirmed" },
  { value: "event_pending_payment", label: "Pending payment" },
  { value: "event_paid", label: "Paid" },
  { value: "event_checked_in", label: "Checked-in" }
];
const registrationActionOrder: RegistrationAction[] = [
  "confirm_registration",
  "cancel_registration",
  "mark_payment_paid",
  "mark_ticket_active",
  "reset_check_in"
];

const initialForm = {
  title: "",
  subtitle: "",
  slug: "",
  description: "",
  date: "",
  city: "",
  venue: "",
  address: "",
  price: "0",
  currency: "UAH",
  capacity: "",
  status: "draft" as EventStatus,
  image_url: "",
  organizer_name: "",
  organizer_description: "",
  organizer_contact: "",
  telegram_url: "",
  lineup: "",
  tags: "",
  age_limit: "",
  dress_code: "",
  doors_open: "",
  event_type: "",
  ticket_wave_label: "",
  urgency_note: "",
  referral_enabled: true,
  wallet_enabled: true
};

export function OrganizerEventPortfolio() {
  const { dictionary, language } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [registrationFilterByEvent, setRegistrationFilterByEvent] = useState<Record<string, RegistrationFilter>>({});
  const [registrationSearchByEvent, setRegistrationSearchByEvent] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canEditAllEvents, setCanEditAllEvents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);
  const [eventActionKey, setEventActionKey] = useState<string | null>(null);
  const [selectedRegistrationAction, setSelectedRegistrationAction] = useState<Record<string, RegistrationAction | "">>({});
  const [registrationActionKey, setRegistrationActionKey] = useState<string | null>(null);
  const [registrationActionError, setRegistrationActionError] = useState<Record<string, string>>({});
  const [registrationActionSuccess, setRegistrationActionSuccess] = useState<Record<string, string>>({});
  const [copiedReferralEventId, setCopiedReferralEventId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      if (!supabase) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const roleState = await getCurrentRole(supabase);

      if (!roleState.user || !roleState.role) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setCurrentUserId(roleState.user.id);
      setCanEditAllEvents(canManagePlatform(roleState.role));

      let query = supabase
        .from("events")
        .select(EVENT_SELECT_FIELDS)
        .order("date", { ascending: true, nullsFirst: false });

      if (!canManagePlatform(roleState.role)) {
        query = query.eq("organizer_id", roleState.user.id);
      }

      const eventResult = await query;
      const databaseEvents = (eventResult.data ?? []) as unknown as EventRow[];
      const mappedEvents = databaseEvents.map((event) => ({
        ...mapDatabaseEvent(event),
        dbStatus: event.status
      }));
      const visibleEvents = eventResult.error ? [] : mappedEvents;
      const eventIds = visibleEvents.map((event) => event.id);

      const registrationResult =
        eventIds.length > 0
          ? await supabase
              .from("registrations")
              .select("id,event_id,name,email,phone,instagram_nickname,telegram_username,referral_code,status,created_at")
              .in("event_id", eventIds)
              .order("created_at", { ascending: false })
          : { data: [] };

      const ticketResult =
        eventIds.length > 0
          ? await supabase
              .from("tickets")
              .select("id,registration_id,event_id,status,payment_status,checked_in,checked_in_at")
              .in("event_id", eventIds)
          : { data: [] };

      const referralResult =
        eventIds.length > 0
          ? await supabase
              .from("referrals")
              .select("id,event_id,code,source,label,clicks,telegram_starts,registrations,confirmed,paid,checked_in")
              .in("event_id", eventIds)
          : { data: [] };

      if (!mounted) {
        return;
      }

      const registrationError = "error" in registrationResult ? registrationResult.error : null;
      const ticketError = "error" in ticketResult ? ticketResult.error : null;

      if ((registrationError || ticketError) && process.env.NODE_ENV !== "production") {
        console.warn("Organizer event stats query failed", {
          eventIds,
          registrationReason: registrationError?.message,
          ticketReason: ticketError?.message
        });
      }

      setEvents(visibleEvents);
      setRegistrations(registrationResult.data ?? []);
      setTickets(ticketResult.data ?? []);
      setReferrals(referralResult.data ?? []);
      setMessage(eventResult.error ? { type: "error", text: eventResult.error.message } : null);
      setLoading(false);
    }

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const confirmedCount = registrations.filter((registration) => registration.status === "confirmed").length;
  const conversion = registrations.length > 0 ? Math.round((confirmedCount / registrations.length) * 100) : 0;

  function updateTitle(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugify(value)
    }));
  }

  function updateField(field: keyof typeof initialForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field: keyof EventForm, value: string | boolean) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function toDatetimeLocal(date: string, time: string) {
    if (!date) {
      return "";
    }

    return `${date}T${time && time !== "TBA" ? time : "00:00"}`;
  }

  function formFromEvent(event: OrganizerEvent): EventForm {
    return {
      title: event.title,
      subtitle: event.subtitle,
      slug: event.slug,
      description: event.description,
      date: toDatetimeLocal(event.date, event.time),
      city: event.city,
      venue: event.venue,
      address: event.address,
      price: event.price.toString(),
      currency: event.currency,
      capacity: event.capacity.toString(),
      status: event.dbStatus ?? event.status,
      image_url: event.image,
      organizer_name: event.organizerName ?? "",
      organizer_description: event.organizerDescription ?? "",
      organizer_contact: event.organizerContact ?? "",
      telegram_url: event.telegramUrl ?? "",
      lineup: event.lineup.join(", "),
      tags: event.tags.join(", "),
      age_limit: event.ageLimit ?? "",
      dress_code: event.dressCode ?? "",
      doors_open: event.doorsOpen ?? "",
      event_type: event.eventType ?? "",
      ticket_wave_label: event.ticketWaveLabel ?? "",
      urgency_note: event.urgencyNote ?? "",
      referral_enabled: event.referralEnabled ?? true,
      wallet_enabled: event.walletEnabled ?? true
    };
  }

  function validateEventForm(targetForm: EventForm, requireSlug: boolean): EventValidationResult {
    const title = targetForm.title.trim();
    const slug = slugify(targetForm.slug || targetForm.title);
    const capacity = Number(targetForm.capacity);
    const price = Number(targetForm.price || 0);

    if (!title) {
      return { error: dictionary.organizer.titleRequired };
    }

    if (!targetForm.date) {
      return { error: dictionary.organizer.dateRequired };
    }

    if (requireSlug && !slug) {
      return { error: dictionary.organizer.slugRequired };
    }

    if (!Number.isFinite(capacity) || capacity <= 0) {
      return { error: dictionary.organizer.capacityRequired };
    }

    if (!Number.isFinite(price) || price < 0) {
      return { error: dictionary.organizer.priceInvalid };
    }

    return { title, slug, capacity, price };
  }

  function getVisibilityHint(status: EventStatus) {
    return status === "draft" ? "draft = private / draft = приватна" : `${status} = public / ${status} = публічна`;
  }

  function openEditPanel(event: OrganizerEvent) {
    setMessage(null);
    setSuccessSlug(null);
    setFormOpen(false);
    setEditingEventId((current) => (current === event.id ? null : event.id));
    setEditForm(formFromEvent(event));
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!supabase || !currentUserId) {
      setMessage({ type: "error", text: dictionary.organizer.sessionMissing });
      return;
    }

    const validated = validateEventForm(form, true);

    if ("error" in validated) {
      setMessage({ type: "error", text: validated.error });
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: validated.title,
        subtitle: form.subtitle.trim() || null,
        slug: validated.slug,
        date: new Date(form.date).toISOString(),
        description: form.description.trim() || null,
        city: form.city.trim() || null,
        venue: form.venue.trim() || null,
        address: form.address.trim() || null,
        price: validated.price,
        currency: form.currency.trim() || "UAH",
        capacity: validated.capacity,
        status: form.status,
        image_url: form.image_url.trim() || null,
        organizer_id: currentUserId,
        organizer_name: form.organizer_name.trim() || null,
        organizer_description: form.organizer_description.trim() || null,
        organizer_contact: form.organizer_contact.trim() || null,
        telegram_url: form.telegram_url.trim() || null,
        lineup: form.lineup.trim(),
        tags: form.tags.trim(),
        age_limit: form.age_limit.trim() || null,
        dress_code: form.dress_code.trim() || null,
        doors_open: form.doors_open.trim() || null,
        event_type: form.event_type.trim() || null,
        ticket_wave_label: form.ticket_wave_label.trim() || null,
        urgency_note: form.urgency_note.trim() || null,
        referral_enabled: form.referral_enabled,
        wallet_enabled: form.wallet_enabled,
        created_at: new Date().toISOString()
      })
      .select(EVENT_SELECT_FIELDS)
      .single();

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    if (data) {
      const createdRow = data as unknown as EventRow;
      const createdEvent: OrganizerEvent = {
        ...mapDatabaseEvent(createdRow),
        dbStatus: createdRow.status
      };

      setEvents((current) => [createdEvent, ...current]);
      setForm(initialForm);
      setFormOpen(false);
      setSuccessSlug(createdRow.slug);
      setMessage({
        type: "success",
        text: createdRow.status === "draft" ? dictionary.organizer.draftSaved : dictionary.organizer.eventSaved
      });
      router.refresh();
    }
  }

  async function updateEvent(event: FormEvent<HTMLFormElement>, targetEvent: OrganizerEvent) {
    event.preventDefault();
    setMessage(null);
    setSuccessSlug(null);

    if (!supabase || !currentUserId) {
      setMessage({ type: "error", text: dictionary.organizer.sessionMissing });
      return;
    }

    const validated = validateEventForm(editForm, false);

    if ("error" in validated) {
      setMessage({ type: "error", text: validated.error });
      return;
    }

    setUpdatingEventId(targetEvent.id);

    const updatePayload: EventUpdate = {
      title: validated.title,
      subtitle: editForm.subtitle.trim() || null,
      date: new Date(editForm.date).toISOString(),
      description: editForm.description.trim() || null,
      city: editForm.city.trim() || null,
      venue: editForm.venue.trim() || null,
      address: editForm.address.trim() || null,
      price: validated.price,
      currency: editForm.currency.trim() || "UAH",
      capacity: validated.capacity,
      status: editForm.status,
      image_url: editForm.image_url.trim() || null,
      organizer_name: editForm.organizer_name.trim() || null,
      organizer_description: editForm.organizer_description.trim() || null,
      organizer_contact: editForm.organizer_contact.trim() || null,
      telegram_url: editForm.telegram_url.trim() || null,
      lineup: editForm.lineup.trim(),
      tags: editForm.tags.trim(),
      age_limit: editForm.age_limit.trim() || null,
      dress_code: editForm.dress_code.trim() || null,
      doors_open: editForm.doors_open.trim() || null,
      event_type: editForm.event_type.trim() || null,
      ticket_wave_label: editForm.ticket_wave_label.trim() || null,
      urgency_note: editForm.urgency_note.trim() || null,
      referral_enabled: editForm.referral_enabled,
      wallet_enabled: editForm.wallet_enabled
    };

    let query = supabase.from("events").update(updatePayload).eq("id", targetEvent.id);

    if (!canEditAllEvents) {
      query = query.eq("organizer_id", currentUserId);
    }

    const { data, error } = await query.select(EVENT_SELECT_FIELDS).single();

    setUpdatingEventId(null);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    if (data) {
      const updatedRow = data as unknown as EventRow;
      const updatedEvent: OrganizerEvent = {
        ...mapDatabaseEvent(updatedRow),
        dbStatus: updatedRow.status
      };

      setEvents((current) => current.map((item) => (item.id === updatedEvent.id ? updatedEvent : item)));
      setEditForm(formFromEvent(updatedEvent));
      setEditingEventId(null);
      setSuccessSlug(updatedRow.slug);
      setMessage({
        type: "success",
        text: `Event updated / Подію оновлено. ${getVisibilityHint(updatedRow.status)}`
      });
    }
  }

  async function updateEventStatus(targetEvent: OrganizerEvent, status: EventStatus, successText: string) {
    if (!supabase || !currentUserId) {
      setMessage({ type: "error", text: dictionary.organizer.sessionMissing });
      return;
    }

    setEventActionKey(`${targetEvent.id}:${status}`);
    setMessage(null);

    let query = supabase.from("events").update({ status }).eq("id", targetEvent.id);

    if (!canEditAllEvents) {
      query = query.eq("organizer_id", currentUserId);
    }

    const { data, error } = await query.select(EVENT_SELECT_FIELDS).single();
    setEventActionKey(null);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    if (data) {
      const updatedRow = data as unknown as EventRow;
      const updatedEvent: OrganizerEvent = {
        ...mapDatabaseEvent(updatedRow),
        dbStatus: updatedRow.status
      };

      setEvents((current) => current.map((item) => (item.id === updatedEvent.id ? updatedEvent : item)));
      setMessage({ type: "success", text: successText });
      router.refresh();
    }
  }

  async function archiveEvent(targetEvent: OrganizerEvent) {
    await updateEventStatus(targetEvent, "archived", "Event archived.");
  }

  async function unarchiveEvent(targetEvent: OrganizerEvent) {
    await updateEventStatus(targetEvent, "draft", "Event restored as draft.");
  }

  async function softDeleteEvent(targetEvent: OrganizerEvent) {
    if (!window.confirm(`Delete "${targetEvent.title}"? This keeps the event data but marks it cancelled.`)) {
      return;
    }

    await updateEventStatus(targetEvent, "cancelled", "Event marked cancelled.");
  }

  async function duplicateEvent(targetEvent: OrganizerEvent) {
    if (!supabase || !currentUserId) {
      setMessage({ type: "error", text: dictionary.organizer.sessionMissing });
      return;
    }

    setEventActionKey(`${targetEvent.id}:duplicate`);
    setMessage(null);

    let sourceQuery = supabase.from("events").select(EVENT_SELECT_FIELDS).eq("id", targetEvent.id);

    if (!canEditAllEvents) {
      sourceQuery = sourceQuery.eq("organizer_id", currentUserId);
    }

    const { data: source, error: sourceError } = await sourceQuery.single();

    if (sourceError || !source) {
      setEventActionKey(null);
      setMessage({ type: "error", text: sourceError?.message || "Event could not be duplicated." });
      return;
    }

    const sourceRow = source as unknown as EventRow;
    const { id: _id, created_at: _createdAt, ...sourcePayload } = sourceRow;
    const { data, error } = await supabase
      .from("events")
      .insert({
        ...sourcePayload,
        title: `${sourceRow.title} Copy`,
        slug: `${sourceRow.slug}-copy-${Date.now().toString(36)}`,
        status: "draft",
        organizer_id: sourceRow.organizer_id || currentUserId,
        created_at: new Date().toISOString()
      })
      .select(EVENT_SELECT_FIELDS)
      .single();

    setEventActionKey(null);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    if (data) {
      const duplicatedRow = data as unknown as EventRow;
      const duplicatedEvent: OrganizerEvent = {
        ...mapDatabaseEvent(duplicatedRow),
        dbStatus: duplicatedRow.status
      };

      setEvents((current) => [duplicatedEvent, ...current]);
      setSuccessSlug(duplicatedRow.slug);
      setMessage({ type: "success", text: "Event duplicated as draft." });
      router.refresh();
    }
  }

  function getRegistrationActionLabel(action: RegistrationAction) {
    const labels: Record<RegistrationAction, string> = {
      confirm_registration: language === "ua" ? "Підтвердити" : "Confirm",
      cancel_registration: language === "ua" ? "Скасувати" : "Cancel",
      mark_payment_paid: language === "ua" ? "Оплачено" : "Mark paid",
      mark_ticket_active: language === "ua" ? "Активувати" : "Activate ticket",
      reset_check_in: language === "ua" ? "Скинути check-in" : "Reset check-in"
    };

    return labels[action];
  }

  function canRunRegistrationAction(input: {
    action: RegistrationAction;
    registrationStatus: RegistrationStatus;
    paymentStatus: PaymentStatus | "missing";
    ticketStatus: TicketStatus | "missing";
    checkedIn: boolean;
  }) {
    if (input.action === "confirm_registration") {
      return input.registrationStatus !== "confirmed";
    }

    if (input.action === "cancel_registration") {
      return input.registrationStatus !== "cancelled";
    }

    if (input.action === "mark_payment_paid") {
      return input.paymentStatus !== "missing" && input.paymentStatus !== "paid";
    }

    if (input.action === "mark_ticket_active") {
      return input.ticketStatus !== "missing" && input.ticketStatus !== "active" && input.ticketStatus !== "used" && !input.checkedIn;
    }

    return canEditAllEvents && input.checkedIn && input.paymentStatus === "paid";
  }

  function escapeCsvValue(value: string | number | boolean | null | undefined) {
    const text = value === null || value === undefined ? "" : String(value);

    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  }

  function exportRegistrationCsv(
    event: OrganizerEvent,
    rows: Array<{
      registration: RegistrationRow;
      paymentStatus: PaymentStatus | "missing";
      ticketStatus: TicketStatus | "missing";
      checkedIn: boolean;
    }>
  ) {
    const headers = [
      "event",
      "name",
      "phone",
      "email",
      "instagram",
      "telegram",
      "registration_status",
      "payment_status",
      "ticket_status",
      "checked_in"
    ];
    const lines = rows.map((row) =>
      [
        event.title,
        row.registration.name,
        row.registration.phone,
        row.registration.email,
        row.registration.instagram_nickname,
        row.registration.telegram_username,
        row.registration.status,
        row.paymentStatus,
        row.ticketStatus,
        row.checkedIn
      ]
        .map(escapeCsvValue)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `raveera-${event.slug}-registrations.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function getEventReferralLink(event: OrganizerEvent, code = event.slug) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://rave-era-project.vercel.app").replace(/\/+$/, "");
    return `${appUrl}/events/${event.slug}?ref=${encodeURIComponent(code)}`;
  }

  async function copyEventReferralLink(event: OrganizerEvent) {
    try {
      await navigator.clipboard.writeText(getEventReferralLink(event));
      setCopiedReferralEventId(event.id);
      window.setTimeout(() => setCopiedReferralEventId(null), 1400);
    } catch {
      setCopiedReferralEventId(null);
    }
  }

  async function runRegistrationAction(registrationId: string, action: RegistrationAction) {
    if (!supabase) {
      setRegistrationActionError((current) => ({
        ...current,
        [registrationId]: "Supabase is not configured."
      }));
      return;
    }

    const actionKey = `${registrationId}:${action}`;
    setRegistrationActionKey(actionKey);
    setRegistrationActionError((current) => {
      const next = { ...current };
      delete next[registrationId];
      return next;
    });
    setRegistrationActionSuccess((current) => {
      const next = { ...current };
      delete next[registrationId];
      return next;
    });

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(dictionary.organizer.sessionMissing);
      }

      const response = await fetch("/api/organizer/registrations/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ registrationId, action })
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        registration?: RegistrationRow;
        tickets?: TicketRow[];
      };

      if (!response.ok || !payload.ok || !payload.registration) {
        throw new Error(payload.error || "Registration action failed.");
      }

      setRegistrations((current) =>
        current.map((registration) => (registration.id === payload.registration!.id ? payload.registration! : registration))
      );

      if (payload.tickets) {
        setTickets((current) => {
          const updatedIds = new Set(payload.tickets!.map((ticket) => ticket.id));
          const withoutUpdated = current.filter((ticket) => !updatedIds.has(ticket.id));
          return [...withoutUpdated, ...payload.tickets!];
        });
      }

      setMessage({ type: "success", text: payload.message || "Registration updated." });
      setRegistrationActionSuccess((current) => ({
        ...current,
        [registrationId]: payload.message || "Registration updated."
      }));
      setSelectedRegistrationAction((current) => ({
        ...current,
        [registrationId]: ""
      }));
    } catch (error) {
      setRegistrationActionError((current) => ({
        ...current,
        [registrationId]: error instanceof Error ? error.message : "Registration action failed."
      }));
    } finally {
      setRegistrationActionKey(null);
    }
  }

  const registrationCopy = {
    sectionTitle: language === "ua" ? "Реєстрації" : "Registrations",
    newestFirst: language === "ua" ? "нові спочатку" : "newest first",
    empty: language === "ua" ? "Поки немає реєстрацій" : "No registrations yet",
    noFilterMatch: language === "ua" ? "Немає реєстрацій за цим фільтром" : "No registrations match this filter",
    notProvided: language === "ua" ? "Не вказано" : "Not provided",
    total: language === "ua" ? "Усього реєстрацій" : "Total registrations",
    confirmed: language === "ua" ? "Підтверджені" : "Confirmed",
    pending: language === "ua" ? "Очікують" : "Pending",
    paid: language === "ua" ? "Оплачені" : "Paid",
    checkedIn: language === "ua" ? "Check-in" : "Checked-in",
    name: language === "ua" ? "Імʼя" : "Name",
    phone: language === "ua" ? "Телефон" : "Phone",
    registrationStatus: language === "ua" ? "Статус реєстрації" : "Registration status",
    paymentStatus: language === "ua" ? "Статус оплати" : "Payment status",
    ticketStatus: language === "ua" ? "Статус квитка" : "Ticket status",
    checkIn: language === "ua" ? "Check-in" : "Check-in",
    actions: language === "ua" ? "Дії" : "Actions",
    chooseAction: language === "ua" ? "Оберіть дію" : "Choose action",
    applyAction: language === "ua" ? "Застосувати" : "Apply",
    exportCsv: language === "ua" ? "Експорт CSV" : "Export CSV",
    searchPlaceholder: language === "ua" ? "Пошук: імʼя, email, Telegram" : "Search name, email, Telegram",
    openCheckIn: language === "ua" ? "Відкрити check-in" : "Open check-in",
    archive: language === "ua" ? "Архівувати" : "Archive",
    unarchive: language === "ua" ? "Розархівувати" : "Unarchive",
    duplicate: language === "ua" ? "Дублювати" : "Duplicate",
    delete: language === "ua" ? "Видалити" : "Delete",
    noAvailableActions: language === "ua" ? "Немає доступних дій" : "No available actions",
    referralTitle: language === "ua" ? "Реферальна аналітика" : "Referral analytics",
    referralClicks: language === "ua" ? "Реферальні кліки" : "Referral clicks",
    referralTelegramStarts: language === "ua" ? "Telegram старти" : "Telegram starts",
    referralRegistrations: language === "ua" ? "Реферальні реєстрації" : "Referral registrations",
    referralConfirmed: language === "ua" ? "Підтверджені реферали" : "Confirmed referrals",
    referralPaid: language === "ua" ? "Оплачені реферали" : "Paid referrals",
    referralCheckedIn: language === "ua" ? "Check-in реферали" : "Checked-in referrals",
    topReferral: language === "ua" ? "Топ джерело" : "Top source",
    noReferralActivity: language === "ua" ? "Реферальної активності ще немає" : "No referral activity yet",
    copyReferralLink: language === "ua" ? "Копіювати реферальне посилання" : "Copy referral link",
    referralCopied: language === "ua" ? "Скопійовано" : "Copied"
  };

  return (
    <section className="org-reveal border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="flex flex-col justify-between gap-5 px-1 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">{dictionary.organizer.eventPortfolio}</p>
          <h2 className="mt-3 text-[clamp(1.85rem,9vw,3rem)] font-black uppercase leading-[0.98] text-white">{dictionary.organizer.activeEvents}</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingEventId(null);
            setSuccessSlug(null);
            setFormOpen((value) => !value);
          }}
          aria-expanded={formOpen}
          className="focus-ring min-h-12 border border-primary px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-300 hover:bg-primary hover:text-black active:scale-[0.98]"
        >
          {formOpen ? dictionary.organizer.closeForm : dictionary.organizer.createEvent}
        </button>
      </div>

      {message ? (
        <div
          className={message.type === "error" ? "mt-6 border border-red-400/25 bg-red-400/[0.035] px-4 py-3 text-sm leading-6 text-red-100" : "mt-6 border border-primary/25 bg-primary/[0.03] px-4 py-3 text-sm leading-6 text-white/65"}
          aria-live="polite"
        >
          <p>{message.text}</p>
          {message.type === "success" && successSlug ? (
            <Link href={`/events/${successSlug}`} className="focus-ring mt-3 inline-flex min-h-11 items-center border border-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary hover:bg-primary hover:text-black">
              Open event / Відкрити подію
            </Link>
          ) : null}
        </div>
      ) : null}

      {formOpen ? (
        <form onSubmit={createEvent} className="mt-8 border-y border-white/[0.05] bg-[#030303] px-3 py-6 sm:px-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{dictionary.organizer.basicProfile}</p>
          <p className="mb-5 text-sm leading-6 text-white/45">{dictionary.organizer.publicHint}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateTitle(event.target.value)}
                required
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Slug</span>
              <input
                type="text"
                value={form.slug}
                onChange={(event) => updateField("slug", slugify(event.target.value))}
                required
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Subtitle</span>
              <input
                type="text"
                value={form.subtitle}
                onChange={(event) => updateField("subtitle", event.target.value)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={4}
                className="mt-2 w-full resize-y border border-white/[0.08] bg-[#020202] px-3 py-3 text-sm leading-6 text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Date</span>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                required
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Status</span>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm uppercase text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              >
                {eventStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">City</span>
              <input
                type="text"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Venue</span>
              <input
                type="text"
                value={form.venue}
                onChange={(event) => updateField("venue", event.target.value)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Address</span>
              <input
                type="text"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Price</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Currency</span>
              <input
                type="text"
                value={form.currency}
                onChange={(event) => updateField("currency", event.target.value.toUpperCase())}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm uppercase text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Capacity</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.capacity}
                onChange={(event) => updateField("capacity", event.target.value)}
                required
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Image URL</span>
              <input
                type="url"
                value={form.image_url}
                onChange={(event) => updateField("image_url", event.target.value)}
                placeholder="https://..."
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <div className="border-t border-white/[0.05] pt-5 md:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Organizer</p>
            </div>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Organizer name</span>
              <input
                type="text"
                value={form.organizer_name}
                onChange={(event) => updateField("organizer_name", event.target.value)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Organizer contact</span>
              <input
                type="text"
                value={form.organizer_contact}
                onChange={(event) => updateField("organizer_contact", event.target.value)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Organizer description</span>
              <textarea
                value={form.organizer_description}
                onChange={(event) => updateField("organizer_description", event.target.value)}
                rows={3}
                className="mt-2 w-full resize-y border border-white/[0.08] bg-[#020202] px-3 py-3 text-sm leading-6 text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Telegram URL</span>
              <input
                type="url"
                value={form.telegram_url}
                onChange={(event) => updateField("telegram_url", event.target.value)}
                placeholder="Configured by NEXT_PUBLIC_TELEGRAM_BOT_URL"
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <div className="border-t border-white/[0.05] pt-5 md:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Lineup and details</p>
            </div>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Lineup</span>
              <textarea
                value={form.lineup}
                onChange={(event) => updateField("lineup", event.target.value)}
                placeholder="Artist One, Artist Two"
                rows={3}
                className="mt-2 w-full resize-y border border-white/[0.08] bg-[#020202] px-3 py-3 text-sm leading-6 text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Tags</span>
              <textarea
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                placeholder="Warehouse, Techno, Visual Show"
                rows={3}
                className="mt-2 w-full resize-y border border-white/[0.08] bg-[#020202] px-3 py-3 text-sm leading-6 text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            {[
              ["age_limit", "Age limit"],
              ["dress_code", "Dress code"],
              ["doors_open", "Doors open"],
              ["event_type", "Event type"]
            ].map(([field, label]) => (
              <label key={field} className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</span>
                <input
                  type="text"
                  value={form[field as keyof typeof initialForm] as string}
                  onChange={(event) => updateField(field as keyof typeof initialForm, event.target.value)}
                  className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                />
              </label>
            ))}
            <div className="border-t border-white/[0.05] pt-5 md:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Conversion</p>
            </div>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Ticket wave label</span>
              <input
                type="text"
                value={form.ticket_wave_label}
                onChange={(event) => updateField("ticket_wave_label", event.target.value)}
                placeholder="Wave 3 active"
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Urgency note</span>
              <input
                type="text"
                value={form.urgency_note}
                onChange={(event) => updateField("urgency_note", event.target.value)}
                placeholder="Last wave open"
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
              />
            </label>
            {[
              ["referral_enabled", "Referral enabled"],
              ["wallet_enabled", "Wallet enabled"]
            ].map(([field, label]) => (
              <label key={field} className="flex min-h-11 items-center justify-between gap-4 border border-white/[0.08] bg-[#020202] px-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</span>
                <input
                  type="checkbox"
                  checked={form[field as keyof typeof initialForm] as boolean}
                  onChange={(event) => updateField(field as keyof typeof initialForm, event.target.checked)}
                  className="h-4 w-4 accent-[#00FF88]"
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="focus-ring mt-5 min-h-12 w-full bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:tracking-widest"
          >
            {saving ? dictionary.organizer.saving : dictionary.organizer.saveSupabase}
          </button>
        </form>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          [events.length.toString(), "events"],
          [registrations.length.toString(), "registrations"],
          [`${conversion}%`, "conversion"]
        ].map(([value, label]) => (
          <div key={label} className="min-w-0 border border-white/[0.05] bg-[#030303] p-4">
            <p className="font-mono text-3xl font-semibold tabular-nums text-white">{loading ? "..." : value}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.13em] text-white/45 sm:tracking-[0.18em]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <TelegramBroadcastPanel
          title="Campaigns"
          eyebrow="Telegram campaigns"
          description="Send event-scoped Telegram updates to registered, confirmed, pending, paid, or checked-in attendees."
          events={events.map((event) => ({ id: event.id, title: event.title, slug: event.slug }))}
          audienceOptions={campaignAudienceOptions}
          requireEvent
          defaultAudience="event_registered"
        />
      </div>

      <div className="mt-10 grid gap-0">
        {events.map((event) => {
          const relatedRegistrations = registrations.filter((registration) => registration.event_id === event.id);
          const relatedTickets = tickets.filter((ticket) => ticket.event_id === event.id);
          const relatedReferrals = referrals.filter((referral) => referral.event_id === event.id);
          const referralMetrics = buildReferralMetrics(relatedReferrals, relatedRegistrations, relatedTickets);
          const referralLeaderboard = sortReferralMetricsByRegistrations(referralMetrics)
            .filter((referral) => referral.starts > 0 || referral.registrations > 0 || referral.confirmed > 0);
          const topReferral = referralLeaderboard[0] ?? null;
          const referralClicks = referralMetrics.reduce((sum, referral) => sum + referral.clicks, 0);
          const referralTelegramStarts = referralMetrics.reduce((sum, referral) => sum + referral.telegramStarts, 0);
          const referralStarts = referralClicks + referralTelegramStarts;
          const referralRegistrations = referralMetrics.reduce((sum, referral) => sum + referral.registrations, 0);
          const confirmedReferralRegistrations = referralMetrics.reduce((sum, referral) => sum + referral.confirmed, 0);
          const paidReferralRegistrations = referralMetrics.reduce((sum, referral) => sum + referral.paid, 0);
          const checkedInReferralRegistrations = referralMetrics.reduce((sum, referral) => sum + referral.checkedIn, 0);
          const referralConversion = Math.round((referralRegistrations / Math.max(referralStarts, 1)) * 1000) / 10;
          const topReferralCode = topReferral?.code ?? null;
          const hasReferralActivity = referralStarts > 0 || referralRegistrations > 0 || confirmedReferralRegistrations > 0 || paidReferralRegistrations > 0 || checkedInReferralRegistrations > 0 || Boolean(topReferralCode);
          const activeFilter = registrationFilterByEvent[event.id] ?? "all";
          const activeSearch = (registrationSearchByEvent[event.id] ?? "").trim().toLowerCase();
          const registrationRows = relatedRegistrations.map((registration) => {
            const registrationTickets = relatedTickets.filter((ticket) => ticket.registration_id === registration.id);
            const hasTicket = registrationTickets.length > 0;
            const paymentStatus: PaymentStatus | "missing" = registrationTickets.some((ticket) => ticket.payment_status === "paid")
              ? "paid"
              : hasTicket
                ? registrationTickets.find((ticket) => ticket.payment_status === "failed")?.payment_status ?? "pending"
                : "missing";
            const checkInStatus = registrationTickets.some((ticket) => ticket.checked_in || ticket.checked_in_at || ticket.status === "used") ? "used" : "active";
            const ticketStatus: TicketStatus | "missing" = registrationTickets.some((ticket) => ticket.checked_in || ticket.checked_in_at || ticket.status === "used")
              ? "used"
              : registrationTickets.find((ticket) => ticket.status === "active")?.status ??
                registrationTickets.find((ticket) => ticket.status === "reserved")?.status ??
                "missing";

            return {
              registration,
              checkedIn: checkInStatus === "used",
              hasTicket,
              paymentStatus,
              checkInStatus,
              ticketStatus
            };
          });
          const filteredRows = registrationRows.filter((row) => {
            const searchable = [
              row.registration.name,
              row.registration.email,
              row.registration.telegram_username,
              row.registration.phone,
              row.registration.instagram_nickname
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            if (activeSearch && !searchable.includes(activeSearch)) {
              return false;
            }

            if (activeFilter === "confirmed") {
              return row.registration.status === "confirmed";
            }

            if (activeFilter === "pending") {
              return row.registration.status === "pending";
            }

            if (activeFilter === "paid") {
              return row.paymentStatus === "paid";
            }

            if (activeFilter === "checked-in") {
              return row.checkInStatus === "used";
            }

            return true;
          });
          const eventStats = calculateEventStatsFromRows(event, relatedRegistrations, relatedTickets);
          const totalRegistrations = eventStats.totalRegistrations;
          const confirmedRegistrations = eventStats.confirmedRegistrations;
          const pendingRegistrations = eventStats.pendingRegistrations;
          const paidTickets = eventStats.paidTickets;
          const reservedTickets = eventStats.reservedTickets;
          const activeTickets = eventStats.activeTickets;
          const usedTickets = eventStats.usedTickets;
          const checkedInTickets = eventStats.checkedInCount;
          const registered = eventStats.totalRegistrations;
          const capacity = eventStats.fillPercent;
          const performancePanels = [
            {
              key: "registrations",
              title: language === "ua" ? "Реєстрації" : "Registrations",
              value: totalRegistrations.toString(),
              detail:
                totalRegistrations > 0
                  ? `${confirmedRegistrations} ${language === "ua" ? "підтверджено" : "confirmed"} / ${pendingRegistrations} ${language === "ua" ? "очікують" : "pending"}`
                  : language === "ua"
                    ? "Поки немає реєстрацій"
                    : "No registrations yet",
              Icon: Users,
              progress: capacity
            },
            {
              key: "paid",
              title: language === "ua" ? "Оплати" : "Paid",
              value: paidTickets.toString(),
              detail:
                paidTickets > 0 || reservedTickets > 0
                  ? `${paidTickets}/${reservedTickets} ${language === "ua" ? "оплачено / резерв" : "paid / reserved"}`
                  : language === "ua"
                    ? "Оплачених квитків ще немає"
                    : "No paid tickets yet",
              Icon: CreditCard,
              progress: totalRegistrations > 0 ? Math.round((paidTickets / totalRegistrations) * 100) : 0
            },
            {
              key: "check-in",
              title: "Check-in",
              value: checkedInTickets.toString(),
              detail:
                checkedInTickets > 0
                  ? `${checkedInTickets}/${activeTickets + usedTickets || totalRegistrations || 0} ${language === "ua" ? "пройшли вхід" : "checked in"}`
                  : language === "ua"
                    ? "Вхід ще не зафіксовано"
                    : "No check-ins yet",
              Icon: QrCode,
              progress: (paidTickets || totalRegistrations) > 0 ? Math.round((checkedInTickets / (paidTickets || totalRegistrations)) * 100) : 0
            },
            {
              key: "referrals",
              title: language === "ua" ? "Реферали" : "Referrals",
              value: referralRegistrations.toString(),
              detail:
                referralClicks > 0
                  ? `${referralClicks} ${language === "ua" ? "кліків" : "clicks"} + ${referralTelegramStarts} TG / ${formatReferralConversion(referralConversion)} ${language === "ua" ? "конверсія" : "conversion"}`
                  : language === "ua"
                    ? "Реферальних кліків ще немає"
                    : "No referral clicks yet",
              Icon: Share2,
              progress: referralConversion
            },
            {
              key: "capacity",
              title: language === "ua" ? "Місткість" : "Capacity",
              value: `${capacity}%`,
              detail:
                registered > 0
                  ? `${registered}/${event.capacity} ${language === "ua" ? "місць зайнято" : "capacity filled"}`
                  : language === "ua"
                    ? "Місткість ще не заповнюється"
                    : "Capacity is still empty",
              Icon: Gauge,
              progress: capacity
            }
          ];

          return (
            <div
              key={event.id}
              className="group relative border-t border-white/[0.05] bg-[#020202] px-1 py-7 motion-safe:transition-[transform,background-color] motion-safe:duration-500 motion-safe:ease-out hover:bg-[#00FF88]/[0.015] motion-safe:hover:-translate-y-0.5"
            >
              <div className="absolute left-0 top-0 h-px w-0 bg-primary motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" />
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h3 className="break-words text-[clamp(1.35rem,7vw,1.5rem)] font-black uppercase leading-tight text-white">{event.title}</h3>
                  <p className="mt-3 break-words font-mono text-xs uppercase leading-5 tracking-[0.12em] text-white/[0.48] sm:tracking-[0.18em]">
                    {formatEventDate(event.date)} / {event.time} / {event.city} / {event.venue} / {event.dbStatus ?? event.status}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                  <p className="font-mono text-sm uppercase tracking-[0.14em] text-primary sm:tracking-[0.18em]">{capacity}% capacity</p>
                  <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                    <Link
                      href="/check-in"
                      className="focus-ring inline-flex min-h-10 items-center gap-2 border border-white/[0.08] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/58 transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      {registrationCopy.openCheckIn}
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEditPanel(event)}
                      aria-expanded={editingEventId === event.id}
                      className="focus-ring min-h-10 border border-primary/70 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary transition-colors hover:bg-primary hover:text-black"
                    >
                      {editingEventId === event.id ? "Close / Закрити" : "Edit / Редагувати"}
                    </button>
                    <button
                      type="button"
                      disabled={eventActionKey !== null}
                      onClick={() => (event.dbStatus === "archived" || event.dbStatus === "cancelled" ? unarchiveEvent(event) : archiveEvent(event))}
                      className="focus-ring inline-flex min-h-10 items-center gap-2 border border-white/[0.08] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/58 transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                      {event.dbStatus === "archived" || event.dbStatus === "cancelled" ? registrationCopy.unarchive : registrationCopy.archive}
                    </button>
                    <button
                      type="button"
                      disabled={eventActionKey !== null}
                      onClick={() => duplicateEvent(event)}
                      className="focus-ring min-h-10 border border-white/[0.08] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/58 transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {eventActionKey === `${event.id}:duplicate` ? "..." : registrationCopy.duplicate}
                    </button>
                    <button
                      type="button"
                      disabled={eventActionKey !== null}
                      onClick={() => softDeleteEvent(event)}
                      className="focus-ring inline-flex min-h-10 items-center gap-2 border border-red-400/25 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-red-100/80 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {registrationCopy.delete}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 h-1 overflow-hidden bg-white/[0.05]">
                <div
                  className="h-full origin-left bg-primary motion-safe:animate-[barFill_700ms_cubic-bezier(0.16,1,0.3,1)_both] group-hover:shadow-[0_0_18px_rgba(0,255,136,0.34)]"
                  style={{ width: `${capacity}%`, "--bar-width": `${capacity}%` } as CSSProperties}
                />
              </div>
              <div className="mt-6 border border-white/[0.05] bg-[#030303] p-4">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{registrationCopy.referralTitle}</p>
                    {hasReferralActivity ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          [registrationCopy.referralClicks, referralClicks.toString()],
                          [registrationCopy.referralTelegramStarts, referralTelegramStarts.toString()],
                          [registrationCopy.referralRegistrations, referralRegistrations.toString()],
                          [registrationCopy.referralConfirmed, confirmedReferralRegistrations.toString()],
                          [registrationCopy.referralPaid, paidReferralRegistrations.toString()],
                          [registrationCopy.referralCheckedIn, checkedInReferralRegistrations.toString()],
                          ["Conversion / Конверсія", formatReferralConversion(referralConversion)],
                          [registrationCopy.topReferral, topReferralCode ?? "-"]
                        ].map(([label, value]) => (
                          <div key={label} className="border border-white/[0.05] bg-[#020202] p-3">
                            <p className="break-words font-mono text-xl font-semibold tabular-nums text-white">{value}</p>
                            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.13em] text-white/[0.38]">{label}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-white/[0.45]">{registrationCopy.noReferralActivity}</p>
                    )}
                    <div className="mt-5 border-t border-white/[0.05] pt-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/[0.42]">Referral leaderboard / Лідерборд</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                          Default code / Код: {event.slug}
                        </p>
                      </div>
                      <div className="-mx-1 mt-3 overflow-x-auto [scrollbar-width:thin]">
                        <table className="w-full min-w-[860px] text-left text-xs">
                          <thead className="font-mono uppercase tracking-[0.13em] text-white/[0.34]">
                            <tr>
                              <th className="py-3 pr-4 font-medium">Code / source</th>
                              <th className="py-3 pr-4 font-medium">Website</th>
                              <th className="py-3 pr-4 font-medium">Telegram</th>
                              <th className="py-3 pr-4 font-medium">Registrations</th>
                              <th className="py-3 pr-4 font-medium">Confirmed</th>
                              <th className="py-3 pr-4 font-medium">Paid</th>
                              <th className="py-3 pr-4 font-medium">Checked-in</th>
                              <th className="py-3 font-medium">Conversion</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.05]">
                            {referralLeaderboard.map((referral) => (
                              <tr key={referral.code} className="motion-safe:transition-colors motion-safe:duration-300 hover:bg-primary/[0.018]">
                                <td className="py-3 pr-4">
                                  <p className="break-words font-mono text-sm font-semibold text-white">{referral.code}</p>
                                  <p className="mt-1 break-words font-mono text-[10px] uppercase tracking-[0.12em] text-white/[0.35]">{referral.source}</p>
                                </td>
                                <td className="py-3 pr-4 font-mono tabular-nums text-white/[0.62]">{referral.clicks}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums text-white/[0.62]">{referral.telegramStarts}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums text-white/[0.62]">{referral.registrations}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums text-primary">{referral.confirmed}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums text-white/[0.62]">{referral.paid}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums text-white/[0.62]">{referral.checkedIn}</td>
                                <td className="py-3 font-mono tabular-nums text-white/[0.62]">{formatReferralConversion(referral.conversionRate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="w-full min-w-0 lg:max-w-[360px]">
                    <div className="border border-white/[0.06] bg-black p-3">
                      <p className="break-anywhere font-mono text-xs leading-5 text-white/[0.46]">{getEventReferralLink(event)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyEventReferralLink(event)}
                      className={`focus-ring mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] transition-[border-color,background-color,color,transform] active:scale-[0.99] ${
                        copiedReferralEventId === event.id
                          ? "border-primary bg-primary text-black"
                          : "border-primary/45 text-primary hover:border-primary hover:bg-primary hover:text-black"
                      }`}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      {copiedReferralEventId === event.id ? registrationCopy.referralCopied : registrationCopy.copyReferralLink}
                    </button>
                  </div>
                </div>
              </div>
              {editingEventId === event.id ? (
                <form onSubmit={(submitEvent) => updateEvent(submitEvent, event)} className="mt-7 border-y border-primary/15 bg-[#030303] px-3 py-6 sm:px-4">
                  <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Edit event / Редагувати подію</p>
                      <p className="mt-2 text-sm leading-6 text-white/45">draft = private. live, limited, soon = public.</p>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Slug locked: {event.slug}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Title</span>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(inputEvent) => updateEditField("title", inputEvent.target.value)}
                        required
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Subtitle</span>
                      <input
                        type="text"
                        value={editForm.subtitle}
                        onChange={(inputEvent) => updateEditField("subtitle", inputEvent.target.value)}
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Description</span>
                      <textarea
                        value={editForm.description}
                        onChange={(inputEvent) => updateEditField("description", inputEvent.target.value)}
                        rows={4}
                        className="mt-2 w-full resize-y border border-white/[0.08] bg-[#020202] px-3 py-3 text-sm leading-6 text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Date</span>
                      <input
                        type="datetime-local"
                        value={editForm.date}
                        onChange={(inputEvent) => updateEditField("date", inputEvent.target.value)}
                        required
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Status</span>
                      <select
                        value={editForm.status}
                        onChange={(inputEvent) => updateEditField("status", inputEvent.target.value)}
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm uppercase text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      >
                        {eventStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">City</span>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(inputEvent) => updateEditField("city", inputEvent.target.value)}
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Venue</span>
                      <input
                        type="text"
                        value={editForm.venue}
                        onChange={(inputEvent) => updateEditField("venue", inputEvent.target.value)}
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Price</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editForm.price}
                        onChange={(inputEvent) => updateEditField("price", inputEvent.target.value)}
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Capacity</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={editForm.capacity}
                        onChange={(inputEvent) => updateEditField("capacity", inputEvent.target.value)}
                        required
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Image URL</span>
                      <input
                        type="url"
                        value={editForm.image_url}
                        onChange={(inputEvent) => updateEditField("image_url", inputEvent.target.value)}
                        placeholder="https://..."
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Organizer name</span>
                      <input
                        type="text"
                        value={editForm.organizer_name}
                        onChange={(inputEvent) => updateEditField("organizer_name", inputEvent.target.value)}
                        className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Lineup</span>
                      <textarea
                        value={editForm.lineup}
                        onChange={(inputEvent) => updateEditField("lineup", inputEvent.target.value)}
                        placeholder="Artist One, Artist Two"
                        rows={3}
                        className="mt-2 w-full resize-y border border-white/[0.08] bg-[#020202] px-3 py-3 text-sm leading-6 text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
                      />
                    </label>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={updatingEventId === event.id}
                      className="focus-ring min-h-12 bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:tracking-widest"
                    >
                      {updatingEventId === event.id ? "Saving / Збереження" : "Save changes / Зберегти"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingEventId(null)}
                      className="focus-ring min-h-12 border border-white/[0.08] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-white/55 transition-colors hover:border-primary/50 hover:text-primary sm:w-auto sm:tracking-widest"
                    >
                      Cancel / Скасувати
                    </button>
                  </div>
                </form>
              ) : null}
              <div className="mt-7 border-t border-white/[0.05] pt-6">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary sm:tracking-[0.22em]">{registrationCopy.sectionTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-white/[0.45]">
                      {relatedRegistrations.length > 0 ? `${relatedRegistrations.length} ${registrationCopy.newestFirst}` : registrationCopy.empty}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {performancePanels.map(({ key, title, value, detail, Icon, progress }) => (
                    <div key={key} className="group/panel min-w-0 border border-white/[0.05] bg-[#030303] p-3 transition-colors hover:border-primary/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-white/[0.38]">{title}</p>
                          <p className="mt-2 break-words font-mono text-2xl font-semibold tabular-nums text-white">{value}</p>
                        </div>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary/20 bg-black text-primary">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="mt-3 h-1 overflow-hidden bg-white/[0.06]">
                        <div
                          className="h-full bg-primary transition-[width,box-shadow] duration-500 group-hover/panel:shadow-[0_0_16px_rgba(0,255,136,0.35)]"
                          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                        />
                      </div>
                      <p className="mt-3 min-h-8 text-xs leading-4 text-white/[0.45]">{detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {registrationFilters.map((filter) => {
                    const isActive = activeFilter === filter.value;

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() =>
                          setRegistrationFilterByEvent((current) => ({
                            ...current,
                            [event.id]: filter.value
                          }))
                        }
                        className={
                          isActive
                            ? "min-h-10 border border-primary bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-black"
                            : "min-h-10 border border-white/[0.08] bg-[#020202] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/[0.52] transition-colors hover:border-primary/40 hover:text-primary"
                        }
                        aria-pressed={isActive}
                      >
                        {filter.label[language]}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                  <label className="block w-full lg:max-w-sm">
                    <span className="sr-only">{registrationCopy.searchPlaceholder}</span>
                    <input
                      type="search"
                      value={registrationSearchByEvent[event.id] ?? ""}
                      onChange={(inputEvent) =>
                        setRegistrationSearchByEvent((current) => ({
                          ...current,
                          [event.id]: inputEvent.target.value
                        }))
                      }
                      placeholder={registrationCopy.searchPlaceholder}
                      className="focus-ring min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-xs text-white outline-none transition-colors placeholder:text-white/[0.28] focus:border-primary"
                    />
                  </label>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/[0.34]">
                    {filteredRows.length} / {relatedRegistrations.length} {registrationCopy.sectionTitle.toLowerCase()}
                  </p>
                  <button
                    type="button"
                    disabled={filteredRows.length === 0}
                    onClick={() => exportRegistrationCsv(event, filteredRows)}
                    className="focus-ring min-h-10 border border-primary/60 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary transition-[border-color,background-color,color,opacity] hover:border-primary hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:text-white/[0.28] disabled:hover:bg-transparent disabled:hover:text-white/[0.28]"
                  >
                    {registrationCopy.exportCsv}
                  </button>
                </div>
                {relatedRegistrations.length > 0 ? (
                  <>
                  <div className="mt-5 grid gap-3 md:hidden">
                    {filteredRows.length > 0 ? (
                      filteredRows.map(({ registration, paymentStatus, ticketStatus, checkInStatus, checkedIn }) => (
                        <div key={registration.id} className="border border-white/[0.06] bg-[#020202] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-white/[0.84]">{registration.name || registrationCopy.notProvided}</p>
                              <p className="mt-1 break-all font-mono text-xs text-white/[0.45]">{registration.email || registration.telegram_username || registration.phone || "-"}</p>
                            </div>
                            <StatusBadge label={registration.status} variant={getStatusBadgeVariant(registration.status)} size="sm" />
                          </div>
                          <div className="mt-4 grid gap-2 min-[420px]:grid-cols-3">
                            <StatusBadge label={Number(event.price) <= 0 && paymentStatus === "paid" ? "paid/free" : paymentStatus} variant={getStatusBadgeVariant(paymentStatus)} size="sm" />
                            <StatusBadge label={ticketStatus} variant={getStatusBadgeVariant(ticketStatus)} size="sm" />
                            <StatusBadge label={checkInStatus} variant={getStatusBadgeVariant(checkInStatus)} size="sm" />
                          </div>
                          <div className="mt-4 flex flex-col gap-2">
                            <select
                              value={selectedRegistrationAction[registration.id] ?? ""}
                              disabled={registrationActionKey !== null}
                              onChange={(selectEvent) =>
                                setSelectedRegistrationAction((current) => ({
                                  ...current,
                                  [registration.id]: selectEvent.target.value as RegistrationAction | ""
                                }))
                              }
                              className="focus-ring min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-white/[0.72] outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:text-white/[0.28]"
                              aria-label={registrationCopy.chooseAction}
                            >
                              <option value="">{registrationCopy.chooseAction}</option>
                              {registrationActionOrder.map((action) => (
                                <option
                                  key={action}
                                  value={action}
                                  disabled={
                                    !canRunRegistrationAction({
                                      action,
                                      registrationStatus: registration.status,
                                      paymentStatus,
                                      ticketStatus,
                                      checkedIn
                                    })
                                  }
                                >
                                  {getRegistrationActionLabel(action)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={
                                registrationActionKey !== null ||
                                !selectedRegistrationAction[registration.id] ||
                                !canRunRegistrationAction({
                                  action: selectedRegistrationAction[registration.id] as RegistrationAction,
                                  registrationStatus: registration.status,
                                  paymentStatus,
                                  ticketStatus,
                                  checkedIn
                                })
                              }
                              onClick={() => {
                                const action = selectedRegistrationAction[registration.id];

                                if (action) {
                                  runRegistrationAction(registration.id, action);
                                }
                              }}
                              className="focus-ring min-h-11 border border-primary/45 bg-[#020202] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-primary transition-[border-color,background-color,color,opacity] hover:border-primary hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:border-white/[0.07] disabled:text-white/[0.26] disabled:hover:bg-[#020202] disabled:hover:text-white/[0.26]"
                            >
                              {registrationActionKey?.startsWith(`${registration.id}:`) ? "..." : registrationCopy.applyAction}
                            </button>
                          </div>
                          {registrationActionError[registration.id] ? (
                            <p className="mt-2 text-xs leading-5 text-red-200">{registrationActionError[registration.id]}</p>
                          ) : null}
                          {registrationActionSuccess[registration.id] ? (
                            <p className="mt-2 text-xs leading-5 text-primary">{registrationActionSuccess[registration.id]}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="border border-white/[0.05] bg-[#030303] px-4 py-5 text-sm text-white/[0.48]">
                        {registrationCopy.noFilterMatch}
                      </div>
                    )}
                  </div>
                  <div className="-mx-1 mt-5 hidden overflow-x-auto [scrollbar-width:thin] md:block">
                    <table className="w-full min-w-[1480px] text-left text-sm">
                      <thead className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/[0.34]">
                        <tr>
                          <th className="py-3 pr-4 font-medium">{registrationCopy.name}</th>
                          <th className="py-3 pr-4 font-medium">{registrationCopy.phone}</th>
                          <th className="py-3 pr-4 font-medium">Email</th>
                          <th className="py-3 pr-4 font-medium">Instagram</th>
                          <th className="py-3 pr-4 font-medium">Telegram</th>
                          <th className="py-3 pr-4 font-medium">{registrationCopy.registrationStatus}</th>
                          <th className="py-3 pr-4 font-medium">{registrationCopy.paymentStatus}</th>
                          <th className="py-3 pr-4 font-medium">{registrationCopy.ticketStatus}</th>
                          <th className="py-3 pr-4 font-medium">{registrationCopy.checkIn}</th>
                          <th className="py-3 font-medium">{registrationCopy.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {filteredRows.length > 0 ? (
                          filteredRows.map(({ registration, paymentStatus, ticketStatus, checkInStatus, checkedIn }) => (
                            <tr key={registration.id} className="motion-safe:transition-colors motion-safe:duration-300 hover:bg-primary/[0.018]">
                              <td className="max-w-[190px] py-4 pr-4 font-medium text-white/[0.82]">
                                <span className="block truncate">{registration.name || registrationCopy.notProvided}</span>
                              </td>
                              <td className="py-4 pr-4 font-mono text-xs text-white/[0.45]">{registration.phone || "-"}</td>
                              <td className="max-w-[210px] py-4 pr-4 font-mono text-xs text-white/[0.45]">
                                <span className="block truncate">{registration.email || "-"}</span>
                              </td>
                              <td className="py-4 pr-4 font-mono text-xs text-white/[0.45]">{registration.instagram_nickname || "-"}</td>
                              <td className="py-4 pr-4 font-mono text-xs text-white/[0.45]">{registration.telegram_username || "-"}</td>
                              <td className="py-4 pr-4">
                                <StatusBadge label={registration.status} variant={getStatusBadgeVariant(registration.status)} size="sm" />
                              </td>
                              <td className="py-4 pr-4">
                                <StatusBadge label={Number(event.price) <= 0 && paymentStatus === "paid" ? "paid/free" : paymentStatus} variant={getStatusBadgeVariant(paymentStatus)} size="sm" />
                                {Number(event.price) > 0 && paymentStatus === "pending" ? (
                                  <p className="mt-2 max-w-[260px] text-xs leading-5 text-white/[0.42]">{getPaymentPlaceholderCopy(language)}</p>
                                ) : null}
                              </td>
                              <td className="py-4 pr-4">
                                <StatusBadge label={ticketStatus} variant={getStatusBadgeVariant(ticketStatus)} size="sm" />
                              </td>
                              <td className="py-4 pr-4">
                                <StatusBadge label={checkInStatus} variant={getStatusBadgeVariant(checkInStatus)} size="sm" />
                              </td>
                              <td className="py-4">
                                <div className="flex max-w-[300px] items-center gap-2">
                                  <select
                                    value={selectedRegistrationAction[registration.id] ?? ""}
                                    disabled={registrationActionKey !== null}
                                    onChange={(selectEvent) =>
                                      setSelectedRegistrationAction((current) => ({
                                        ...current,
                                        [registration.id]: selectEvent.target.value as RegistrationAction | ""
                                      }))
                                    }
                                    className="focus-ring min-h-10 w-[178px] border border-white/[0.08] bg-[#020202] px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-white/[0.72] outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:text-white/[0.28]"
                                    aria-label={registrationCopy.chooseAction}
                                  >
                                    <option value="">{registrationCopy.chooseAction}</option>
                                    {registrationActionOrder.map((action) => (
                                      <option
                                        key={action}
                                        value={action}
                                        disabled={
                                          !canRunRegistrationAction({
                                            action,
                                            registrationStatus: registration.status,
                                            paymentStatus,
                                            ticketStatus,
                                            checkedIn
                                          })
                                        }
                                      >
                                        {getRegistrationActionLabel(action)}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={
                                      registrationActionKey !== null ||
                                      !selectedRegistrationAction[registration.id] ||
                                      !canRunRegistrationAction({
                                        action: selectedRegistrationAction[registration.id] as RegistrationAction,
                                        registrationStatus: registration.status,
                                        paymentStatus,
                                        ticketStatus,
                                        checkedIn
                                      })
                                    }
                                    aria-busy={registrationActionKey?.startsWith(`${registration.id}:`) ?? false}
                                    onClick={() => {
                                      const action = selectedRegistrationAction[registration.id];

                                      if (action) {
                                        runRegistrationAction(registration.id, action);
                                      }
                                    }}
                                    className="focus-ring min-h-10 border border-primary/45 bg-[#020202] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-primary transition-[border-color,background-color,color,opacity] hover:border-primary hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:border-white/[0.07] disabled:text-white/[0.26] disabled:hover:bg-[#020202] disabled:hover:text-white/[0.26]"
                                  >
                                    {registrationActionKey?.startsWith(`${registration.id}:`) ? "..." : registrationCopy.applyAction}
                                  </button>
                                </div>
                                {registrationActionError[registration.id] ? (
                                  <p className="mt-2 max-w-[360px] text-xs leading-5 text-red-200">{registrationActionError[registration.id]}</p>
                                ) : null}
                                {registrationActionSuccess[registration.id] ? (
                                  <p className="mt-2 max-w-[360px] text-xs leading-5 text-primary">{registrationActionSuccess[registration.id]}</p>
                                ) : null}
                                {!registrationActionError[registration.id] &&
                                !registrationActionSuccess[registration.id] &&
                                !registrationActionOrder.some((action) =>
                                  canRunRegistrationAction({
                                    action,
                                    registrationStatus: registration.status,
                                    paymentStatus,
                                    ticketStatus,
                                    checkedIn
                                  })
                                ) ? (
                                  <p className="mt-2 max-w-[300px] text-xs leading-5 text-white/[0.34]">{registrationCopy.noAvailableActions}</p>
                                ) : null}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={10} className="py-5 text-sm text-white/[0.48]">
                              {registrationCopy.noFilterMatch}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  </>
                ) : (
                  <div className="mt-5 border border-white/[0.05] bg-[#030303] px-4 py-5 text-sm text-white/[0.48]">
                    {registrationCopy.empty}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
