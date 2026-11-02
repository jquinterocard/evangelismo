import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource/lora/latin-500.css";
import "@fontsource/lora/latin-600.css";
import "@fontsource/lora/latin-500-italic.css";
import "@fontsource/nunito-sans/latin-400.css";
import "@fontsource/nunito-sans/latin-600.css";
import "@fontsource/nunito-sans/latin-700.css";
import "@fontsource/nunito-sans/latin-800.css";
import "./globals.css";
import { appConfig, withBasePath } from "@/lib/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { contentSecurityPolicy } from "@/lib/csp";
import { themePreloadScript } from "@/lib/theme-script";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileMenuPanel, MobileMenuProvider } from "@/components/layout/MobileMenu";
import { WhatsAppFab } from "@/components/WhatsAppFab";

export const metadata: Metadata = {
  metadataBase: appConfig.siteUrl ? new URL(`${appConfig.siteUrl}/`) : undefined,
  title: {
    default: `${appConfig.name} — ${appConfig.heroSubtitle}`,
    template: `%s · ${appConfig.name}`,
  },
  description: appConfig.description,
  applicationName: appConfig.name,
  icons: {
    icon: [
      { url: withBasePath("/icons/icon.svg"), type: "image/svg+xml" },
      { url: withBasePath("/favicon.png"), sizes: "48x48", type: "image/png" },
      { url: withBasePath("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: withBasePath("/icons/apple-touch-icon.png"), sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: appConfig.shortName, statusBarStyle: "default" },
  openGraph: {
    title: appConfig.name,
    description: appConfig.description,
    type: "website",
    locale: "es_LA",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: appConfig.colors.deepBlue,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "production" && <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy()} />}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="flex min-h-full flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] xl:pb-0">
        <ToastProvider>
          <MobileMenuProvider>
            <Header />
            <main id="contenido" className="flex-1">
              {children}
            </main>
            <Footer />
            <WhatsAppFab />
            <MobileMenuPanel />
            <BottomNav />
          </MobileMenuProvider>
        </ToastProvider>
        <ServiceWorkerRegister />
        {/* Aplica el modo noche/claro antes de pintar, para evitar destellos. */}
        <Script id="theme-preload" strategy="beforeInteractive">
          {themePreloadScript}
        </Script>
        {/* Evita mostrar la portada un instante a quien llega desde un QR (antes de hidratar). */}
        <Script id="qr-preload" strategy="beforeInteractive">
          {`try{if(/[?&]qr=/.test(location.search))document.documentElement.classList.add("from-qr")}catch(e){}`}
        </Script>
      </body>
    </html>
  );
}
