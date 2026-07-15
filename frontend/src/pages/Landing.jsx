import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-soft hidden md:flex justify-between items-center px-margin-desktop h-20">
        <div className="flex items-center gap-stack-lg">
          <span className="text-display-lg font-bold text-primary tracking-tighter">NivasAI</span>
          <div className="hidden lg:flex items-center gap-stack-md ml-stack-lg">
            <Link to="/listings" className="text-title-md text-on-surface-variant hover:text-primary transition-colors px-3 py-2 rounded-lg">Browse</Link>
          </div>
        </div>
        <div className="flex items-center gap-stack-sm border-l border-outline-variant/50 pl-gutter">
          <Link to="/login" className="text-body-md font-medium text-on-surface hover:text-primary px-4 py-2 transition-colors">Sign In</Link>
          <Link to="/register" className="text-title-md text-on-primary bg-primary hover:bg-primary/90 active:scale-95 transition-all px-6 py-2.5 rounded-lg">Get Started</Link>
        </div>
      </nav>

      {/* Mobile header */}
      <nav className="md:hidden fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 h-16 flex items-center justify-between px-margin-mobile">
        <span className="text-headline-lg-mobile font-bold text-primary tracking-tighter">NivasAI</span>
        <Link to="/login" className="text-body-sm font-semibold text-primary">Sign In</Link>
      </nav>

      {/* Hero */}
      <main className="flex-grow pt-16 md:pt-20">
        <section className="relative min-h-[calc(100vh-80px)] flex items-center overflow-hidden px-margin-mobile md:px-margin-desktop py-16">
          {/* Background glow */}
          <div className="absolute right-0 top-1/4 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute left-0 bottom-1/4 w-1/3 h-1/3 bg-tertiary-container/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-gutter relative z-10">
            <div className="lg:col-span-7 flex flex-col justify-center gap-stack-lg pr-0 lg:pr-12">
              {/* AI badge */}
              <div className="inline-flex items-center gap-2 bg-secondary-container/50 text-primary font-mono text-label-caps px-3 py-1 rounded-full w-max border border-primary/10">
                <span className="material-symbols-outlined text-[16px] filled">auto_awesome</span>
                AI-POWERED MATCHING ENGINE
              </div>

              <h1 className="text-[40px] md:text-[56px] lg:text-[64px] leading-[1.1] tracking-[-0.03em] font-extrabold text-on-surface">
                Find your perfect room.{' '}
                <span className="text-gradient-primary">With zero friction.</span>
              </h1>

              <p className="text-title-md text-on-surface-variant font-normal max-w-2xl">
                NivasAI uses AI to instantly match tenants with rooms based on budget, location, and lifestyle. Owners list rooms, tenants find their best match — ranked by compatibility score.
              </p>

              <div className="flex flex-col sm:flex-row gap-stack-md pt-stack-sm">
                <Link to="/register" className="btn-primary flex items-center justify-center gap-2 py-4 text-title-md">
                  Start AI Matching
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link to="/listings" className="btn-secondary flex items-center justify-center gap-2 py-4 text-title-md">
                  <span className="material-symbols-outlined">search</span>
                  Browse Rooms
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-stack-md pt-stack-lg mt-stack-md border-t border-outline-variant/30 w-max">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-surface bg-secondary-container" />
                  ))}
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  Join <strong className="text-on-surface">1,000+</strong> tenants and owners.
                </p>
              </div>
            </div>

            {/* Hero card */}
            <div className="lg:col-span-5 hidden lg:flex relative">
              <div className="w-full relative h-[560px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/15 blur-[100px] rounded-full" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-11/12 bg-surface-container-lowest rounded-3xl shadow-lift border border-outline-variant/20 overflow-hidden z-20 hover:-translate-y-2 transition-transform duration-500">
                  <div className="h-56 bg-gradient-to-br from-secondary-container to-primary-fixed relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[80px] text-primary/30">apartment</span>
                    </div>
                    <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-soft border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-[16px] filled">auto_awesome</span>
                      <span className="text-ai-stat text-primary">94% Match</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-title-md text-on-surface">Cozy Studio — Koramangala</h3>
                      <span className="text-title-md text-on-surface">₹18,000</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mb-4">Bangalore • STUDIO • Furnished</p>
                    <div className="space-y-3 pt-4 border-t border-outline-variant/30">
                      <div className="flex justify-between items-center">
                        <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                          Budget Match
                        </span>
                        <span className="text-ai-stat text-primary">High Fit</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                          Location
                        </span>
                        <span className="text-ai-stat text-primary">Perfect</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-margin-mobile md:px-margin-desktop py-16 bg-surface-container-lowest border-t border-outline-variant/20">
          <div className="max-w-container-max mx-auto">
            <h2 className="text-headline-lg font-semibold text-center text-on-surface mb-12">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {[
                { icon: 'person_add', title: 'Create Profile', desc: 'Tenants set preferred location, budget range, and move-in date.' },
                { icon: 'auto_awesome', title: 'AI Scores Match', desc: 'Gemini AI computes compatibility scores for every room listing automatically.' },
                { icon: 'forum', title: 'Chat & Connect', desc: 'Express interest, get accepted, and chat directly with the owner in real time.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="card p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px] text-primary">{icon}</span>
                  </div>
                  <h3 className="text-title-md font-semibold text-on-surface">{title}</h3>
                  <p className="text-body-sm text-on-surface-variant">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-margin-mobile md:px-margin-desktop py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-headline-lg font-semibold text-on-surface mb-4">Ready to find your match?</h2>
            <p className="text-body-md text-on-surface-variant mb-8">Join as a tenant to find rooms, or as an owner to list yours.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" state={{ role: 'TENANT' }} className="btn-primary text-title-md py-3 px-8">
                I'm a Tenant
              </Link>
              <Link to="/register" state={{ role: 'OWNER' }} className="btn-secondary text-title-md py-3 px-8">
                I'm an Owner
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/30 w-full">
        <div className="max-w-container-max mx-auto px-margin-desktop py-stack-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-title-md font-black text-on-surface">NivasAI</span>
          <p className="text-body-sm text-on-surface-variant">© 2024 NivasAI. AI-Powered Rent & Flatmate Finder.</p>
        </div>
      </footer>
    </div>
  )
}
