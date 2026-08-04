import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Key,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useAuth } from '../../core/auth/auth.context';
import { useTheme } from '../../core/theme/theme.context';
import { homePathForRole } from '../../core/models/rol';
import { mensajeDeError } from '../../shared/error';
import { MarcaOptica } from '../../shared/MarcaOptica';

const SLIDES = [
  {
    title: 'Ray-Ban & Oakley Elite',
    subtitle: 'Nuestra herencia en lentes icónicos',
    desc: 'Fusionamos la sofisticación clásica con el rendimiento deportivo de nivel mundial en monturas y materiales patentados.',
    image:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Varilux® & Eyezen™',
    subtitle: 'Ingeniería en óptica de alta precisión',
    desc: 'Lentes oftálmicos de vanguardia que garantizan transiciones visuales fluidas, descanso digital y protección avanzada.',
    image:
      'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'OneSight Foundation',
    subtitle: 'Un compromiso con la visión global',
    desc: 'Ayudamos a erradicar los problemas de visión no resueltos, equipando a comunidades con atención de calidad.',
    image:
      'https://images.unsplash.com/photo-1516062423079-7ca13cca775f?auto=format&fit=crop&q=80&w=800',
  },
];

/**
 * Accesos de demostración del RBAC. Solo existen en desarrollo: la condición
 * sobre `import.meta.env.DEV` la resuelve Vite al compilar, así que estas
 * credenciales **no llegan al bundle de producción**.
 */
const DEMO = import.meta.env.DEV
  ? [
      { label: 'Administrador del sistema', email: 'admin@optica.local', password: 'admin1234' },
      { label: 'Dr. Semeraro (Doctor)', email: 'doctor@optica.local', password: 'doctor1234' },
      { label: 'Recepción (front desk)', email: 'recepcion@optica.local', password: 'recepcion1234' },
    ]
  : [];

