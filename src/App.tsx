import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './core/auth/auth.context';
import { IdiomaProvider } from './core/i18n/idioma.context';
import { ThemeProvider } from './core/theme/theme.context';
import { router } from './router';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        {/* El idioma envuelve a la sesión: la pantalla de login ya necesita
          traducirse, y ahí todavía no hay usuario. */}
        <IdiomaProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </IdiomaProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
