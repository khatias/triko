"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Profile } from "@/types/db";

export async function updateProfileAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    full_name: (formData.get("full_name") as string) || null,
    phone: (formData.get("phone") as string) || null,
    marketing_opt_in: formData.get("marketing_opt_in") === "on",
    sex: (formData.get("sex") as string) || null,
    birth_date: (formData.get("birth_date") as string) || null,
  } satisfies Partial<Profile>;

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("user_id", user.id);

  if (error) {
    console.error("updateProfileAction error", error);
    return { error: error.message }; // 👈 return message
  }

  revalidatePath("/profile");
  return { error: undefined };
}
