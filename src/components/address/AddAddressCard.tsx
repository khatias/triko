// components/address/AddAddressCard.tsx
"use client";

import React from "react";
import Modal from "../Modal";
import { Input, Button } from "../UI/primitives";
import { useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";
export default function AddAddressCard({
  action,
}: {
  action: (fd: FormData) => Promise<void>;
  wide?: boolean;
}) {
  const t = useTranslations("Profile.addresses");
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group border border-orange-500 rounded-lg w-full max-w-[230px] mx-auto py-2.5 px-4 
             text-center transition-colors duration-200 
             hover:bg-orange-500 hover:text-white 
             focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-center gap-2 text-orange-500">
          <PlusIcon className="h-4 w-4 text-current group-hover:text-white" />

          <div className="text-sm font-semibold text-orange-500 group-hover:text-white">
            {t("add")}
          </div>
        </div>
      </button>

      {open && (
        <Modal title={t("add")} onClose={() => setOpen(false)}>
          <form
            action={async (fd) => {
              await action(fd);
              setOpen(false);
            }}
            className="grid grid-cols-1 gap-4"
          >
            <Input id="line1" name="line1" label={t("address1")} required />
            <Input id="line2" name="line2" label={t("address2")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="city" name="city" label={t("city")} required />
              <Input id="region" name="region" label={t("region")} />
            </div>

            <label className="mt-1 inline-flex select-none items-center gap-2">
              <input
                id="is_default_shipping"
                name="is_default_shipping"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">{t("setDefault")}</span>
            </label>

            <div className="mt-3 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" variant="primary">
                {t("save")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