export const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const sesion = await login({ email, password });
      // Respeta la ruta de origen; si no hay, envía al inicio según el rol.
      navigate(from ?? homePathForRole(sesion?.rol), { replace: true });
    } catch (e) {
      setError(mensajeDeError(e, 'Credenciales inválidas'));
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (d: (typeof DEMO)[number]) => {
    setEmail(d.email);
    setPassword(d.password);
    setError('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-lux-cream font-sans text-lux-blue transition-luxe dark:bg-[#0a0a0a] dark:text-zinc-100">
      {/* Header */}
      <header className="transition-luxe sticky top-0 z-30 border-b border-lux-blue/10 bg-[#fcfbf9]/80 blur-backdrop dark:border-white/10 dark:bg-[#0a0a0a]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/">
            <MarcaOptica tamano="md" />
          </Link>
          <div className="flex items-center gap-5">
            <div className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest opacity-60 sm:flex">
              <Globe className="h-3.5 w-3.5" /> ES <span className="opacity-30">/</span> EN
            </div>
            <button
              onClick={toggleTheme}
              title="Cambiar modo visual"
              className="transition-luxe cursor-pointer rounded-full border border-neutral-200 bg-neutral-100/50 p-2 text-neutral-800 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-yellow-400 dark:hover:bg-white/15"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Sun className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cuerpo dual-pane */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-stretch gap-10 px-6 py-12 lg:flex-row">
        {/* Panel izquierdo cinematográfico */}
        <section className="relative hidden flex-1 flex-col justify-between overflow-hidden border border-neutral-200/60 bg-white p-12 dark:border-white/10 dark:bg-[#0d0d0d] lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-lux-gold/5 via-transparent to-lux-blue/5" />
          <div className="relative z-10">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-lux-gold">
              Innovación y estilo exclusivo
            </span>
            <div className="mt-3 h-px w-12 bg-lux-gold" />
          </div>

          <div className="relative z-10 my-auto flex min-h-[340px] flex-col justify-center py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.52, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={SLIDES[slide].image}
                    alt={SLIDES[slide].title}
                    referrerPolicy="no-referrer"
                    className="transition-luxe h-full w-full object-cover opacity-90 grayscale hover:scale-105 hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div>
                  <span className="block font-mono text-[11px] uppercase tracking-widest text-neutral-400">
                    {SLIDES[slide].subtitle}
                  </span>
                  <h2 className="mt-1 font-serif text-3xl italic tracking-tight text-lux-blue dark:text-white">
                    {SLIDES[slide].title}
                  </h2>
                  <p className="mt-3 max-w-md text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {SLIDES[slide].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center gap-2">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSlide(idx)}
                  className={[
                    'transition-luxe h-1.5 cursor-pointer',
                    slide === idx
                      ? 'w-8 bg-lux-gold'
                      : 'w-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-white/20 dark:hover:bg-white/40',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
            <span className="text-neutral-400">
              Óptica Dr. Luigi Semeraro · Pérez Zeledón
            </span>
            <Link
              to="/"
              className="group flex items-center gap-1 text-lux-gold hover:underline"
            >
              Ir al sitio de la óptica
              <ArrowRight className="transition-luxe h-3 w-3 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* Panel derecho: formulario */}
        <section className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative w-full max-w-md border border-lux-blue/10 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#0f0f10] md:p-10"
          >
            <div className="mb-8">
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-lux-gold">
                Portal interno autenticado
              </span>
              <h1 className="font-serif text-3xl italic leading-none tracking-tight">
                Óptica Dr. Luigi Semeraro
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Acceda con credenciales clínicas para gestionar fichas de pacientes,
                consultas y bodegas.
              </p>
            </div>

            {error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 border border-red-900/30 bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </motion.div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  Correo corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" strokeWidth={1} />
                  <input
                    type="email"
                    name="email"
                    placeholder="admin@optica.local"
                    value={email}
                    required
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="transition-luxe w-full border border-neutral-200 bg-[#fdfdfc] py-3 pl-10 pr-4 text-xs text-neutral-900 placeholder-neutral-400 focus:border-lux-blue focus:outline-none focus:ring-1 focus:ring-lux-gold dark:border-white/10 dark:bg-[#18181a] dark:text-white dark:placeholder-neutral-600 dark:focus:border-lux-gold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  Contraseña de acceso
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" strokeWidth={1} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Contraseña del sistema"
                    value={password}
                    required
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="transition-luxe w-full border border-neutral-200 bg-[#fdfdfc] py-3 pl-10 pr-10 text-xs text-neutral-900 placeholder-neutral-400 focus:border-lux-blue focus:outline-none focus:ring-1 focus:ring-lux-gold dark:border-white/10 dark:bg-[#18181a] dark:text-white dark:placeholder-neutral-600 dark:focus:border-lux-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="transition-luxe absolute right-3 top-3 text-gray-400 hover:text-lux-gold"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.2} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.2} />
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={loading ? {} : { scale: 0.99 }}
                className="transition-luxe w-full cursor-pointer bg-lux-blue py-3.5 text-xs font-semibold uppercase tracking-wider2 text-white shadow-md hover:bg-lux-gold disabled:opacity-60 dark:bg-lux-gold dark:text-black dark:hover:bg-white"
              >
                {loading ? 'Autenticando…' : 'Autenticar credenciales'}
              </motion.button>
            </form>

            {DEMO.length > 0 ? (
            <div className="mt-8 border-t border-neutral-200/20 pt-6">
              <span className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-lux-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Acceso directo (demo RBAC)
              </span>
              <div className="space-y-2">
                {DEMO.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => quickFill(d)}
                    className="transition-luxe group flex w-full items-center justify-between border border-neutral-200 bg-neutral-50 p-3 text-left hover:border-lux-blue hover:bg-white dark:border-white/5 dark:bg-[#141415] dark:hover:border-lux-gold/60 dark:hover:bg-[#1a1a1c]"
                  >
                    <div>
                      <span className="transition-luxe block text-xs font-semibold text-neutral-800 group-hover:text-lux-gold dark:text-white">
                        {d.label}
                      </span>
                      <span className="mt-0.5 block font-mono text-[9px] opacity-50">
                        {d.email}
                      </span>
                    </div>
                    <Key className="transition-luxe h-3.5 w-3.5 text-lux-gold opacity-40 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
            ) : null}
          </motion.div>
        </section>
      </main>

      <footer className="transition-luxe w-full border-t border-neutral-200/50 bg-[#faf9f6] py-6 text-center font-sans text-[9px] uppercase tracking-[0.2em] text-neutral-500 dark:border-white/5 dark:bg-[#080809]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
          <span>
            Óptica Dr. Luigi Semeraro © {new Date().getFullYear()}
          </span>
          <span className="font-semibold text-lux-blue dark:text-lux-gold">
            Pérez Zeledón, Costa Rica · Tel. 7085-3353
          </span>
        </div>
      </footer>
    </div>
  );
};
