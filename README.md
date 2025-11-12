# Voaya: Tu Compañero de Viaje IA

Voaya es una aplicación web innovadora diseñada para reinventar la forma en que planificas y experimentas tus viajes. Utilizando el poder de la inteligencia artificial, Voaya actúa como un asistente de viaje personal e inteligente que te ayuda a descubrir destinos, planificar itinerarios y recibir asistencia en tiempo real durante tus aventuras.

## Propósito y Visión

Nuestra visión es hacer que la planificación de viajes sea una experiencia fluida, personalizada y emocionante. Voaya elimina el estrés y la incertidumbre de la planificación de viajes al proporcionar recomendaciones inteligentes y asistencia contextual, permitiéndote centrarte en disfrutar de tu viaje al máximo.

## Estructura de Datos

### Objeto Chat
```typescript
interface Chat {
  id: string;                 // Identificador único del chat
  userId: string;            // Usuario propietario del chat
  createdAt: Date;           // Fecha de creación
  title: string;             // Derivado del primer mensaje del usuario
  status: 'active' | 'completed' | 'archived'; // Estado del chat
  category: string[];        // Categorías (vuelos, hoteles, experiencias)
  lastMessageAt: Date;       // Timestamp del último mensaje
  metadata: {
    destination?: string;    // Destino identificado
    dates?: {
      start?: Date;         // Fecha de inicio del viaje
      end?: Date;          // Fecha de fin del viaje
    };
    travelers?: number;     // Número de viajeros
    preferences?: {         // Preferencias adicionales capturadas
      [key: string]: any;
    }
  }
}
```

### Objeto Mensaje
```typescript
interface Message {
  id: string;              // Identificador único del mensaje
  chatId: string;          // Referencia al chat padre
  role: 'user' | 'assistant'; // Quien envió el mensaje
  text: string;            // Contenido del mensaje
  createdAt: Date;         // Fecha de envío
  metadata?: {             // Metadatos opcionales
    intent?: string;      // Intención identificada
    entities?: {          // Entidades nombradas extraídas
      [key: string]: any;
    };
    context?: {           // Información contextual
      [key: string]: any;
    }
  }
}
```

## Flujo de la Aplicación - Gestión de Chats

### 1. Inicio de Nuevo Chat
1. **Interfaz de Usuario**:
   - Usuario hace clic en "Nuevo Chat" en `/client/src/app/chats/page.tsx`
   - Redirección a la interfaz de chat con estado vacío

2. **Creación del Chat**:
   - En `/client/src/app/chats/[chatId]/page.tsx`:
     - Crear nuevo documento de chat en Firestore
     - Inicializar con estado por defecto
     - Devolver ID del chat al frontend

3. **Inicialización del Servicio AI**:
   - En `/src/services/geminiService.ts`:
     - Crear nueva instancia de chat con Gemini
     - Configurar modelo basado en categorías detectadas/seleccionadas

### 2. Flujo de Mensajes
1. **Primer Mensaje del Usuario**:
   - Captura del mensaje en frontend
   - Creación del documento de mensaje en Firestore
   - Activación del procesamiento AI

2. **Procesamiento AI**:
   - Análisis del mensaje para intención y entidades
   - Actualización de metadatos del chat
   - Generación de respuesta
   - Almacenamiento en Firestore

3. **Interacción Continua**:
   - Actualización de metadatos del chat
   - Mantenimiento del contexto a través del historial
   - Actualización en tiempo real con listeners de Firestore

### 3. Estructura Firestore
```
/chats/{chatId}/
  - id: string
  - userId: string
  - createdAt: timestamp
  - title: string
  - status: string
  - category: array
  - lastMessageAt: timestamp
  - metadata: map

/chats/{chatId}/messages/{messageId}
  - id: string
  - role: string
  - text: string
  - createdAt: timestamp
  - metadata: map
```

## ¿Qué Ofrece Voaya?

