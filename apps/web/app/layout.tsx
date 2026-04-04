import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import Link from "next/link";
import { Geist } from "next/font/google";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Home,
  Landmark,
  Repeat,
} from "lucide-react";
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
  { href: "/", label: "Home", icon: Home },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/todos", label: "Todos", icon: CheckSquare },
  { href: "/recurrent", label: "Recurrent", icon: Repeat },
  { href: "/months/current", label: "Current Month", icon: CalendarDays },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
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
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <NavigationMenuItem key={href}>
                    <NavigationMenuLink asChild className="flex-row! items-center! gap-1.5">
                      <Link href={href} className="inline-flex items-center gap-1.5">
                        <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-[5px] bg-muted/55 ring-1 ring-border/60">
                          <Icon className="h-3.5 w-3.5 text-foreground/70" aria-hidden="true" />
                        </span>
                        <span>{label}</span>
                      </Link>
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
