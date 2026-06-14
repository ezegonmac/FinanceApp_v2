"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  year: number;
  month: number;
  totalExpenses: number;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function BudgetBar({ year, month, totalExpenses }: Props) {
  const [budget, setBudget] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/months/${year}/${month}/budget`)
      .then((res) => res.json())
      .then((data) => {
        if (data.budget) {
          setBudget(data.budget.amount);
          setInputValue(String(data.budget.amount));
        } else {
          setBudget(null);
          setInputValue("");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  async function handleSave() {
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount < 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/months/${year}/${month}/budget`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setBudget(data.budget.amount);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  const percentage = budget && budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const remaining = budget ? budget - totalExpenses : 0;
  const isOverBudget = remaining < 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Monthly Budget:</label>
        <Input
          type="number"
          min={0}
          step={0.01}
          placeholder="Set budget..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-36"
        />
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {budget !== null && budget > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>
              {formatCurrency(totalExpenses)} / {formatCurrency(budget)}{" "}
              <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
            </span>
            <span className={isOverBudget ? "font-semibold text-negative" : "font-semibold text-positive"}>
              {isOverBudget ? `Over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} left`}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${isOverBudget ? "bg-negative" : "bg-positive"}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
