import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import Link from "next/link";
import { Geist } from "next/font/google";
import { DebugProvider } from "@/components/debug/DebugContext";
import DebugIndicator from "@/components/debug/DebugIndicator";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Finance App",
  description: "A simple finance management app built with Next.js, Prisma, and MariaDB.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/accounts", label: "Accounts" },
  { href: "/todos", label: "Todos" },
  { href: "/recurrent", label: "Recurrent" },
  { href: "/months/current", label: "Current Month" },
  { href: "/metrics", label: "Metrics" },
];

const devLinks = [
  { href: "/admin", label: "Admin" },
  { href: "/playground", label: "Playground" },
  { href: "/months", label: "Months" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <DebugProvider>
          <header className="border-b">
            <NavigationMenu viewport={false} className="px-4 py-2">
              <NavigationMenuList>
                {navLinks.map(({ href, label }) => (
                  <NavigationMenuItem key={href}>
                    <NavigationMenuLink asChild>
                      <Link href={href}>{label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}

                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    Dev
                    <DebugIndicator />
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="flex flex-col p-1 w-36">
                    {devLinks.map(({ href, label }) => (
                      <NavigationMenuLink key={href} asChild>
                        <Link href={href}>{label}</Link>
                      </NavigationMenuLink>
                    ))}
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </header>

          <main className="p-4">{children}</main>
        </DebugProvider>
      </body>
    </html>
  );
}
