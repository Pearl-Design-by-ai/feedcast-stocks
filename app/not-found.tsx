import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-gray-100 px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-400">404</p>
            <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
            <p className="mt-2 max-w-md text-gray-500">
                The page you’re looking for doesn’t exist or may have moved.
            </p>
            <Link
                href="/"
                className="mt-6 rounded-md bg-teal-500 px-5 py-2.5 font-medium text-black transition-colors hover:bg-teal-400"
            >
                Back to dashboard
            </Link>
        </div>
    );
}
