import CategoryCard from "./CategoryCard";

type Item = {
  id: string;
  name: string;
  href: string;
  imageUrl?: string | null;
};

export default function CategoryGrid({ items }: { items: Item[] }) {
  if (!items?.length) {
    return <div className="text-sm text-gray-500">No categories yet.</div>;
  }

  return (
    // Standard responsive grid setup
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <CategoryCard
          key={item.id}
          name={item.name}
          href={item.href}
          imageUrl={item.imageUrl ?? undefined}
        />
      ))}
    </div>
  );
}