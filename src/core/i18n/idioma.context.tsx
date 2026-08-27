import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ClaveTexto } from './catalogos/es';
import {
  idiomaInicial,
  traducir,
  type Idioma,
} from './idioma';
import * as fmt from './formato';

interface IdiomaContextValue {
  idioma: Idioma;
  setIdioma: (i: Idioma) => void;
  /** Traduce una clave. Solo acepta claves declaradas en `es.ts`. */
  t: (clave: ClaveTexto) => string;
  /** Formato regional ya atado al idioma activo: no hay que pasarlo cada vez. */
  fechaCorta: (valor: string | Date) => string;
  fechaHora: (valor: string | Date) => string;
  hora: (valor: string | Date) => string;
  numero: (valor: number, decimales?: number) => string;
  colones: (valor: number) => string;
}

const IdiomaContext = createContext<IdiomaContextValue | undefined>(undefined);

const STORAGE_KEY = 'optica_idioma';

/**
 * Proveedor de idioma (`DSO-53`), calcado del `ThemeProvider` que ya existía.
 *
 * Mantiene `<html lang>` sincronizado, que no es cosmético: de ahí sacan el
 * idioma los lectores de pantalla y los traductores automáticos del navegador.
 * Con `lang="es"` fijo, un lector de pantalla leía el inglés con fonética
 * española.
 */
export const IdiomaProvider = ({ children }: { children: ReactNode }) => {
  const [idioma, setIdiomaState] = useState<Idioma>(() =>
    idiomaInicial(
      localStorage.getItem(STORAGE_KEY),
      typeof navigator === 'undefined' ? undefined : navigator.language,
    ),
  );

  useEffect(() => {
    document.documentElement.lang = idioma;
    localStorage.setItem(STORAGE_KEY, idioma);
  }, [idioma]);

  const setIdioma = useCallback((i: Idioma) => setIdiomaState(i), []);

  const value = useMemo<IdiomaContextValue>(
    () => ({
      idioma,
      setIdioma,
      t: (clave) => traducir(idioma, clave),
      fechaCorta: (v) => fmt.fechaCorta(idioma, v),
      fechaHora: (v) => fmt.fechaHora(idioma, v),
      hora: (v) => fmt.hora(idioma, v),
      numero: (v, d) => fmt.numero(idioma, v, d),
      colones: (v) => fmt.colones(idioma, v),
    }),
    [idioma, setIdioma],
  );

  return <IdiomaContext.Provider value={value}>{children}</IdiomaContext.Provider>;
};

export const useIdioma = (): IdiomaContextValue => {
  const ctx = useContext(IdiomaContext);
  if (!ctx) {
    throw new Error('useIdioma debe usarse dentro de <IdiomaProvider>');
  }
  return ctx;
};
