import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">404 — Page not found</h2>
      <p className="text-sm text-zinc-500">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
      >
        Go home
      </Link>
    </div>
  );
}
