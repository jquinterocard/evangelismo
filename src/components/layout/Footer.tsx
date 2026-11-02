import Link from "next/link";
import { Dove } from "@/components/illustrations";
import { appConfig } from "@/lib/config";
import { navItems } from "./nav";

export function Footer() {
  return (
    <footer className="mt-16 bg-navy-ink text-sky">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Dove className="h-12 w-auto" />
            <p className="font-serif text-xl font-semibold text-white">{appConfig.name}</p>
          </div>
          <p className="max-w-md text-sky/90">«{appConfig.tagline}».</p>
          <p className="max-w-md font-serif text-lg text-gold-soft italic">
            Que la paz de Cristo llene tu corazón hoy y siempre.
          </p>
        </div>
        <nav aria-label="Pie de página">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.95rem]">
            {navItems.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-sky/90 underline-offset-4 hover:text-white hover:underline">
                  {i.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacidad/" className="text-sky/90 underline-offset-4 hover:text-white hover:underline">
                Privacidad
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs leading-relaxed text-sky/75">{appConfig.bible.copyright}</p>
      </div>
    </footer>
  );
}
