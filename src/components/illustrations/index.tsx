/**
 * Ilustraciones vectoriales originales del proyecto "Un Encuentro con Jesús".
 * Estilo minimalista, formas suaves y luz cálida. Todas son decorativas (aria-hidden)
 * salvo que se pase `title`.
 */
import type { SVGProps } from "react";
import type { IllustrationKey } from "@/types";

type Props = SVGProps<SVGSVGElement> & { title?: string };

function a11y(title?: string) {
  return title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const, focusable: false as const };
}

/** Rayos de luz suaves para fondos. */
export function LightRays({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 400 400" {...a11y(title)} {...props}>
      <defs>
        <radialGradient id="lr-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF8E6" stopOpacity="1" />
          <stop offset="45%" stopColor="#F3E6C4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F3E6C4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity="0.55" stroke="#D8B56A" strokeWidth="1.2" strokeLinecap="round">
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * Math.PI * 2) / 24;
          const r1 = 70;
          const r2 = i % 2 === 0 ? 195 : 160;
          return (
            <line
              key={i}
              x1={200 + Math.cos(a) * r1}
              y1={200 + Math.sin(a) * r1}
              x2={200 + Math.cos(a) * r2}
              y2={200 + Math.sin(a) * r2}
              strokeOpacity={i % 2 === 0 ? 0.6 : 0.3}
            />
          );
        })}
      </g>
      <circle cx="200" cy="200" r="150" fill="url(#lr-core)" />
    </svg>
  );
}

/** Jesús con los brazos abiertos: silueta estilizada, sin rasgos faciales, con halo de luz. */
export function JesusOpenArms({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 320 360" {...a11y(title)} {...props}>
      <defs>
        <radialGradient id="jo-halo" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFF6DD" />
          <stop offset="55%" stopColor="#F3E6C4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F3E6C4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="jo-robe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E9F2FC" />
        </linearGradient>
        <linearGradient id="jo-sash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D8B56A" />
          <stop offset="100%" stopColor="#C49A48" />
        </linearGradient>
        <linearGradient id="jo-mantle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A6690" />
          <stop offset="100%" stopColor="#25476A" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="130" rx="150" ry="140" fill="url(#jo-halo)" />
      <g stroke="#D8B56A" strokeOpacity="0.45" strokeWidth="1.3" strokeLinecap="round">
        {Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI + (i * Math.PI) / 12;
          return (
            <line key={i} x1={160 + Math.cos(a) * 52} y1={70 + Math.sin(a) * 52} x2={160 + Math.cos(a) * 92} y2={70 + Math.sin(a) * 92} />
          );
        })}
      </g>
      {/* halo */}
      <circle cx="160" cy="70" r="40" fill="none" stroke="#D8B56A" strokeWidth="2.5" strokeOpacity="0.85" />
      {/* cabeza y cabello */}
      <path d="M160 40c-17 0-28 13-28 30 0 13 6 22 14 27l-2 10h32l-2-10c8-5 14-14 14-27 0-17-11-30-28-30z" fill="#7A5A3A" />
      <ellipse cx="160" cy="70" rx="17" ry="21" fill="#E9C9A6" />
      <path d="M143 62c3-12 11-17 17-17s14 5 17 17c-5-6-11-8-17-8s-12 2-17 8z" fill="#6B4E32" />
      <path d="M146 80c2 12 8 19 14 19s12-7 14-19c-3 6-8 9-14 9s-11-3-14-9z" fill="#6B4E32" opacity="0.9" />
      {/* túnica */}
      <path
        d="M128 112c10-8 22-11 32-11s22 3 32 11l10 70 12 150c-18 10-36 14-54 14s-36-4-54-14l12-150z"
        fill="url(#jo-robe)"
        stroke="#C9D9EA"
        strokeWidth="1.2"
      />
      {/* manto */}
      <path d="M190 108c14 8 20 30 18 64l8 154c-12 8-22 11-30 12l-10-170c-2-30 2-50 14-60z" fill="url(#jo-mantle)" opacity="0.92" />
      {/* cinto */}
      <path d="M140 188c13 4 27 4 40 0l1 9c-14 4-28 4-42 0z" fill="url(#jo-sash)" />
      {/* brazos abiertos */}
      <path d="M130 116c-26 10-52 30-78 58l-12 4c-4 1-6 6-2 8 6 3 14 0 20-4 26-22 50-36 76-44z" fill="url(#jo-robe)" stroke="#C9D9EA" strokeWidth="1.2" />
      <path d="M190 116c26 10 52 30 78 58l12 4c4 1 6 6 2 8-6 3-14 0-20-4-26-22-50-36-76-44z" fill="url(#jo-robe)" stroke="#C9D9EA" strokeWidth="1.2" />
      <ellipse cx="44" cy="183" rx="9" ry="6" fill="#E9C9A6" transform="rotate(-25 44 183)" />
      <ellipse cx="276" cy="183" rx="9" ry="6" fill="#E9C9A6" transform="rotate(25 276 183)" />
      {/* pliegues */}
      <g stroke="#C9D9EA" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M150 210c-2 40-4 80-8 118" />
        <path d="M165 210c1 40 2 80 4 120" />
      </g>
    </svg>
  );
}

