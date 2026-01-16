import Link from "next/link";
import Image from "next/image";
import type { ComponentType, ReactNode } from "react";
import { Section, StatusBadge } from "@/components/UI/primitives";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  ChevronLeft,
  Package,
  Layers,
  Image as ImageIcon,
  Tag,
  AlertCircle,
  Globe,
} from "lucide-react";
import {
  ProductRow,
  ProductImageRow,
  ProductColorImageRow,
  VariantRow,
  ColorMeta,
  CategoryJoinRow,
} from "@/types/product";
import { moneyFromCents } from "@/lib/helpers";
import DeleteProductButton from "./edit/DeleteProductButton";

export const dynamic = "force-dynamic";

function groupBy<K extends string, V>(
  rows: V[],
  keyFn: (v: V) => K
): Record<K, V[]> {
  const out = {} as Record<K, V[]>;
  for (const r of rows) {
    const k = keyFn(r);
    (out[k] ??= []).push(r);
  }
  return out;
}

type IconComponent = ComponentType<{ className?: string }>;

type CardProps = {
  children: ReactNode;
  title?: string;
  icon?: IconComponent;
  className?: string;
};

function Card({ children, title, icon: Icon, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden ${className}`}
    >
      {(title || Icon) && (
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
          {Icon ? <Icon className="w-4 h-4 text-zinc-500" /> : null}
          {title ? (
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          ) : null}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

const DetailRow = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) => (
  <div className="flex flex-col py-2">
    <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
      {label}
    </dt>
    <dd className="mt-1 text-sm text-zinc-900 font-medium">{value}</dd>
    {sub && <dd className="text-xs text-zinc-400 font-mono mt-0.5">{sub}</dd>}
  </div>
);

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  await requireAdmin(locale);
  const db = createAdminClient();

  const [
    { data: product, error: pErr },
    { data: gallery, error: gErr },
    { data: colorImgs, error: ciErr },
    { data: variants, error: vErr },
    { data: catLinks, error: catErr },
  ] = await Promise.all([
    db
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .overrideTypes<ProductRow, { merge: false }>(),
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
    db
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("color_id")
      .order("size_id")
      .overrideTypes<VariantRow[], { merge: false }>(),
    db
      .from("product_categories")
      .select("position,categories(id,name_en,name_ka)")
      .eq("product_id", id)
      .order("position")
      .overrideTypes<CategoryJoinRow[], { merge: false }>(),
  ]);

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
            {pErr?.message ?? "The requested product ID could not be located."}
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

  const colorIds = Array.from(
    new Set((colorImgs ?? []).map((r) => r.color_id))
  );
  const { data: colorMetaRows, error: colorMetaErr } =
    colorIds.length > 0
      ? await db
          .from("colors")
          .select("*")
          .in("id", colorIds)
          .overrideTypes<ColorMeta[], { merge: false }>()
      : { data: [], error: null };

  const colorMetaById = new Map((colorMetaRows ?? []).map((c) => [c.id, c]));
  const colorImagesGrouped = groupBy(colorImgs ?? [], (r) => r.color_id);

  const catSafe = (catLinks ?? [])
    .map((r) => r.categories)
    .filter(Boolean) as Array<{
    id: string;
    name_en: string | null;
    name_ka: string | null;
  }>;

  const gallerySafe = gallery ?? [];
  const variantsSafe = variants ?? [];

  const errors = [gErr, ciErr, vErr, catErr, colorMetaErr].filter(Boolean);

  return (
    <main className="min-h-screen bg-zinc-50/50 pb-20">
      <Section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Top Navigation & Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-3">
              <Link
                href={`/${locale}/admin/products`}
                className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Products
              </Link>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    {product.name_en || "Untitled Product"}
                  </h1>
                  <StatusBadge status={product.status} />
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="uppercase">ID:</span>
                  <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                    {product.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-semibold text-zinc-900">
                  {moneyFromCents(product.price_cents)}
                </div>
                <div className="text-xs text-zinc-500">Base Price</div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">
                  Some data failed to load correctly
                </p>
                <ul className="list-disc list-inside mt-1 opacity-80">
                  {errors.map((e, i) => (
                    <li key={i}>{e?.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
              {/* Product Media */}
              <Card title="Media Gallery" icon={ImageIcon}>
                <div className="space-y-6">
                  {/* Primary */}
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 mb-3 uppercase">
                      Primary Image
                    </h4>

                    {product.primary_image_url ? (
                      <div className="relative group rounded-lg overflow-hidden border border-zinc-200 aspect-auto min-h-screen">
                        <Image
                          src={product.primary_image_url}
                          alt="Primary"
                          fill
                          priority
                          sizes="(min-width: 1024px) 66vw, 100vw"
                          className="object-contain"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                    ) : (
                      <div className="h-40 rounded-lg border border-dashed border-zinc-300 flex items-center justify-center bg-zinc-50 text-zinc-400 text-sm">
                        No primary image set
                      </div>
                    )}
                  </div>

                  {/* Additional Gallery */}
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 mb-3 uppercase flex justify-between">
                      <span>Additional Images</span>
                      <span className="text-zinc-400 font-normal">
                        {gallerySafe.length} images
                      </span>
                    </h4>

                    {gallerySafe.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {gallerySafe.map((img) => (
                          <div
                            key={img.storage_path}
                            className="relative group aspect-square rounded-md overflow-hidden border border-zinc-200 bg-white"
                          >
                            <Image
                              src={img.url}
                              alt="Gallery"
                              fill
                              sizes="(min-width: 1024px) 14vw, (min-width: 640px) 20vw, 25vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-1 bg-black/50 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                              Pos: {img.position}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 italic">
                        No additional gallery images.
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Descriptions */}
              <Card title="Product Details" icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                        EN
                      </div>
                      <span className="text-sm font-semibold text-zinc-900">
                        English
                      </span>
                    </div>

                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 min-h-[100px]">
                      <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                        {product.description_en || (
                          <span className="text-zinc-400 italic">
                            No description provided
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold">
                        KA
                      </div>
                      <span className="text-sm font-semibold text-zinc-900">
                        Georgian
                      </span>
                    </div>

                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 min-h-[100px]">
                      <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                        {product.description_ka || (
                          <span className="text-zinc-400 italic">
                            No description provided
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Variants Table */}
              <Card
                title={`Variants (${variantsSafe.length})`}
                icon={Package}
                className="overflow-hidden"
              >
                {variantsSafe.length > 0 ? (
                  <div className="overflow-x-auto -mx-6 -mb-6">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-semibold">
                        <tr>
                          <th className="px-6 py-3">Color</th>
                          <th className="px-6 py-3">Size</th>
                          <th className="px-6 py-3 text-center">Status</th>
                          <th className="px-6 py-3 text-right">Variant ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {variantsSafe.map((v) => (
                          <tr
                            key={v.id}
                            className="hover:bg-zinc-50/50 transition-colors"
                          >
                            <td className="px-6 py-3 font-medium text-zinc-900">
                              {v.color ?? v.color_id}
                            </td>
                            <td className="px-6 py-3 text-zinc-700">
                              {v.size ?? v.size_id}
                            </td>
                            <td className="px-6 py-3 text-center">
                              {v.is_active ? (
                                <span
                                  className="inline-flex w-2 h-2 rounded-full bg-emerald-500"
                                  title="Active"
                                />
                              ) : (
                                <span
                                  className="inline-flex w-2 h-2 rounded-full bg-zinc-300"
                                  title="Inactive"
                                />
                              )}
                            </td>
                            <td className="px-6 py-3 text-right text-xs font-mono text-zinc-400">
                              {v.id.split("-")[0]}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    No variants created for this product yet.
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-8 lg:sticky lg:top-8">
              {/* Core Info */}
              <Card title="Metadata" icon={Tag}>
                <div className="space-y-4 divide-y divide-zinc-100">
                  <DetailRow label="Slug" value={product.slug || "N/A"} />
                  <DetailRow
                    label="English Name"
                    value={product.name_en || "-"}
                  />
                  <DetailRow
                    label="Georgian Name"
                    value={product.name_ka || "-"}
                  />

                  <div className="pt-2">
                    <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                      Categories
                    </dt>
                    <div className="flex flex-wrap gap-2">
                      {catSafe.length > 0 ? (
                        catSafe.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium"
                          >
                            {c.name_en || c.name_ka || "Unknown"}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-400">
                          Uncategorized
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Color Specific Images */}
              <Card title="Colorways" icon={Layers}>
                <div className="space-y-6">
                  {Object.keys(colorImagesGrouped).length > 0 ? (
                    Object.entries(colorImagesGrouped).map(
                      ([colorId, imgs]) => {
                        const meta = colorMetaById.get(colorId);
                        const title =
                          meta?.name_en ||
                          meta?.name_ka ||
                          meta?.code ||
                          "Unknown Color";
                        const hex = meta?.hex || "#e4e4e7";

                        return (
                          <div key={colorId} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-5 h-5 rounded-full border border-zinc-200 shadow-sm ring-1 ring-white"
                                  style={{ backgroundColor: hex }}
                                />
                                <span className="text-sm font-medium text-zinc-700">
                                  {title}
                                </span>
                              </div>
                              <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 rounded">
                                {imgs.length}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              {imgs.map((img) => (
                                <div
                                  key={img.storage_path}
                                  className="relative aspect-square rounded border border-zinc-200 overflow-hidden bg-white"
                                >
                                  <Image
                                    src={img.url}
                                    alt={title}
                                    fill
                                    sizes="(min-width: 1024px) 9vw, 25vw"
                                    className="object-cover hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )
                  ) : (
                    <div className="text-sm text-zinc-500">
                      No specific images assigned to colors.
                    </div>
                  )}
                </div>
              </Card>

              {/* Admin Actions (Mock UI) */}
              <div className="bg-zinc-100/50 rounded-xl p-4 border border-zinc-200/50">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                  Actions
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={`/${locale}/admin/products/${product.id}/edit`}
                    className="flex items-center justify-center px-4 py-2 bg-white border border-zinc-300 shadow-sm rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Edit
                  </Link>

                  <DeleteProductButton locale={locale} productId={product.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
