'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Home,
  Landmark,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import TodoNavBadge from "@/components/todos/TodoNavBadge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import DebugIndicator from "@/components/debug/DebugIndicator";

const navLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/",               label: "Home",          icon: Home         },
  { href: "/accounts",       label: "Accounts",      icon: Landmark     },
  { href: "/todos",          label: "Todos",         icon: CheckSquare  },
  { href: "/recurrent",      label: "Recurrent",     icon: Repeat       },
  { href: "/months/current", label: "Current Month", icon: CalendarDays },
  { href: "/metrics",        label: "Metrics",       icon: BarChart3    },
];

const devLinks = [
  { href: "/admin",      label: "Admin"      },
  { href: "/playground", label: "Playground" },
  { href: "/months",     label: "Months"     },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center">
      {/* Main links */}
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group inline-flex items-center gap-2 h-12 px-3 text-sm font-medium whitespace-nowrap transition-colors relative",
              isActive
                ? "text-foreground shadow-[inset_0_-2px_0_0_var(--primary)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
            {href === "/todos" ? <TodoNavBadge /> : null}
          </Link>
        );
      })}

      {/* Dev dropdown — inline, same height as nav links */}
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                "h-12 px-3 text-sm font-medium whitespace-nowrap rounded-none",
                "text-muted-foreground transition-colors",
                // Force-clear all background states from navigationMenuTriggerStyle
                "!bg-transparent hover:!bg-transparent focus:!bg-transparent",
                "data-[state=open]:!bg-transparent data-[state=open]:hover:!bg-transparent data-[state=open]:focus:!bg-transparent",
                // Text colour on hover and open
                "hover:text-foreground data-[state=open]:text-foreground",
                // Open state: bottom bar matches active links
                "data-[state=open]:shadow-[inset_0_-2px_0_0_var(--primary)]",
                // Hide the built-in chevron — we render our own
                "[&>svg:last-child]:hidden",
              )}
            >
              Dev
              <ChevronDown className="h-3 w-3 transition-transform duration-200 [[data-state=open]_&]:rotate-180" aria-hidden="true" />
              <DebugIndicator />
            </NavigationMenuTrigger>
            <NavigationMenuContent className="flex flex-col p-1 min-w-[8rem]">
              {devLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-sm px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
