"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-gray-100 px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-400">Error</p>
            <h1 className="mt-3 text-3xl font-bold">Something went wrong</h1>
            <p className="mt-2 max-w-md text-gray-500">
                An unexpected error occurred. Please try again.
            </p>
            <button
                onClick={reset}
                className="mt-6 rounded-md bg-teal-500 px-5 py-2.5 font-medium text-black transition-colors hover:bg-teal-400"
            >
                Try again
            </button>
        </div>
    );
}
