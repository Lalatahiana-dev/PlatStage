import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">PlatStage</h1>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Inscription
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <h2 className="text-5xl font-bold text-gray-800 mb-6">
          Trouvez votre stage <br />
          <span className="text-indigo-600">idéal à Madagascar</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          PlatStage connecte les étudiants avec les meilleures entreprises
          pour des opportunités de stage enrichissantes.
        </p>
        <div className="flex gap-4">
          <Link
            href="/register"
            className="px-8 py-4 bg-indigo-600 text-white text-lg rounded-xl hover:bg-indigo-700 transition font-semibold"
          >
            Commencer maintenant
          </Link>
          <Link
            href="/offers"
            className="px-8 py-4 border-2 border-indigo-600 text-indigo-600 text-lg rounded-xl hover:bg-indigo-50 transition font-semibold"
          >
            Voir les offres
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500">
        © 2026 PlatStage — Tous droits réservés
      </footer>
    </div>
  );
}