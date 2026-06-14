'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IconPicker from "./IconPicker";
import ErrorMessage from "../ErrorMessage";

type Props = {
  account: {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    active: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditAccountForm({ account, open, onOpenChange }: Props) {
  const router = useRouter();
  const [name, setName] = useState(account.name);
  const [description, setDescription] = useState(account.description ?? "");
  const [icon, setIcon] = useState<string | null>(account.icon);
  const [active, setActive] = useState(account.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Name cannot be empty or whitespace-only");
      return;
    }

    setSaving(true);

    // Compute diff: only send changed fields
    const body: Record<string, unknown> = {};
    if (name !== account.name) body.name = name;
    const newDescription = description.trim() || null;
    if (newDescription !== account.description) body.description = newDescription;
    if (icon !== account.icon) body.icon = icon;
    if (active !== account.active) body.active = active;

    // If nothing changed, just close
    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ?? `Failed to update account (${response.status})`
        );
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!saving) onOpenChange(value); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>
            Modify the account details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {error && <ErrorMessage message={error} />}

          <IconPicker value={icon} onChange={setIcon} disabled={saving} />

          <div className="grid gap-2">
            <label htmlFor="edit-account-name" className="text-sm font-medium">
              Account name
            </label>
            <Input
              id="edit-account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Account name"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="edit-account-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="edit-account-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Checking account, Digital wallet..."
              disabled={saving}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="edit-account-active"
              checked={active}
              onCheckedChange={setActive}
              disabled={saving}
            />
            <label htmlFor="edit-account-active" className="text-sm font-medium">
              Active
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
