import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
import { JsonLd } from "@/components/JsonLd/JsonLd";
import { ReferralModalWrapper } from "@/components/ReferralModal";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://basylab.com.br";
const SITE_NAME = "Basylab";
const SITE_DESCRIPTION =
  "Desenvolvimento de software sob medida: sistemas web, aplicativos mobile e automações. Código limpo, prazos respeitados e qualidade técnica garantida. Transformamos sua ideia em software que funciona.";
const SITE_KEYWORDS = [
  "desenvolvimento de software",
  "software sob medida",
  "desenvolvimento web",
  "criação de aplicativos",
  "app mobile",
  "desenvolvimento de sistemas",
  "automação de processos",
  "integrações de sistemas",
  "API",
  "software house",
  "empresa de tecnologia",
  "desenvolvimento personalizado",
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "programação",
  "Basylab",
  "startup de tecnologia",
  "consultoria em TI",
  "Brasil",
];

export const metadata: Metadata = {
  // Metadados básicos
  title: {
    default: "Basylab | Desenvolvimento de Software Sob Medida",
    template: "%s | Basylab",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Basylab", url: SITE_URL }],
  creator: "Basylab",
  publisher: "Basylab",
  category: "Technology",

  // Metabase URL
  metadataBase: new URL(SITE_URL),

  // Canonical e alternates
  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": "/",
    },
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph (Facebook, LinkedIn, WhatsApp)
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Basylab | Desenvolvimento de Software Sob Medida",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Basylab - Desenvolvimento de Software Sob Medida",
        type: "image/png",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Basylab | Desenvolvimento de Software Sob Medida",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@basylab",
    site: "@basylab",
  },

  // Icons
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    other: [{ rel: "mask-icon", url: "/favicon.svg", color: "#e7343a" }],
  },

  // Manifest PWA
  manifest: "/manifest.json",

  // Verificação de propriedade (adicione seus IDs quando disponíveis)
  verification: {
    google: "seu-google-site-verification",
    // yandex: "seu-yandex-verification",
    // bing: "seu-bing-verification",
  },

  // App links
  appLinks: {
    web: {
      url: SITE_URL,
      should_fallback: true,
    },
  },

  // Outros metadados
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Referrer
  referrer: "origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030303" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Preconnect para otimização de performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <JsonLd />
        <Header />
        {children}
        <Footer />
        <ReferralModalWrapper />
      </body>
    </html>
  );
}
