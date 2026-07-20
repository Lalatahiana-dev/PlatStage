import Link from 'next/link';
import Logo from '@/components/Logo';

interface Offer {
  id_offer: number;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: number;
  deadline?: string;
  created_at: string;
  company: {
    id_company: number;
    company_name: string;
    logo_url?: string;
    sector?: string;
  };
  categories: { category: { id_category: number; name: string } }[];
}

// Server component — fetch directement côté serveur
async function getOffers(): Promise<Offer[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">

      {/* Navbar */}
      <nav className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <Link href="/" className="flex items-center">
          <Logo size="md" />
        </Link>
        <div className="flex gap-3 items-center">
          <Link
            href="/login"
            className="px-4 py-2 text-gray-600 hover:text-indigo-600 transition text-sm font-medium"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            S&apos;inscrire
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
            Offres de stage
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
            {offers.length} offre{offers.length !== 1 ? 's' : ''} disponible{offers.length !== 1 ? 's' : ''}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Trouvez le stage qui correspond à votre profil et postulez dès maintenant.
          </p>
        </div>
      </div>

      {/* Liste offres */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="max-w-4xl mx-auto">
          {offers.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <i className="ti ti-briefcase-off text-5xl text-gray-200 block mb-4"></i>
              <p className="text-gray-400 text-sm">Aucune offre disponible pour le moment.</p>
              <Link href="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id_offer}
                  className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 hover:shadow-md hover:border-indigo-100 transition group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    {/* Infos */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Initiale company */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-base sm:text-lg flex-shrink-0">
                        {offer.company.company_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 font-medium">
                            {offer.company.company_name}
                          </span>
                          {offer.company.sector && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-medium">
                              {offer.company.sector}
                            </span>
                          )}
                        </div>

                        <h2 className="text-base font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                          {offer.title}
                        </h2>

                        <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                          {offer.description}
                        </p>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3">
                          {offer.location && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <i className="ti ti-map-pin text-xs"></i>
                              {offer.location}
                            </span>
                          )}
                          {offer.salary && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <i className="ti ti-coin text-xs"></i>
                              {offer.salary.toLocaleString('fr-FR')} Ar/mois
                            </span>
                          )}
                          {offer.deadline && (
                            <span className="flex items-center gap-1 text-xs text-rose-400">
                              <i className="ti ti-clock text-xs"></i>
                              Clôture :{' '}
                              {new Date(offer.deadline).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                          <span className="text-xs text-gray-300 hidden sm:inline">·</span>
                          <span className="text-xs text-gray-400">
                            {timeAgo(offer.created_at)}
                          </span>
                        </div>

                        {/* Categories */}
                        {offer.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {offer.categories.map((c) => (
                              <span
                                key={c.category.id_category}
                                className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-md"
                              >
                                {c.category.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bouton postuler → /register */}
                    <div className="flex-shrink-0 sm:self-center">
                      <Link
                        href="/register"
                        className="block sm:inline-block text-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 whitespace-nowrap"
                      >
                        Postuler →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CTA bas */}
      <div className="border-t border-gray-100 bg-indigo-50 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center">
        <p className="text-sm font-semibold text-gray-800 mb-1">Déjà inscrit ?</p>
        <p className="text-xs text-gray-400 mb-4">
          Connectez-vous pour postuler directement depuis votre espace étudiant.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
        >
          Se connecter
        </Link>
      </div>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <Logo size="sm" />
          <p className="text-xs text-gray-400">© 2026 e-Stage</p>
          <Link href="/" className="text-xs text-gray-400 hover:text-indigo-600 transition">
            Retour à l&apos;accueil
          </Link>
        </div>
      </footer>
    </div>
  );
}