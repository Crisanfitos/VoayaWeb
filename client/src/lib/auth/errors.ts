export class FirestorePermissionError extends Error {
    public readonly request: any;

    constructor(context: any) {
        super("Supabase Permission Error");
        this.name = 'SupabaseError';
        this.request = context;
    }
}
