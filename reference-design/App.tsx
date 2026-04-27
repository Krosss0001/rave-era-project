import { useState, useEffect, useRef } from "react";
import {
  motion, AnimatePresence, useScroll, useTransform,
  useInView, useMotionValue, useSpring,
} from "framer-motion";
import {
  ArrowRight, ArrowUpRight, ChevronDown, Menu, X, Globe,
  MapPin, Mail, MessageCircle, Phone, Zap, Building2,
  Monitor, Users, LayoutGrid, CalendarDays, Mic2,
  Coffee, DollarSign, Newspaper, Ticket, Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "en" | "uk";

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    nav: { cases: "Cases", about: "About Us", services: "Services", team: "Team", contact: "Contact" },
    hero: {
      badge: "Rave'era Group · Concerts & Marketing Agency",
      line1: "We Build Events",
      line2: "That Sell",
      sub: "Conferences · Festivals · Corporate Events",
      cta: "Discuss Your Project",
      scroll: "Scroll to explore",
    },
    stats: [
      { value: 10, suffix: "+", label: "Years of experience" },
      { value: 600, suffix: "K+", label: "Guests" },
      { value: 100, suffix: "+", label: "Events per year" },
    ],
    trusted: {
      label: "Trusted By",
      items: ["VYAVA", "CRYPTO.KARATIST", "ZEEKR", "MAISON CASTEL", "JACK DANIEL'S Old №7", "HIKE", "SENOR CARTEL", "TOOSECCO", "LAVAZZA", "MUSIC BOX", "StudFest", "NCrypto 2025", "NCrypto Awards", "E-Commerce Conf", "Parkovy"],
    },
    cases: {
      idx: "01", sub: "Portfolio", title: "Our Cases",
      desc: "Real events. Real results. Here's what we've built.",
      viewAll: "View All Cases",
      items: [
        {
          title: "Zeekr 9X — Official Ukraine Launch",
          category: "Auto · Brand Launch",
          date: "May 12, 2026",
          meta: "Flagship hybrid SUV · ComAutoTrans 2026",
          img: "/images/case-zeekr.jpg",
          fit: "cover" as const,
          desc: "Official Ukrainian launch of the flagship Zeekr 9X hybrid SUV — a full Online-to-Offline (O2O) campaign tailored to the scale and innovation of the Zeekr brand.",
          bullets: [
            "Comprehensive Online-to-Offline marketing strategy",
            "Pre-Event warm-up and digital brand awareness",
            "Influencer Drive — ambassador engagement",
            "Digital bridge — converting online interest to offline attendance",
            "Live Event activation on location",
            "Gamification and audience data collection",
            "Post-Event remarketing and sales conversion",
          ],
        },
        {
          title: "SMART COMMERCE FORUM KYIV-2026",
          category: "Forum · Commerce",
          date: "2026",
          meta: "The main event for product business in Ukraine",
          img: "/images/case-smart-commerce.jpg",
          fit: "contain" as const,
          desc: "End-to-end work on event promotion and sales (B2B & B2C) for Ukraine's leading commerce forum.",
          bullets: [
            "Strategic partnerships and sponsor relations",
            "Marketing campaign and sales management",
          ],
        },
        {
          title: "Music BOX FEST",
          category: "Festival · Music",
          date: "June 21, 2025",
          meta: "Largest capital festival of 2025 · Kyiv Ice Stadium",
          img: "/images/case-music-box.jpg",
          fit: "contain" as const,
          desc: "Full-cycle work on event concept creation, promotion, and B2B/B2C sales for Kyiv's biggest festival of 2025.",
          bullets: [
            "Concept creation and sales architecture",
            "Strategic partnerships and sponsor relations",
            "Marketing campaign and sales management",
            "Onboarding to all ticketing platforms and promotion",
          ],
        },
        {
          title: "NCrypto Conference 2025",
          category: "Conference · Web3",
          date: "April 27, 2025",
          meta: "2,500+ attendees · 100+ expo companies",
          img: "/images/case-1.png",
          fit: "cover" as const,
          desc: "The main meeting point for Ukraine's crypto and Web3 community — uniting market leaders, startups, investors, and media in one space.",
          bullets: [
            "End-to-end event promotion with B2B & B2C sales",
            "Strategic partnerships and sponsor relations",
            "Marketing campaign and sales management",
            "Venue security and intelligent access logistics",
            "Turnkey production of an exclusive Afterparty",
          ],
        },
        {
          title: "E-Commerce Conference 2025",
          category: "Conference · Retail",
          date: "October 13, 2025",
          meta: "2,000+ attendees · 70+ expo companies",
          img: "/images/case-2.png",
          fit: "cover" as const,
          desc: "United the strongest players in Ukraine's eCommerce market as a platform for sharing practical experience and real cases.",
          bullets: [
            "End-to-end event promotion with B2B & B2C sales",
            "Strategic partnerships and sponsor relations",
            "Marketing campaign and sales management",
            "Venue security and intelligent access logistics",
          ],
        },
        {
          title: "NCrypto Awards 2025",
          category: "Conference · Awards",
          date: "October 12, 2025",
          meta: "2,500+ attendees · Flagship crypto event",
          img: "/images/case-3.png",
          fit: "cover" as const,
          desc: "A flagship crypto conference combined with a ceremonial award show honoring the best companies and industry leaders.",
          bullets: [
            "End-to-end event promotion with B2B & B2C sales",
            "Strategic partnerships and sponsor relations",
            "Marketing campaign and sales management",
            "Venue security and intelligent access logistics",
          ],
        },
      ],
    },
    about: {
      idx: "02", sub: "Agency", title: "About Us",
      headline: "Rave'era Group · Concerts & Marketing Agency. Full-cycle event partner.",
      p1: "An event company from Kyiv on the market since 2012, with over 10 years of hands-on experience in organizing large-scale entertainment, cultural, and social events.",
      p2: "The company started with large student and club events and over the years has executed hundreds of events with leading venues across Kyiv — regular parties, afterparties, festivals, concerts, and large-scale social projects.",
      p3: "Key projects: StudFest, StudMiss, Holi Fest, MusicBox Fest, charity balls for Kyiv City Administration.",
      quote: "Today, Rave'era Group Concerts & Marketing Agency is a systematic event agency combining creativity, production, marketing, and work with large audiences.",
    },
    ravepass: {
      badge: "Proprietary Ticketing Technology",
      title: "Rave'Era Arbitration Tickets Service",
      shortTitle: "Tickets Service",
      desc: "Our proprietary visitor management and ticketing arbitration system ensures fast registration, reliable access control, and complete analytics for your event.",
      features: [
        { title: "Fast Registration", desc: "Instant QR code scanning and automatic guest verification" },
        { title: "Access Control", desc: "Zone differentiation for different participant categories" },
        { title: "Attendance Statistics", desc: "Real-time analytics: guest count, peak attendance times" },
      ],
    },
    services: {
      idx: "03", sub: "What We Do", title: "Our Services",
      items: [
        {
          title: "Concept & Strategy",
          desc: "We create events as business products. Idea, format, script, and event logic tailored to your goals.",
          tags: ["Client goal analysis", "Concept development", "Script & timing"],
        },
        {
          title: "Venue Selection",
          desc: "We select the perfect venue for your format, budget, and guest count.",
          tags: ["Conference halls", "Technical assessment", "Contract negotiation"],
        },
        {
          title: "Full Technical Production",
          desc: "Complete technical production for your event.",
          tags: ["Stage", "Professional sound", "Lighting & LED"],
        },
        {
          title: "Team & Staff",
          desc: "We fully staff your event with professionals.",
          tags: ["Hostesses", "Security", "Technical staff"],
        },
        {
          title: "Expo Zone & Design",
          desc: "We create spaces that sell.",
          tags: ["Partner expo booths", "Photo zones", "Branded décor"],
        },
        {
          title: "Event Program",
          desc: "Full control of event content.",
          tags: ["Agenda formation", "Speaker coordination", "Stage timing"],
        },
        {
          title: "Artists & Hosts",
          desc: "We work with artists of any scale.",
          tags: ["Top hosts", "Ukrainian & international artists", "DJs & performances"],
        },
        {
          title: "Catering & Service",
          desc: "Complete F&B service for your event.",
          tags: ["Coffee breaks", "Buffets", "VIP catering"],
        },
        {
          title: "Sponsors & Partners",
          desc: "We don't just search — we sell participation in your event.",
          tags: ["Sponsor acquisition", "Partnership packages", "Exhibitor management"],
        },
        {
          title: "PR & Media",
          desc: "We transform your event into a news story.",
          tags: ["Media partner relations", "Influencers", "PR campaigns"],
        },
        {
          title: "Ticketing & Analytics",
          desc: "Our proprietary visitor management technology.",
          tags: ["Ticket generation", "QR scanning", "Entry control"],
        },
        {
          title: "Activities & Wow Effects",
          desc: "We don't just create events — we create emotions.",
          tags: ["Interactive zones", "Gamification", "Contests"],
        },
      ],
    },
    team: {
      idx: "04", sub: "People", title: "Our Team",
      desc: "Professionals who create unforgettable events.",
      members: [
        { name: "Bohdan Chekan", role: "CEO & Co-Founder", desc: "Marketing, brand, client acquisition", img: "/images/team-bogdan.jpg" },
        { name: "Yaroslav", role: "CMO, IT Lead & Co-Founder", desc: "Strategy, IT systems, client coordination, technical production, marketing", img: "/images/team-yaroslav.jpg" },
      ],
    },
    contact: {
      idx: "05", sub: "Contact",
      title1: "Ready to",
      title2: "Collaborate?",
      desc: "We create events that are remembered. Contact us — let's discuss your project.",
      namePh: "Your name",
      emailPh: "Your email",
      msgPh: "Tell us about your event...",
      send: "Send Message",
      sending: "Sending...",
      sent: "Message Sent",
      tgLabel: "Telegram",
      tgHandle: "@bogdan_chekan",
      tgDesc: "Quick contact with our manager",
      emailLabel: "Email",
      emailAddr: "citointrues@gmail.com",
      emailDesc: "For official inquiries",
      phoneLabel: "Phone",
      phoneNum: "+38 (093) 430-75-51",
      locLabel: "Location",
      locAddr: "Kyiv, Ukraine",
    },
    footer: {
      tagline: "Full-cycle event agency from Kyiv.",
      sub: "Over 10 years of experience in organizing large-scale events.",
      copy: "© 2026 Rave'era Group Agency. All rights reserved.",
      menu: ["Cases", "About Us", "Services", "Team", "Contacts"],
    },
  },

  uk: {
    nav: { cases: "Кейси", about: "Про нас", services: "Послуги", team: "Команда", contact: "Контакт" },
    hero: {
      badge: "Rave'era Group · Concerts & Marketing Agency",
      line1: "Ми Будуємо Події,",
      line2: "Які Продають",
      sub: "Конференції · Фестивалі · Корпоративні заходи",
      cta: "Обговорити Проєкт",
      scroll: "Гортати далі",
    },
    stats: [
      { value: 10, suffix: "+", label: "Років досвіду" },
      { value: 600, suffix: "K+", label: "Гостей" },
      { value: 100, suffix: "+", label: "Подій на рік" },
    ],
    trusted: {
      label: "Нам Довіряють",
      items: ["VYAVA", "CRYPTO.KARATIST", "ZEEKR", "MAISON CASTEL", "JACK DANIEL'S Old №7", "HIKE", "SENOR CARTEL", "TOOSECCO", "LAVAZZA", "MUSIC BOX", "StudFest", "NCrypto 2025", "NCrypto Awards", "E-Commerce Conf", "Parkovy"],
    },
    cases: {
      idx: "01", sub: "Портфоліо", title: "Наші Кейси",
      desc: "Реальні події. Реальні результати. Ось що ми побудували.",
      viewAll: "Усі Кейси",
      items: [
        {
          title: "Zeekr 9X — офіційна презентація в Україні",
          category: "Авто · Запуск бренду",
          date: "12 травня 2026",
          meta: "Флагманський гібридний позашляховик · ComAutoTrans 2026",
          img: "/images/case-zeekr.jpg",
          fit: "cover" as const,
          desc: "Офіційна презентація флагманського гібридного позашляховика Zeekr 9X в Україні — комплексна Online-to-Offline (O2O) кампанія, адаптована під масштаб та інноваційність бренду Zeekr.",
          bullets: [
            "Комплексна маркетингова стратегія (Online-to-Offline)",
            "Прогрів та цифрова впізнаваність (Pre-Event)",
            "Influencer Drive (залучення амбасадорів)",
            "Digital-міст (конверсія в офлайн)",
            "Активація на локації (Live Event)",
            "Гейміфікація та збір даних (Engagement)",
            "Ремаркетинг та продаж (Post-Event)",
          ],
        },
        {
          title: "SMART COMMERCE FORUM KYIV-2026",
          category: "Форум · Комерція",
          date: "2026",
          meta: "Головна подія для товарного бізнесу в Україні",
          img: "/images/case-smart-commerce.jpg",
          fit: "contain" as const,
          desc: "Комплексна робота з промовшином заходу та продажі b2b, b2c для головної події товарного бізнесу України.",
          bullets: [
            "Стратегічне партнерство та робота зі спонсорами",
            "Маркетингова кампанія та управління продажами",
          ],
        },
        {
          title: "Music BOX FEST",
          category: "Фестиваль · Музика",
          date: "21 червня 2025",
          meta: "Найбільший столичний фестиваль 2025 · Льодовий стадіон, Київ",
          img: "/images/case-music-box.jpg",
          fit: "contain" as const,
          desc: "Комплексна робота з створення ідеї заходу, промовшином заходу, та продажі b2b, b2c для найбільшого столичного фестивалю 2025 року.",
          bullets: [
            "Створення ідеї заходу та архітектури продаж",
            "Стратегічне партнерство та робота зі спонсорами",
            "Маркетингова кампанія та управління продажами",
            "Заведення заходу на всі білетні оператори та просування",
          ],
        },
        {
          title: "NCrypto Conference 2025",
          category: "Конференція · Web3",
          date: "27 квітня 2025",
          meta: "2 500+ учасників · 100+ компаній на expo",
          img: "/images/case-1.png",
          fit: "cover" as const,
          desc: "Головна точка зустрічі крипто- та Web3-спільноти України — об'єднала лідерів ринку, стартапи, інвесторів і медіа в одному просторі.",
          bullets: [
            "Комплексна робота з промовшином заходу та продажі b2b, b2c",
            "Стратегічне партнерство та робота зі спонсорами",
            "Маркетингова кампанія та управління продажами",
            "Безпека локації та інтелектуальна логістика пропуску",
            "Організація ексклюзивного Afterparty «під ключ»",
          ],
        },
        {
          title: "E-Commerce Conference 2025",
          category: "Конференція · Рітейл",
          date: "13 жовтня 2025",
          meta: "2 000+ учасників · 70+ компаній на expo",
          img: "/images/case-2.png",
          fit: "cover" as const,
          desc: "Об'єднала найсильніших гравців ринку eCommerce України і стала майданчиком для обміну практичним досвідом і реальними кейсами.",
          bullets: [
            "Комплексна робота з промовшином заходу та продажі b2b, b2c",
            "Стратегічне партнерство та робота зі спонсорами",
            "Маркетингова кампанія та управління продажами",
            "Безпека локації та інтелектуальна логістика пропуску",
          ],
        },
        {
          title: "NCrypto Awards 2025",
          category: "Конференція · Нагороди",
          date: "12 жовтня 2025",
          meta: "2 500+ учасників · Флагманська крипто-подія",
          img: "/images/case-3.png",
          fit: "cover" as const,
          desc: "Флагманська крипто-конференція у поєднанні з церемонією нагородження кращих компаній та лідерів індустрії.",
          bullets: [
            "Комплексна робота з промовшином заходу та продажі b2b, b2c",
            "Стратегічне партнерство та робота зі спонсорами",
            "Маркетингова кампанія та управління продажами",
            "Безпека локації та інтелектуальна логістика пропуску",
          ],
        },
      ],
    },
    about: {
      idx: "02", sub: "Агентство", title: "Про Нас",
      headline: "Rave'era Group · Concerts & Marketing Agency. Повноциклове івент-партнерство.",
      p1: "Івент-компанія з Києва на ринку з 2012 року, з понад 10 роками практичного досвіду в організації масштабних розважальних, культурних і соціальних подій.",
      p2: "Компанія почала з великих студентських і клубних заходів, а з роками провела сотні подій у партнерстві з провідними майданчиками Києва — вечірки, afterparty, фестивалі, концерти та масштабні соціальні проєкти.",
      p3: "Ключові проєкти: StudFest, StudMiss, Holi Fest, MusicBox Fest, благодійні бали для КМДА.",
      quote: "Сьогодні Rave'era Group Concerts & Marketing Agency — це системне івент-агентство, що поєднує креатив, продакшн, маркетинг і роботу з великою аудиторією.",
    },
    ravepass: {
      badge: "Власна технологія квиткового сервісу",
      title: "Rave'Era Arbitration Tickets Service",
      shortTitle: "Tickets Service",
      desc: "Наша власна система арбітражу квитків та управління відвідувачами забезпечує швидку реєстрацію, надійний контроль доступу та повну аналітику вашого заходу.",
      features: [
        { title: "Швидка реєстрація", desc: "Миттєве сканування QR-коду та автоматична верифікація гостя" },
        { title: "Контроль доступу", desc: "Зонування для різних категорій учасників" },
        { title: "Статистика відвідуваності", desc: "Аналітика в реальному часі: кількість гостей, пікові години" },
      ],
    },
    services: {
      idx: "03", sub: "Що Ми Робимо", title: "Наші Послуги",
      items: [
        {
          title: "Концепція та Стратегія",
          desc: "Ми створюємо події як бізнес-продукти. Ідея, формат, сценарій і логіка події під ваші цілі.",
          tags: ["Аналіз цілей", "Розробка концепції", "Сценарій і тайминг"],
        },
        {
          title: "Вибір Майданчика",
          desc: "Підбираємо ідеальний майданчик під ваш формат, бюджет і кількість гостей.",
          tags: ["Конференц-зали", "Технічна оцінка", "Узгодження умов"],
        },
        {
          title: "Повний Технічний Продакшн",
          desc: "Забезпечуємо повний технічний продакшн вашого заходу.",
          tags: ["Сцена", "Професійний звук", "Світло та LED-екрани"],
        },
        {
          title: "Команда та Персонал",
          desc: "Повністю забезпечуємо ваш захід персоналом.",
          tags: ["Хостес", "Охорона", "Технічний персонал"],
        },
        {
          title: "Expo-зона та Дизайн",
          desc: "Ми створюємо простори, що продають.",
          tags: ["Стенди партнерів", "Фотозони", "Брендоване оформлення"],
        },
        {
          title: "Програма Заходу",
          desc: "Повний контроль контенту події.",
          tags: ["Формування агенди", "Координація спікерів", "Тайминг сцени"],
        },
        {
          title: "Артисти та Ведучі",
          desc: "Працюємо з артистами будь-якого масштабу.",
          tags: ["Топові ведучі", "Українські та міжнародні артисти", "DJ та шоу-програми"],
        },
        {
          title: "Кейтеринг і Сервіс",
          desc: "Організовуємо повне F&B-обслуговування.",
          tags: ["Кавові паузи", "Фуршети", "VIP-кейтеринг"],
        },
        {
          title: "Спонсорство та Партнери",
          desc: "Ми не просто шукаємо — ми продаємо участь у вашій події.",
          tags: ["Залучення спонсорів", "Партнерські пакети", "Управління експонентами"],
        },
        {
          title: "PR та Медіа",
          desc: "Перетворюємо вашу подію на новину.",
          tags: ["Медіапартнери", "Інфлюенсери", "PR-кампанії"],
        },
        {
          title: "Квитки та Аналітика",
          desc: "Наша власна технологія управління відвідувачами.",
          tags: ["Генерація квитків", "QR-сканування", "Контроль входу"],
        },
        {
          title: "Активності та Wow-ефекти",
          desc: "Ми не просто організовуємо події — ми створюємо емоції.",
          tags: ["Інтерактивні зони", "Гейміфікація", "Конкурси"],
        },
      ],
    },
    team: {
      idx: "04", sub: "Люди", title: "Наша Команда",
      desc: "Професіонали, що створюють незабутні події.",
      members: [
        { name: "Богдан Чекан", role: "CEO та Співзасновник", desc: "Маркетинг, бренд, залучення клієнтів", img: "/images/team-bogdan.jpg" },
        { name: "Ярослав", role: "CMO, IT Lead та Співзасновник", desc: "Стратегія, IT-системи, координація клієнтів, технічний продакшн, маркетинг", img: "/images/team-yaroslav.jpg" },
      ],
    },
    contact: {
      idx: "05", sub: "Контакт",
      title1: "Готові до",
      title2: "Співпраці?",
      desc: "Ми створюємо події, які пам'ятають. Напишіть нам — обговоримо ваш проєкт.",
      namePh: "Ваше ім'я",
      emailPh: "Ваш email",
      msgPh: "Розкажіть про ваш захід...",
      send: "Надіслати",
      sending: "Надсилання...",
      sent: "Надіслано",
      tgLabel: "Telegram",
      tgHandle: "@bogdan_chekan",
      tgDesc: "Швидкий зв'язок з менеджером",
      emailLabel: "Email",
      emailAddr: "citointrues@gmail.com",
      emailDesc: "Для офіційних запитів",
      phoneLabel: "Телефон",
      phoneNum: "+38 (093) 430-75-51",
      locLabel: "Місцезнаходження",
      locAddr: "Київ, Україна",
    },
    footer: {
      tagline: "Повноциклове івент-агентство з Києва.",
      sub: "Понад 10 років досвіду в організації масштабних подій.",
      copy: "© 2026 Rave'era Group Agency. Всі права захищені.",
      menu: ["Кейси", "Про нас", "Послуги", "Команда", "Контакти"],
    },
  },
} as const;

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Service icons ────────────────────────────────────────────────────────────

