import Link from "next/link";
import Image from "next/image";

type Props = {
  name: string;
  href: string;
  imageUrl?: string;
};

export default function CategoryCard({ name, href, imageUrl }: Props) {
  return (
    <Link
      href={href}
      aria-label={name}
      className="group block rounded-2xl border border-zinc-200 bg-white/90 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-rose-500"
    >
      <div className="relative aspect-[4/5] ">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-500 will-change-transform motion-safe:group-hover:scale-[1.06] select-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-gray-400"></div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-medium text-neutral-900 transition-colors group-hover:text-neutral-700">
          {name}
        </h3>
        <span
          aria-hidden
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-neutral-500 transition-all group-hover:translate-x-1 group-hover:shadow-sm"
        >
          →
        </span>
      </div>
    </Link>
  );
}
