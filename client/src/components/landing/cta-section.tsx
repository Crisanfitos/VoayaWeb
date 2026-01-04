import Link from "next/link";

export function CtaSection() {
    return (
        <section className="py-20 relative overflow-hidden bg-slate-50 dark:bg-surface-dark">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/40 dark:from-voaya-primary/10 via-transparent to-transparent" />
            <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
                <h2 className="text-3xl sm:text-5xl font-black text-text-main dark:text-white mb-6 tracking-tight">
                    ¿Listo para tu próxima aventura?
                </h2>
                <p className="text-lg text-text-secondary dark:text-text-muted mb-10 max-w-2xl mx-auto">
                    Únete a miles de viajeros que están descubriendo el mundo de una manera más inteligente.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/signup">
                        <button className="h-14 px-8 rounded-2xl bg-voaya-primary hover:bg-voaya-primary-dark text-white text-lg font-bold shadow-xl shadow-voaya-primary/25 transition-all transform hover:scale-105">
                            Empezar Gratis
                        </button>
                    </Link>
                    <Link href="/plan">
                        <button className="h-14 px-8 rounded-2xl bg-white dark:bg-surface-darker border border-stroke dark:border-input-dark text-text-main dark:text-white text-lg font-bold hover:bg-slate-50 dark:hover:bg-input-dark hover:shadow-lg transition-all">
                            Ver Demo
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
