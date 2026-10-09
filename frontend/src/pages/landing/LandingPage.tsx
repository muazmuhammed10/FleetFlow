import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Shield, Zap, Users, BarChart2,
  Star, ChevronDown, Menu, X, Car,
} from 'lucide-react';

// ─── Simple hook: element in viewport ───────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Fade-in wrapper ─────────────────────────────────────────────────────────
function FadeIn({
  children, delay = 0, direction = 'up', className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  className?: string;
}) {
  const { ref, inView } = useInView();
  const transforms: Record<string, string> = {
    up: 'translateY(40px)',
    left: 'translateX(-40px)',
    right: 'translateX(40px)',
    none: 'none',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : transforms[direction],
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const features = [
  {
    icon: <Car size={22} />,
    title: 'Smart Fleet Management',
    desc: 'Track every vehicle in real time — availability, location, maintenance status and more from one dashboard.',
    color: 'bg-blue-500',
  },
  {
    icon: <Shield size={22} />,
    title: 'Secure & Compliant',
    desc: 'Role-based access, audit logs, encrypted credentials and full data security built into every layer.',
    color: 'bg-indigo-500',
  },
  {
    icon: <Zap size={22} />,
    title: 'Instant Bookings',
    desc: 'Customers book vehicles in seconds. Staff approve, assign and manage the full rental lifecycle.',
    color: 'bg-violet-500',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Powerful Analytics',
    desc: 'Revenue charts, utilisation rates, maintenance costs and booking trends — all in real time.',
    color: 'bg-purple-500',
  },
  {
    icon: <Users size={22} />,
    title: 'Multi-Role Access',
    desc: 'Four distinct roles — Admin, Fleet Manager, Rental Agent and Customer — each with the right tools.',
    color: 'bg-pink-500',
  },
  {
    icon: <Star size={22} />,
    title: 'Full Rental Lifecycle',
    desc: 'From booking to pickup inspection, payment, return and invoice — every step is covered.',
    color: 'bg-rose-500',
  },
];

const vehicles = [
  { name: 'BMW 5 Series', type: 'Luxury', price: '$150', img: '/images/car-luxury.jpg' },
  { name: 'Ford Explorer', type: 'SUV',    price: '$85',  img: '/images/car-suv.jpg' },
  { name: 'Toyota Corolla', type: 'Economy', price: '$45', img: '/images/car-sedan.jpg' },
  { name: 'Toyota RAV4',   type: 'Hybrid SUV', price: '$75', img: '/images/car-sport.jpg' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-md shadow-black/5 border-b border-gray-100' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 rounded-xl p-1.5 shadow-md shadow-blue-600/30">
              <Car size={18} className="text-white" />
            </div>
            <span className={`font-bold text-lg tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
              FleetFlow
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {['features', 'fleet', 'stats'].map((s) => (
              <button
                key={s}
                onClick={() => scrollToSection(s)}
                className={`text-sm font-medium capitalize transition-colors hover:text-blue-400 ${
                  scrolled ? 'text-gray-600' : 'text-white/80'
                }`}
              >
                {s === 'stats' ? 'About' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-sm font-semibold px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all active:scale-95"
            >
              Get started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} className={scrolled ? 'text-gray-700' : 'text-white'} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-3 shadow-xl">
            {['features', 'fleet', 'stats'].map((s) => (
              <button key={s} onClick={() => scrollToSection(s)}
                className="block w-full text-left text-sm font-medium text-gray-700 py-2 capitalize">
                {s === 'stats' ? 'About' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/login')}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl">
                Sign in
              </button>
              <button onClick={() => navigate('/register')}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-600/25">
                Get started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Full-bleed background photo */}
        <img
          src="/images/hero-car.jpg"
          alt="Fleet"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Animated particles / dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                width: Math.random() * 6 + 2,
                height: Math.random() * 6 + 2,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20
                rounded-full px-4 py-2 mb-6"
              style={{ animation: 'fadeSlideDown 0.8s ease both' }}
            >
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/90 text-sm font-medium">Fleet Management Platform</span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6"
              style={{ animation: 'fadeSlideUp 0.9s ease 0.1s both' }}
            >
              Drive your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                fleet forward.
              </span>
            </h1>

            {/* Sub */}
            <p
              className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl"
              style={{ animation: 'fadeSlideUp 0.9s ease 0.2s both' }}
            >
              A complete vehicle rental and fleet operations platform. Manage bookings, inspections, payments and your entire fleet — all in one place.
            </p>

            {/* CTA group */}
            <div
              className="flex flex-col sm:flex-row gap-4"
              style={{ animation: 'fadeSlideUp 0.9s ease 0.3s both' }}
            >
              <button
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500
                  text-white font-bold rounded-2xl shadow-2xl shadow-blue-600/40 hover:shadow-blue-500/50
                  transition-all duration-200 active:scale-95 text-base"
              >
                Get started free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20
                  backdrop-blur-sm border border-white/25 text-white font-semibold rounded-2xl
                  transition-all duration-200 active:scale-95 text-base"
              >
                Sign in
              </button>
            </div>

            {/* Social proof */}
            <div
              className="flex items-center gap-3 mt-10"
              style={{ animation: 'fadeSlideUp 0.9s ease 0.4s both' }}
            >
              <div className="flex -space-x-2">
                {['bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-indigo-500'].map((c, i) => (
                  <div key={i} className={`h-8 w-8 rounded-full ${c} border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-yellow-400 text-xs">{'★★★★★'}</div>
                <p className="text-gray-400 text-xs mt-0.5">Trusted by fleet operators worldwide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer"
          onClick={() => scrollToSection('features')}
          style={{ animation: 'bounce 2s infinite' }}
        >
          <span className="text-white/50 text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown size={20} className="text-white/50" />
        </div>
      </section>

      {/* ══════════════ STATS BAND ══════════════ */}
      <section id="stats" className="bg-gray-900 py-14">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 500, suffix: '+', label: 'Vehicles Managed' },
              { value: 12000, suffix: '+', label: 'Bookings Processed' },
              { value: 99, suffix: '.9%', label: 'Uptime' },
              { value: 4, suffix: '', label: 'Access Roles' },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div>
                  <p className="text-4xl font-bold text-white">
                    <Counter to={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-gray-400 text-sm mt-1">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <FadeIn className="text-center mb-16">
            <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">Features</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Everything you need
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From booking to billing — FleetFlow covers every step of the rental and fleet management lifecycle.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.08} direction="up">
                <div className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-100
                  hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 hover:-translate-y-1 cursor-default">
                  <div className={`${f.color} inline-flex items-center justify-center h-11 w-11 rounded-xl text-white mb-4 shadow-md`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FLEET SHOWCASE ══════════════ */}
      <section id="fleet" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <FadeIn className="text-center mb-14">
            <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">Our Fleet</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-3 mb-4 tracking-tight">
              Every vehicle, every need
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              From economy to luxury — browse and book the perfect vehicle for any journey.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {vehicles.map((v, i) => (
              <FadeIn key={i} delay={i * 0.1} direction="up">
                <div
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100
                    shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-400 cursor-pointer"
                  onClick={() => navigate('/register')}
                >
                  <div className="relative h-44 overflow-hidden bg-gray-100">
                    <img
                      src={v.img}
                      alt={v.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full px-2.5 py-1 text-xs font-bold text-gray-700">
                      {v.type}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-blue-600 rounded-full px-3 py-1.5 text-white text-xs font-bold shadow-lg">
                      {v.price}/day
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900">{v.name}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/register'); }}
                      className="mt-3 w-full py-2 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white
                        text-gray-600 text-xs font-semibold rounded-xl transition-all duration-300"
                    >
                      Book this vehicle
                    </button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-10">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-blue-600
                border-2 border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600
                transition-all duration-200"
            >
              View full fleet <ArrowRight size={15} />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <FadeIn className="text-center mb-16">
            <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">Process</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-3 tracking-tight">
              How it works
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

            {[
              { step: '01', title: 'Create account', desc: 'Sign up in seconds. No credit card required to get started.' },
              { step: '02', title: 'Browse & book', desc: 'Choose from our fleet, set your dates and submit a booking request instantly.' },
              { step: '03', title: 'Pick up & drive', desc: 'Get approved, collect the keys and enjoy your rental. Return and done.' },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.15} direction="up">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white text-xl font-bold mb-5 shadow-xl shadow-blue-600/25">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <section className="py-24 relative overflow-hidden">
        <img src="/images/car-sport.jpg" alt="CTA background" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/80 to-indigo-900/90" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <FadeIn>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Ready to get started?
            </h2>
            <p className="text-blue-200 text-lg mb-10">
              Join FleetFlow today and take control of your vehicle rental operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700
                  font-bold rounded-2xl hover:bg-blue-50 shadow-2xl transition-all duration-200 active:scale-95 text-base"
              >
                Create free account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center px-8 py-4 border-2 border-white/30
                  hover:border-white/60 text-white font-semibold rounded-2xl transition-all duration-200 active:scale-95 text-base"
              >
                Sign in
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 rounded-lg p-1.5"><Car size={16} className="text-white" /></div>
            <span className="text-white font-bold">FleetFlow</span>
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} FleetFlow. All rights reserved.</p>
          <div className="flex items-center gap-5 text-gray-500 text-sm">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Sign in</button>
            <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Register</button>
          </div>
        </div>
      </footer>

      {/* ── Global animation keyframes injected via style tag ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}
