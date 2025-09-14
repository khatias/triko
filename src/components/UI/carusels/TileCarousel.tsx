import Image, { StaticImageData } from "next/image";

type Tile = {
  src: StaticImageData;
  alt: string;
};

interface TileCarouselProps {
  tiles: Tile[];
}

export default function TileCarousel({ tiles }: TileCarouselProps) {
  return (
    <div className="mt-6 -mx-4 overflow-x-auto scroll-smooth snap-x snap-mandatory">
      <ul className="flex gap-3 px-4">
        {tiles.map((tile, i) => (
          <li key={i} className="snap-center shrink-0">
            <div className="relative w-[78vw] aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="80vw"
                className="object-cover"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
