'use client';

import { useDebug } from "../debug/DebugContext";
import { Badge } from "@/components/ui/badge";
import AccountIcon from "@/components/accounts/AccountIcon";

type Props = {
  name: string;
  description?: string | null;
  icon?: string | null;
  balance: string;
  createdAtIso: string;
  active: boolean;
};

export default function AccountSummary({ name, description, icon, balance, createdAtIso, active }: Props) {
  const { debug } = useDebug();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <AccountIcon icon={icon} name={name} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
          <div className="mt-2">
            <Badge variant={active ? "success" : "outline"}>
              {active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {debug && (
            <p className="mt-1 text-xs text-muted-foreground">Created: {createdAtIso}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Balance</p>
        <p className="text-2xl font-semibold tabular-nums font-mono">{balance} €</p>
      </div>
    </div>
  );
}
