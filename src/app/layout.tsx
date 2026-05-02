import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://google-indexer-one.vercel.app'),
  title: {
    default: "IndexForge — Bulk URL Indexing Platform",
    template: "%s | IndexForge",
  },
  description:
    "Submit and track thousands of backlink URLs for Google indexing via automated sitemap generation and Search Console integration.",
  keywords: ["SEO", "indexing", "backlinks", "sitemap", "Google Search Console"],
  openGraph: {
    title: "IndexForge — Bulk URL Indexing Platform",
    description: "Submit and track thousands of backlink URLs for Google indexing.",
    url: 'https://google-indexer-one.vercel.app',
    siteName: 'IndexForge',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "IndexForge — Bulk URL Indexing Platform",
    description: "Automate your Google Indexing workflow easily.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
