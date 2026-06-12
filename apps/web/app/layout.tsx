import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DebugProvider } from "@/components/debug/DebugContext";
import NavLinks from "@/components/NavLinks";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Finance App",
  description: "A simple finance management app built with Next.js, Prisma, and MariaDB.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={cn("font-sans", inter.variable, jetbrains.variable)}>
      <body>
        <DebugProvider>
          {session && (
            <header className="sticky top-0 z-40 border-b border-border bg-card">
              <div className="flex items-center h-10 px-4">
                <NavLinks />
                <div className="ml-auto">
                  <SignOutButton />
                </div>
              </div>
            </header>
          )}
          <main className="p-4">{children}</main>
        </DebugProvider>
      </body>
    </html>
  );
}
