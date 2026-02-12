export default function Loading() {
  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="h-10 w-72 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}
