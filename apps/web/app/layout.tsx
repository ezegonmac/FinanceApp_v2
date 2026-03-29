import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from "react";
import Link from "next/link";
import { DebugProvider } from "@/components/debug/DebugContext";
import DebugIndicator from "@/components/debug/DebugIndicator";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Finance App",
  description: "A simple finance management app built with Next.js, Prisma, and MariaDB.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif" }}>
        <DebugProvider>
          <header style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
            <nav>
              <Link href="/">Home</Link> |{" "}
              <Link href="/accounts">Accounts</Link> |{" "}
              <Link href="/months">Months</Link> |{" "}
              <Link href="/months/current">Current Month</Link> |{" "}
              <Link href="/recurrent">Recurrent</Link> |{" "}
              <Link href="/metrics">Metrics</Link> |{" "}
              <Link href="/admin">Admin</Link>
              <DebugIndicator />
            </nav>
          </header>
          <main style={{ padding: "1rem" }}>{children}</main>
        </DebugProvider>
      </body>
    </html>
  );
}
