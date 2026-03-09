export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-16 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white px-4 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-130 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-4 h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-2 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>

        <div className="h-115 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900" />
      </div>
    </div>
  );
}
