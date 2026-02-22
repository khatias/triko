"use client";

import React from "react";
import Modal from "../Modal";
import { Input, Button } from "../UI/primitives";
import { useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";

type ShippingZone = "" | "region_city" | "region_village" | "tbilisi";

export default function AddAddressCard2({
  action,
}: {
  action: (fd: FormData) => Promise<void>;
  wide?: boolean;
}) {
  const t = useTranslations("Profile.addresses");
  const [open, setOpen] = React.useState(false);
  const [shippingZone, setShippingZone] = React.useState<ShippingZone>("");

  const isTbilisi = shippingZone === "tbilisi";
  const isRegionCity = shippingZone === "region_city";
  const isRegionVillage = shippingZone === "region_village";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setShippingZone("");
        }}
        className="group border border-orange-500 rounded-lg w-full max-w-57.5 mx-auto py-2.5 px-4 
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
              // Force consistent payload
              if (shippingZone === "tbilisi") {
                fd.set("city", "Tbilisi");
                fd.set("region", "");
              }

              await action(fd);
              setOpen(false);
            }}
            className="grid grid-cols-1 gap-4"
          >
            <label
              htmlFor="shipping_zone"
              className="text-sm font-medium text-slate-700"
            >
              {t("shippingZone")} <span className="text-orange-500">*</span>
            </label>

            <select
              id="shipping_zone"
              name="shipping_zone"
              value={shippingZone}
              onChange={(e) => setShippingZone(e.target.value as ShippingZone)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition duration-150"
            >
              <option value="" disabled>
                {t("shippingZone")}
              </option>
              <option value="region_city">{t("regionCity")}</option>
              <option value="region_village">{t("regionVillage")}</option>
              <option value="tbilisi">{t("regionTbilisi")}</option>
            </select>

            <Input id="line1" name="line1" label={t("address1")} required />
            <Input id="line2" name="line2" label={t("address2")} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isTbilisi && (
                <>
                  <input type="hidden" name="city" value="Tbilisi" />
                  <input type="hidden" name="region" value="" />
                </>
              )}

              {isRegionCity && (
                <>
                  <Input id="city" name="city" label={t("city")} required />
                </>
              )}

              {isRegionVillage && (
                <>
                  <Input
                    id="city"
                    name="city"
                    label={t("municipality")}
                    required
                  />
                  <Input
                    id="region"
                    name="region"
                    label={t("village")}
                    required
                  />
                </>
              )}
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
