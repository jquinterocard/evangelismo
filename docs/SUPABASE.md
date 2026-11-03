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

## Seguimiento: solicitudes de contacto y panel de mentores (migración 0002)

Tras responder **«Sí»**, la persona ve el bloque «¿Quieres hablar con alguien?» con:

- **Escribir por WhatsApp**: abre un chat con el número del equipo y un mensaje ya escrito que
  incluye la enseñanza que leyó. Se activa con la variable `NEXT_PUBLIC_CONTACT_WHATSAPP` (en GitHub
  Pages, la variable de repositorio `CONTACT_WHATSAPP`), solo dígitos con indicativo, p. ej.
  `573001234567`. Sin ella el botón no aparece. No usa la base de datos.
- **Prefiero que me contacten**: formulario voluntario (nombre, WhatsApp, correo opcional, forma de
  contacto preferida, petición de oración opcional) con **autorización expresa** de tratamiento de
  datos (Ley 1581 de 2012). Solo aparece si Supabase está configurado y la respuesta «Sí» quedó
  registrada.

| Tabla | Contenido |
|---|---|
| `mentors` | `email` (en minúsculas), `name`, `active`. La llena el administrador. |
| `contact_requests` | Datos del formulario, `teaching_id`, `consent_at`/`consent_version`, `status` (`nuevo`, `contactado`, `acompanamiento`, `cerrado`), `notes`, `updated_at`/`updated_by`. |

Seguridad:

- Igual que 0001: RLS forzado sin políticas y privilegios revocados; solo RPC `SECURITY DEFINER`.
- `submit_contact_request` (anon) exige la autorización, una finalización aceptada de la **misma
  sesión**, de menos de 24 h y con respuesta «Sí». Admite una solicitud por finalización.
- Límites que no dependen de la sesión (migración **0003**): 3 solicitudes por hora por conexión,
  1 cada 24 h por número de WhatsApp (las repeticiones se tratan como duplicado) y un tope global de
  200 por hora como respaldo. La conexión se identifica solo con `cf-connecting-ip` (la fija
  Cloudflare; el cliente no la controla; `x-forwarded-for` se ignora y, si falta ese encabezado, no
  se aplica el límite por conexión) y solo se guarda un hash con sal aleatoria diaria
  (`client_key`), que se borra a las 24 horas; la sal se descarta a los 2 días. Nunca se guarda la IP.
- `mentor_list_requests`, `mentor_update_request` y `mentor_delete_request` solo se pueden ejecutar
  con sesión (`authenticated`) y además verifican que el correo del JWT esté activo en `mentors`.

### Activarlo

1. **SQL Editor → New query**: pega `supabase/migrations/0002_contact_requests.sql` y pulsa **Run**.
   Después, en otra consulta, `supabase/migrations/0003_contact_rate_limits.sql`.
2. **Authentication → Sign In / Providers**: deja activo *Email* y **desactiva «Allow new users to
   sign up»** (solo entran usuarios invitados).
3. **Authentication → URL Configuration**: en *Site URL* y *Redirect URLs* agrega
   `https://jquinterocard.github.io/evangelismo/seguimiento/` (y `http://localhost:3000/seguimiento/`
   para desarrollo).
4. **Authentication → Users → Invite user** con el correo de cada mentor.
5. Autorízalo en **SQL Editor**:

   ```sql
   insert into public.mentors (email, name) values ('mentor@ejemplo.com', 'Nombre del mentor');
   -- Para quitar el acceso: update public.mentors set active = false where email = 'mentor@ejemplo.com';
   ```

6. El mentor abre `/seguimiento/` (la página no aparece en el menú ni en buscadores), escribe su
   correo, abre el enlace que recibe y ve las solicitudes. Puede abrir WhatsApp con un saludo, cambiar
   el estado, escribir notas y **eliminar** una solicitud cuando la persona lo pida (derecho de
   supresión).

> Supabase envía los correos de acceso con un servicio de prueba limitado a pocos mensajes por hora.
> Si tienes varios mentores, configura un SMTP propio en **Authentication → Emails → SMTP Settings**.

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

El simulador expone solo los endpoints RPC del visitante (también `submit_contact_request`; el panel
de mentores necesita Supabase Auth real), guarda todo en memoria y no sirve para producción.
La prueba automatizada `src/features/completions/supabase-sql.test.ts` ejecuta la misma migración y
comprueba RLS, idempotencia, respuesta única por finalización, sesiones ajenas y límites de tasa.
`src/features/followup/followup-sql.test.ts` hace lo mismo con la 0002: autorización obligatoria,
solo tras un «Sí», una solicitud por finalización, límites por conexión y por número, y acceso
exclusivo de mentores activos.
