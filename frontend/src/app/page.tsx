import Link from 'next/link';

// ── Mock data ho an'ny hero cards ──────────────────────────────────────────
const heroOffers = [
  {
    id: 1,
    company: 'Tech Madagascar',
    initial: 'T',
    color: 'bg-indigo-600',
    title: 'Développeur Full Stack',
    location: 'Antananarivo',
    type: 'Temps plein',
    tags: ['React', 'Node.js'],
  },
  {
    id: 2,
    company: 'Orange Madagascar',
    initial: 'O',
    color: 'bg-orange-500',
    title: 'Stage Marketing Digital',
    location: 'Antananarivo',
    type: '6 mois',
    tags: ['SEO', 'Analytics'],
  },
  {
    id: 3,
    company: 'Axian Group',
    initial: 'A',
    color: 'bg-purple-600',
    title: 'Data Analyst Junior',
    location: 'Tana / Remote',
    type: '3 mois',
    tags: ['Python', 'SQL'],
  },
];

const features = [
  {
    icon: 'ti-search',
    color: 'text-indigo-600 bg-indigo-50',
    title: 'Offres ciblées',
    desc: "Filtrez par secteur, durée et lieu. Trouvez ce qui correspond vraiment à votre profil.",
  },
  {
    icon: 'ti-send',
    color: 'text-emerald-600 bg-emerald-50',
    title: 'Candidature en un clic',
    desc: 'Votre CV, votre motivation — envoyés directement sans email ni impression.',
  },
  {
    icon: 'ti-chart-bar',
    color: 'text-violet-600 bg-violet-50',
    title: 'Suivi en temps réel',
    desc: "En attente, acceptée, entretien prévu — vous savez toujours où vous en êtes.",
  },
  {
    icon: 'ti-message',
    color: 'text-amber-600 bg-amber-50',
    title: 'Messagerie intégrée',
    desc: 'Échangez directement avec les recruteurs, sans quitter la plateforme.',
  },
  {
    icon: 'ti-bell',
    color: 'text-rose-600 bg-rose-50',
    title: 'Alertes instantanées',
    desc: "Soyez notifié dès qu'une entreprise répond à votre dossier.",
  },
  {
    icon: 'ti-shield-check',
    color: 'text-sky-600 bg-sky-50',
    title: 'Entreprises vérifiées',
    desc: 'Chaque entreprise partenaire est validée par notre équipe avant publication.',
  },
];

