import Link from "next/link";
import { Section } from "@/components/UI/primitives";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { ChevronLeft, AlertCircle } from "lucide-react";
import type { ProductRow } from "@/types/product";
import EditProductForm from "./EditProductForm";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  await requireAdmin(locale);
  const db = createAdminClient();

  const { data: product, error } = await db
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<ProductRow, { merge: false }>();

  if (error || !product) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">Product Not Found</h1>
          <p className="text-sm text-zinc-500">{error?.message ?? "This product does not exist."}</p>
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

  return (
    <main className="min-h-screen bg-zinc-50/50 pb-20">
      <Section className="py-8">
        <div className=" mx-auto px-4 sm:px-6 space-y-6">
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
              <p className="text-sm text-zinc-500">Update core fields. Images and variants can be edited separately.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <EditProductForm locale={locale} product={product} />
          </div>
        </div>
      </Section>
    </main>
  );
}
