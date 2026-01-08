import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Boat Academy</h1>
        <p className="mt-4 text-lg text-gray-600">Back-office de gestion</p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition hover:bg-primary-700"
          >
            Se connecter
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Version MVP - Phase 1</p>
        </div>
      </div>
    </div>
  );
}
