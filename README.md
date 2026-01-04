# Voaya Web

Voaya is a modern travel management application designed to streamline flight and hotel bookings, manage itineraries, and provide AI-assisted travel planning.

## 🏗 Project Structure

The project is organized as a monorepo with distinct client and server applications.

### 📂 Client (`/client`)
Built with **Next.js 15**, **React 18**, and **Tailwind CSS**.

-   **`src/app`**: App Router pages and layouts.
-   **`src/components`**: Reusable UI components (using **inc/ui**).
-   **`src/lib`**: Utility functions and Supabase client configuration.
-   **`src/hooks`**: Custom React hooks.
-   **Key Dependencies**:
    -   `@supabase/supabase-js`: Authentication and database interaction.
    -   `@google/genai`: Integration with Google's Gemini models.
    -   `react-hook-form` + `zod`: Form handling and validation.
    -   `lucide-react`: Iconography.

### 📂 Server (`/server`)
Built with **Node.js**, **Express**, and **TypeScript**.

-   **`src/api`**:
    -   **`routes`**: Express routes definitions.
    -   **`controllers`**: Request handling logic.
    -   **`middlewares`**: Authentication and error handling middlewares.
-   **`src/services`**: Business logic and external API integrations (Supabase, Google AI).
-   **Key Dependencies**:
    -   `express`: Web server framework.
    -   `@google/generative-ai`: AI model interaction.
    -   `@supabase/supabase-js`: Backend admin operations.
    -   `dotenv`: Environment variable management.

---

## 🗄 Database Schema (Supabase - PostgreSQL)

The application uses a relational database hosted on Supabase. Key tables include:

### Core Tables
-   **`usuarios`**: User profiles (extends Supabase Auth).
    -   `id` (PK, ref `auth.users`), `email`, `nombre`, `apellidos`, `moneda_preferida`.
-   **`perfiles_facturacion`**: Billing profiles for users.
    -   `tipo` (individual/empresa), `nif`, `razon_social`, `direccion`.

### Travel & Bookings
-   **`vuelos`**: Flight records.
    -   `estado` (pendiente, confirmado...), `codigo_reserva`, `escalas` (JSONB), `precio`.
-   **`reservas_hoteles`**: Hotel booking records.
    -   `nombre_hotel`, `fecha_entrada`, `fecha_salida`, `precio`, `estado`.

### AI & Chat
-   **`chats`**: Conversation threads.
    -   `titulo`, `estado`, `categorias`.
-   **`mensajes`**: Individual chat messages.
    -   `rol` (user/assistant), `contenido`.

### Security
-   **Row Level Security (RLS)** is enabled on all tables to ensure users can only access their own data.

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   npm or yarn
-   Supabase Project
-   Google AI Studio API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Crisanfitos/VoayaWeb.git
    cd VoayaWeb
    ```

2.  **Install Client Dependencies:**
    ```bash
    cd client
    npm install
    ```

3.  **Install Server Dependencies:**
    ```bash
    cd ../server
    npm install
    ```

4.  **Environment Setup:**
    -   Create `.env.local` in `/client` with your Supabase keys.
    -   Create `.env` in `/server` with Supabase Service Role key and Google API Key.

5.  **Run Development Servers:**

    *Client:*
    ```bash
    cd client
    npm run dev
    ```

    *Server:*
    ```bash
    cd server
    npm run dev
    ```

## 🔐 Authentication

Authentication is handled via **Supabase Auth**. The client handles login/signup flows, and the server validates session tokens for protected routes.
