CREATE TABLE public.usuarios (
    id TEXT PRIMARY KEY, 
    email TEXT,
    nombre TEXT,
    apellidos TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moneda_preferida TEXT DEFAULT 'EUR'
);
-- 3. Crear Tabla Perfiles de Facturación
CREATE TABLE public.perfiles_facturacion (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id TEXT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo TEXT CHECK (tipo IN ('individual', 'empresa')) DEFAULT 'individual',
    nif TEXT, -- NIF/CIF/VAT
    razon_social TEXT, -- Nombre legal o Razón Social
    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,
    codigo_postal TEXT,
    pais TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    es_principal BOOLEAN DEFAULT FALSE
);
-- 4. Crear Tabla Chats
CREATE TABLE public.chats (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo TEXT,
    estado TEXT DEFAULT 'active',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_mensaje_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    categorias TEXT[] DEFAULT '{}',
    metadatos JSONB DEFAULT '{}'
);
-- 5. Crear Tabla Mensajes
CREATE TABLE public.mensajes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    chat_id TEXT REFERENCES public.chats(id) ON DELETE CASCADE,
    usuario_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    rol TEXT NOT NULL CHECK (rol IN ('user', 'assistant', 'system')),
    contenido TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadatos JSONB DEFAULT '{}'
);
-- 6. Crear Tabla Vuelos
CREATE TABLE public.vuelos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
    chat_id TEXT REFERENCES public.chats(id) ON DELETE SET NULL,
    
    -- Estado
    estado TEXT CHECK (estado IN ('pendiente', 'confirmado', 'completado', 'cancelado')) DEFAULT 'pendiente',
    
    -- Información de Reserva
    codigo_reserva TEXT, -- PNR Agencia
    localizador_proveedor TEXT, -- PNR Aerolínea
    url_billete TEXT,
    url_check_in TEXT,
    
    -- Itinerario
    es_directo BOOLEAN DEFAULT TRUE,
    aeropuerto_origen TEXT,
    aeropuerto_destino TEXT,
    fecha_salida TIMESTAMP WITH TIME ZONE,
    fecha_llegada TIMESTAMP WITH TIME ZONE,
    
    -- Escalas / Segmentos
    -- Estructura JSON: [{"aerolinea": "IB", "numero_vuelo": "3400", "origen": "MAD", ...}]
    escalas JSONB DEFAULT '[]', 
    
    precio DECIMAL(10, 2),
    moneda TEXT DEFAULT 'EUR',
    
    metadatos JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 7. Crear Tabla Reservas de Hoteles
CREATE TABLE public.reservas_hoteles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
    chat_id TEXT REFERENCES public.chats(id) ON DELETE SET NULL,
    
    -- Estado
    estado TEXT CHECK (estado IN ('pendiente', 'confirmado', 'completado', 'cancelado')) DEFAULT 'pendiente',
    
    -- Información del Hotel
    nombre_hotel TEXT,
    direccion_hotel TEXT,
    
    -- Detalles de Estancia
    fecha_entrada TIMESTAMP WITH TIME ZONE,
    fecha_salida TIMESTAMP WITH TIME ZONE,
    numero_huespedes INTEGER DEFAULT 1,
    numero_habitaciones INTEGER DEFAULT 1,
    
    -- Información de Reserva
    codigo_reserva TEXT, -- ID Agencia
    localizador_hotel TEXT, -- Código confirmación del hotel
    url_check_in TEXT,
    
    precio DECIMAL(10, 2),
    moneda TEXT DEFAULT 'EUR',
    
    metadatos JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 8. Habilitar Row Level Security (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_facturacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vuelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas_hoteles ENABLE ROW LEVEL SECURITY;
-- 9. Crear Políticas RLS (Policies)
-- Usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.usuarios FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.usuarios FOR UPDATE USING (auth.uid()::text = id);
-- Perfiles de Facturación
CREATE POLICY "Usuarios pueden ver sus perfiles" ON public.perfiles_facturacion FOR SELECT USING (auth.uid()::text = usuario_id);
CREATE POLICY "Usuarios pueden crear sus perfiles" ON public.perfiles_facturacion FOR INSERT WITH CHECK (auth.uid()::text = usuario_id);
CREATE POLICY "Usuarios pueden actualizar sus perfiles" ON public.perfiles_facturacion FOR UPDATE USING (auth.uid()::text = usuario_id);
CREATE POLICY "Usuarios pueden borrar sus perfiles" ON public.perfiles_facturacion FOR DELETE USING (auth.uid()::text = usuario_id);
-- Chats
CREATE POLICY "Usuarios pueden ver sus chats" ON public.chats FOR SELECT USING (auth.uid()::text = usuario_id);
CREATE POLICY "Usuarios pueden crear sus chats" ON public.chats FOR INSERT WITH CHECK (auth.uid()::text = usuario_id);
CREATE POLICY "Usuarios pueden actualizar sus chats" ON public.chats FOR UPDATE USING (auth.uid()::text = usuario_id);
CREATE POLICY "Usuarios pueden borrar sus chats" ON public.chats FOR DELETE USING (auth.uid()::text = usuario_id);
-- Mensajes
CREATE POLICY "Usuarios pueden ver mensajes de sus chats" ON public.mensajes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chats WHERE chats.id = mensajes.chat_id AND chats.usuario_id = auth.uid()::text)
);
CREATE POLICY "Usuarios pueden insertar mensajes en sus chats" ON public.mensajes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.chats WHERE chats.id = mensajes.chat_id AND chats.usuario_id = auth.uid()::text)
);
-- Vuelos
CREATE POLICY "Usuarios pueden ver sus vuelos" ON public.vuelos FOR SELECT USING (auth.uid()::text = usuario_id);
CREATE POLICY "Usuarios pueden gestionar sus vuelos" ON public.vuelos FOR ALL USING (auth.uid()::text = usuario_id);
-- Reservas Hoteles
CREATE POLICY "Usuarios pueden ver sus reservas de hotel" ON public.reservas_hoteles FOR SELECT USING (auth.uid()::text = usuario_id);
CREATE POLICY "Usuarios pueden gestionar sus reservas de hotel" ON public.reservas_hoteles FOR ALL USING (auth.uid()::text = usuario_id);
COMMIT;