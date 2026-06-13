interface PlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Contenido provisional de una página. La UI definitiva (design system premium)
 * se aborda en un sprint de interfaz posterior.
 */
export const Placeholder = ({ title, description }: PlaceholderProps) => (
  <section>
    <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
    {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
  </section>
);
