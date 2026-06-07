import { Landmark } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  icon?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
};

const pxMap = {
  sm: 24,
  md: 32,
  lg: 40,
};

export default function AccountIcon({ icon, name, size = "md", className }: Props) {
  if (!icon) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-muted",
          sizeMap[size],
          className
        )}
      >
        <Landmark className="size-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={`/icons/${icon}`}
      alt={`${name} icon`}
      width={pxMap[size]}
      height={pxMap[size]}
      className={cn("rounded-md object-contain", sizeMap[size], className)}
    />
  );
}
