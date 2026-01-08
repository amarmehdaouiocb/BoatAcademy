export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-bold text-gray-900">Boat Academy</h1>
          <nav className="flex items-center gap-6">
            <a href="/dashboard" className="text-primary-600 font-medium">
              Dashboard
            </a>
            <a href="/dashboard/students" className="text-gray-600 hover:text-gray-900">
              Stagiaires
            </a>
            <a href="/dashboard/sessions" className="text-gray-600 hover:text-gray-900">
              Sessions
            </a>
            <a href="/dashboard/messages" className="text-gray-600 hover:text-gray-900">
              Messages
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl p-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">Bienvenue sur le back-office Boat Academy</p>

        {/* Stats grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Stagiaires actifs" value="0" change="+0%" />
          <StatCard title="Sessions a venir" value="0" change="+0%" />
          <StatCard title="Documents en attente" value="0" change="-0%" />
          <StatCard title="Messages non lus" value="0" change="+0%" />
        </div>

        {/* Quick actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
          <div className="mt-4 flex flex-wrap gap-4">
            <button className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
              Ajouter un stagiaire
            </button>
            <button className="rounded-lg bg-white px-4 py-2 text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50">
              Creer une session
            </button>
            <button className="rounded-lg bg-white px-4 py-2 text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50">
              Valider des documents
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) {
  const isPositive = change.startsWith('+');

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <p className={`mt-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {change} vs mois dernier
      </p>
    </div>
  );
}
