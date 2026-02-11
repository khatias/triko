import "server-only";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { fetchAdminParentProduct } from "./_queries/productDetail";
import ProductEditorClient from "./_components/ProductEditorClient";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; parentCode: string }>;
}) {
  const { locale, parentCode } = await params;
  const row = await fetchAdminParentProduct(locale, parentCode);
  if (!row) return notFound();

  return (
    <main className="min-h-screen bg-zinc-50/50 pb-20 pt-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Breadcrumb / Nav */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href={`/${locale}/admin/products`} className="hover:text-zinc-900 transition-colors">
            Products
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-zinc-900">{row.parent_code}</span>
        </nav>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Edit Product
            </h1>
            <p className="mt-1 text-zinc-500">
              Manage details, media, and publishing status.
            </p>
          </div>
          
          <Link
            href={`/${locale}/admin/products`}
            className="group flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back
          </Link>
        </div>

        <ProductEditorClient locale={locale} row={row} />
      </div>
    </main>
  );
}