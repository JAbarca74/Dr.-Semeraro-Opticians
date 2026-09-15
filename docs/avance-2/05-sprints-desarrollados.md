# 5. Sprints desarrollados

**Proyecto:** Sistema de Gestión para la Óptica Dr. Semeraro · **Curso:**
Ingeniería de Sistemas II, UNA, Grupo 84 · **Corte de la evidencia:** 15/09/2026

---

## 5.1 Cómo se debían desarrollar los sprints

> **Esta sección describe lo que la documentación del proyecto comprometió, no lo
> que se ejecutó.** La ejecución real está en §5.2 y la comparación de ambas en
> §5.3.

**Marco comprometido:** **Scrum** adaptado con **Kanban**, sprints de 1 a 4
semanas, con Sprint Planning, Weekly Standup (martes 7:00 p. m.), Sprint Review y
Sprint Retrospective; artefactos Product Backlog, Sprint Backlog e Incremento. El
ciclo de vida exige una fase de **pruebas de aceptación de usuario** separada de
las pruebas técnicas.

El cap. 2 declaró **Trello** como herramienta de tablero, con tres columnas
(Pendientes → En Progreso → Completadas). ⚠️ **El proyecto no se ejecutó en
Trello: se ejecutó en Jira Cloud**, por ser la herramienta estándar de la
industria y la única de las dos capaz de representar el flujo comprometido. El
razonamiento completo está en §5.2 y la desviación queda registrada en §5.6.

**Cronograma comprometido — sprints 1 a 11 de 17:**

| Sprint | Nombre | Fechas | Objetivo |
| --- | --- | --- | --- |
| 1 | Inicio del proyecto | 02/03 – 22/03/26 | Alcance, visión, riesgos, factibilidad |
| 2 | Análisis y requerimientos | 23/03 – 12/04/26 | SRS + CU-01 a CU-19 |
| 3 | Diseño, arquitectura y entorno | 13/04 – 03/05/26 | Arquitectura, WBS, repositorios |
| 4 | Base de datos | 04/05 – 17/05/26 | Modelo relacional + carga inicial |
| 5 | Autenticación, usuarios y roles | 18/05 – 31/05/26 | **CU-01**, **CU-18**, **CU-08** |
| 6 | Expediente clínico y recetas | 01/06 – 15/06/26 | **CU-02**, **CU-16** |
| 7 | Citas, disponibilidad y WhatsApp | 03/08 – 16/08/26 | **CU-05**, **CU-06** |
| 8 | Inventario, ventas y laboratorio | 17/08 – 30/08/26 | **CU-03**, **CU-04**, **CU-07** |
| 9 | Portal: acceso y catálogo | 31/08 – 13/09/26 | **CU-09**, **CU-10**, **CU-13** |
| 10 | Portal: citas, expediente y pedidos | 14/09 – 27/09/26 | **CU-11**, **CU-12**, **CU-14** |
| 11 | Inteligencia y métricas | 28/09 – 23/10/26 | **CU-15**, **CU-17**, **CU-19** |

> Los sprints 12 a 17 (despliegue, hypercare, mantenimiento y cierre) quedan
> fuera del alcance de este avance.

---

## 5.2 Cómo se desarrollaron: el tablero en Jira

El trabajo se ejecutó en **Jira Cloud**, proyecto **`DSO`**, con **9 épicas**
(`DSO-1`…`DSO-9`) que representan los 7 módulos de la WBS, y **39 tareas**.

```
Tareas por hacer → En curso → En revisión → IN UAT → Finalizada
```

### Por qué se cambió Trello por Jira

**1 · Razón profesional — es la herramienta del ámbito real.** Jira es el
estándar de facto para la gestión ágil en la industria del software: es lo que
usan los equipos de desarrollo en las empresas donde el grupo va a trabajar al
graduarse. Aprender el marco Scrum sobre la herramienta que el mercado
efectivamente usa convierte el proyecto de curso en **experiencia transferible a
un puesto real**, y no en un ejercicio sobre una herramienta que después habría
que desaprender. El vocabulario del tablero —épica, *sprint backlog*, *story*,
transición de flujo, UAT— es el mismo que se encuentra en una empresa, de modo
que la práctica del curso y la práctica profesional coinciden.

