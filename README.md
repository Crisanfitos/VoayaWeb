# Voaya

Aplicación web de planificación de viajes con asistencia de IA.

## Tecnologías

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Base de datos**: Supabase (PostgreSQL)
- **IA**: Google Gemini

## Estructura del Proyecto

```
├── client/          # Aplicación Next.js
│   ├── src/app/     # Páginas (App Router)
│   ├── src/components/
│   └── src/lib/
├── server/          # API Express
│   └── src/api/
└── shared/          # Tipos compartidos
    └── types/
```

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. Configurar variables de entorno (`.env.local` en client, `.env` en server)
4. Ejecutar:
   ```bash
   # Terminal 1 - Cliente
   cd client && npm run dev
   
   # Terminal 2 - Servidor
   cd server && npm run dev
   ```

## Variables de Entorno Requeridas

### Cliente (`client/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Servidor (`server/.env`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY`

## Licencia

Proyecto privado. Todos los derechos reservados.
