import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge, Kicker, LuxCard, SectionHeader, fadeUpItem, stagger } from '../../shared/ui';

interface Modelo {
  nombre: string;
  marca: string;
  precio: number;
  img: string;
  desc: string;
}

const MODELOS: Modelo[] = [
  {
    nombre: 'Clubmaster Titanium Gold',
    marca: 'Ray-Ban®',
    precio: 85000,
    img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=600&auto=format&fit=crop',
    desc: 'Titanio ultraliviano con acentos en chapa de oro 18k. Un clásico italiano renovado.',
  },
  {
    nombre: 'Pitch Matte Black',
    marca: 'Oakley®',
    precio: 95000,
    img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop',
    desc: 'Aro deportivo de alto rendimiento en O-Matter negro mate, resistente y ligero.',
  },
  {
    nombre: 'Cat-Eye Rose Quartz',
    marca: 'Persol®',
    precio: 110000,
    img: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=600&auto=format&fit=crop',
    desc: 'Silueta ojo de gato en acetato translúcido cuarzo rosa, biselada a mano.',
  },
  {
    nombre: 'Aviator Minimalist Carbon',
    marca: 'Semeraro Titanium',
    precio: 125000,
    img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop',
    desc: 'Aviador ultradelgado en fibra de carbono aeroespacial y titanio.',
  },
  {
    nombre: 'Hexagon Slate Grey',
    marca: 'Semeraro Studio',
    precio: 78000,
    img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?q=80&w=600&auto=format&fit=crop',
    desc: 'Geometría hexagonal en gris pizarra, contemporánea y versátil.',
  },
  {
    nombre: 'Round Heritage Tortoise',
    marca: 'Ray-Ban®',
    precio: 89000,
    img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=600&auto=format&fit=crop',
    desc: 'Montura redonda en acetato carey, inspiración vintage de alta gama.',
  },
];

const colones = (n: number) =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);

export const CatalogoPage = () => (
  <section className="space-y-10">
    <SectionHeader
      kicker="Vitrina de modelos"
      title="Colección Óptica Dr. Luigi Semeraro"
      description="Selección curada de monturas y lentes de las casas más prestigiosas del mundo. Precios de referencia; consulte disponibilidad y adaptación con el especialista."
    />

    <motion.div
      variants={stagger}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
    >
      {MODELOS.map((m) => (
        <motion.div key={m.nombre} variants={fadeUpItem}>
          <LuxCard hover className="group flex h-full flex-col overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={m.img}
                alt={m.nombre}
                referrerPolicy="no-referrer"
                className="transition-luxe h-full w-full object-cover group-hover:scale-105"
              />
              <div className="absolute left-3 top-3">
                <Badge tone="tinta">{m.marca}</Badge>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-medium text-lux-blue dark:text-white">
                  {m.nombre}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {m.desc}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-white/5">
                <span className="font-mono text-sm font-bold text-lux-tinta">
                  {colones(m.precio)}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                  Ref.
                </span>
              </div>
            </div>
          </LuxCard>
        </motion.div>
      ))}
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <LuxCard className="flex flex-col items-center justify-between gap-4 bg-lux-gray p-8 text-center dark:bg-[#0e0e0e] sm:flex-row sm:text-left">
        <div className="space-y-1">
          <Kicker>¿Ya tiene su receta?</Kicker>
          <p className="font-serif text-xl font-light text-lux-blue dark:text-white">
            Valide su fórmula y elija su montura ideal
          </p>
        </div>
        <Link
          to="/portal"
          className="transition-luxe inline-flex items-center gap-2 bg-lux-blue px-6 py-3 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-lux-tinta dark:bg-lux-tinta-claro dark:text-black dark:hover:bg-white"
        >
          Ir a mi receta <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </LuxCard>
    </motion.div>
  </section>
);
