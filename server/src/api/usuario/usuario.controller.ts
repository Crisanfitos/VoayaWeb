/**
 * Usuario Controller
 * API endpoints para gestión de usuarios y preferencias
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../supabase/admin';

const router = Router();

// Tipos para preferencias IA
interface PreferenciasIA {
    aventura: number;    // 0-100 (relax -> aventura)
    lujo: number;        // 0-100 (económico -> lujo)
    naturaleza: number;  // 0-100 (naturaleza -> ciudad)
    espontaneo: number;  // 0-100 (planificado -> espontáneo)
}

/**
 * GET /usuarios/:id
 * Obtener datos de usuario
 */
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const { data: usuario, error } = await supabaseAdmin
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ usuario });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * PATCH /usuarios/:id/preferencias
 * Actualizar preferencias IA del usuario
 */
router.patch('/:userId/preferencias', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { preferenciasIa } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        if (!preferenciasIa || typeof preferenciasIa !== 'object') {
            return res.status(400).json({ error: 'preferenciasIa required' });
        }

        // Validar que los valores estén en rango 0-100
        const { aventura, lujo, naturaleza, espontaneo } = preferenciasIa;
        const valores = [aventura, lujo, naturaleza, espontaneo];

        for (const val of valores) {
            if (val !== undefined && (typeof val !== 'number' || val < 0 || val > 100)) {
                return res.status(400).json({
                    error: 'Los valores de preferencias deben ser números entre 0 y 100'
                });
            }
        }

        const { error } = await supabaseAdmin
            .from('usuarios')
            .update({
                preferencias_ia: preferenciasIa,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        res.json({
            ok: true,
            mensaje: 'Preferencias actualizadas',
            preferenciasIa
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

/**
 * PATCH /usuarios/:id
 * Actualizar perfil de usuario
 */
router.patch('/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { nombre, apellidos, bio, avatarUrl, temaModo } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const updateData: Record<string, any> = {
            fecha_actualizacion: new Date().toISOString()
        };

        if (nombre !== undefined) updateData.nombre = nombre;
        if (apellidos !== undefined) updateData.apellidos = apellidos;
        if (bio !== undefined) updateData.bio = bio;
        if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
        if (temaModo !== undefined) updateData.tema_modo = temaModo;

        const { error } = await supabaseAdmin
            .from('usuarios')
            .update(updateData)
            .eq('id', userId);

        if (error) throw error;

        res.json({ ok: true, mensaje: 'Perfil actualizado' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