/** Paloma blanca en vuelo, símbolo del Espíritu Santo. */
export function Dove({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 200 160" {...a11y(title)} {...props}>
      <defs>
        <linearGradient id="dv-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DCEEFF" />
        </linearGradient>
      </defs>
      <path d="M96 84C76 52 50 30 14 22c18 18 26 38 30 56 12 6 30 8 52 6z" fill="url(#dv-wing)" stroke="#9DB7D1" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M100 86c6-30 22-54 52-70-6 22-6 42-2 58-14 10-30 14-50 12z" fill="url(#dv-wing)" stroke="#9DB7D1" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M40 96c22-10 52-14 82-10 14 2 26-2 36-10 8-6 18-4 22 2-6 0-10 2-14 6 0 18-16 34-42 38-12 2-22 8-30 18-2-10 2-18 8-24-26 4-48-2-62-20z"
        fill="#FFFFFF"
        stroke="#9DB7D1"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="166" cy="88" r="2.4" fill="#25476A" />
      <path d="M180 86l10 3-10 3z" fill="#D8B56A" />
      <g stroke="#B7CBE0" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <path d="M30 34c14 6 26 18 34 34" />
        <path d="M140 30c-10 10-16 24-18 38" />
      </g>
      {/* rama de olivo en el pico */}
      <path d="M188 92c6 6 8 12 6 18" stroke="#5E8F72" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="196" cy="100" rx="4" ry="2" fill="#7DAE92" transform="rotate(50 196 100)" />
      <ellipse cx="192" cy="108" rx="4" ry="2" fill="#7DAE92" transform="rotate(-30 192 108)" />
    </svg>
  );
}

/** Biblia abierta con luz que emana de sus páginas. */
export function OpenBible({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 240 170" {...a11y(title)} {...props}>
      <defs>
        <radialGradient id="ob-light" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#FFF4D6" />
          <stop offset="100%" stopColor="#FFF4D6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="70" rx="110" ry="70" fill="url(#ob-light)" />
      <g stroke="#D8B56A" strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round">
        <line x1="120" y1="78" x2="120" y2="14" />
        <line x1="120" y1="78" x2="86" y2="22" />
        <line x1="120" y1="78" x2="154" y2="22" />
        <line x1="120" y1="78" x2="58" y2="40" />
        <line x1="120" y1="78" x2="182" y2="40" />
      </g>
      <path d="M20 96c34-10 66-8 100 8v56c-34-14-66-16-100-6z" fill="#25476A" />
      <path d="M220 96c-34-10-66-8-100 8v56c34-14 66-16 100-6z" fill="#1A3450" />
      <path d="M28 90c32-10 62-8 92 8v52c-30-14-60-16-92-6z" fill="#FFFDF7" stroke="#E6DCC4" />
      <path d="M212 90c-32-10-62-8-92 8v52c30-14 60-16 92-6z" fill="#FFFDF7" stroke="#E6DCC4" />
      <g stroke="#CDBF9F" strokeWidth="1.3" strokeLinecap="round">
        <path d="M42 104c22-5 42-4 64 4" />
        <path d="M42 114c22-5 42-4 64 4" />
        <path d="M42 124c22-5 42-4 64 4" />
        <path d="M134 108c22-8 42-9 64-4" />
        <path d="M134 118c22-8 42-9 64-4" />
        <path d="M134 128c22-8 42-9 64-4" />
      </g>
      <path d="M118 98v58" stroke="#D8B56A" strokeWidth="2" />
      <path d="M150 92v30l5-5 5 5V90" fill="#B5435A" opacity="0.85" />
    </svg>
  );
}

/** Cruz sencilla con resplandor. */
export function CrossGlow({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 160 200" {...a11y(title)} {...props}>
      <defs>
        <radialGradient id="cg-glow" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FFF4D6" />
          <stop offset="100%" stopColor="#FFF4D6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cg-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E7C987" />
          <stop offset="100%" stopColor="#C49A48" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="76" r="78" fill="url(#cg-glow)" />
      <rect x="70" y="18" width="20" height="164" rx="4" fill="url(#cg-wood)" />
      <rect x="32" y="58" width="96" height="18" rx="4" fill="url(#cg-wood)" />
      <path d="M40 186c20-8 60-8 80 0" stroke="#7DAE92" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Corazón con una pequeña cruz, el amor de Dios. */
export function HeartLove({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 160 150" {...a11y(title)} {...props}>
      <defs>
        <linearGradient id="hl-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F9E3E3" />
          <stop offset="100%" stopColor="#EDB9BF" />
        </linearGradient>
      </defs>
      <path
        d="M80 138C30 104 8 78 8 50 8 28 25 12 46 12c14 0 26 8 34 20 8-12 20-20 34-20 21 0 38 16 38 38 0 28-22 54-72 88z"
        fill="url(#hl-fill)"
        stroke="#D99AA3"
        strokeWidth="2"
      />
      <rect x="75" y="44" width="10" height="50" rx="2" fill="#FFFFFF" opacity="0.95" />
      <rect x="62" y="58" width="36" height="9" rx="2" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}

/** Manos en oración. */
export function PrayingHands({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 160 180" {...a11y(title)} {...props}>
      <defs>
        <radialGradient id="ph-glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFF4D6" />
          <stop offset="100%" stopColor="#FFF4D6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="60" r="70" fill="url(#ph-glow)" />
      <path d="M80 20c-6 4-10 14-12 28l-6 40-18 24c-6 8-4 18 4 22l32 18z" fill="#F1D3B6" stroke="#C99E7C" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M80 20c6 4 10 14 12 28l6 40 18 24c6 8 4 18-4 22l-32 18z" fill="#E9C4A2" stroke="#C99E7C" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M80 22v128" stroke="#C99E7C" strokeWidth="1.4" />
      <path d="M44 142l-8 26h88l-8-26" fill="#DCEEFF" stroke="#9DB7D1" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** Rama de olivo. */
export function OliveBranch({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 200 80" {...a11y(title)} {...props}>
      <path d="M8 60C60 40 120 34 192 20" stroke="#5E8F72" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {[
        [40, 50, -30],
        [58, 56, 30],
        [80, 40, -25],
        [98, 47, 28],
        [120, 32, -22],
        [138, 38, 26],
        [160, 25, -20],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="12" ry="4.5" fill={i % 2 ? "#7DAE92" : "#9CC4AC"} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <circle cx="110" cy="52" r="4" fill="#4A6B56" />
      <circle cx="150" cy="42" r="3.5" fill="#4A6B56" />
    </svg>
  );
}

/** Camino de esperanza hacia la luz. */
export function HopePath({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 240 160" {...a11y(title)} {...props}>
      <defs>
        <linearGradient id="hp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF4D6" />
          <stop offset="100%" stopColor="#DCEEFF" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" rx="20" fill="url(#hp-sky)" />
      <circle cx="120" cy="58" r="22" fill="#FFF8E6" stroke="#D8B56A" strokeOpacity="0.6" />
      <path d="M0 110c40-14 80-18 120-14s80 2 120-10v74H0z" fill="#B9D7C4" />
      <path d="M0 126c50-10 100-10 150-4 30 4 60 2 90-6v44H0z" fill="#7DAE92" />
      <path d="M112 96c-4 20-20 40-52 64h60c4-24 4-44 0-64z" fill="#F7EEDB" />
      <path d="M150 92l-6 8m-10-10l-4 9" stroke="#25476A" strokeOpacity="0.25" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Semilla que brota en un pequeño árbol. */
export function Seedling({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 160 160" {...a11y(title)} {...props}>
      <ellipse cx="80" cy="140" rx="56" ry="10" fill="#E2F0E7" />
      <path d="M80 138V78" stroke="#4A6B56" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 96C56 96 40 80 36 56c24 0 40 14 44 40z" fill="#9CC4AC" />
      <path d="M80 84c4-28 22-46 50-48-2 30-20 46-50 48z" fill="#7DAE92" />
      <path d="M80 96C64 86 54 72 50 58M80 84c12-14 26-26 42-38" stroke="#4A6B56" strokeWidth="1.4" fill="none" strokeOpacity="0.6" />
      <circle cx="120" cy="30" r="10" fill="#F3E6C4" />
    </svg>
  );
}

/** Logo: cruz dentro de un corazón con destello. */
export function Logo({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 64 64" {...a11y(title)} {...props}>
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2F5A84" />
          <stop offset="100%" stopColor="#1A3450" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lg-bg)" />
      <path
        d="M32 52C17 42 10 34 10 25c0-7 5.5-12 12-12 4.4 0 8 2.4 10 6 2-3.6 5.6-6 10-6 6.5 0 12 5 12 12 0 9-7 17-22 27z"
        fill="none"
        stroke="#D8B56A"
        strokeWidth="2.6"
      />
      <rect x="30" y="20" width="4" height="22" rx="1" fill="#FAFAF7" />
      <rect x="24.5" y="25.5" width="15" height="4" rx="1" fill="#FAFAF7" />
    </svg>
  );
}

const map: Record<IllustrationKey, (p: Props) => React.JSX.Element> = {
  jesus: JesusOpenArms,
  dove: Dove,
  bible: OpenBible,
  cross: CrossGlow,
  heart: HeartLove,
  hands: PrayingHands,
  olive: OliveBranch,
  path: HopePath,
  seed: Seedling,
  light: LightRays,
};

export function Illustration({ name, ...props }: Props & { name: IllustrationKey }) {
  const C = map[name] ?? LightRays;
  return <C {...props} />;
}
