'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import TodoNavBadge from "@/components/todos/TodoNavBadge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import DebugIndicator from "@/components/debug/DebugIndicator";

const navLinks: { href: string; label: string }[] = [
  { href: "/",               label: "Home"          },
  { href: "/accounts",       label: "Accounts"      },
  { href: "/todos",          label: "Todos"         },
  { href: "/recurrent",      label: "Recurrent"     },
  { href: "/months/current", label: "Current Month" },
  { href: "/metrics",        label: "Metrics"       },
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
      {navLinks.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative inline-flex items-center h-14 px-5 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "font-semibold text-foreground"
                : "font-normal text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="relative inline-flex h-full items-center gap-1">
              {label}
              {href === "/todos" && <TodoNavBadge />}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-px h-[3px] transition-opacity",
                  isActive
                    ? "bg-primary"
                    : "bg-muted-foreground/30 opacity-0 group-hover:opacity-100",
                )}
              />
            </span>
          </Link>
        );
      })}

      {/* Dev dropdown — inline, same height as nav links */}
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                "group relative h-14 px-5 text-sm font-normal whitespace-nowrap rounded-none",
                "text-muted-foreground transition-colors",
                "!bg-transparent hover:!bg-transparent focus:!bg-transparent",
                "data-[state=open]:!bg-transparent data-[state=open]:hover:!bg-transparent data-[state=open]:focus:!bg-transparent",
                "hover:text-foreground data-[state=open]:text-foreground",
                "[&>svg:last-child]:hidden",
              )}
            >
              Dev
              <DebugIndicator />
              <span className="absolute inset-x-0 -bottom-px h-[3px] bg-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 group-data-[state=open]:bg-primary group-data-[state=open]:opacity-100" />
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
