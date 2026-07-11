'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function InvestmentsSubNav() {
  const pathname = usePathname();

  const isPortfolio = pathname === "/investments";
  const isExposure = pathname.startsWith("/investments/exposure");

  return (
    <div className="flex gap-1">
      <Button
        variant={isPortfolio ? "default" : "outline"}
        size="sm"
        asChild
      >
        <Link href="/investments">Portfolio</Link>
      </Button>
      <Button
        variant={isExposure ? "default" : "outline"}
        size="sm"
        asChild
      >
        <Link href="/investments/exposure">Exposure</Link>
      </Button>
    </div>
  );
}
