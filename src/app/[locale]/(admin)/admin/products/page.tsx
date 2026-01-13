import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin.products");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/${locale}/login`);

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id,status,position,name_en,name_ka,slug_en,slug_ka,primary_image_url,updated_at"
    )
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">{t("products")}</h1>
        <p className="mt-3 text-sm text-red-600">
          Failed to load products: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("products")}</h1>
        <Link
          href={`/${locale}/admin/products/new`}
          className="rounded-md px-3 py-2 text-sm font-medium border"
        >
          {t("newProduct")}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">{t("productName")}</th>
              <th className="p-3">{t("status")}</th>
              <th className="p-3">{t("position")}</th>
              <th className="p-3">{t("updated")}</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{p.name_ka ?? p.name_en}</div>
                  <div className="text-xs text-gray-500">{p.slug_en}</div>
                </td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">{p.position}</td>
                <td className="p-3">
                  {p.updated_at ? new Date(p.updated_at).toLocaleString() : ""}
                </td>
              </tr>
            ))}

            {!products?.length && (
              <tr>
                <td className="p-3" colSpan={4}>
                  {t("noProducts")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
