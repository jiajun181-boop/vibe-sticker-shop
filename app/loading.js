export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-gray-200)] border-t-[var(--color-gray-900)]" />
        <p className="text-sm text-[var(--color-gray-400)] animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
