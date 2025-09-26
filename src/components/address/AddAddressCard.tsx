// components/address/AddAddressCard.tsx
"use client";

import React from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import Modal from "../Modal";
import { Input, Button } from "../UI/primitives";

export default function AddAddressCard({
  action,
  wide = false,
}: {
  action: (fd: FormData) => Promise<void>;
  wide?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "group w-full rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-left transition",
          "hover:border-slate-400 hover:bg-slate-50",
          wide ? "block" : "flex flex-col justify-center",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200">
            <PlusCircleIcon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Add address
            </div>
            <div className="text-sm text-slate-500">
              Quickly save a new shipping location
            </div>
          </div>
        </div>
      </button>

      {open && (
        <Modal title="Add new address" onClose={() => setOpen(false)}>
          <form
            action={async (fd) => {
              await action(fd);
              setOpen(false);
            }}
            className="grid grid-cols-1 gap-4"
          >
            <Input id="line1" name="line1" label="Address line 1" required />
            <Input id="line2" name="line2" label="Address line 2 (optional)" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="city" name="city" label="City" required />
              <Input id="region" name="region" label="State / Region (optional)" />
            </div>

            <label className="mt-1 inline-flex select-none items-center gap-2">
              <input
                id="is_default_shipping"
                name="is_default_shipping"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Set as default</span>
            </label>

            <div className="mt-3 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save address
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
