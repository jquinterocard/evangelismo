# Registro global de finalizaciones e interés (Supabase)

El registro global es **opcional**. Sin él, la aplicación sigue mostrando enseñanzas, generando QR
y guardando metas y actividades en el navegador. La pregunta final sigue mostrándose, pero con un
mensaje claro de que la respuesta no se guarda, y el dashboard indica que las estadísticas globales
no están disponibles.

## Flujo para el visitante

Al final de cada enseñanza aparece «❤️ ¿Te gustaría seguir conociendo a Jesús?» con tres botones del
mismo tamaño: **Sí, quiero aprender más**, **Por ahora no, gracias** y **Omitir**. Tocar cualquiera
llama, en un solo paso, a `register_completion` y después a `register_interest`. Si ya existía una
respuesta para esa finalización, se respeta la primera.

## Qué se guarda (y qué no)

| Tabla | Campos | Notas |
|---|---|---|
| `teachings` | `id`, `active` | Solo los ids válidos, para validar solicitudes. |
| `completion_events` | `id` (UUID aleatorio del evento), `qr_id`, `teaching_id`, `session_id`, `completed_at` (hora del servidor), `validation_status` | `session_id` es un UUID aleatorio de `sessionStorage`: se borra al cerrar la pestaña. **No** identifica personas ni demuestra que sean visitantes únicos. |
| `interest_responses` | `completion_id` (clave primaria), `response` (`positive`/`negative`/`skipped`), `responded_at` | Una sola respuesta por finalización, garantizado por la base de datos. |

No se guardan nombres, correos, teléfonos, direcciones IP ni identificadores persistentes, y no se
crean perfiles por persona.

## Seguridad

- **RLS activado y sin políticas** en las tres tablas, además de `revoke all` para `anon` y
  `authenticated`. El navegador no puede leer, insertar, modificar ni borrar filas directamente.
- El navegador solo puede ejecutar cuatro funciones RPC `SECURITY DEFINER` con `search_path` fijo:
  - `register_completion(p_teaching_id, p_session_id, p_qr_id)`: valida la enseñanza y los UUID, es
    idempotente (un duplicado devuelve el mismo evento) y aplica límites de tasa.
  - `register_interest(p_completion_id, p_session_id, p_response)`: exige que la finalización
    exista, esté aceptada, pertenezca a esa sesión y tenga menos de 24 h. Usa
    `insert … on conflict do nothing`, así que repetir la llamada devuelve la respuesta ya guardada.
  - `impact_daily_stats(p_from, p_to, p_tz)` y `top_completed_teachings(...)`: solo lectura de
    agregados, con un rango máximo de 400 días.
- **No existen contadores almacenados**: las cifras se calculan a partir de los eventos, así que no
  hay ningún contador que el navegador pueda alterar.
- Límites contra abuso (ajustables al inicio de `register_completion`): 30 finalizaciones aceptadas
  por sesión y hora, 120 por QR y minuto, y 600 globales por minuto para proteger el plan gratuito.
  Los intentos rechazados se guardan con `validation_status = 'rate_limited'`, con un tope por sesión.
- Fricción ligera en la interfaz: el botón se habilita al llegar al final de la enseñanza o tras 12 s.
- Solo van al frontend la **URL del proyecto** y la clave pública **anon/publishable**, que están
  pensadas para ser públicas. La clave `service_role` (o *secret key*) **nunca** debe ponerse en
  variables `NEXT_PUBLIC_*`, en el repositorio ni en GitHub/Vercel. `npm run verify:export` falla si
  encuentra `service_role` en el bundle.

### Limitaciones conocidas (anti-abuso)

Al ser un sitio estático sin backend propio y sin guardar IP:

1. El `session_id` lo genera el navegador. Un atacante puede rotarlo para eludir el límite por sesión
   e inflar las cifras. Por eso las métricas se presentan como «finalizaciones registradas», nunca
   como personas.
2. El límite global por minuto lo comparten todos: un abuso intenso puede bloquear temporalmente los
   registros legítimos (lo que protege la cuota gratuita, pero no la disponibilidad).

Mejora recomendada para la V2: verificar Cloudflare Turnstile (o similar) en una Supabase Edge
Function que emita un token firmado de corta duración, y aplicar límites por token en lugar de por
`session_id`.

## Paso a paso (plan gratuito)

1. Crea una cuenta en <https://supabase.com> y luego un proyecto (**New project**). Elige una región
   cercana y guarda la contraseña de la base de datos en un lugar seguro (la app no la usa).
2. Abre **SQL Editor → New query**, pega el contenido de
   `supabase/migrations/0001_completions_and_interest.sql` y pulsa **Run**.
3. En otra consulta, pega `supabase/seed_teachings.sql` y pulsa **Run**. Si agregas o cambias
   enseñanzas, ejecuta `npm run gen:sql` y vuelve a correr ese archivo (se puede repetir sin problema).
4. En **Project Settings → API** (o **API Keys**) copia:
   - *Project URL* → `NEXT_PUBLIC_SUPABASE_URL`
   - clave *anon* / *publishable* → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Configura las variables:
   - **Local:** crea `.env.local` a partir de `.env.example`.
   - **Vercel:** *Project → Settings → Environment Variables* y vuelve a desplegar.
   - **GitHub Pages:** *Settings → Secrets and variables → Actions → Variables* con los mismos
     nombres (son públicas, por eso van como *variables*, no como *secrets*), y vuelve a ejecutar el
     workflow.
6. Abre el sitio, lee una enseñanza y elige una de las tres opciones de la pregunta final. El
   resultado debe aparecer en `/impacto`, en las tarjetas de finalizaciones y respuestas.

### Límites del plan gratuito (revisa la página de precios vigente)

- Base de datos de 500 MB y 2 proyectos activos.
- Los proyectos gratuitos **se pausan tras unos 7 días sin actividad**. Mientras están en pausa, el
  registro falla y la app muestra un error de conexión sin afirmar que se registró nada. Reactívalo
  desde el panel.
- Cada finalización ocupa unos pocos cientos de bytes, así que 500 MB alcanzan para millones de eventos.

## Probar sin cuenta (simulador local)

```bash
npm run supabase:local     # PostgreSQL embebido (PGlite) con la migración real, en :54321
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=local npm run dev
```

El simulador expone solo los endpoints RPC, guarda todo en memoria y no sirve para producción.
La prueba automatizada `src/features/completions/supabase-sql.test.ts` ejecuta la misma migración y
comprueba RLS, idempotencia, respuesta única por finalización, sesiones ajenas y límites de tasa.
