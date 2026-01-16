import Link from "next/link";
import { Section } from "@/components/UI/primitives";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { ChevronLeft, AlertCircle } from "lucide-react";

import type {
  ProductRow,
  ProductImageRow,
  ProductColorImageRow,
} from "@/types/product";
import type { CategoryRow, ColorRow, SizeRow } from "@/types/catalog";

import EditProductSizes from "./EditProductSizes";
import EditProductForm from "./EditProductForm";
import EditProductCategories from "./EditProductCategories";
import ImageManager from "./ImageManager";
import { buildCategoryTreeFlat } from "@/lib/admin/catalog/categoryTree";

export const dynamic = "force-dynamic";

type CategoryJoinRow = {
  position: number | null;
  categories: {
    id: string;
    name_en: string | null;
    name_ka: string | null;
  } | null;
};

type VariantColorRow = { color_id: string };
type VariantSizeRow = { size_id: string };

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  await requireAdmin(locale);
  const db = createAdminClient();

  const { data: product, error: pErr } = await db
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<ProductRow, { merge: false }>();

  if (pErr || !product) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">
            Product Not Found
          </h1>
          <p className="text-sm text-zinc-500">
            {pErr?.message ?? "This product does not exist."}
          </p>
          <Link
            href={`/${locale}/admin/products`}
            className="inline-block px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  const [
    { data: catLinks, error: catErr },
    { data: rawCats, error: rawErr },
    { data: gallery, error: gErr },
    { data: colorImgs, error: ciErr },
    { data: variantColors, error: vcErr },
    { data: variantSizes, error: vsErr },
    { data: allColors, error: allColErr },
    { data: allSizes, error: allSizesErr },
  ] = await Promise.all([
    db
      .from("product_categories")
      .select("position,categories(id,name_en,name_ka)")
      .eq("product_id", id)
      .order("position", { ascending: true })
      .overrideTypes<CategoryJoinRow[], { merge: false }>(),
    db
      .from("categories")
      .select("id,parent_id,position,status,name_en,name_ka")
      .overrideTypes<CategoryRow[], { merge: false }>(),
    db
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .order("position", { ascending: true })
      .overrideTypes<ProductImageRow[], { merge: false }>(),
    db
      .from("product_color_images")
      .select("*")
      .eq("product_id", id)
      .order("position", { ascending: true })
      .overrideTypes<ProductColorImageRow[], { merge: false }>(),

    // only active variants should define assigned colors
    db
      .from("product_variants")
      .select("color_id")
      .eq("product_id", id)
      .eq("is_active", true)
      .overrideTypes<VariantColorRow[], { merge: false }>(),

    // only active variants should define assigned sizes
    db
      .from("product_variants")
      .select("size_id")
      .eq("product_id", id)
      .eq("is_active", true)
      .overrideTypes<VariantSizeRow[], { merge: false }>(),

    db
      .from("colors")
      .select("id,code,name_en,name_ka,hex")
      .order("name_en", { ascending: true })
      .overrideTypes<ColorRow[], { merge: false }>(),

    db
      .from("sizes")
      .select("id,code,name,position")
      .order("position", { ascending: true })
      .order("code", { ascending: true })
      .overrideTypes<SizeRow[], { merge: false }>(),
  ]);

  const assigned = (catLinks ?? [])
    .map((r) => (r.categories ? { ...r.categories, position: r.position } : null))
    .filter(Boolean) as Array<{
    id: string;
    name_en: string | null;
    name_ka: string | null;
    position: number | null;
  }>;

  const categoriesFlat = buildCategoryTreeFlat(rawCats ?? []);

  const colorIds = Array.from(
    new Set([
      ...(variantColors ?? []).map((v) => v.color_id),
      ...(colorImgs ?? []).map((c) => c.color_id),
    ])
  );

  const colorSet = new Set(colorIds);
  const colors = (allColors ?? []).filter((c) => colorSet.has(c.id));

  const assignedSizeIds = Array.from(
    new Set((variantSizes ?? []).map((v) => v.size_id))
  );

  return (
    <main className="min-h-screen bg-zinc-50/50 pb-20">
      <Section className="py-8">
        <div className="mx-auto px-4 sm:px-6 space-y-6">
          <div className="space-y-2">
            <Link
              href={`/${locale}/admin/products/${product.id}`}
              className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to product
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Edit product</h1>
              <p className="text-sm text-zinc-500">
                Update core fields, categories, sizes, and images.
              </p>
            </div>

            {catErr ||
            rawErr ||
            gErr ||
            ciErr ||
            vcErr ||
            vsErr ||
            allColErr ||
            allSizesErr ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Some data failed to load:{" "}
                {catErr?.message ??
                  rawErr?.message ??
                  gErr?.message ??
                  ciErr?.message ??
                  vcErr?.message ??
                  vsErr?.message ??
                  allColErr?.message ??
                  allSizesErr?.message}
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-8">
            <EditProductForm locale={locale} product={product} />

            <div className="max-w-6xl mx-auto">
              <EditProductCategories
                locale={locale}
                productId={product.id}
                assigned={assigned}
                allCategories={categoriesFlat}
              />
            </div>

            <div className="max-w-6xl mx-auto">
              <EditProductSizes
                locale={locale}
                productId={product.id}
                assignedSizeIds={assignedSizeIds}
                allSizes={allSizes ?? []}
              />
            </div>

            <div className="max-w-6xl mx-auto">
              <ImageManager
                locale={locale}
                productId={product.id}
                primaryImageUrl={product.primary_image_url}
                gallery={gallery ?? []}
                colorImages={colorImgs ?? []}
                colors={colors ?? []}
                allColors={allColors ?? []}
              />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
