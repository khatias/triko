import Link from "next/link";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import NewProductForm from "../NewProductForm";
import { Section } from "@/components/UI/primitives";
import type { CategoryRow, ColorRow, SizeRow } from "@/types/catalog";
import { buildCategoryTreeFlat } from "@/lib/admin/catalog/categoryTree";
export const dynamic = "force-dynamic";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { supabase } = await requireAdmin(locale);

  const [
    { data: categoryData, error: catErr },
    { data: colorData, error: colorErr },
    { data: sizeData, error: sizeErr },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name_en,name_ka,position,parent_id,status")
      .order("position", { ascending: true })
      .limit(500)
      .overrideTypes<CategoryRow[], { merge: false }>(),
    supabase
      .from("colors")
      .select("id,code,name_en,name_ka,hex,position")
      .order("position", { ascending: true })
      .overrideTypes<ColorRow[], { merge: false }>(),
    supabase
      .from("sizes")
      .select("id,code,position")
      .order("position", { ascending: true })
      .overrideTypes<SizeRow[], { merge: false }>(),
  ]);

  if (catErr) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">New product</h1>
          <Link
            className="underline text-sm"
            href={`/${locale}/admin/products`}
          >
            Back
          </Link>
        </div>
        <p className="mt-4 text-sm text-red-600">
          Failed to load categories: {catErr.message}
        </p>
      </div>
    );
  }

  const rawCategories: CategoryRow[] = (categoryData ?? []).map((c) => ({
    id: String(c.id),
    name_en: c.name_en ?? null,
    name_ka: c.name_ka ?? null,
    position: typeof c.position === "number" ? c.position : null,
    parent_id: c.parent_id ? String(c.parent_id) : null,
    status: c.status ?? null,
  }));

  const catRows = buildCategoryTreeFlat(rawCategories);

  const colorRows: ColorRow[] = (colorData ?? []).map((c) => ({
    id: String(c.id),
    code: String(c.code),
    name_en: c.name_en ?? null,
    name_ka: c.name_ka ?? null,
    hex: c.hex ?? null,
    position: typeof c.position === "number" ? c.position : null,
  }));

  const sizeRows: SizeRow[] = (sizeData ?? []).map((s) => ({
    id: String(s.id),
    code: String(s.code),
    position: typeof s.position === "number" ? s.position : null,
  }));

  return (
    <main className="overflow-hidden bg-gradient-to-b from-zinc-50 to-white">
      <Section className="grid place-items-center py-14">
        <div className="p-6 space-y-6 w-full max-w-6xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">New product</h1>
            <Link
              className="underline text-sm"
              href={`/${locale}/admin/products`}
            >
              Back
            </Link>
          </div>

          {colorErr || sizeErr ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              <div className="font-medium">Some lookups failed</div>
              <ul className="list-disc list-inside opacity-80 mt-1">
                {colorErr ? <li>Colors: {colorErr.message}</li> : null}
                {sizeErr ? <li>Sizes: {sizeErr.message}</li> : null}
              </ul>
            </div>
          ) : null}

          <NewProductForm
            locale={locale}
            categories={catRows}
            colors={colorRows}
            sizes={sizeRows}
          />
        </div>
      </Section>
    </main>
  );
}
