export type RaveeraEvent = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  address: string;
  image: string;
  price: number;
  currency: string;
  capacity: number;
  registered: number;
  stats?: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    paidTickets: number;
    reservedTickets: number;
    activeTickets: number;
    usedTickets: number;
    checkedInCount: number;
    remainingCapacity: number;
    fillPercent: number;
  };
  status: "live" | "soon" | "limited";
  tags: string[];
  lineup: string[];
  organizerId: string;
  featured: boolean;
  referralBaseUrl: string;
  organizerName?: string;
  organizerDescription?: string;
  organizerContact?: string;
  telegramUrl?: string;
  ageLimit?: string;
  dressCode?: string;
  doorsOpen?: string;
  eventType?: string;
  ticketWaveLabel?: string;
  urgencyNote?: string;
  referralEnabled?: boolean;
  walletEnabled?: boolean;
};

export const events: RaveeraEvent[] = [
  {
    id: "evt-001",
    slug: "noir-signal",
    title: "Noir Signal",
    subtitle: "A premium concert experience with melodic techno, hardgroove, and cinematic visual systems.",
    description:
      "Noir Signal opens Rave'era's premium event series with a curated lineup, controlled capacity, ticket waves, Telegram confirmation, and a cinematic production layer built for high-intensity audience energy.",
    date: "2026-05-17",
    time: "22:00",
    city: "Kyiv",
    venue: "Module 41",
    address: "Secret location revealed after confirmation",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=85",
    price: 1800,
    currency: "UAH",
    capacity: 420,
    registered: 318,
    status: "limited",
    tags: ["Concert", "Melodic Techno", "Visual Show"],
    lineup: ["Astra Void", "Mira V", "NIKS", "Rave'era Residents"],
    organizerId: "org-raveera",
    featured: true,
    referralBaseUrl: "/events/noir-signal"
  },
  {
    id: "evt-002",
    slug: "violet-current",
    title: "Violet Current",
    subtitle: "A premium open-air festival format designed around speed garage, house, and laser architecture.",
    description:
      "Violet Current is a summer-format Rave'era event with tiered access, referral-led audience growth, and Telegram confirmation for a clean registration flow.",
    date: "2026-06-08",
    time: "21:30",
    city: "Lviv",
    venue: "Terrace 9",
    address: "Pid Dubom district",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85",
    price: 1450,
    currency: "UAH",
    capacity: 360,
    registered: 184,
    status: "live",
    tags: ["Open Air", "House", "Speed Garage"],
    lineup: ["Lea Motion", "Danylo K", "SOMA Unit"],
    organizerId: "org-raveera",
    featured: false,
    referralBaseUrl: "/events/violet-current"
  },
  {
    id: "evt-003",
    slug: "blue-hour-protocol",
    title: "Blue Hour Protocol",
    subtitle: "An intimate Solana-ready cultural event for founders, artists, and selected guests.",
    description:
      "Blue Hour Protocol previews Rave'era's Web3 roadmap through a curated invite-only format, wallet-ready access concepts, and collector pass storytelling.",
    date: "2026-07-03",
    time: "20:00",
    city: "Odesa",
    venue: "Portside Loft",
    address: "By invitation",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=85",
    price: 2200,
    currency: "UAH",
    capacity: 180,
    registered: 67,
    status: "soon",
    tags: ["Invite", "Web3", "Collector Pass"],
    lineup: ["KORO", "Nadia Vektor", "Guest TBA"],
    organizerId: "org-raveera",
    featured: false,
    referralBaseUrl: "/events/blue-hour-protocol"
  }
];

export function getEventBySlug(slug: string) {
  return events.find((event) => event.slug === slug);
}

export const featuredEvent = events.find((event) => event.featured) ?? events[0];
