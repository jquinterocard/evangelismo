# Arquitectura

## Principios

- **Estático primero.** `next.config.ts` usa `output: 'export'`, `trailingSlash` y `basePath`
  configurable. No hay API Routes, Server Actions ni middleware. Toda la lógica dinámica corre en el
  navegador.
- **Configuración centralizada** en `src/lib/config.ts`: los componentes no escriben dominios ni rutas
  base. Las URL de los QR salen de `resolvePublicBase()` (preferencia del usuario > variable de
  build > `location.origin + basePath`) y de `buildQrUrl()`.
- **Datos no confiables por defecto.** Lo que viene de LocalStorage, de los respaldos importados, de
  los parámetros de la URL y de Supabase se valida (zod o validadores propios) antes de usarse. No se
  usa `dangerouslySetInnerHTML` salvo en un script constante de la portada.

## Capas

```
UI (app/, components/, features/*/Componente.tsx)
  └─ hooks (useStore, usePublicBase, useGlobalDaily)
       └─ lógica pura (features/*/model.ts, impact/projections.ts, teachings/random.ts, qr/render.ts)
            └─ persistencia
                 ├─ lib/storage.ts → LocalStorage (sobre {v, data}, migraciones, cuota llena)
                 ├─ data/ → catálogo en archivos TypeScript
                 └─ features/completions/api.ts → RPC Supabase (opcional, carga diferida)
```

La lógica pura no depende del DOM y tiene pruebas unitarias. Los componentes consumen interfaces:

- `TeachingRepository` (`features/teachings/repository.ts`): hoy es local; mañana puede ser una API.
- `CompletionsApi` (`features/completions/api.ts`): recibe un `RpcFn` inyectable. En las pruebas se
  conecta a PGlite y en producción a `supabase-js`.
- `Store<T>` (`lib/storage.ts`): se puede sustituir por un almacén remoto con la misma forma.

## Modelo de datos local (LocalStorage, prefijo `uecj:`)

| Clave | Contenido | Versión |
|---|---|---|
| `activities` | `Activity[]` | 1 |
| `goals` | `Goal[]` (el valor actual **se deriva** de los registros, no se guarda) | 1 |
| `preferences` | URL pública y estilo de QR | 1 |
| `qr-history` | `QrRecord[]` | 1 |
| `learning` | temas leídos de la ruta | 1 |

`sessionStorage` guarda el historial de enseñanzas recientes (para no repetirlas) y el `session_id`
aleatorio del registro global.

## Hacia la V2 (con backend)

1. **PostgreSQL / Supabase como fuente principal:** tablas `teachings`, `categories`, `qr_codes`,
   `organizations` (iglesias), `teams`, `members`, `goals`, `activities`, más las de eventos que ya
   existen. Implementar `TeachingRepository` y `Store` remotos.
2. **Autenticación real** (Supabase Auth) para evangelizadores. Las políticas RLS por
   `organization_id` y `auth.uid()` sustituyen los almacenes locales, y la importación JSON sirve de
   migración inicial.
3. **Panel administrativo** de enseñanzas con flujo de revisión y publicación (estado
   `active`/borrador), en lugar de editar archivos.
4. **Gestión centralizada de QR:** registrar cada `qr_id` con su propietario o equipo y obtener
   estadísticas por código. El parámetro `?qr=` actual ya es compatible.
5. **Estadísticas globales de escaneos** con un endpoint de eventos y anti-abuso con token firmado
   (Edge Function + Turnstile).
6. **Seguimiento voluntario de interesados** solo con consentimiento explícito, finalidad declarada,
   retención limitada y derecho a borrar los datos. Separarlo de las métricas anónimas.
7. **Metas por persona, equipo e iglesia**, reutilizando `projections.ts` sin cambios.
