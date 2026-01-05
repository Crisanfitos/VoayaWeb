/**
 * Tipos de datos para Preferencias de Usuario
 * Corresponde a columnas en la tabla `usuarios` y tabla `perfiles_facturacion`
 */

/**
 * Preferencias de IA para personalizar recomendaciones
 * Valores de 0 a 100
 */
export interface PreferenciasIA {
    aventura: number;    // 0 = relax, 100 = aventura
    lujo: number;        // 0 = económico, 100 = lujo
    naturaleza: number;  // 0 = naturaleza, 100 = ciudad
    espontaneo: number;  // 0 = planificado, 100 = espontáneo
}

export const PREFERENCIAS_IA_DEFAULT: PreferenciasIA = {
    aventura: 50,
    lujo: 50,
    naturaleza: 50,
    espontaneo: 50,
};

/**
 * Perfil de facturación del usuario
 * Corresponde a la tabla `perfiles_facturacion`
 */
export type TipoPerfilFacturacion = 'individual' | 'empresa';

export interface PerfilFacturacion {
    id: string;
    usuarioId: string;
    tipo: TipoPerfilFacturacion;
    nif?: string;
    razonSocial?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
    pais?: string;
    esPrincipal: boolean;
    fechaCreacion: string;
    fechaActualizacion: string;
}

/**
 * Helper para mapear datos de DB (snake_case) a API (camelCase)
 */
export function mapearPerfilFacturacionDesdeBD(perfil: any): PerfilFacturacion {
    return {
        id: perfil.id,
        usuarioId: perfil.usuario_id,
        tipo: perfil.tipo,
        nif: perfil.nif,
        razonSocial: perfil.razon_social,
        direccion: perfil.direccion,
        ciudad: perfil.ciudad,
        provincia: perfil.provincia,
        codigoPostal: perfil.codigo_postal,
        pais: perfil.pais,
        esPrincipal: perfil.es_principal || false,
        fechaCreacion: perfil.fecha_creacion,
        fechaActualizacion: perfil.fecha_actualizacion,
    };
}

/**
 * Helper para mapear datos de API (camelCase) a DB (snake_case)
 */
export function mapearPerfilFacturacionABD(perfil: Partial<PerfilFacturacion>): Record<string, any> {
    const resultado: Record<string, any> = {};

    if (perfil.usuarioId !== undefined) resultado.usuario_id = perfil.usuarioId;
    if (perfil.tipo !== undefined) resultado.tipo = perfil.tipo;
    if (perfil.nif !== undefined) resultado.nif = perfil.nif;
    if (perfil.razonSocial !== undefined) resultado.razon_social = perfil.razonSocial;
    if (perfil.direccion !== undefined) resultado.direccion = perfil.direccion;
    if (perfil.ciudad !== undefined) resultado.ciudad = perfil.ciudad;
    if (perfil.provincia !== undefined) resultado.provincia = perfil.provincia;
    if (perfil.codigoPostal !== undefined) resultado.codigo_postal = perfil.codigoPostal;
    if (perfil.pais !== undefined) resultado.pais = perfil.pais;
    if (perfil.esPrincipal !== undefined) resultado.es_principal = perfil.esPrincipal;

    return resultado;
}
