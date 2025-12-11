import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatAgent } from "@/components/ChatAgent";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "next-themes";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Retrofish Digital - Meta Ads Dashboard",
    template: "%s | Retrofish Digital"
  },
  description: "Dashboard profesional de análisis Meta Ads para Retrofish Digital con métricas de ROAS, CTR, CPA y recomendaciones IA",
  keywords: ["Meta Ads", "Facebook Ads", "Dashboard", "Analytics", "ROAS", "CPA", "CTR", "Marketing Digital", "Retrofish"],
  authors: [{ name: "Retrofish Digital" }],
  creator: "Retrofish Digital",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Retrofish Digital - Meta Ads Dashboard",
    description: "Panel de análisis avanzado para Meta Ads con insights accionables y recomendaciones de IA",
    type: "website",
    locale: "es_ES",
    siteName: "Retrofish Digital",
  },
  twitter: {
    card: "summary_large_image",
    title: "Retrofish Digital - Meta Ads Dashboard",
    description: "Panel de análisis avanzado para Meta Ads con insights accionables y recomendaciones de IA",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Fuentes para el Editor de Imágenes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          @import url('https://fonts.cdnfonts.com/css/impact');
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <ChatAgent />
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
