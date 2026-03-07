'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="max-w-md p-8 text-center">
        <h2 className="text-foreground mb-4 text-2xl font-bold">Something went wrong</h2>
        <p className="mb-6 text-gray-400">An unexpected error occurred. Please try again.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-white px-4 py-2 text-black transition-colors hover:bg-gray-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
