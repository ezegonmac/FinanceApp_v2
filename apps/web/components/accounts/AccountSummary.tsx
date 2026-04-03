'use client';

import { useDebug } from "../debug/DebugContext";
import { Badge } from "@/components/ui/badge";

type Props = {
  name: string;
  balance: string;
  createdAtIso: string;
  active: boolean;
};

export default function AccountSummary({ name, balance, createdAtIso, active }: Props) {
  const { debug } = useDebug();

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{name}</h1>
        <div className="mt-2">
          <Badge variant={active ? "success" : "outline"}>
            {active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {debug && (
          <p className="mt-1 text-xs text-muted-foreground">Created: {createdAtIso}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Balance</p>
        <p className="text-3xl font-semibold tabular-nums">{balance} €</p>
      </div>
    </div>
  );
}
