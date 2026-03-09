import { PropsWithChildren, ReactNode } from "react";
import { P } from "../UI/primitives";
export default function FormCard({
  title,
  subtitle,
  accent = true,
  children,
}: PropsWithChildren<{
  title: ReactNode;
  subtitle?: ReactNode;
  accent?: boolean;
}>) {
  return (
    <div className="mx-auto w-full max-w-xl p-[1px] rounded-2xl">
      <div className="rounded-2xl bg-white/80  backdrop-blur-xl shadow-md ring-1 ring-zinc-200/70  transition transform hover:shadow-xl hover:scale-[1.01]">
        <div className="px-6 pt-6 pb-8 border-b border-zinc-200/60 ">
          <h3 className="text-3xl pb-4 font-semibold tracking-tight text-zinc-900 ">
            {title}
          </h3>
          {subtitle ? <P>{subtitle}</P> : null}
        </div>
        {accent && (
          <div className="h-1 w-12 mt-2 bg-gradient-to-r from-[#fdd5a2] to-[#fc5c5c] rounded-full" />
        )}
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}
