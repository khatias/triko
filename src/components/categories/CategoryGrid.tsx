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

    <div className="grid grid-cols-2 gap-4  lg:grid-cols-4 lg:gap-8">
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