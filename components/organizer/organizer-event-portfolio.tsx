"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { events as mockEvents, type RaveeraEvent } from "@/data/events";
import { getCurrentRole } from "@/lib/auth/get-role";
import { canManagePlatform } from "@/lib/auth/roles";
import { useLanguage } from "@/lib/i18n/use-language";
import { formatEventDate, getCapacityPercent } from "@/lib/format";
import { slugify } from "@/lib/slugify";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { EVENT_SELECT_FIELDS } from "@/lib/supabase/event-fields";
import { mapDatabaseEvent } from "@/lib/supabase/event-mapper";
import type { Database, EventStatus } from "@/lib/supabase/types";

type RegistrationRow = Pick<Database["public"]["Tables"]["registrations"]["Row"], "event_id" | "status">;
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type OrganizerEvent = RaveeraEvent & { dbStatus?: EventStatus };

const eventStatusOptions: EventStatus[] = ["draft", "live", "limited", "soon"];

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
  const { dictionary } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [events, setEvents] = useState<OrganizerEvent[]>(mockEvents);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const roleState = await getCurrentRole(supabase);

      if (!roleState.user || !roleState.role) {
        setLoading(false);
        return;
      }

      setCurrentUserId(roleState.user.id);

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
      const visibleEvents = mappedEvents.length > 0 ? mappedEvents : mockEvents;
      const eventIds = visibleEvents.map((event) => event.id);

      const registrationResult =
        eventIds.length > 0
          ? await supabase
              .from("registrations")
              .select("event_id,status")
              .in("event_id", eventIds)
          : { data: [] };

      if (!mounted) {
        return;
      }

      setEvents(visibleEvents);
      setRegistrations(registrationResult.data ?? []);
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

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!supabase || !currentUserId) {
      setMessage({ type: "error", text: dictionary.organizer.sessionMissing });
      return;
    }

    const title = form.title.trim();
    const slug = slugify(form.slug || form.title);
    const capacity = Number(form.capacity);
    const price = Number(form.price || 0);

    if (!title) {
      setMessage({ type: "error", text: dictionary.organizer.titleRequired });
      return;
    }

    if (!form.date) {
      setMessage({ type: "error", text: dictionary.organizer.dateRequired });
      return;
    }

    if (!slug) {
      setMessage({ type: "error", text: dictionary.organizer.slugRequired });
      return;
    }

    if (!Number.isFinite(capacity) || capacity <= 0) {
      setMessage({ type: "error", text: dictionary.organizer.capacityRequired });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setMessage({ type: "error", text: dictionary.organizer.priceInvalid });
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        subtitle: form.subtitle.trim() || null,
        slug,
        date: new Date(form.date).toISOString(),
        description: form.description.trim() || null,
        city: form.city.trim() || null,
        venue: form.venue.trim() || null,
        address: form.address.trim() || null,
        price,
        currency: form.currency.trim() || "UAH",
        capacity,
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
      setCreatedSlug(createdRow.slug);
      setMessage({
        type: "success",
        text: createdRow.status === "draft" ? dictionary.organizer.draftSaved : dictionary.organizer.eventSaved
      });
      router.refresh();
    }
  }

  return (
    <section className="org-reveal border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="flex flex-col justify-between gap-5 px-1 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">{dictionary.organizer.eventPortfolio}</p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-5xl">{dictionary.organizer.activeEvents}</h2>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((value) => !value)}
          aria-expanded={formOpen}
          className="focus-ring min-h-11 border border-primary px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-500 hover:bg-primary hover:text-black active:scale-[0.98]"
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
          {message.type === "success" && createdSlug ? (
            <Link href={`/events/${createdSlug}`} className="focus-ring mt-3 inline-flex min-h-10 items-center border border-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-black">
              {dictionary.organizer.openCreatedEvent}
            </Link>
          ) : null}
        </div>
      ) : null}

      {formOpen ? (
        <form onSubmit={createEvent} className="mt-8 border-y border-white/[0.05] bg-[#030303] px-1 py-6">
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
                type="number"
                min="0"
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
                type="number"
                min="1"
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
                placeholder="https://t.me/..."
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
            className="focus-ring mt-5 min-h-11 bg-primary px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-500 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
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
          <div key={label} className="border border-white/[0.05] bg-[#030303] p-4">
            <p className="font-mono text-3xl font-semibold tabular-nums text-white">{loading ? "..." : value}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-0">
        {events.map((event) => {
          const relatedRegistrations = registrations.filter((registration) => registration.event_id === event.id);
          const registered = relatedRegistrations.length || event.registered;
          const capacity = getCapacityPercent(registered, event.capacity);

          return (
            <div
              key={event.id}
              className="group relative border-t border-white/[0.05] bg-[#020202] px-1 py-7 motion-safe:transition-[transform,background-color] motion-safe:duration-500 motion-safe:ease-out hover:bg-[#00FF88]/[0.015] motion-safe:hover:-translate-y-0.5"
            >
              <div className="absolute left-0 top-0 h-px w-0 bg-primary motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" />
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-2xl font-black uppercase leading-none text-white">{event.title}</h3>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-white/[0.38]">
                    {formatEventDate(event.date)} / {event.time} / {event.city} / {event.venue} / {event.dbStatus ?? event.status}
                  </p>
                </div>
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">{capacity}% capacity</p>
              </div>
              <div className="mt-6 h-1 overflow-hidden bg-white/[0.05]">
                <div
                  className="h-full origin-left bg-primary motion-safe:animate-[barFill_700ms_cubic-bezier(0.16,1,0.3,1)_both] group-hover:shadow-[0_0_18px_rgba(0,255,136,0.34)]"
                  style={{ width: `${capacity}%`, "--bar-width": `${capacity}%` } as CSSProperties}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
