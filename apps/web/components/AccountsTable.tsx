'use client';

import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import ErrorMessage from "./ErrorMessage";
import { useDebug } from "./debug/DebugContext";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ListTable } from "@/components/ui/list-table";
import Link from "next/link";
import AccountIcon from "@/components/accounts/AccountIcon";
import IconPicker from "@/components/accounts/IconPicker";
import EditAccountForm from "@/components/accounts/EditAccountForm";

type Account = {
    id: number;
    name: string;
    icon: string | null;
    balance: number | string;
    active: boolean;
    created_at: string;
};

const formatBalance = (value: unknown) => {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numericValue)) return `${value} EUR`;
    const hasDecimals = !Number.isInteger(numericValue);
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: hasDecimals ? 2 : 0,
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
    const [accountBalance, setAccountBalance] = useState("");
    const [accountIcon, setAccountIcon] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const resetForm = () => {
        setAccountName("");
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
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <AccountIcon icon={row.original.icon} name={row.original.name} size="sm" />
                    <span className="font-medium">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "balance",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Balance</span>,
            cell: ({ row }) => formatBalance(row.original.balance),
            meta: { numeric: true },
        },
        {
            accessorKey: "active",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active</span>,
            cell: ({ row }) => (
                <Badge variant={row.original.active ? "success" : "outline"}>
                    {row.original.active ? "Active" : "Inactive"}
                </Badge>
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
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Accounts list</h2>
                    <p className="text-sm text-muted-foreground">
                        Review balances and open individual account details.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleRefresh} disabled={loading || adding || refreshing}>
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                            <Button>Add account</Button>
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
                <p className="text-sm text-muted-foreground">Loading accounts...</p>
            ) : fetchError ? (
                <ErrorMessage message={fetchError} />
            ) : accounts.length > 0 ? (
                <ListTable
                    columns={columns}
                    data={accounts}
                    getRowHref={(account) => `/accounts/${account.id}`}
                    emptyMessage="No accounts available."
                />
            ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No accounts available.
                </div>
            )}

            {editingAccount && (
                <EditAccountForm
                    account={{
                        id: editingAccount.id,
                        name: editingAccount.name,
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
