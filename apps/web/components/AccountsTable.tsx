'use client';

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, RefreshCw } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import ErrorMessage from "./ErrorMessage";
import { useDebug } from "./debug/DebugContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListTable } from "@/components/ui/list-table";
import Link from "next/link";
import AccountIcon from "@/components/accounts/AccountIcon";
import IconPicker from "@/components/accounts/IconPicker";
import EditAccountForm from "@/components/accounts/EditAccountForm";

type Account = {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    balance: number | string;
    active: boolean;
    created_at: string;
};

const formatBalance = (value: unknown) => {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numericValue)) return `${value} EUR`;
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numericValue);
};

export default function AccountsTable() {
    const { debug } = useDebug();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [accountName, setAccountName] = useState("");
    const [accountDescription, setAccountDescription] = useState("");
    const [accountBalance, setAccountBalance] = useState("");
    const [accountIcon, setAccountIcon] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const resetForm = () => {
        setAccountName("");
        setAccountDescription("");
        setAccountBalance("");
        setAccountIcon(null);
        setFormError(null);
    };

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open && !adding) resetForm();
    };

    const fetchAccounts = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const response = await fetch("/api/accounts");
            if (!response.ok) throw new Error("Failed to fetch accounts");
            const data: Account[] = await response.json();
            setAccounts(data);
        } catch (err) {
            setFetchError(err instanceof Error ? err.message : "Failed to fetch accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void fetchAccounts(); }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAccounts();
        setRefreshing(false);
    };

    const handleAddAccount = async () => {
        if (!accountName.trim()) {
            setFormError("Account name cannot be empty");
            return;
        }
        setAdding(true);
        setFormError(null);
        try {
            const response = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: accountName.trim(),
                    description: accountDescription.trim() || null,
                    icon: accountIcon,
                    balance: accountBalance ? parseFloat(accountBalance) : 0,
                }),
            });
            if (!response.ok) throw new Error("Failed to add account");
            resetForm();
            setIsDialogOpen(false);
            await fetchAccounts();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setAdding(false);
        }
    };

    const columns: ColumnDef<Account>[] = [];

    if (debug) {
        columns.push({
            accessorKey: "id",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Id</span>,
        });
    }

    columns.push(
        {
            accessorKey: "name",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <AccountIcon icon={row.original.icon} name={row.original.name} size="md" />
                    <div>
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.description && (
                            <p className="text-xs text-muted-foreground">{row.original.description}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "balance",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Balance</span>,
            cell: ({ row }) => (
                <span className="font-mono tabular-nums">{formatBalance(row.original.balance)}</span>
            ),
            meta: { numeric: true },
        },
        {
            accessorKey: "active",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>,
            cell: ({ row }) => (
                <span
                    className={cn(
                        "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold leading-none",
                        row.original.active
                            ? "border-positive/10 bg-positive-subtle/60 text-positive-subtle-foreground"
                            : "border-border/50 bg-muted/60 text-muted-foreground"
                    )}
                >
                    {row.original.active ? "Active" : "Inactive"}
                </span>
            ),
        }
    );

    if (debug) {
        columns.push({
            accessorKey: "created_at",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created At</span>,
            cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
        });
    }

    columns.push({
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>,
        cell: ({ row }) => (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/accounts/${row.original.id}`}>View account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingAccount(row.original)}>
                        Edit account
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        meta: { isAction: true },
    });

    return (
        <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-4 p-5">
                <h2 className="text-lg font-semibold">Your Accounts</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="bg-white" onClick={handleRefresh} disabled={loading || adding || refreshing}>
                        <RefreshCw className="size-3.5" />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="size-3.5" />
                                Add account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add new account</DialogTitle>
                                <DialogDescription>
                                    Create a new account with an optional initial balance.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                {formError ? <ErrorMessage message={formError} /> : null}

                                <IconPicker
                                    value={accountIcon}
                                    onChange={setAccountIcon}
                                    disabled={adding}
                                />

                                <div className="grid gap-2">
                                    <label htmlFor="account-name" className="text-sm font-medium">
                                        Account name
                                    </label>
                                    <Input
                                        id="account-name"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        placeholder="Savings, Santander, Revolut..."
                                        disabled={adding}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label htmlFor="account-description" className="text-sm font-medium">
                                        Description
                                    </label>
                                    <Input
                                        id="account-description"
                                        value={accountDescription}
                                        onChange={(e) => setAccountDescription(e.target.value)}
                                        placeholder="Checking account, Digital wallet..."
                                        disabled={adding}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label htmlFor="account-balance" className="text-sm font-medium">
                                        Initial balance (EUR)
                                    </label>
                                    <Input
                                        id="account-balance"
                                        type="number"
                                        inputMode="decimal"
                                        value={accountBalance}
                                        onChange={(e) => setAccountBalance(e.target.value)}
                                        placeholder="0 EUR"
                                        disabled={adding}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={adding}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddAccount} disabled={adding}>
                                    {adding ? "Adding..." : "Create account"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <p className="border-t px-5 py-8 text-center text-sm text-muted-foreground">Loading accounts...</p>
            ) : fetchError ? (
                <div className="border-t px-5 py-8">
                    <ErrorMessage message={fetchError} />
                </div>
            ) : accounts.length > 0 ? (
                <ListTable
                    columns={columns}
                    data={accounts}
                    getRowHref={(account) => `/accounts/${account.id}`}
                    emptyMessage="No accounts available."
                    bare
                />
            ) : (
                <p className="border-t px-5 py-8 text-center text-sm text-muted-foreground">
                    No accounts available.
                </p>
            )}

            {editingAccount && (
                <EditAccountForm
                    account={{
                        id: editingAccount.id,
                        name: editingAccount.name,
                        description: editingAccount.description,
                        icon: editingAccount.icon,
                        active: editingAccount.active,
                    }}
                    open={!!editingAccount}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingAccount(null);
                            void fetchAccounts();
                        }
                    }}
                />
            )}
        </div>
    );
}
