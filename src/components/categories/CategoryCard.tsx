import Link from "next/link";

export default function CategoryCard({
  name,
  href,
}: {
  name: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition"
    >
      <div className="aspect-[4/3] w-full rounded-xl bg-gray-50 mb-3" />
      <h3 className="text-sm font-medium">{name}</h3>
    </Link>
  );
}