**2 · Razón técnica — Trello no puede representar lo que el proyecto exige.** El
ciclo de vida comprometido incluye una fase de **pruebas de aceptación de
usuario** separada de las pruebas técnicas. El estado **`IN UAT`** es justamente
eso: una tarea llega a `Finalizada` solo cuando la responsable de UAT la valida
contra la aplicación en ejecución, no cuando el desarrollador termina el código.
Con tres columnas eso no es representable. Tampoco lo son las **épicas** que
trazan la WBS hasta cada ticket, los **sprints con fecha de inicio y fin**, ni los
informes de velocidad que sostienen §5.5.

> **En resumen:** se cambió por la herramienta que la industria usa y que, además,
> sí permite ejecutar el marco de trabajo comprometido. Trello habría obligado a
> simplificar el proceso para que cupiera en la herramienta; con Jira fue la
> herramienta la que se adaptó al proceso.

| Integrante | Rol Scrum | Responsabilidad |
| --- | --- | --- |
| Jefferson Abarca | **Product Owner** + Developer | Alcance y Solicitudes de Cambio · backend íntegro y frontend del portal público |
| Brenda Aguilar Fonseca | **Scrum Master** | Registro ante el CCC · **UAT** · frontend del tablero de órdenes |
| David Acuña Orozco | Developer | Frontend de bodega y caja de salidas |

> ⚠️ **Dos observaciones de trazabilidad.**
>
> **(a)** El **Product Owner acumula el rol de Developer**. Scrum los separa a
> propósito —quien decide el valor de negocio no debería ser quien construye—,
> así que la decisión de alcance y la ejecución recaen en la misma persona. Se
> declara aquí porque afecta a la imparcialidad de las aceptaciones; **la
> mitigación es que el UAT lo firma la Scrum Master, no el PO**.
>
> **(b)** Desde el UAT del 21/08/2026 los tickets aceptados se reasignaron a la
> Scrum Master: el campo `assignee` **dice quién valida, no quién construyó**. La
> autoría real consta en el comentario de cada ticket.

---

## 5.3 Resumen: cómo se debía desarrollar vs. cómo se desarrolló

| Sprint | Cómo se **debía** desarrollar | Cómo se **desarrolló** en Jira | ✔ |
| --- | --- | --- | --- |
| **1–2** | Visión, riesgos, factibilidad y SRS | **Documental**, sin tickets. Entregado en el Avance #1 | ✅ 100 % |
| **3** | Arquitectura, WBS, repositorios | Rama `sprint-3/arquitectura-entorno`: 2 repos, CI, Husky, Docker. **Cambio de stack** Angular+MySQL → React+PostgreSQL | ✅ 100 % |
| **4** | Modelo relacional + carga inicial | Migración y *seed* en PostgreSQL, *migrations-first*, 3FN | ✅ 100 % |
| **5** | CU-01, CU-18, CU-08 | `En revisión por el Doctor` · **`DSO-19`** · JWT + RBAC de 4 roles + auditoría | ✅ 100 % |
| **6** | CU-02, CU-16 | `En revisión por el Doctor` · **`DSO-21`…`DSO-24`** · 4/4 Finalizadas | ✅ 100 % |
| **7** | CU-05, CU-06 + WhatsApp | `Sprint7: Citas, disponi y Whats` · **`DSO-32`…`DSO-36`** · 4/5 · **`DSO-36` bloqueada por credenciales de Meta** | 🟡 80 % |
| **8** | CU-03, CU-04, CU-07 | `Sprint8: Invent, ventas y cata` · **`DSO-25`…`DSO-31` + `DSO-49`** · **8/8**. CU-09 **adelantado** del sprint 9 | ✅ 100 % |
| **9** | CU-09, CU-10, CU-13 | `Sprint9: Portal del paciente` · **`DSO-37`…`DSO-39`** · 3/3 construidas | ✅ 100 % |
| **10** | CU-11, CU-12, CU-14 | `Sprint10: Portal del paciente` · **`DSO-40`, `DSO-41`** · 2/2 construidas | ✅ 100 % |
| **11** | CU-15, CU-17, CU-19 | `Sprint11: IA y Metricas` · **`DSO-42`…`DSO-48`** · **CU-19 cerrado** · CU-17 **retirado** · CU-15 **bloqueado** | 🟡 43 % |
| **—** | *(no previsto)* | Alcance nuevo del PO: **i18n ES/EN/IT y precio en dólares** · `DSO-53`…`DSO-58` · 5/6 | ⚠️ CCC |

