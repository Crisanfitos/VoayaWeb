import Link from "next/link";

export function FeaturesSection() {
    return (
        <section id="features" className="py-16 sm:py-24 bg-background-light dark:bg-background">
            <div className="max-w-[1024px] mx-auto px-4 sm:px-10">
                <div className="flex flex-col md:flex-row gap-12 items-start justify-between mb-16">
                    <div className="flex flex-col gap-4 max-w-xl">
                        <h2 className="text-text-main dark:text-white text-3xl sm:text-4xl font-bold leading-tight">
                            ¿Por qué planificar con Voaya?
                        </h2>
                        <p className="text-text-secondary dark:text-text-muted text-lg">
                            Experimenta el futuro de la planificación de viajes con nuestro asistente inteligente que aprende de ti.
                        </p>
                    </div>
                    <Link href="/plan">
                        <button className="shrink-0 h-12 px-6 rounded-xl bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark text-text-main dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-input-dark hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                            <span>Conocer más sobre nuestra IA</span>
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Feature 1 */}
                    <div className="group flex flex-col gap-4 rounded-2xl border border-stroke dark:border-input-dark bg-white dark:bg-surface-dark p-6 hover:border-voaya-primary/50 transition-all hover:shadow-soft hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-voaya-primary group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                        </div>
                        <div>
                            <h3 className="text-text-main dark:text-white text-xl font-bold mb-2">Itinerarios Inteligentes</h3>
                            <p className="text-text-secondary dark:text-text-muted text-sm leading-relaxed">
                                Planes día a día hechos a medida que se adaptan a tu ritmo, preferencias y tiempos de viaje.
                            </p>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="group flex flex-col gap-4 rounded-2xl border border-stroke dark:border-input-dark bg-white dark:bg-surface-dark p-6 hover:border-green-500/50 transition-all hover:shadow-soft hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">attach_money</span>
                        </div>
                        <div>
                            <h3 className="text-text-main dark:text-white text-xl font-bold mb-2">Optimización de Presupuesto</h3>
                            <p className="text-text-secondary dark:text-text-muted text-sm leading-relaxed">
                                Saca el máximo partido a tu dinero con seguimiento de precios en tiempo real y ofertas exclusivas.
                            </p>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="group flex flex-col gap-4 rounded-2xl border border-stroke dark:border-input-dark bg-white dark:bg-surface-dark p-6 hover:border-purple-500/50 transition-all hover:shadow-soft hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">location_on</span>
                        </div>
                        <div>
                            <h3 className="text-text-main dark:text-white text-xl font-bold mb-2">Joyas Ocultas</h3>
                            <p className="text-text-secondary dark:text-text-muted text-sm leading-relaxed">
                                Descubre secretos locales y lugares auténticos que no aparecen en las guías estándar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
