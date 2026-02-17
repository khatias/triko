import Link from "next/link";
import type { ReactNode } from "react";

type ActionType = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type Props = {
  title: string;
  description?: string;
  variant?: "neutral" | "warning"; // "neutral" = gray, "warning" = orange/alert tint
  primaryAction?: ActionType;
  secondaryAction?: ActionType;
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
  // Styles based on variant
  const containerStyles =
    variant === "warning"
      ? "bg-orange-50/50 border-orange-100"
      : "bg-white border-gray-200";

  const iconWrapperStyles =
    variant === "warning"
      ? "bg-orange-100 text-orange-600 ring-orange-200"
      : "bg-gray-50 text-gray-500 ring-gray-100";

  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-3xl border border-dashed px-4 py-16 text-center sm:px-10 ${containerStyles} ${className}`}
    >
      {icon && (
        <div
          className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ring-4 ${iconWrapperStyles}`}
        >
          <div className="h-8 w-8">{icon}</div>
        </div>
      )}

      {/* --- Text Content --- */}
      <div className="max-w-md space-y-2">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm leading-relaxed text-gray-500">{description}</p>
        )}
      </div>

      {/* --- Actions --- */}
      {(primaryAction || secondaryAction) && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {primaryAction && (
            <ActionButton action={primaryAction} variant="primary" />
          )}
          {secondaryAction && (
            <ActionButton action={secondaryAction} variant="secondary" />
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  action,
  variant,
}: {
  action: ActionType;
  variant: "primary" | "secondary";
}) {
  const baseStyles =
    "inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-all active:scale-95";

  const variantStyles =
    variant === "primary"
      ? "bg-[#172a3e] text-white shadow-sm hover:bg-[#1c3b57] hover:shadow-md"
      : "bg-white text-gray-700 border border-gray-200 hover:border-[#1c3b57] hover:bg-[#1c3b57] hover:text-white";

  const className = `${baseStyles} ${variantStyles}`;

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button onClick={action.onClick} className={className} type="button">
      {action.label}
    </button>
  );
}
