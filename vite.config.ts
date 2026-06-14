/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Solo lógica pura (servicios, auth, utilidades). Los componentes React
      // son probados con herramientas de integración; excluirlos evita falsos negativos.
      // core/models solo contiene interfaces TS y const de tipos: sin código ejecutable.
      include: ['src/core/api/**/*.ts', 'src/core/auth/**/*.ts', 'src/shared/**/*.ts'],
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
