"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <p className="text-sm text-zinc-700">Sorry, something went wrong.</p>

      {/* Optional but VERY useful while debugging */}
      <pre className="mt-4 whitespace-pre-wrap text-xs text-zinc-500">
        {error?.message}
        {error?.digest ? `\nDigest: ${error.digest}` : ""}
      </pre>

      <button
        className="mt-4 rounded-md border px-3 py-2 text-sm"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
