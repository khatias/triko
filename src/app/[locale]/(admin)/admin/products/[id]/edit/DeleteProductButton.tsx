"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { deleteProductAction, type DeleteProductState } from "./deleteProductAction";

const initialState: DeleteProductState = { ok: false };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SubmitButton({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cx(className, pending && "opacity-60")}>
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

export default function DeleteProductButton({
  locale,
  productId,
}: {
  locale: string;
  productId: string;
}) {
  const router = useRouter();
  const action = deleteProductAction.bind(null, locale, productId);
  const [state, formAction] = useActionState(action, initialState);

  React.useEffect(() => {
    if (state.ok) router.push(`/${locale}/admin/products`);
  }, [state.ok, router, locale]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("Delete this product permanently?")) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="_intent" value="delete_product" />

      <SubmitButton className="flex items-center justify-center px-4 py-2 bg-white border border-red-200 shadow-sm rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full" />

      {state.message ? (
        <div className={cx("text-xs", state.ok ? "text-emerald-700" : "text-red-700")}>
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
