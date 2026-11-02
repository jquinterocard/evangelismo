import type { Metadata, Viewport } from "next";
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
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ToastProvider>
          <Header />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <Footer />
        </ToastProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