**Cuatro claves para leer el cuadro:**

1. **Nueve de once sprints al 100 %.** Los dos incompletos lo están por causas
   externas al equipo: credenciales de un proveedor y una contratación pendiente.
2. **Los sprints 1 a 4 no tienen tickets** porque el tablero se creó el
   **28/07/2026**, cuando ya se habían ejecutado; fueron documentales y de
   infraestructura.
3. Por lo mismo, el trabajo de los **sprints 5 y 6** aparece cargado en un primer
   sprint del tablero llamado «En revisión por el Doctor».
4. **Hubo un reordenamiento controlado:** CU-09 estaba comprometido para el
   sprint 9 y se **adelantó al 8** —el sprint se llamaba «…y catálogo» y no tenía
   ningún ticket de catálogo—; se corrigió creando `DSO-49` durante el sprint.

---

## 5.4 Qué entregó cada sprint

**Sprints 3–4 · Arquitectura y base de datos.** Dos repositorios independientes
comunicados solo por HTTP, CI en GitHub Actions, `Husky` + `lint-staged`. Esquema
en PostgreSQL *migrations-first*, 3FN, con tablas en singular, columnas
`snake_case` y claves `id_<tabla>`. El stack cambió a PostgreSQL porque Supabase
da **respaldos automáticos diarios**, la mitigación comprometida para el riesgo
**A3 (integridad de datos)**. · `e0e4848`, `b671890`, `9ba0e32`

**Sprint 5 · Autenticación y auditoría (`DSO-19`).** JWT con `bcrypt`, **RBAC de
cuatro roles** con guardas en la API y separación de interfaz pública y privada.
**CU-08:** interceptor que registra cada cambio en `log_auditoria` **incluyendo
el valor anterior**, con visor y exportación CSV. La cuenta se revalida en **cada
petición**. · `49d03c0`, `2666132`, `cece174`, `7271ca4`

**Sprint 6 · Expediente clínico y recetas (`DSO-21`…`DSO-24`).** Ficha digital
que **reproduce el expediente en papel** (agudeza por ojo con y sin corrección,
refracción, PIO, nueve puntos de mirada). **EX-03** bloquea el guardado ante un
valor fuera de rango óptico. **CU-16:** receta firmada, con **QR**, descargable
en PDF y verificable públicamente sin sesión.
🔎 **UAT:** se alteró en PostgreSQL la esfera de una receta emitida y la
verificación pasó a `valida: false`; al restaurarla volvió a `true`. **El sellado
detecta alteración en la base.** · `7fb3e70`, `cc8e440`, `b66d6e2`, `6b57e31`

**Sprint 7 · Citas y disponibilidad (`DSO-32`…`DSO-36`).** El doctor define
horarios y el sistema genera los cupos, con **EX-07**; calendario administrativo
con alta por cupo, reprogramación real y **EX-06**.
🔎 **Sprint Review:** la auditoría contra la especificación encontró que **el
calendario administrativo no existía** pese a tener ticket, y que faltaban EX-06
y EX-07 completas. Nueve defectos corregidos antes de pasar a UAT.
🔴 **`DSO-36` queda bloqueada:** el envío automático necesita credenciales de la
**WhatsApp Cloud API de Meta** que se recogen en la óptica. **Sin ellas no hay
nada que verificar.** Lo que sí funciona hoy es la redirección `wa.me` (CU-09,
CU-11, CU-13, CU-14), que no usa credenciales. · `260d567`, `61f2a1c`, `14ba578`

**Sprint 8 · Inventario, ventas y laboratorio (`DSO-25`…`DSO-31`, `DSO-49`).**
El sprint más grande: **8 tickets, 8 finalizados.** Bodega con entradas, ajustes
y **kardex**; caja de salidas con ventas **transaccionales** (stock y registro
ocurren o fallan juntos) y anulación con reversión atómica; tablero de órdenes
con bitácora y un desplegable que **solo ofrece transiciones válidas**; catálogo
público con **EX-11**.
🔎 **Planificación con restricción:** *el trabajo de Jefferson no puede depender
de nadie*. Se modeló el sprint como grafo y se le asignó todo el backend (las
raíces), dejando fuera solo los tres tickets de frontend, que son **hojas**. Como
esos tres cuelgan de sus APIs, se **congelaron y publicaron los contratos de los
DTO** al abrir el sprint (`docs/contratos-sprint8.md`).
🔎 **UAT:** venta real de extremo a extremo —se cobró la venta #29, el stock bajó
de 19 a 18, se anuló desde la pantalla y volvió a 19—, siete rutas sin errores de
consola y **`e2e:sprint8` 38/38** contra la API viva.

