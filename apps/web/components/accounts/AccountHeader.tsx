'use client';

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountSummary from "./AccountSummary";
import EditAccountForm from "./EditAccountForm";

type Props = {
  account: {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    balance: string;
    createdAtIso: string;
    active: boolean;
  };
};

export default function AccountHeader({ account }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between">
        <AccountSummary
          name={account.name}
          description={account.description}
          icon={account.icon}
          balance={account.balance}
          createdAtIso={account.createdAtIso}
          active={account.active}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDialogOpen(true)}
          aria-label="Edit account"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <EditAccountForm
        account={{
          id: account.id,
          name: account.name,
          description: account.description,
          icon: account.icon,
          active: account.active,
        }}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
