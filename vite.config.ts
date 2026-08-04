/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Respeta el puerto que inyecte el entorno (previews con puerto asignado);
    // en local sigue siendo 5173.
    port: Number(process.env.PORT) || 5173,
    // Falla en vez de mudarse a otro puerto: si Vite se cambia en silencio, el
    // arranque parece colgado porque nada responde donde se le espera.
    strictPort: true,
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Solo lógica pura (servicios, auth, utilidades, helpers de modelo). Los
      // componentes React (.tsx) se prueban con herramientas de integración;
      // excluirlos evita falsos negativos. Los modelos solo-tipo se omiten.
      include: [
        'src/core/api/**/*.ts',
        'src/core/auth/**/*.ts',
        'src/core/models/rol.ts',
        'src/shared/**/*.ts',
      ],
      exclude: [],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
