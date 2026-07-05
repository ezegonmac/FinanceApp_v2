'use client';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ContributionToggle({ checked, onChange }: Props) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary h-4 w-4"
      />
      <span className="text-sm text-muted-foreground">Show transactions</span>
    </label>
  );
}