const SVC_ICONS = [
  <Zap className="w-5 h-5" />, <Building2 className="w-5 h-5" />, <Monitor className="w-5 h-5" />,
  <Users className="w-5 h-5" />, <LayoutGrid className="w-5 h-5" />, <CalendarDays className="w-5 h-5" />,
  <Mic2 className="w-5 h-5" />, <Coffee className="w-5 h-5" />, <DollarSign className="w-5 h-5" />,
  <Newspaper className="w-5 h-5" />, <Ticket className="w-5 h-5" />, <Sparkles className="w-5 h-5" />,
];

const G = "#00FF88";

// ─── Sub-components ───────────────────────────────────────────────────────────

function BrandLine({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <span className={className}>
        Rave<span style={{ color: G }}>'</span>era Group
      </span>
    );
  }
  return (
    <span className={className}>
      Rave<span style={{ color: G }}>'</span>era Group{" "}
      <span style={{ color: G }}>·</span> Concerts{" "}
      <span style={{ color: G }}>&amp;</span> Marketing Agency
    </span>
  );
}

function SectionLabel({ idx, sub }: { idx: string; sub: string }) {
  return (
    <motion.div variants={fadeIn} className="flex items-center gap-3 mb-5">
      <span className="text-[10px] font-mono text-white/20 tracking-widest">{idx}</span>
      <span className="w-5 h-px bg-white/10" />
      <span className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: G }}>{sub}</span>
    </motion.div>
  );
}

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 55, damping: 18 });
  const [val, setVal] = useState(0);
  useEffect(() => { if (inView) mv.set(target); }, [inView, mv, target]);
  useEffect(() => spring.on("change", (v) => setVal(Math.round(v))), [spring]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const tr = T[lang];

  const { scrollY, scrollYProgress } = useScroll();
  useEffect(() => scrollY.on("change", (v) => setNavScrolled(v > 50)), [scrollY]);

  useEffect(() => { document.documentElement.lang = lang === "uk" ? "uk" : "en"; }, [lang]);

  useEffect(() => {
    const ids = ["hero", "cases", "about", "ravepass", "services", "team", "contact"];
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }); },
      { threshold: 0.25 }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const heroY = useTransform(scrollY, [0, 600], [0, -90]);
  const heroOp = useTransform(scrollY, [0, 500], [1, 0]);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };
  const toggleLang = () => setLang((l) => (l === "en" ? "uk" : "en"));


  const navLinks = (["cases", "about", "services", "team"] as const);

  return (
    <div className="bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Scroll progress ── */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left" style={{ scaleX: scrollYProgress, background: G }} />

      {/* ── Navbar ── */}
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? "bg-black/95 backdrop-blur-xl border-b border-white/[0.06]" : ""}`}
      >
        <div className="max-w-7xl 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 h-14 sm:h-16 md:h-20 flex items-center justify-between gap-3">
          <button onClick={() => scrollTo("hero")} className="text-xs sm:text-sm md:text-base font-black tracking-tight uppercase leading-none text-white hover:opacity-80 transition-opacity whitespace-nowrap min-w-0 truncate">
            <span className="lg:hidden"><BrandLine compact /></span>
            <span className="hidden lg:inline"><BrandLine /></span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((k) => (
              <button key={k} onClick={() => scrollTo(k)} className={`relative text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors duration-200 ${activeSection === k ? "text-white" : "text-white/40 hover:text-white"}`}>
                {tr.nav[k]}
                {activeSection === k && <motion.span layoutId="nav-ul" className="absolute -bottom-1 left-0 right-0 h-px" style={{ background: G }} />}
              </button>
            ))}
            <button onClick={() => scrollTo("contact")} className="text-[11px] font-bold tracking-[0.14em] uppercase px-4 py-2 border transition-all duration-200 hover:bg-[#00FF88] hover:text-black" style={{ borderColor: G, color: G }}>
              {tr.nav.contact}
            </button>
            <button onClick={toggleLang} className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase border border-white/10 px-3 py-2 text-white/35 hover:border-white/25 hover:text-white transition-all">
              <Globe className="w-3 h-3" />
              <AnimatePresence mode="wait">
                <motion.span key={lang} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.18 }}>
                  {lang === "en" ? "UA" : "EN"}
                </motion.span>
              </AnimatePresence>
            </button>
          </nav>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleLang} className="flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase border border-white/10 px-2 py-1.5 text-white/35 hover:text-[#00FF88] transition-all">
              <Globe className="w-3 h-3" />{lang === "en" ? "UA" : "EN"}
            </button>
            <button onClick={() => setMenuOpen((v) => !v)} className="p-1.5 text-white/50 hover:text-white transition-colors">
              <AnimatePresence mode="wait">
                <motion.div key={String(menuOpen)} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="md:hidden overflow-hidden bg-black/97 border-t border-white/[0.06]">
              <div className="px-8 py-7 flex flex-col gap-5">
                {([...navLinks, "contact"] as const).map((k, i) => (
                  <motion.button key={k} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => scrollTo(k)}
                    className="text-left text-sm font-semibold tracking-[0.14em] uppercase transition-colors"
                    style={{ color: k === "contact" ? G : "rgba(255,255,255,0.55)" }}>
                    {tr.nav[k]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── Hero ── */}
      <section id="hero" className="relative h-screen min-h-[680px] flex flex-col justify-center px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ scale: [1, 1.14, 1], opacity: [0.09, 0.14, 0.09] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] right-[-5%] w-[60vw] h-[60vw] rounded-full blur-[140px]" style={{ background: G }} />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-[0%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px]" style={{ background: G }} />
          <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.02, 0.04, 0.02] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[50%] left-[40%] w-[30vw] h-[30vw] rounded-full blur-[90px] bg-emerald-900/20" />
        </div>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)`, backgroundSize: "80px 80px" }} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/40" />

        <motion.div style={{ y: heroY, opacity: heroOp }} className="relative z-10 max-w-7xl mx-auto w-full pt-20">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2.5 mb-8">
              <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] border px-4 py-2" style={{ borderColor: `${G}40`, color: G, background: `${G}08` }}>
                <motion.span animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: G }} />
                {tr.hero.badge}
              </span>
            </motion.div>

            <motion.h1 variants={stagger} className="font-black leading-[0.86] tracking-tighter uppercase" style={{ fontSize: "clamp(3rem, 9.5vw, 10.5rem)" }}>
              <AnimatePresence mode="wait">
                <motion.div key={lang + "l1"} initial={{ opacity: 0, y: "25%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "-15%" }} transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }} className="block text-white">
                  {tr.hero.line1}
                </motion.div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.div key={lang + "l2"} initial={{ opacity: 0, y: "25%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "-15%" }} transition={{ duration: 0.48, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
                  className="block" style={{ color: G, textShadow: `0 0 100px ${G}45` }}>
                  {tr.hero.line2}
                </motion.div>
              </AnimatePresence>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-base md:text-lg text-white/45 font-light tracking-wide">
              {tr.hero.sub.split(" · ").map((word, i, arr) => (
                <span key={i}>
                  {word}
                  {i < arr.length - 1 && <span className="mx-2.5" style={{ color: G }}>·</span>}
                </span>
              ))}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-5">
              <button onClick={() => scrollTo("contact")}
                className="group relative overflow-hidden px-8 py-4 font-bold text-sm uppercase tracking-widest text-black" style={{ background: G }}>
                <span className="relative z-10 flex items-center gap-2">
                  {tr.hero.cta} <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <motion.div className="absolute inset-0 bg-white" initial={{ x: "-100%" }} whileHover={{ x: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} />
              </button>
              <button onClick={() => scrollTo("cases")} className="text-sm font-semibold uppercase tracking-widest text-white/30 hover:text-white transition-colors border-b border-white/10 hover:border-white pb-0.5">
                {lang === "en" ? "View Cases" : "Дивитись кейси"}
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-16 pt-8 border-t border-white/[0.07] grid grid-cols-3 gap-6 max-w-md">
              {tr.stats.map((s, i) => (
                <div key={i}>
                  <div className="text-2xl md:text-3xl font-black" style={{ color: G }}>
                    <Counter target={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer" onClick={() => scrollTo("cases")}>
          <span className="text-[9px] font-mono text-white/15 uppercase tracking-[0.22em]">{tr.hero.scroll}</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="w-4 h-4 text-white/15" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Cases ── */}
      <section id="cases" className="py-24 md:py-36 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <SectionLabel idx={tr.cases.idx} sub={tr.cases.sub} />
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-5">
              <div>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88]">{tr.cases.title}</motion.h2>
                <motion.p variants={fadeIn} className="text-white/35 text-sm mt-4 max-w-xs leading-relaxed">{tr.cases.desc}</motion.p>
              </div>
              <motion.div variants={fadeIn} className="shrink-0 flex items-center gap-3 text-[10px] font-mono tracking-[0.2em] uppercase text-white/30 whitespace-pre-line leading-tight">
                <span className="font-black text-3xl md:text-4xl tracking-tighter leading-none" style={{ color: G }}>{String(tr.cases.items.length).padStart(2,"0")}</span>
                <span>{lang === "en" ? "Featured\nCases" : "Топ\nКейсів"}</span>
              </motion.div>
            </div>

            <div className="space-y-20">
              {tr.cases.items.map((c, i) => (
                <motion.div key={i} variants={fadeUp} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                  {/* Image side */}
                  <div className={`${i % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className="relative overflow-hidden aspect-video bg-black group">
                      <img src={c.img} alt={c.title}
                        className={`w-full h-full transition-all duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 ${c.fit === "contain" ? "object-contain" : "object-cover"}`} />
                      {c.fit !== "contain" && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      )}
                      <div className="absolute inset-0 border border-white/0 group-hover:border-[#00FF88]/30 transition-colors duration-500" />
                      <div className="absolute top-4 left-4 z-10">
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 bg-black/80 backdrop-blur-sm text-white/70 border border-white/10">{c.category}</span>
                      </div>
                      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-white/60 z-10 px-2 py-1 bg-black/70 backdrop-blur-sm">{c.date}</div>
                    </div>
                  </div>
                  {/* Text side */}
                  <div className={`${i % 2 === 1 ? "lg:order-1" : ""}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] font-mono font-bold tracking-[0.22em]" style={{ color: G }}>
                        {String(i + 1).padStart(2, "0")} / {String(tr.cases.items.length).padStart(2, "0")}
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-[#00FF88]/30 to-transparent" />
                    </div>
                    <div className="text-[10px] font-mono text-white/30 mb-3 tracking-widest uppercase">{c.meta}</div>
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4" style={{ color: i === 0 ? G : "white" }}>{c.title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed mb-6">{c.desc}</p>
                    <ul className="space-y-2">
                      {c.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-white/45">
                          <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: G }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-24 md:py-36 px-6 md:px-12 bg-[#030303] border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <SectionLabel idx={tr.about.idx} sub={tr.about.sub} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-start">
              <div>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.88] mb-6">{tr.about.title}</motion.h2>
                <motion.p variants={fadeUp} className="text-base font-bold text-white/80 mb-5">{tr.about.headline}</motion.p>
                <motion.p variants={fadeUp} className="text-sm text-white/45 leading-relaxed mb-4">{tr.about.p1}</motion.p>
                <motion.p variants={fadeUp} className="text-sm text-white/45 leading-relaxed mb-4">{tr.about.p2}</motion.p>
                <motion.p variants={fadeUp} className="text-sm text-white/30 leading-relaxed mb-10">{tr.about.p3}</motion.p>

                <motion.blockquote variants={fadeUp} className="relative border-l-2 pl-8 py-2 italic text-white/65 text-base leading-relaxed" style={{ borderColor: G }}>
                  <span className="absolute -left-1 -top-3 font-black select-none leading-none" style={{ color: G, fontSize: "3.5rem", textShadow: `0 0 30px ${G}40` }}>“</span>
                  {tr.about.quote}
                </motion.blockquote>

                <motion.div variants={fadeUp} className="mt-10 grid grid-cols-3 gap-5 pt-8 border-t border-white/[0.06]">
                  {tr.stats.map((s, i) => (
                    <div key={i}>
                      <div className="text-2xl font-black text-white"><Counter target={s.value} suffix={s.suffix} /></div>
                      <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest mt-1">{s.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} className="mt-10">
                  <img src="/images/about-1.png" alt="event" className="w-full aspect-square object-cover" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}>
                  <img src="/images/about-2.png" alt="event" className="w-full aspect-[4/5] object-cover" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── RavePass ── */}
      <section id="ravepass" className="py-24 md:py-32 px-6 md:px-12 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div>
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] border px-3 py-1.5 mb-8" style={{ borderColor: `${G}35`, color: G, background: `${G}06` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: G }} />
                {tr.ravepass.badge}
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.92] mb-6" style={{ color: G }}>
                {tr.ravepass.title}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-sm text-white/45 leading-relaxed mb-10 max-w-md">{tr.ravepass.desc}</motion.p>
              <motion.div variants={stagger} className="space-y-5">
                {tr.ravepass.features.map((f, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex gap-4">
                    <div className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center border" style={{ borderColor: `${G}50`, background: `${G}10` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: G }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-0.5">{f.title}</div>
                      <div className="text-xs text-white/35">{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-video lg:aspect-square bg-[#040404] overflow-hidden border border-white/[0.07] group">
              {/* Pattern grid */}
              <div className="absolute inset-0 opacity-25" style={{
                backgroundImage: `linear-gradient(${G}18 1px,transparent 1px),linear-gradient(90deg,${G}18 1px,transparent 1px)`,
                backgroundSize: "32px 32px",
              }} />
              {/* Radial glow */}
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full blur-[80px]" style={{ background: G }} />
              {/* Corner brackets */}
              {[
                "top-3 left-3 border-l-2 border-t-2",
                "top-3 right-3 border-r-2 border-t-2",
                "bottom-3 left-3 border-l-2 border-b-2",
                "bottom-3 right-3 border-r-2 border-b-2",
              ].map((p, i) => <span key={i} className={`absolute w-5 h-5 ${p}`} style={{ borderColor: G }} />)}
              {/* QR-style decorative corner */}
              <div className="absolute top-7 right-7 grid grid-cols-3 gap-0.5 opacity-40">
                {Array.from({ length: 9 }).map((_, k) => (
                  <span key={k} className={`w-1.5 h-1.5 ${k % 3 === 0 || k === 4 ? "bg-[#00FF88]" : "bg-white/20"}`} />
                ))}
              </div>
              <div className="relative z-10 h-full flex items-center justify-center px-8">
                <div className="text-center">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                    <Ticket className="w-14 h-14 mx-auto mb-6" style={{ color: G, filter: `drop-shadow(0 0 24px ${G})` }} />
                  </motion.div>
                  <div className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.92]" style={{ color: G, textShadow: `0 0 60px ${G}90` }}>
                    Rave<span className="text-white">'</span>Era<br/>Tickets<br/>Service
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-white/55 px-3 py-1.5 border" style={{ borderColor: `${G}30` }}>
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: G }} />
                    Arbitration Engine
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 md:py-36 px-6 md:px-12 bg-[#030303] border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <SectionLabel idx={tr.services.idx} sub={tr.services.sub} />
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.88] mb-14 max-w-2xl">{tr.services.title}</motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {tr.services.items.map((s, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="group relative border border-white/[0.05] p-6 hover:border-[#00FF88]/30 transition-all duration-400 overflow-hidden cursor-default bg-black/20 hover:bg-[#00FF88]/[0.02]">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 30% 0%, ${G}10, transparent 60%)` }} />
                  <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full transition-all duration-700" style={{ background: G }} />
                  <span className="absolute top-4 right-5 text-[9px] font-mono font-bold tracking-widest text-white/15 group-hover:text-[#00FF88]/60 transition-colors duration-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative z-10">
                    <div className="mb-4 p-2.5 inline-flex border border-white/[0.08] group-hover:border-[#00FF88]/40 group-hover:bg-[#00FF88]/[0.05] transition-all duration-300" style={{ color: G }}>
                      {SVC_ICONS[i]}
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.07em] mb-2.5 group-hover:text-[#00FF88] transition-colors duration-300">{s.title}</h3>
                    <p className="text-[11px] text-white/35 leading-relaxed mb-4">{s.desc}</p>
                    <ul className="space-y-1">
                      {s.tags.map((tag, j) => (
                        <li key={j} className="flex items-center gap-1.5 text-[10px] text-white/25">
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: `${G}60` }} />
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trusted By (Marquee) ── */}
      <section className="py-14 md:py-20 border-y border-white/[0.06] bg-[#020202] overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${G}05, transparent 70%)` }} />
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8 relative z-10">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="w-8 h-px" style={{ background: G }} />
              <p className="text-[10px] font-mono uppercase tracking-[0.28em]" style={{ color: G }}>{tr.trusted.label}</p>
            </div>
            <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.2em]">{tr.trusted.items.length}+ {lang === "en" ? "Brands & Partners" : "Брендів і Партнерів"}</p>
          </div>
        </div>
        <div className="relative z-10 space-y-5">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#020202] to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#020202] to-transparent z-20 pointer-events-none" />
          {/* Row 1 */}
          <div className="flex overflow-hidden">
            <motion.div
              className="flex shrink-0 gap-12 md:gap-16 pr-12 md:pr-16 items-center"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            >
              {[...tr.trusted.items, ...tr.trusted.items].map((name, i) => (
                <span key={i} className="text-xl md:text-3xl font-black tracking-tighter uppercase text-white/30 hover:text-white whitespace-nowrap transition-colors duration-300 cursor-default flex items-center gap-12 md:gap-16">
                  {name}
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: G, boxShadow: `0 0 14px ${G}` }} />
                </span>
              ))}
            </motion.div>
          </div>
          {/* Row 2 (reverse, slower, dimmer) */}
          <div className="flex overflow-hidden">
            <motion.div
              className="flex shrink-0 gap-10 md:gap-14 pr-10 md:pr-14 items-center"
              animate={{ x: ["-50%", "0%"] }}
              transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
            >
              {[...tr.trusted.items.slice().reverse(), ...tr.trusted.items.slice().reverse()].map((name, i) => (
                <span key={i} className="text-base md:text-xl font-bold tracking-[0.18em] uppercase text-white/15 hover:text-[#00FF88] whitespace-nowrap transition-colors duration-300 cursor-default flex items-center gap-10 md:gap-14">
                  {name}
                  <span className="w-1 h-1 rounded-full bg-white/15" />
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section id="team" className="py-24 md:py-36 px-6 md:px-12 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <SectionLabel idx={tr.team.idx} sub={tr.team.sub} />
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
              <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.88]">{tr.team.title}</motion.h2>
              <motion.p variants={fadeIn} className="text-white/25 text-sm font-mono">{tr.team.desc}</motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8 max-w-3xl">
              {tr.team.members.map((m, i) => (
                <motion.div key={i} variants={fadeUp} className="group relative overflow-hidden border border-white/[0.07] hover:border-white/[0.18] transition-all duration-500 bg-[#080808]">
                  <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
                    <img src={m.img} alt={m.name} onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                      className="w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600" style={{ background: `linear-gradient(to top, ${G}18, transparent 55%)` }} />
                    <motion.div className="absolute bottom-0 left-0 right-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-600" style={{ background: G }} />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-[8px] font-mono uppercase tracking-widest px-2.5 py-1.5 bg-black/80 backdrop-blur-sm" style={{ color: G, border: `1px solid ${G}30` }}>Co-Founder</div>
                    </div>
                  </div>
                  <div className="p-5 md:p-6">
                    <h3 className="text-base md:text-lg font-black uppercase tracking-tight mb-1">{m.name}</h3>
                    <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: G }}>{m.role}</p>
                    <p className="text-xs md:text-sm text-white/30 leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24 md:py-36 px-6 md:px-12 relative overflow-hidden border-t border-white/[0.04]">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px]" style={{ background: G }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <div className="flex justify-center mb-5">
              <SectionLabel idx={tr.contact.idx} sub={tr.contact.sub} />
            </div>

            <motion.h2 variants={fadeUp} className="font-black uppercase tracking-tighter leading-[0.88] mb-6" style={{ fontSize: "clamp(2.8rem, 8vw, 8rem)" }}>
              <span className="text-white">{tr.contact.title1} </span>
              <span style={{ color: G, textShadow: `0 0 100px ${G}50` }}>{tr.contact.title2}</span>
            </motion.h2>

            <motion.p variants={fadeIn} className="text-white/35 text-sm md:text-base leading-relaxed mb-14 max-w-lg mx-auto">{tr.contact.desc}</motion.p>

            <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { icon: <MessageCircle className="w-5 h-5" />, label: tr.contact.tgLabel, main: tr.contact.tgHandle, sub: tr.contact.tgDesc, href: "https://t.me/bogdan_chekan" },
                { icon: <Mail className="w-5 h-5" />, label: tr.contact.emailLabel, main: tr.contact.emailAddr, sub: tr.contact.emailDesc, href: `mailto:${tr.contact.emailAddr}` },
                { icon: <Phone className="w-5 h-5" />, label: tr.contact.phoneLabel, main: tr.contact.phoneNum, sub: lang === "en" ? "Call us directly" : "Телефонуйте нам", href: `tel:+380934307551` },
                { icon: <MapPin className="w-5 h-5" />, label: tr.contact.locLabel, main: tr.contact.locAddr, sub: lang === "en" ? "Our home city" : "Наше місто", href: undefined },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="group flex flex-col items-center text-center gap-3 p-6 border border-white/[0.06] hover:border-white/[0.14] transition-all duration-400 bg-white/[0.01] hover:bg-white/[0.03]">
                  <div className="p-3 border border-white/[0.07] group-hover:border-[#00FF88]/35 transition-colors duration-300" style={{ color: G }}>{item.icon}</div>
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25 mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
                        className="text-sm font-bold hover:text-[#00FF88] transition-colors duration-200 block">{item.main}</a>
                    ) : (
                      <span className="text-sm font-bold block">{item.main}</span>
                    )}
                    {item.sub && <p className="text-[10px] text-white/20 mt-1">{item.sub}</p>}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://t.me/bogdan_chekan" target="_blank" rel="noreferrer"
                className="group relative overflow-hidden inline-flex items-center gap-2.5 px-10 py-4 font-bold text-sm uppercase tracking-widest text-black" style={{ background: G }}>
                <span className="relative z-10 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {lang === "en" ? "Write on Telegram" : "Написати в Telegram"}
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <motion.div className="absolute inset-0 bg-white" initial={{ x: "-100%" }} whileHover={{ x: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} />
              </a>
              <a href={`mailto:${tr.contact.emailAddr}`}
                className="inline-flex items-center gap-2.5 px-10 py-4 font-bold text-sm uppercase tracking-widest border transition-all duration-300 hover:border-white/25 hover:text-white text-white/35"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <Mail className="w-4 h-4" />
                {lang === "en" ? "Send Email" : "Надіслати Email"}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/[0.05] bg-[#020202]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <BrandLine className="block text-sm md:text-base font-black uppercase tracking-tight leading-none text-white mb-4 whitespace-nowrap" />
            <p className="text-xs text-white/30 leading-relaxed">{tr.footer.tagline}</p>
            <p className="text-xs text-white/20 mt-1">{tr.footer.sub}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mb-4">{lang === "en" ? "Menu" : "Меню"}</p>
            <div className="flex flex-col gap-2.5">
              {(["cases", "about", "services", "team", "contact"] as const).map((k, i) => (
                <button key={k} onClick={() => scrollTo(k)} className="text-left text-xs font-semibold uppercase tracking-wider text-white/35 hover:text-white transition-colors">{tr.footer.menu[i]}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mb-4">{lang === "en" ? "Contacts" : "Контакти"}</p>
            <div className="space-y-2 text-xs text-white/35">
              <a href={`mailto:${tr.contact.emailAddr}`} className="block hover:text-[#00FF88] transition-colors">{tr.contact.emailAddr}</a>
              <a href="tel:+380934307551" className="block hover:text-[#00FF88] transition-colors">{tr.contact.phoneNum}</a>
              <div>{tr.contact.locAddr}</div>
            </div>
            <div className="flex items-center gap-2.5 mt-6">
              <a href="https://t.me/bogdan_chekan" target="_blank" rel="noreferrer" aria-label="Telegram"
                className="w-9 h-9 flex items-center justify-center border border-white/10 hover:border-[#00FF88]/50 hover:text-[#00FF88] hover:bg-[#00FF88]/5 text-white/40 transition-all">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href={`mailto:${tr.contact.emailAddr}`} aria-label="Email"
                className="w-9 h-9 flex items-center justify-center border border-white/10 hover:border-[#00FF88]/50 hover:text-[#00FF88] hover:bg-[#00FF88]/5 text-white/40 transition-all">
                <Mail className="w-4 h-4" />
              </a>
              <a href="tel:+380934307551" aria-label="Phone"
                className="w-9 h-9 flex items-center justify-center border border-white/10 hover:border-[#00FF88]/50 hover:text-[#00FF88] hover:bg-[#00FF88]/5 text-white/40 transition-all">
                <Phone className="w-4 h-4" />
              </a>
              <button onClick={toggleLang} aria-label="Switch language"
                className="ml-2 h-9 px-3 flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase border border-white/10 hover:border-[#00FF88]/50 text-white/40 hover:text-[#00FF88] transition-all">
                <Globe className="w-3 h-3" />{lang === "en" ? "UA" : "EN"}
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.05] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-white/20 font-mono">{tr.footer.copy}</p>
          <p className="text-[10px] text-white/15 font-mono uppercase tracking-widest">
            {lang === "en" ? "Crafted with " : "Зроблено з "}<span style={{ color: G }}>●</span>{lang === "en" ? " in Kyiv" : " у Києві"}
          </p>
        </div>
      </footer>

    </div>
  );
}
