'use client';

import { supabase } from '@/supabase/client';
import { errorEmitter } from './error-emitter';

/**
 * Initiates an update operation for a record.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(table: string, id: string, data: any) {
    supabase.from(table).update(data).eq('id', id)
        .then(({ error }) => {
            if (error) {
                console.error(`Error updating ${table} ${id}`, error);
                // emit generic error
                errorEmitter.emit('permission-error', new Error(error.message) as any);
            }
        });
}

/**
 * Initiates a delete operation.
 */
export function deleteDocumentNonBlocking(table: string, id: string) {
    supabase.from(table).delete().eq('id', id)
        .then(({ error }) => {
            if (error) {
                console.error(`Error deleting ${table} ${id}`, error);
                errorEmitter.emit('permission-error', new Error(error.message) as any);
            }
        });
}

export function setDocumentNonBlocking(table: string, id: string, data: any) {
    // Upsert or Insert
    supabase.from(table).upsert({ id, ...data })
        .then(({ error }) => {
            if (error) {
                console.error(`Error setting ${table} ${id}`, error);
                errorEmitter.emit('permission-error', new Error(error.message) as any);
            }
        });
}