const steps = [
  { n: '01', title: 'Créez votre profil', desc: 'Inscrivez-vous en 2 minutes — étudiant ou entreprise.' },
  { n: '02', title: 'Trouvez ou publiez', desc: 'Parcourez les offres ou publiez la vôtre selon votre rôle.' },
  { n: '03', title: 'Échangez et confirmez', desc: 'Candidatez, discutez, planifiez vos entretiens directement.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="px-8 py-4 flex justify-between items-center border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-300">
            <span className="text-white font-black text-sm tracking-tight">P</span>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">PlatStage</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <Link href="/offers" className="hover:text-indigo-600 transition">Offres</Link>
          <Link href="#features" className="hover:text-indigo-600 transition">Fonctionnalités</Link>
          <Link href="#how" className="hover:text-indigo-600 transition">Comment ça marche</Link>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/login"
            className="px-4 py-2 text-gray-600 hover:text-indigo-600 transition text-sm font-medium"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold shadow-sm shadow-indigo-200"
          >
            S&apos;inscrire
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="flex-1 px-8 py-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            Plateforme #1 à Madagascar
          </div>

          <h1 className="text-5xl xl:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
            Le stage qui{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-indigo-600">lance</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-indigo-100 -z-0 rounded"></span>
            </span>{' '}
            votre carrière commence ici
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
            PlatStage connecte les étudiants malgaches avec les meilleures entreprises.
            Postulez, suivez, réussissez — tout en un seul endroit.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link
              href="/register"
              className="px-7 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm"
            >
              Commencer gratuitement →
            </Link>
            <Link
              href="/offres"
              className="px-7 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition text-sm"
            >
              Voir les offres
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            {[
              { val: '100+', label: 'Offres actives' },
              { val: '50+', label: 'Entreprises' },
              { val: '98%', label: 'Satisfaction' },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-4">
                {i > 0 && <div className="w-px h-8 bg-gray-200" />}
                <div>
                  <div className="text-2xl font-black text-gray-900">{s.val}</div>
                  <div className="text-xs text-gray-400 font-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Floating offer cards */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl" />
          <div className="relative p-8 flex flex-col gap-4">
            {heroOffers.map((offer, i) => (
              <div
                key={offer.id}
                className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                  i === 1 ? 'ml-6' : i === 2 ? 'ml-3' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${offer.color} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                    >
                      {offer.initial}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{offer.company}</p>
                      <p className="text-sm font-semibold text-gray-800">{offer.title}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-medium flex-shrink-0">
                    {offer.type}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {offer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-gray-400 flex items-center gap-1 ml-1">
                      <i className="ti ti-map-pin text-xs"></i>
                      {offer.location}
                    </span>
                  </div>
                  <button className="text-xs text-indigo-600 font-semibold hover:underline">
                    Postuler →
                  </button>
                </div>
              </div>
            ))}

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-white border border-gray-100 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <i className="ti ti-check text-emerald-600 text-sm"></i>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Candidature envoyée</p>
                <p className="text-xs text-gray-400">Stage Dev Full Stack · Tech Madagascar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-8 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
              Fonctionnalités
            </p>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
              Tout ce qu&apos;il vous faut
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Une plateforme pensée pour les étudiants et les entreprises malgaches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}
                >
                  <i className={`ti ${f.icon} text-xl`}></i>
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────────────────────────── */}
      <section id="how" className="px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
              Processus
            </p>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
              Démarrez en 3 étapes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.n} className="flex flex-col items-start">
                <div className="flex items-center gap-4 mb-4 w-full">
                  <span className="text-4xl font-black text-indigo-100 leading-none">
                    {s.n}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px bg-indigo-100 hidden md:block" />
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pour qui ─────────────────────────────────────────────────────── */}
      <section className="px-8 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Étudiants */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-sm transition">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <i className="ti ti-school text-2xl text-indigo-600"></i>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Étudiants
            </p>
            <h3 className="text-2xl font-black text-gray-900 mb-3">
              Trouvez votre stage idéal
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Créez votre profil, parcourez les offres et postulez en un clic.
              Suivez chaque étape de vos candidatures depuis votre tableau de bord.
            </p>
            <ul className="flex flex-col gap-2 mb-8">
              {['Recherche avancée par secteur', 'Suivi de candidatures', 'Messagerie avec les RH'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                  <i className="ti ti-circle-check text-indigo-400 flex-shrink-0"></i>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="inline-block px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
            >
              Créer un compte étudiant →
            </Link>
          </div>

          {/* Entreprises */}
          <div className="bg-indigo-600 rounded-3xl p-8 hover:bg-indigo-700 transition">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <i className="ti ti-building text-2xl text-white"></i>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-2">
              Entreprises
            </p>
            <h3 className="text-2xl font-black text-white mb-3">
              Recrutez les meilleurs talents
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed mb-6">
              Publiez vos offres, recevez des candidatures qualifiées et gérez vos entretiens
              directement depuis votre espace entreprise.
            </p>
            <ul className="flex flex-col gap-2 mb-8">
              {['Publication d\'offres illimitée', 'Gestion des candidatures', 'Planification d\'entretiens'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-indigo-100">
                  <i className="ti ti-circle-check text-white/60 flex-shrink-0"></i>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="inline-block px-6 py-3 bg-white text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition"
            >
              Créer un compte entreprise →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-8 py-24 bg-gray-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            Prêt à commencer ?
          </p>
          <h2 className="text-4xl font-black mb-5 leading-tight">
            Votre prochain stage est sur PlatStage
          </h2>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Rejoignez des milliers d&apos;étudiants et d&apos;entreprises qui font confiance à PlatStage.
            Inscription gratuite, en 2 minutes.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-900 text-sm"
            >
              Créer un compte gratuit
            </Link>
            <Link
              href="/offers"
              className="px-8 py-3.5 border border-gray-700 text-gray-300 font-semibold rounded-xl hover:border-gray-500 hover:text-white transition text-sm"
            >
              Voir les offres
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="px-8 py-8 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">P</span>
            </div>
            <span className="text-sm font-bold text-gray-700 tracking-tight">PlatStage</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 PlatStage — Tous droits réservés
          </p>
          <div className="flex gap-5 text-sm text-gray-400">
            <Link href="/offers" className="hover:text-indigo-600 transition">Offres</Link>
            <Link href="/login" className="hover:text-indigo-600 transition">Connexion</Link>
            <Link href="/register" className="hover:text-indigo-600 transition">Inscription</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}