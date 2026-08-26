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
      // Dos grupos con exigencias distintas, a propósito:
      //
      //  1. Lógica pura (servicios, auth, utilidades, helpers de modelo) →
      //     100 %. No hay excusa: son funciones sin DOM.
      //  2. Componentes con pruebas de integración → umbral alto pero no
      //     absoluto. Llegar al 100 % en un .tsx obliga a forzar ramas de
      //     render que no aportan confianza, y el coste no se paga.
      //
      // ⚠️ Solo entran los componentes que **tienen su propio archivo de
      // pruebas**. El resto (PersonasPage, UsuariosPage, DashboardPage, páginas
      // públicas y layouts) queda fuera porque todavía no tiene tests: medirlo
      // hundiría el umbral sin decir nada nuevo. Cuando se les escriban
      // pruebas, se añaden aquí — es la deuda que registra
      // `06-estado-y-hallazgos.md` §5.
      include: [
        'src/core/api/**/*.ts',
        'src/core/auth/**/*.ts',
        'src/core/models/rol.ts',
        'src/core/models/laboratorio.ts',
        'src/core/models/inventario.ts',
        'src/core/models/venta.ts',
        'src/core/models/catalogo.ts',
        'src/core/models/especialista.ts',
        'src/core/models/portal.ts',
        'src/core/models/cita-whatsapp.ts',
        'src/core/models/metricas.ts',
        'src/shared/**/*.ts',
        'src/features/admin/AgendaPage.tsx',
        'src/features/admin/AgendaCitasPanel.tsx',
        'src/features/admin/ExpedientesPage.tsx',
        'src/features/admin/AuditoriaPage.tsx',
        'src/features/admin/MetricasPage.tsx',
        'src/features/admin/DiagramaMotilidad.tsx',
        'src/features/admin/InventarioPage.tsx',
        'src/features/admin/VentasPage.tsx',
        'src/features/public/CatalogoPage.tsx',
        'src/features/public/PerfilEspecialistaPage.tsx',
        'src/features/public/RegistroPage.tsx',
        'src/features/public/SeguimientoPedidosPage.tsx',
        'src/features/public/MisExpedientes.tsx',
        'src/features/public/AgendarCitaPage.tsx',
        'src/features/recepcion/LaboratorioPage.tsx',
      ],
      // Las propias pruebas no cuentan como código cubierto: se medían a sí
      // mismas al 100 % e inflaban el resultado.
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        'src/core/**/*.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/shared/**/*.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // Suelo medido sobre la cobertura real del 2026-08-20 (94 % stmts /
        // 86 % ramas / 74 % funcs), con margen para no romper el CI por un
        // refactor menor. Bajar de aquí sí debe hacer saltar la alarma.
        'src/features/**/*.tsx': {
          statements: 90,
          branches: 80,
          functions: 70,
          lines: 90,
        },
      },
    },
  },
});
