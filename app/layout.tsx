import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ClientShell from "../components/chrome/ClientShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "XORR — Autonomous Trading Agent",
  description: "Self-custodial algorithmic trading system for BNB Chain Smart Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-xr-bg overflow-hidden">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
