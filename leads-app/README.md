# Firekworks Leads

CRM interno para investigar, ordenar y priorizar comercios locales antes de visitas comerciales de Firekworks.

## V6 local CRM

- `/leads`: pantalla principal de comercios con filtros, tarjetas limpias y ficha lateral editable.
- `/map`: mapa real si hay clave y coordenadas; fallback honesto por ciudad si faltan.
- `/route`: ruta presencial, reordenación, Google Maps, copia de ruta y resultado de visita.
- `/pipeline`: Kanban de 5 fases agrupadas: Descartar, Detectados, Prioritarios, Contactados y Cierre.
- `/calendar`: seguimientos internos y tareas próximas sin depender de Google Calendar.
- `/system`: estado de integraciones y arquitectura.
- `/`, `/prospecting`, `/pulse`, `/scan`, `/admin` redirigen a las vistas correctas.

Zona fija: Castalla, Ibi, Onil, Tibi, Biar, Sax, Elda y Petrer. Alcoy queda solo como histórico si ya existe en base de datos.

## Datos

Supabase es la fuente principal detrás de `/api/leads`. Si Supabase no está disponible, la app usa `localStorage` como fallback temporal para no dejar la herramienta inutilizada.

La tabla principal sigue siendo `public.leads`. Las migraciones locales están en `supabase/migrations` y no borran datos existentes.

## Arranque local

```bash
npm install
npm run dev
```

Si `npm` no está disponible en la máquina local:

```bash
pnpm install
./node_modules/.bin/next dev
```

## Variables

Ver `.env.example`. Las claves server-only (`SUPABASE_SERVICE_ROLE_KEY`, Google server keys, Meta, WhatsApp, Stats) deben vivir en Vercel o en un `.env.*` ignorado por Git.
