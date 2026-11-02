# Un Encuentro con Jesús

> «Un código, una enseñanza, una oportunidad para conocer a Jesús».

Plataforma de evangelización digital por códigos QR. Quien escanea un código recibe en su celular una
enseñanza bíblica elegida al azar, con contexto, explicación, reflexión, aplicación práctica y oración.
Quien comparte puede generar e imprimir códigos, registrar sus actividades, definir metas y ver
proyecciones. Opcionalmente, con Supabase, se registran de forma anónima las enseñanzas completadas
y el interés voluntario en seguir conociendo a Jesús.

Es un **sitio 100 % estático** (Next.js con `output: 'export'`): sin servidor propio, sin funciones
serverless y sin base de datos obligatoria. Se publica gratis en Vercel, en GitHub Pages o en
cualquier hosting estático.

## Funcionalidades

- **Portada** con ilustraciones vectoriales originales (Jesús con los brazos abiertos, paloma,
  Biblia, cruz, corazón, manos en oración, olivo, camino y semilla), 20 temas, mensaje destacado
  aleatorio y llamada a compartir.
- **60 enseñanzas** (3 por cada uno de los 20 temas) con texto NVI y enlace al pasaje completo.
- **Escaneo** (`/?qr=UUID`): valida el parámetro y elige al azar en el navegador, sin repetir las
  enseñanzas recientes de la sesión. Botones para otra enseñanza, compartir (Web Share API), copiar
  enlace y volver al inicio. No pide datos personales.
- **Generador QR** (`/qr`): UUID v4, URL pública tomada de la compilación, color, fondo, tamaño, margen y 5
  plantillas (cruz, corazón, paloma, Biblia, minimalista). Con emblema usa corrección H y el
  emblema ocupa ≤ 20 % del lado. Descarga PNG, SVG, tarjeta imprimible (PNG/SVG) y lotes ZIP de
  1–100 códigos con `manifest.csv`. Historial local.
- **Catálogo** (`/ensenanzas`) con búsqueda sin tildes y filtro por tema; cada enseñanza tiene su
  página estática.
- **Ruta «Conociendo a Jesús»** (`/conociendo-a-jesus`): 10 temas con referencias, explicación,
  reflexión y actividad opcional, y progreso local opcional.
- **Actividades** (`/actividades`): crear, editar, eliminar, filtrar por fecha y tipo, y exportar CSV.
- **Metas** (`/metas`): diarias, semanales, mensuales, trimestrales, anuales o personalizadas, sobre
  actividades locales o indicadores globales. Muestran progreso, pendiente, días restantes, ritmo
  necesario, proyección y comparación con el período anterior.
- **Impacto Evangelístico** (`/impacto`): tarjetas, gráficas Recharts (actividad diaria, tendencia
  y proyección de cierre, comparación semanal/mensual, distribución, progreso de metas) con vista
  de tabla accesible, y una sección global de finalizaciones y respuestas.
- **Finalización + interés voluntario** (opcional, Supabase): al final de cada enseñanza, «❤️ ¿Te
  gustaría seguir conociendo a Jesús?» con tres botones: Sí / Por ahora no / Omitir. Tocar cualquiera
  registra en un solo paso la finalización y la respuesta. Hay una sola respuesta por finalización,
  garantizada en la base de datos. Ver [docs/SUPABASE.md](docs/SUPABASE.md).
- **Exportar CSV** de actividades desde `/actividades`, protegido contra inyección de fórmulas.
- **PWA** instalable (manifest, íconos y service worker sencillo) y diseño mobile-first accesible:
  teclado, lectores de pantalla y `prefers-reduced-motion`.

## Requisitos

- Node.js 20.9 o superior (probado con Node 22) y npm.
- No necesita PostgreSQL, Docker ni ninguna base de datos local.

## Comandos

```bash
npm install
npm run dev            # desarrollo en http://localhost:3000
npm run build          # exporta el sitio estático a out/
npm start              # sirve out/ en http://localhost:3000 (respeta NEXT_PUBLIC_BASE_PATH)
npm run lint           # ESLint
npm run typecheck      # tipos de rutas + tsc
npm test               # Vitest (unitarias, componentes y SQL sobre PGlite)
npm run verify:export  # comprueba rutas, ruta base, manifest y ausencia de service_role en out/
npm run check          # todo lo anterior en cadena
npm run gen:sql        # regenera supabase/seed_teachings.sql desde el catálogo
npm run gen:citas      # regenera docs/REVISION-CITAS.md
npm run gen:icons      # regenera los íconos PWA
npm run supabase:local # simulador local de Supabase (PGlite) para probar el registro global
```

## Configuración

Todo sale de `src/lib/config.ts` y de variables de entorno (ver `.env.example`):

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública con la que se construyen los QR. Si está vacía (desarrollo local), se usa la del navegador. |
| `NEXT_PUBLIC_BASE_PATH` | Subruta de publicación (`/nombre-repo` en GitHub Pages; vacía en Vercel o con dominio propio). |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Opcionales. Activan el registro global. **Nunca** uses la clave `service_role`. |

## Publicar en Vercel (gratis)

1. Sube el proyecto a un repositorio de GitHub.
2. En <https://vercel.com> pulsa **Add New → Project** e importa el repositorio. Vercel detecta Next.js;
   `vercel.json` ya indica `npm run build` y la carpeta `out`.
3. En **Environment Variables** define `NEXT_PUBLIC_SITE_URL=https://<tu-proyecto>.vercel.app` y,
   si quieres, las de Supabase. Deja `NEXT_PUBLIC_BASE_PATH` vacía.