**Sprint 9 · Portal: especialista y registro (`DSO-37`…`DSO-39`).** Migración que
crea `perfil_especialista`, `especializacion` y su puente —las dos tablas que la
matriz de brechas daba por bloqueantes— y `GET /especialistas` **público sin
JWT**, que devuelve una vitrina **sin cédula, correo ni teléfono**. **CU-10:**
`POST /auth/registro` público y transaccional con **EX-12 por partida doble**.
🔴 **Seguridad:** siendo un endpoint público que crea usuarios, se implementó
**doble defensa** —`whitelist` descarta el campo `rol` y el servicio fija
`Rol.PACIENTE`—: un alta con `rol: "Administrador"` **acaba siendo Paciente y
queda en auditoría**.
🔎 **Integridad documental:** se eliminó un número de colegiatura inventado por el
proyecto y tres tarjetas de credenciales sin respaldo. **La página solo afirma lo
que la base contiene**, con una prueba que falla si el literal vuelve.
· `9fd3fce`, `96600c4`, `82a386d` · **`e2e:sprint9` 17/17**

**Sprint 10 · Portal: expediente, pedidos y citas (`DSO-40`, `DSO-41`).**
`/portal/expedientes` y `/portal/pedidos` con **JWT + rol PACIENTE**: el paciente
ve un **resumen** —diagnósticos y recetas—, nunca información interna. `/agendar`
con formulario rápido y **EX-13**.
🔴 **Garantía verificada:** **ningún endpoint del portal recibe un id de
paciente** —sale del JWT—; se comprobó que dos cuentas pidiendo la misma URL
reciben cada una lo suyo. Y `/agendar` **no agenda**: la cita la registra
Recepción con CU-05, donde sí se valida el cupo.
🔎 **Hallazgo de método:** el umbral de cobertura del frontend **llevaba fallando
desde `DSO-39` sin detectarse**, porque las corridas se filtraban con
`npm run test:coverage | grep …` y **una tubería devuelve el código de salida de
`grep`**. Regla adoptada: no filtrar la salida de una corrida cuyo exit code
importa. · `a8edcb1`, `73259f0`, `c3c311e`

**Sprint 11 · Métricas gerenciales (`DSO-46`…`DSO-48`).** `GET /metricas` **solo
para Administrador**, con ventas, inventario, agenda y *top* de aros; la
agregación se hace **en SQL** porque **RS-18** lo exige. Panel con rango
personalizado y **EX-21**. El CSV se arma en el navegador y el PDF lo emite la
API con el mismo guardia de rol. **Con `DSO-47` desapareció el último
*placeholder* de la aplicación.**
🔴 **Una prueba verde sobre código que no funciona:** el servicio usaba
`d.subtotal`, columna **inexistente**. Compiló, pasó *lint* y pasó **17 pruebas
con 100 % de cobertura** —los repositorios están simulados— y dio **error 500 en
la primera petición real**. Por eso se escribió **`e2e:sprint11` (27/27 contra la
base real)**.
🔴 **Seguridad crítica:** `celdaCsv()` citaba según RFC 4180 pero **no protegía
contra inyección de fórmulas** —un valor que empiece por `=`, `+`, `-` o `@` **lo
ejecuta Excel**—. Afectaba también a la descarga de CU-08, **viva desde el sprint
8**. Corregido. · `68a382a`, `781c563`, `25d0bcd`, `8e098cc`

### Retiro de CU-17 y alcance nuevo (27/08/2026)

**CU-17 retirado del producto** por decisión del PO: `DSO-42` y `DSO-43`
cancelados y migración `RetirarBiometriaCU17` ejecutada **sin pérdida de datos**
(0 filas tenían valor). **Decae RS-14.** Motivos expuestos antes de decidir:
RS-14 prohíbe guardar vectores faciales en el servidor —así que **no habría
historial**— y el *bundle* de 643 kB se multiplicaría **para todos los
visitantes**.

