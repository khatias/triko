import Link from "next/link";
import Image from "next/image";

export default function CategoryCard({
  name,
  href,
  imageUrl,
}: {
  name: string;
  href: string;
  imageUrl?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition"
    >
      {/* ✅ parent needs 'relative' for fill to work */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50 mb-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium">{name}</h3>
    </Link>
  );
}
