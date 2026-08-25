import { useId } from "react";
import { cn } from "@/lib/utils";

export function DiloIcono({
  className,
  titulo = "Dilo",
}: {
  className?: string;
  titulo?: string;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={titulo}
    >
      <title>{titulo}</title>
      <defs>
        <radialGradient id={`${id}-n`} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="16%" stopColor="#00e5ff" />
          <stop offset="52%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </radialGradient>
        <radialGradient id={`${id}-s`} cx="30%" cy="78%" r="48%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-h`} cx="30%" cy="24%" r="32%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill={`url(#${id}-n)`} />
      <circle cx="16" cy="16" r="16" fill={`url(#${id}-s)`} />
      <circle cx="16" cy="16" r="16" fill={`url(#${id}-h)`} />
    </svg>
  );
}

export function DiloMarca({
  className,
}: {
  className?: string;
  tamano?: "sm" | "md";
}) {
  return (
    <span className={className}>
      Dilo
    </span>
  );
}
