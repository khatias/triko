import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  variant?: "neutral" | "warning";
  primaryAction?: {
    label: string;
    href?: string; // link action
    onClick?: () => void; // button action
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  variant = "neutral",
  primaryAction,
  secondaryAction,
  icon,
  className = "",
}: Props) {
  const tone =
    variant === "warning"
      ? "border-orange-200 bg-orange-50 text-orange-900"
      : "border-gray-200 bg-gray-50 text-gray-900";

  function Action({
    action,
    kind,
  }: {
    action: NonNullable<Props["primaryAction"]>;
    kind: "primary" | "secondary";
  }) {
    const base =
      kind === "primary"
        ? "bg-orange-600 text-white hover:bg-orange-700 shadow-sm"
        : "bg-white text-gray-700 border border-gray-200 hover:border-orange-500 hover:text-orange-600";

    const common =
      "inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold transition-all active:scale-95";

    if (action.href) {
      return (
        <Link href={action.href} className={`${common} ${base}`}>
          {action.label}
        </Link>
      );
    }

    return (
      <button onClick={action.onClick} className={`${common} ${base}`}>
        {action.label}
      </button>
    );
  }

  return (
    <div
      className={`w-full rounded-3xl border p-8 sm:p-10 ${tone} ${className}`}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        {icon ? (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/70">
            {icon}
          </div>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
          {description ? (
            <p className="max-w-md text-sm leading-relaxed text-gray-600">
              {description}
            </p>
          ) : null}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {primaryAction ? (
              <Action action={primaryAction} kind="primary" />
            ) : null}
            {secondaryAction ? (
              <Action action={secondaryAction} kind="secondary" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
