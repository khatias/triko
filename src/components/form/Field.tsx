import { ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from "react";

export type FieldBaseProps = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
};

const baseInputClass = [
  "peer w-full rounded-xl border bg-white/60",
  "px-10 py-3.5 text-base font-medium",
  "text-zinc-800 placeholder-zinc-400",
  "placeholder-transparent outline-none transition",
  "border-zinc-300/80 focus:border-[#fdd5a2] focus:ring-4 focus:ring-[#fdd5a2]/40",
  "hover:border-[#fdd5a2]/70 focus:text-zinc-900",
].join(" ");

const errorClass =
  "border-[#fc5c5c] focus:border-[#fc5c5c] focus:ring-[#fc5c5c]/30 text-[#fc5c5c]";

export function FieldShell({
  id,
  label,
  icon,
  helper,
  error,
  children,
}: FieldBaseProps & { children: ReactNode }) {
  return (
    <div className="mb-5">
      <div className="group relative">
        {icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {icon}
          </div>
        ) : null}
        {children}
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 px-1 text-[13px] text-zinc-500 transition-all duration-200 bg-white/80  peer-focus:-top-3 peer-focus:translate-y-0 peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0 rounded"
        >
          {label}
        </label>
      </div>
      <div className="mt-1 min-h-5">
        {error ? (
          <p
            className="text-sm text-rose-600 "
            aria-live="polite"
          >
            {error}
          </p>
        ) : helper ? (
          <p className="text-xs text-zinc-500 ">{helper}</p>
        ) : null}
      </div>
    </div>
  );
}

export function InputField({
  id,
  label,
  icon,
  helper,
  error,
  disabled,
  ...rest
}: FieldBaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell id={id} label={label} icon={icon} helper={helper} error={error}>
      <input
        id={id}
        disabled={disabled}
        placeholder=" "
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[baseInputClass, error ? errorClass : ""].join(" ")}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  label,
  icon,
  helper,
  error,
  disabled,
  rows = 5,
  ...rest
}: FieldBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell id={id} label={label} icon={icon} helper={helper} error={error}>
      <textarea
        id={id}
        rows={rows}
        disabled={disabled}
        placeholder=" "
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[baseInputClass, error ? errorClass : ""].join(" ")}
        {...rest}
      />
    </FieldShell>
  );
}
