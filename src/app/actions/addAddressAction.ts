// app/actions/addressActions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function revalidateAddresses(locale?: string) {
  const base = locale ? `/${locale}` : "";
  revalidatePath(`${base}/profile/addresses`);
}

export async function addAddressAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const isDefault = formData.get("is_default_shipping") === "on";

  const payload = {
    user_id: user.id, // needed for RLS
    line1: String(formData.get("line1") || "").trim(),
    line2: (formData.get("line2") as string)
      ? String(formData.get("line2")).trim()
      : null,
    city: String(formData.get("city") || "").trim(),
    region: (formData.get("region") as string)
      ? String(formData.get("region")).trim()
      : null,
    is_default_shipping: isDefault,
  };

  if (!payload.line1 || !payload.city) {
    console.error(
      "addAddressAction validation failed: line1 and city are required"
    );
    return;
  }

  if (isDefault) {
    const { error: unsetErr } = await supabase
      .from("addresses")
      .update({ is_default_shipping: false })
      .eq("user_id", user.id);

    if (unsetErr) {
      console.error("Failed to unset previous default:", unsetErr);
      return;
    }
  }

  const { error } = await supabase.from("addresses").insert(payload);
  if (error) {
    console.error("addAddressAction error", error);
  }

  revalidateAddresses(String(formData.get("locale") || "").trim());
}

export async function deleteAddressAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("deleteAddressAction error", error);
  }

  revalidateAddresses(String(formData.get("locale") || "").trim());
}

export async function setDefaultAddressAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") || "");

  const { error: unsetErr } = await supabase
    .from("addresses")
    .update({ is_default_shipping: false })
    .eq("user_id", user.id);

  if (unsetErr) {
    return;
  }

  const { error: setErr } = await supabase
    .from("addresses")
    .update({ is_default_shipping: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (setErr) {
    console.error("set default error:", setErr);
    return;
  }

  revalidateAddresses(String(formData.get("locale") || "").trim());
}