✅ **Retiro verificado el 15/09/2026:** no queda **ninguna** referencia a
biometría en el código vivo de los dos repositorios. Lo único que persiste son
las dos migraciones —la original que creó `producto.formas_rostro_compatibles` y
la que la elimina—, porque el historial de migraciones es inmutable por diseño y
**es justamente la evidencia del retiro**.

**Alcance nuevo del PO:** tres idiomas (ES/EN/IT) y aproximado en dólares,
`DSO-53`…`DSO-58`. Los catálogos de traducción son **tipados**: añadir un texto y
no traducirlo **impide compilar**. De paso se descubrió que el control `ES / EN`
de las cabeceras **era decoración y no cambiaba nada**; se sustituyó por un
selector real. **Nada de esto está en el cronograma, la WBS ni el SRS.**

---

## 5.5 Estado del tablero y métricas

| Estado | Cant. | Detalle |
| --- | --- | --- |
| Épicas | **9** | `DSO-1`…`DSO-9` |
| ✅ Finalizada (aceptada en UAT) | **17** | `DSO-19`, `DSO-21`…`DSO-35`, `DSO-49` |
| ⚫ Cerrada por retiro de alcance | **2** | `DSO-42`, `DSO-43` |
| 🟢 En revisión (construida, pendiente de UAT) | **13** | sprints 9, 10, 11 e i18n |
| 🔴 En curso, bloqueada por terceros | **1** | `DSO-36` |
| ⬜ Por hacer | **6** | `DSO-44`, `45`, `50`, `51`, `52`, `58` |
| **Total de tareas** | **39** | **30 con código construido → 77 %** |

> Jira muestra **19 tarjetas en «Finalizada»**, no 17: las dos de diferencia son
> `DSO-42` y `DSO-43`, cerradas así porque el flujo no tiene columna «Cancelada»
> (su resumen lleva el prefijo `❌ CANCELADO`). Aquí se cuentan aparte: **cerrar
> por retiro de alcance no es entregar**.

**Casos de uso:** **17 construidos y funcionando** (CU-01 a CU-14, CU-16, CU-18,
CU-19) · **1 bloqueado** por proveedor externo (CU-15) · **1 retirado** (CU-17).
**Sobre el alcance vigente de 18 CU: 17/18 → 94 %.**

**Calidad — re-ejecutada el 15/09/2026:**

| Métrica | Web | API |
| --- | --- | --- |
| `lint` | ✅ limpio (exit 0) | ✅ limpio (exit 0) |
| Pruebas unitarias | ✅ **595 / 595** en 52 archivos | ✅ **385 / 385** en 22 suites |
| **Total del sistema** | **980 pruebas · 0 fallidas** | |
| Cobertura `core/**` y `shared/**` | 100 % con exit 0 real | 100 % |
| Commits en `master` | 75 | 53 — **128 en total** |

**Integración contra la base real:** `e2e:sprint8` **38/38** · `e2e:sprint9`
**17/17** · `e2e:sprint11` **27/27** → **82 comprobaciones E2E**.

**Velocidad:**

| Sprint | 5 | 6 | 7 | 8 | 9 | 10 | 11 | **Total** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Planificados | 1 | 4 | 5 | 8 | 3 | 2 | 7 | **30** |
| Construidos | 1 | 4 | 4 | 8 | 3 | 2 | 3 | **25** |
| Velocidad | 100 % | 100 % | 80 % | 100 % | 100 % | 100 % | 43 % | **83 %** |

**Sobre trabajo no bloqueado por terceros: 100 %.**

---

## 5.6 Gestión de cambios y desviaciones

El proyecto mantiene un **Registro de Cambios versionado**
(`api/docs/solicitudes-cambio/`) con el procedimiento de seis pasos comprometido.
**`SC-001`** (anulación de venta con orden de laboratorio en curso, origen
`DSO-31`) está redactada y *pendiente de registro ante la Scrum Master*.

**Desviaciones detectadas aún sin Solicitud de Cambio abierta:**

| # | Desviación | Afecta a |
| --- | --- | --- |
| 1 | Trello → **Jira Cloud** — herramienta estándar de la industria y única de las dos capaz de representar épicas, sprints con fecha y UAT (§5.2) | cap. 2 |
| 2 | Angular + MySQL → **React + PostgreSQL** | cap. 4, riesgo A3 |
| 3 | Idioma del código: inglés → español en el dominio | cap. 2.1.2 |
| 4 | **Retiro de CU-17** | Historia 19, **RS-14**, WBS, sprint 11 |
| 5 | **Tres idiomas (ES/EN/IT)** | Alcance nuevo |
| 6 | **Aproximado en dólares** | Alcance nuevo |

