# Guía de Configuración Local para Voaya

Este documento detalla las variables de entorno necesarias para ejecutar el proyecto **Voaya** en local, tanto para el cliente (Next.js) como para el servidor (Node.js/Express).

## 1. Configuración del Servidor (`server/`)

Crea un archivo `.env` en la carpeta `server/` (e.g., `server/.env`).

| Variable | Descripción | Ejemplo / Valor por Defecto |
|----------|-------------|-----------------------------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3001` |
| `CLIENT_URL` | URL del cliente (para logs/lógica interna) | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para CORS (separados por coma) | `http://localhost:3000,http://localhost:9002` |
| `FIREBASE_ADMIN_PROJECT_ID` | ID del proyecto de Firebase | `tu-proyecto-id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Email de servicio de Firebase Admin | `firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Clave privada de Firebase Admin (¡Cuidado con los saltos de línea!) | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `GEMINI_API_KEY` | API Key de Google Gemini (AI Studio) | `AIzaSy...` |

### Notas sobre `FIREBASE_ADMIN_PRIVATE_KEY`:
Asegúrate de que la clave privada incluya los saltos de línea `\n` correctamente o esté entre comillas dobles si es necesario. El código del servidor intenta corregir el formato automáticamente, pero es mejor copiarla tal cual aparece en el archivo JSON de credenciales de servicio.

## 2. Configuración del Cliente (`client/`)

Crea un archivo `.env.local` en la carpeta `client/` (e.g., `client/.env.local`).

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key pública de Firebase | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación | `tu-proyecto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto de Firebase | `tu-proyecto-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Bucket de almacenamiento | `tu-proyecto.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID de remitente de mensajería | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID de la App web de Firebase | `1:123456789:web:abcdef...` |
| `NEXT_PUBLIC_API_URL` | URL del Backend (Opcional en dev, por defecto localhost:3001) | `http://localhost:3001` |

> **Nota:** Existe una configuración _hardcodeada_ como fallback en `src/firebase/config.ts` (en la raíz). Se recomienda encarecidamente usar las variables de entorno en su lugar para mantener la seguridad y flexibilidad.

## 3. Obtención de Credenciales

### Firebase
1.  Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2.  Selecciona tu proyecto.
3.  **Para el Cliente (`NEXT_PUBLIC_...`)**:
    *   Ve a "Configuración del proyecto" (engranaje).
    *   En la pestaña "General", baja hasta "Tus apps" y selecciona la app Web.
    *   Allí encontrarás el objeto `firebaseConfig`. Copia cada valor a su variable `NEXT_PUBLIC_` correspondiente.
4.  **Para el Servidor (Admin SDK)**:
    *   Ve a "Configuración del proyecto" -> "Cuentas de servicio".
    *   Haz clic en "Generar nueva clave privada".
    *   Se descargará un archivo JSON. Abre este archivo y extrae `project_id`, `client_email` y `private_key` para ponerlos en el `.env` del servidor.

### Google Gemini (AI)
1.  Ve a [Google AI Studio](https://aistudio.google.com/).
2.  Obtén una API Key.
3.  Asígnala a `GEMINI_API_KEY` en el `.env` del servidor.

## 4. Ejecutar el Proyecto

Desde la raíz del proyecto (donde está el `package.json` principal):

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Iniciar en modo desarrollo (Cliente + Servidor):**
    ```bash
    npm run dev
    ```
    Esto ejecutará concurrentemente el cliente (puerto 3000 por defecto) y el servidor (puerto 3001).

3.  **Verificar:**
    *   Cliente: Abre `http://localhost:3000`
    *   Servidor (Health check): Abre `http://localhost:3001/health`