-   **Planificación de Viajes Inteligente:** Genera planes de viaje completos y personalizados basados en tus intereses, presupuesto y estilo de viaje.
-   **Asistente de Viaje en Tiempo Real:** Obtén respuestas a tus preguntas y asistencia durante tu viaje, desde recomendaciones de restaurantes hasta información sobre el transporte público.
-   **Descubrimiento de Destinos:** Explora nuevos destinos con recomendaciones personalizadas que se adaptan a tus preferencias.
-   **Gestión de Viajes:** Guarda y organiza tus planes de viaje, chats y lugares favoritos en un solo lugar.

## Estructura del Proyecto

El proyecto Voaya está organizado en una arquitectura monorepo que separa claramente el frontend, el backend y el código compartido. A continuación se detalla la estructura de directorios y el propósito de cada componente clave.

### Directorios Principales

-   `client/`: Contiene la aplicación de frontend construida con Next.js.
-   `server/`: Contiene la aplicación de backend construida con Express.js.
-   `shared/`: Contiene código y tipos compartidos entre el cliente y el servidor.
-   `src/`: Contiene la lógica de negocio principal y los servicios de IA que son utilizados tanto por el cliente como por el servidor.

### `client/` - Aplicación Frontend (Next.js)

La aplicación cliente es responsable de la interfaz de usuario y la experiencia del usuario.

-   `client/src/app/`: El directorio principal de la aplicación Next.js, que sigue la convención de App Router.
    -   `client/src/app/layout.tsx`: El layout principal de la aplicación, donde se inicializan los proveedores de contexto, como Firebase.
    -   `client/src/app/page.tsx`: La página de inicio de la aplicación.
    -   `client/src/app/(auth)/`: Contiene las páginas de autenticación (login, signup).
    -   `client/src/app/(main)/`: Contiene las páginas principales de la aplicación para usuarios autenticados (plan, chats, etc.).
-   `client/src/components/`: Contiene todos los componentes de React utilizados en la aplicación.
    -   `client/src/components/ui/`: Componentes de UI genéricos (botones, inputs, etc.), basados en `shadcn/ui`.
    -   `client/src/components/layout/`: Componentes de la estructura de la página, como la barra de navegación y el pie de página.
    -   `client/src/components/auth/`: Componentes relacionados con la autenticación, como los formularios de inicio de sesión y registro.
-   `client/src/firebase/`: Configuración y hooks para la integración con Firebase en el cliente.
    -   `client/src/firebase/index.tsx`: El proveedor de contexto de Firebase y los hooks principales (`useAuth`, `useUser`, `useFirestore`).
-   `client/src/hooks/`: Hooks de React personalizados.
-   `client/src/lib/`: Funciones de utilidad y librerías auxiliares.

### `server/` - Aplicación Backend (Express.js)

El backend maneja la lógica de negocio, la comunicación con servicios externos y las operaciones de la base de datos.

-   `server/src/index.ts`: El punto de entrada de la aplicación de Express.
-   `server/src/api/`: Define las rutas y controladores de la API.
    -   `server/src/api/chat/`: Contiene la lógica para el manejo de las interacciones del chat con el servicio de IA.
-   `server/src/services/`: Contiene los servicios que encapsulan la lógica de negocio.
    -   `server/src/services/ai/`: Servicios para la integración con modelos de IA, como Gemini.

### `shared/` - Código Compartido

Este directorio es crucial para mantener la consistencia y evitar la duplicación de código entre el cliente y el servidor.

-   `shared/types/`: Contiene las definiciones de tipos de TypeScript (interfaces, tipos) que se utilizan tanto en el frontend como en el backend.

### `src/` - Lógica de Negocio y IA

Este directorio contiene la lógica de negocio principal y los servicios de IA que son independientes de la plataforma (cliente o servidor).

-   `src/ai/`: Contiene la configuración y los flujos de Genkit para interactuar con los modelos de IA.
-   `src/firebase/`: Contiene la configuración de Firebase y los componentes de bajo nivel que pueden ser utilizados en toda la aplicación.
    -   `src/firebase/config.ts`: La configuración de inicialización de Firebase.
    -   `src/firebase/provider.tsx`: El proveedor de contexto de Firebase que envuelve la aplicación.
    -   `src/firebase/non-blocking-login.tsx`: Funciones para manejar la autenticación de forma no bloqueante.
