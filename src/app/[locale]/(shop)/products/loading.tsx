import { Section } from "@/components/UI/primitives";
export default function Loading() {
  return (
    <Section className="p-4 space-y-4 animate-pulse">
      <div className="h-10 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[4/5] bg-gray-100 rounded-xl" />
        ))}
      </div>
    </Section>
  );
}