4. Pulsa **Deploy**. Cada `push` a `main` vuelve a publicar automáticamente.
5. Genera los QR desde `https://<tu-proyecto>.vercel.app/qr/` y comprueba que la URL mostrada sea la
   correcta antes de imprimir.

Plan Hobby: es gratuito para **uso personal y no comercial**, con cuotas mensuales de transferencia y
compilación. El sitio no usa funciones serverless ni optimización de imágenes, así que consume muy poco.
Revisa los límites vigentes en <https://vercel.com/pricing>.

## Publicar en GitHub Pages (gratis)

1. Sube el proyecto a GitHub, a la rama `main`.
2. Ve a **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. El workflow `.github/workflows/pages.yml` compila con
   `NEXT_PUBLIC_BASE_PATH=/<repositorio>` y `NEXT_PUBLIC_SITE_URL=https://<usuario>.github.io/<repositorio>`,
   verifica la exportación y publica `out/` (incluye `.nojekyll`).
4. Opcional, en **Settings → Secrets and variables → Actions → Variables**:
   - `PAGES_BASE_PATH=/` si el repositorio es `<usuario>.github.io` o usas un dominio propio.
   - `PUBLIC_SITE_URL` con tu dominio propio.
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (son públicas).
5. Haz push o ejecuta el workflow a mano (**Actions → Publicar en GitHub Pages → Run workflow**).

Los QR quedan como `https://<usuario>.github.io/<repositorio>/?qr=<uuid>`. Esto se probó localmente
con `NEXT_PUBLIC_BASE_PATH=/evangelizmo npm run build && npm start`.

**Dominio propio futuro:** apúntalo a Vercel o a GitHub Pages, cambia `NEXT_PUBLIC_SITE_URL` (y
`PAGES_BASE_PATH=/` en Pages) y vuelve a desplegar. Los QR ya impresos siguen apuntando a la URL
anterior, así que conviene elegir la URL definitiva antes de imprimir en cantidad.

## Estructura

```
src/app/                 rutas (/, ensenanza, ensenanzas/[id], conociendo-a-jesus/[slug], qr, impacto, metas,
                         actividades, acerca, privacidad, manifest)
src/components/          UI base, layout (Header/Footer/SW) e ilustraciones SVG originales
src/data/                categorías, enseñanzas (teachings/group-*.ts) y ruta de aprendizaje
src/features/teachings/  repositorio del catálogo, selección aleatoria, vista y experiencia de escaneo
src/features/qr/         render SVG/PNG, tarjetas, ZIP, historial, configuración de URL
src/features/completions/cliente Supabase (RPC), panel de la pregunta de interés, hooks de estadísticas
src/features/interest/   pregunta voluntaria y seguimiento positivo/negativo
src/features/activities/ modelo, formulario y gestor de actividades
src/features/goals/      modelo, formulario, tarjetas y gestor de metas
src/features/impact/     proyecciones, agregaciones, gráficas y dashboard
src/features/learning/   progreso de la ruta «Conociendo a Jesús»
src/lib/                 config, fechas, UUID, almacenamiento versionado, esquemas zod, respaldos, URLs, CSP
supabase/                migración SQL (RLS + RPC) y semilla de enseñanzas
scripts/                 verificación de exportación, servidor estático, íconos, SQL, citas, simulador Supabase
.github/workflows/       CI y publicación en GitHub Pages
docs/                    SUPABASE.md, ARQUITECTURA.md, REVISION-CITAS.md
```

## Editar el catálogo

Las enseñanzas están en `src/data/teachings/group-*.ts`. Para ocultar una sin borrarla, pon
`active: false`. Después ejecuta `npm test` (valida esquema, ids y referencias únicas),
`npm run gen:sql` (si usas Supabase) y `npm run gen:citas`.

## Texto bíblico

Se usa la Nueva Versión Internacional (NVI), con el aviso de copyright en el pie de página y en
«Acerca». Son 77 citas breves, muy por debajo del límite de uso sin permiso escrito que publica
Biblica; confirma sus condiciones vigentes para tu caso. **Revisa las citas contra una NVI antes de
publicar** usando [docs/REVISION-CITAS.md](docs/REVISION-CITAS.md).

## Limitaciones conocidas

- Las citas NVI se escribieron sin cotejar contra una edición impresa: requieren revisión humana.
- Metas, actividades y preferencias viven solo en el navegador: no se sincronizan entre dispositivos y
  se pierden si se borran los datos del sitio.
- Abrir una URL de QR no es un escaneo verificado, y no hay estadísticas globales de visitas: solo de
  finalizaciones voluntarias, si Supabase está configurado.
- El registro global se probó con la migración real sobre PostgreSQL embebido (PGlite) y un simulador
  PostgREST local, **no contra un proyecto Supabase real**.
- La protección contra abuso no tiene CAPTCHA y el `session_id` se puede rotar (ver docs/SUPABASE.md).
- GitHub Pages no permite cabeceras HTTP: la CSP se aplica con `<meta>` (sin `frame-ancestors`).
- La CSP necesita `'unsafe-inline'` para los scripts de hidratación de Next.js en un sitio estático.
- El modo sin conexión cubre solo las páginas y recursos ya visitados o precargados.

## Próximas versiones

Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md): PostgreSQL y panel administrativo real,
autenticación, gestión centralizada de QR y enseñanzas, evangelizadores, equipos e iglesias con metas
propias, dashboard general y seguimiento voluntario de interesados con consentimiento explícito.