> **Declararlas es parte del avance.** Un cambio de alcance no se consolida por
> estar construido: requiere decisión del PO registrada. Seis de las siete ya se
> ejecutaron en código, así que **la deuda es de gestión documental, no de
> desarrollo**.

---

## 5.7 Trabajo pendiente, con su causa

| Ticket | Qué falta | Causa raíz | Riesgo |
| --- | --- | --- | --- |
| `DSO-36` | Envío automático de recordatorios | Credenciales de WhatsApp Cloud API | **C1** |
| `DSO-52` | Contratar el proveedor de IA (CU-15) | Coste por consulta, **límite de gasto** y decisión del CCC sobre **qué no debe decir** un asistente que interpreta síntomas oculares | **C1**, **A1** |
| `DSO-44` · `DSO-45` | Asistente inteligente | Bloqueadas tras `DSO-52` | **C1** |
| `DSO-50` | Correo de bienvenida | Proveedor de correo | **C1** |
| `DSO-51` | Datos de contacto reales | Pendiente del cliente | **T2** |
| `DSO-58` | Mensajes de la API en 3 idiomas | Aparcado hasta aprobar el alcance i18n | **A1** |

**Restricción vigente sea cual sea el proveedor:** la clave de IA va en el `.env`
del **backend, nunca del frontend** —en el navegador cualquiera la lee y **la
factura es de la óptica**—.

**Pendientes que no dependen de terceros:** CU-01 EX-02 (bloqueo tras 5 intentos
y recuperación de contraseña) · logotipo en el PDF de la receta · alta digitando
cédula (CU-18) · **RS-11** (el JWT dura `1d`, se pidió 2 h de inactividad) · y las
**historias 10 y 11** —contenido del sitio y productos destacados—, de prioridad
**Alta** y **sin implementación ni planificación**: la mayor brecha frente al SRS.

---

## 5.8 Evidencias adjuntas

| # | Evidencia | Dónde obtenerla |
| --- | --- | --- |
| E-1 | Jira — vista de sprints y Kanban de 5 columnas | proyecto `DSO` → *Backlog* / *Tablero* |
| E-2 | Épicas `DSO-1`…`DSO-9` | proyecto `DSO` → *Épicas* |
| E-3 | Ticket con comentario de alcance, criterios y evidencia | p. ej. `DSO-48` |
| E-4 | Salida de `npm test` de ambos repos | 595/595 y 385/385 |
| E-5 | Salida de `e2e:sprint8/9/11` | 38/38, 17/17, 27/27 |
| E-6 | Capturas de las pantallas entregadas por sprint | aplicación en ejecución |
| E-7 | Receta en PDF con QR · PDF/CSV gerencial | CU-16 · CU-19 |
| E-8 | Registro de Cambios del CCC y `SC-001` | `api/docs/solicitudes-cambio/` |

---

## 5.9 Conclusiones

1. **Se ejecutaron 11 de los 17 sprints comprometidos** y **nueve se cumplieron
   al 100 %**. Hay **17 de 19 casos de uso construidos y funcionando** (94 % del
   alcance vigente).

2. **Los dos sprints incompletos no lo están por capacidad del equipo**, sino por
   dependencias externas documentadas —credenciales de un proveedor y una
   contratación pendiente—, que se gestionaron **abriendo ticket propio** en vez
   de esconder el bloqueo dentro de la tarea de desarrollo.

3. **El UAT funcionó como control real, no como trámite:** la revisión del sprint
   7 descubrió que un calendario dado por hecho **no existía**; la del 9 eliminó
   datos profesionales inventados; la del 11 detectó una inyección de fórmulas
   **viva desde el sprint 8**.

4. **Lección metodológica:** el 100 % de cobertura no garantiza que el sistema
   funcione. Un servicio con 17 pruebas verdes falló con error 500 en la primera
   petición real por consultar una columna inexistente. Las **82 pruebas de
   integración contra la base real** cierran esa brecha, y se incorporaron al
   proceso desde el sprint 8.
