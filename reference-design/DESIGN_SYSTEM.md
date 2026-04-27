# Rave'era Group — Design System

Полный гайд по дизайну сайта Rave'era Group. Используй этот документ для создания других сайтов/платформ/сервисов в едином стиле.

---

## 1. Философия дизайна

**Тёмная премиум-эстетика с неоновым акцентом.**

- **Фон**: чёрный (#000) и почти-чёрный (#020202, #030303) — глубина через слои.
- **Текст**: белый с уровнями прозрачности (opacity-based hierarchy).
- **Акцент**: один яркий неоново-зелёный цвет используется как сигнальный — для важных деталей, hover-состояний, разделителей, апострофа и амперсанда в логотипе.
- **Типографика**: гигантские заголовки в Inter Black + моно-шрифт JetBrains Mono для технических меток.
- **Отсутствие закруглений**: все углы прямые (`border-radius: 0`) — индустриальный, технологичный вид.
- **Функциональные анимации**: плавные fade-up на скролл, marquee, parallax — без излишеств.

---

## 2. Цветовая палитра

### Основные цвета

| Цвет | HEX | Применение |
|---|---|---|
| **Чёрный** | `#000000` | Главный фон, кнопки CTA текст |
| **Тёмно-чёрный 1** | `#020202` | Footer, секция Trusted By |
| **Тёмно-чёрный 2** | `#030303` | Секции About, Services (чтобы создать слои) |
| **Карточный фон** | `#040404` / `#080808` | Карточки команды, RavePass card |
| **Белый** | `#FFFFFF` | Основной текст |
| **Неон-зелёный** | `#00FF88` | **Акцентный цвет** (sign color) |

### Прозрачности белого (text hierarchy)

Используй прозрачности вместо grey-палитры — это даёт более органичную глубину на тёмном фоне.

| Класс Tailwind | Применение |
|---|---|
| `text-white` | Основные заголовки |
| `text-white/80` | Жирный подзаголовок |
| `text-white/65` | Цитаты |
| `text-white/55` | Описания кейсов |
| `text-white/45` | Параграфы About, hero subtitle |
| `text-white/35` | Текст в карточках |
| `text-white/30` | Подписи, метки |
| `text-white/25` | Декоративные подписи |
| `text-white/20` | Footer метки |
| `text-white/15` | Микро-текст, копирайт |

### Прозрачности зелёного (для тонких эффектов)

| Цвет | Применение |
|---|---|
| `#00FF88` (100%) | Логотип-акцент, кнопки CTA, активные состояния |
| `#00FF8890` | Свечение текста (textShadow) |
| `#00FF8850` / `#00FF8840` | Бордер активных карточек, glow |
| `#00FF8830` | Лёгкий бордер на hover |
| `#00FF8810` | Hover background tint |
| `#00FF8806` / `#00FF8805` | Едва заметный тинт badge-фона |

### Прозрачности границ

| Класс | Применение |
|---|---|
| `border-white/[0.05]` | Стандартная разделительная линия |
| `border-white/[0.06]` / `[0.07]` | Карточки |
| `border-white/[0.1]` / `[0.14]` | Hover состояние |
| `border-white/[0.18]` | Активный hover карточек команды |

---

## 3. Шрифты

### Inter (основной)

- **Источник**: Google Fonts
- **Веса**: 300, 400, 500, 600, 700, 800, **900 (Black — критически важен для заголовков!)**
- **Использование**: всё, кроме технических меток

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### JetBrains Mono (технический)

- **Источник**: Google Fonts
- **Веса**: 400, 600
- **Использование**: индексы секций (`01.`, `02.`), метки времени, копирайт, номера на карточках, статистика-подписи

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

### Типографическая шкала

| Элемент | Размер | Класс Tailwind | Вес |
|---|---|---|---|
| **H1 Hero** | clamp(3rem, 9.5vw, 10.5rem) | inline style | `font-black` (900) |
| **H2 Section** | text-4xl → text-6xl → lg:text-7xl | `text-4xl md:text-6xl lg:text-7xl` | `font-black` |
| **H3 Card title** | text-2xl → text-3xl | `text-2xl md:text-3xl` | `font-black` |
| **Body large** | text-base → text-lg | `text-base md:text-lg` | `font-light` |
| **Body** | text-sm | `text-sm` | normal |
| **Body small** | text-xs | `text-xs` | normal |
| **Метка моно** | 9-10px | `text-[10px] font-mono` | normal/bold |

### Tracking (межбуквенные интервалы)

- **Заголовки**: `tracking-tighter` или `tracking-tight` (плотно)
- **Моно-метки**: `tracking-[0.2em]` или `tracking-[0.22em]` (широко, uppercase)
- **Кнопки**: `tracking-widest` (uppercase)

### Leading (межстрочный интервал)

- **Гигантские заголовки**: `leading-[0.86]` или `leading-[0.88]` (плотный)
- **Параграфы**: `leading-relaxed` (1.625)

---

## 4. Layout-система

### Контейнер

```tsx
<div className="max-w-7xl 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12">
```

- `max-w-7xl` (80rem / 1280px) — основной контент
- `2xl:max-w-[1500px]` — расширение для больших мониторов
- Padding: `px-4 sm:px-6 md:px-10 lg:px-12` — растёт с шириной

### Вертикальные отступы секций

```tsx
<section className="py-24 md:py-36">
```

- 96px на мобильных, 144px на десктопе.
- Между секциями: тонкий `border-t border-white/[0.04]`.

### Брейкпоинты (Tailwind стандартные)

| Префикс | Min-width | Устройство |
|---|---|---|
| (default) | 0 | Маленький телефон |
| `sm:` | 640px | Большой телефон |
| `md:` | 768px | Планшет |
| `lg:` | 1024px | Маленький десктоп |
| `xl:` | 1280px | Десктоп |
| `2xl:` | 1536px | Большой десктоп / TV |

### Сетки (используемые)

- **Cases**: `grid-cols-1 lg:grid-cols-2 gap-10 items-center` (изображение/текст с чередованием)
- **Services**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **Team**: `grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8`
- **Contact cards**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- **Footer**: `grid-cols-1 md:grid-cols-3 gap-10`
- **Hero stats**: `grid-cols-3 gap-6 max-w-md`

### Углы (важно!)

**Все углы прямые** — `border-radius: 0`. Это центральная часть стиля.

```css
:root { --radius: 0px; }
```

---

## 5. Базовые компоненты

### Кнопка primary (CTA)

```tsx
<button className="group relative overflow-hidden px-8 py-4 font-bold text-sm uppercase tracking-widest text-black"
        style={{ background: "#00FF88" }}>
  <span className="relative z-10 flex items-center gap-2">
    Discuss your project <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
  </span>
  <motion.div className="absolute inset-0 bg-white"
              initial={{ x: "-100%" }} whileHover={{ x: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} />
</button>
```

### Кнопка secondary (текст с подчёркиванием)

```tsx
<button className="text-sm font-semibold uppercase tracking-widest text-white/30 hover:text-white transition-colors border-b border-white/10 hover:border-white pb-0.5">
  View Cases
</button>
```

### Кнопка outline (зелёный border)

```tsx
<button className="text-[11px] font-bold tracking-[0.14em] uppercase px-4 py-2 border transition-all hover:bg-[#00FF88] hover:text-black"
        style={{ borderColor: "#00FF88", color: "#00FF88" }}>
  Contact
</button>
```

### Badge (метка с пульсирующим индикатором)

```tsx
<span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] border px-4 py-2"
      style={{ borderColor: "#00FF8840", color: "#00FF88", background: "#00FF8808" }}>
  <motion.span animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 2, repeat: Infinity }}
               className="w-1.5 h-1.5 rounded-full" style={{ background: "#00FF88" }} />
  Badge text
</span>
```

### Section Label (индекс + линия + подпись)

```tsx
<div className="flex items-center gap-3 mb-5">
  <span className="text-[10px] font-mono text-white/20 tracking-widest">01.</span>
  <span className="w-5 h-px bg-white/10" />
  <span className="text-[10px] font-mono uppercase tracking-[0.22em]"
        style={{ color: "#00FF88" }}>Featured Cases</span>
</div>
```

### Карточка с hover-эффектом (Service card)

```tsx
<div className="group relative border border-white/[0.05] p-6
                hover:border-[#00FF88]/30 transition-all duration-400
                overflow-hidden cursor-default bg-black/20 hover:bg-[#00FF88]/[0.02]">
  {/* Радиальный glow при hover */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
       style={{ background: "radial-gradient(circle at 30% 0%, #00FF8810, transparent 60%)" }} />
  {/* Анимированная зелёная линия сверху */}
  <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full transition-all duration-700"
       style={{ background: "#00FF88" }} />
  {/* Контент */}
</div>
```

### Картинка с grayscale → color на hover

```tsx
<img src="..." className="w-full h-full object-cover transition-all duration-700
                          grayscale group-hover:grayscale-0
                          opacity-70 group-hover:opacity-100
                          group-hover:scale-105" />
```

---

## 6. Анимации (Framer Motion)

### Базовые варианты

```tsx
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
};
```

### Стандартный easing

`[0.16, 1, 0.3, 1]` — мягкий, профессиональный (custom ease-out).

### Применение к секции

```tsx
<motion.div initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-60px" }} variants={stagger}>
  <motion.h2 variants={fadeUp}>...</motion.h2>
  <motion.p variants={fadeIn}>...</motion.p>
</motion.div>
```

### Marquee (бесконечная прокрутка)

```tsx
<motion.div animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="flex shrink-0 gap-12">
  {[...items, ...items].map(...)}
</motion.div>
```

### Parallax на скролле

```tsx
const { scrollY } = useScroll();
const heroY = useTransform(scrollY, [0, 600], [0, -90]);
const heroOp = useTransform(scrollY, [0, 500], [1, 0]);

<motion.div style={{ y: heroY, opacity: heroOp }}>...</motion.div>
```

### Прогресс-бар скролла

```tsx
const { scrollYProgress } = useScroll();
<motion.div className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
            style={{ scaleX: scrollYProgress, background: "#00FF88" }} />
```

---

## 7. Декоративные элементы

### Сетка-фон (subtle grid)

```tsx
<div className="absolute inset-0 pointer-events-none"
     style={{
       backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
       backgroundSize: "80px 80px"
     }} />
```

### Зелёная сетка (для акцентных карточек)

```tsx
<div className="absolute inset-0 opacity-25" style={{
  backgroundImage: `linear-gradient(#00FF8818 1px, transparent 1px),
                    linear-gradient(90deg, #00FF8818 1px, transparent 1px)`,
  backgroundSize: "32px 32px"
}} />
```

### Радиальное свечение (glow blob)

```tsx
<motion.div animate={{ scale: [1, 1.14, 1], opacity: [0.09, 0.14, 0.09] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] right-[-5%] w-[60vw] h-[60vw] rounded-full blur-[140px]"
            style={{ background: "#00FF88" }} />
```

### Угловые скобки (corner brackets)

```tsx
{[
  "top-3 left-3 border-l-2 border-t-2",
  "top-3 right-3 border-r-2 border-t-2",
  "bottom-3 left-3 border-l-2 border-b-2",
  "bottom-3 right-3 border-r-2 border-b-2",
].map((p, i) => <span key={i} className={`absolute w-5 h-5 ${p}`} style={{ borderColor: "#00FF88" }} />)}
```

### Свечение текста (text-shadow)

```tsx
style={{ color: "#00FF88", textShadow: "0 0 100px #00FF8845" }}
```

### Drop-shadow для иконок

```tsx
style={{ color: "#00FF88", filter: "drop-shadow(0 0 24px #00FF88)" }}
```

---

## 8. Брендовый компонент BrandLine

**Это сердце логотипа** — переиспользуй везде, где нужно показать название.

```tsx
const G = "#00FF88";

function BrandLine({ compact = false }) {
  if (compact) {
    return <span>Rave<span style={{ color: G }}>'</span>era Group</span>;
  }
  return (
    <span>
      Rave<span style={{ color: G }}>'</span>era Group{" "}
      <span style={{ color: G }}>·</span> Concerts{" "}
      <span style={{ color: G }}>&amp;</span> Marketing Agency
    </span>
  );
}
```

**Принцип**: апостроф `'`, разделитель `·` и амперсанд `&` — всегда зелёные. Это микро-сигнатура бренда.

---

## 9. Технологический стек

```json
{
  "framework": "Vite + React 18 + TypeScript",
  "styling": "Tailwind CSS v4",
  "animations": "framer-motion",
  "icons": "lucide-react",
  "fonts": "Inter (300-900) + JetBrains Mono (400, 600)"
}
```

### Установка для нового проекта

```bash
npm install react react-dom framer-motion lucide-react
npm install -D vite @vitejs/plugin-react typescript tailwindcss @tailwindcss/vite
```

---

## 10. Глобальный CSS (index.css)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
@import "tailwindcss";

:root {
  --background: 0 0% 0%;
  --foreground: 0 0% 96%;
  --primary: 151 100% 50%;          /* #00FF88 */
  --primary-foreground: 0 0% 0%;
  --radius: 0px;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  background: #000;
}

body {
  background: #000;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  overflow-x: hidden;
}

section[id] { scroll-margin-top: 80px; }

::selection { background: #00FF88; color: #000; }

/* Тонкий зелёный скроллбар */
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: #050505; }
::-webkit-scrollbar-thumb { background: #00FF8855; }
::-webkit-scrollbar-thumb:hover { background: #00FF88; }
```

---

## 11. Чек-лист для нового сайта в этом стиле

- [ ] Чёрный фон `#000`, прозрачный белый текст с уровнями (35/45/55/65)
- [ ] Зелёный акцент `#00FF88` — экономно, только на важном
- [ ] Inter Black (900) для огромных заголовков
- [ ] JetBrains Mono для технических меток (10px, uppercase, tracking-widest)
- [ ] Все углы прямые (`rounded-none`)
- [ ] Section label "01. — SECTION NAME" с зелёной подписью в начале каждой секции
- [ ] Index numbers `01/06`, `02/06` для коллекций
- [ ] Кнопка CTA: solid зелёная с чёрным текстом + `ArrowRight` иконка с translate-x на hover
- [ ] Изображения: grayscale по умолчанию, color на hover, opacity 70 → 100
- [ ] Marquee для логотипов партнёров (linear, 50s)
- [ ] Радиальные blur-blobs на фоне (зелёные, низкая прозрачность)
- [ ] Subtle grid pattern (80x80px, opacity 0.018)
- [ ] Прогресс-бар скролла сверху страницы
- [ ] Анимация fadeUp с easing `[0.16, 1, 0.3, 1]`
- [ ] Респонсив: `px-4 sm:px-6 md:px-10 lg:px-12`, `py-24 md:py-36`
- [ ] Тонкие зелёные скроллбары (3px)
- [ ] BrandLine: акцент на `'`, `·`, `&` — всегда зелёные

---

## 12. Иконки (lucide-react)

Используемые в проекте:

```tsx
import {
  ArrowRight, ArrowUpRight, ChevronDown,
  Mail, Phone, MessageCircle, MapPin,
  Globe, Menu, X, Ticket,
  Calendar, Music, Users, Lightbulb,
  Megaphone, Camera, Sparkles, Briefcase,
  Building2, Mic, Award, Gamepad2
} from "lucide-react";
```

Размеры: `w-3 h-3` (12px), `w-4 h-4` (16px), `w-5 h-5` (20px), `w-12 h-12` (48px) для крупных декоративных.

---

## 13. Файлы проекта-эталона

Все исходники находятся в:
- **Главный компонент**: `artifacts/raveera-website/src/App.tsx`
- **Глобальные стили**: `artifacts/raveera-website/src/index.css`
- **HTML + meta + шрифты**: `artifacts/raveera-website/index.html`
- **Изображения**: `artifacts/raveera-website/public/images/`
- **Зависимости**: `artifacts/raveera-website/package.json`

Скопируй любой компонент из `App.tsx` как референс — структура самодостаточна.
