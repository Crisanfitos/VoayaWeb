export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="py-12 bg-white dark:bg-surface-dark">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Timeline Content */}
                    <div className="order-2 lg:order-1">
                        <h2 className="text-3xl font-bold text-text-main dark:text-white mb-8">
                            Cómo funciona Voaya
                        </h2>
                        <div className="grid grid-cols-[48px_1fr] gap-x-4">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center pt-1">
                                <div className="w-10 h-10 rounded-full bg-voaya-primary text-white flex items-center justify-center shadow-lg shadow-voaya-primary/30 z-10">
                                    <span className="material-symbols-outlined text-xl">edit_note</span>
                                </div>
                                <div className="w-[2px] bg-stroke dark:bg-input-dark h-full min-h-[60px] my-2" />
                            </div>
                            <div className="pb-10 pt-1">
                                <p className="text-voaya-primary text-sm font-bold tracking-wider uppercase mb-1">Paso 1</p>
                                <h3 className="text-text-main dark:text-white text-xl font-bold mb-2">Comparte tu Sueño</h3>
                                <p className="text-text-secondary dark:text-text-muted">
                                    Cuéntanos qué te gusta. ¿Playa o montaña? ¿Lujo o aventura? Nuestro chat intuitivo te entiende.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center pt-1">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark text-text-muted dark:text-white flex items-center justify-center z-10 shadow-sm">
                                    <span className="material-symbols-outlined text-xl">psychology</span>
                                </div>
                                <div className="w-[2px] bg-stroke dark:bg-input-dark h-full min-h-[60px] my-2" />
                            </div>
                            <div className="pb-10 pt-1">
                                <p className="text-text-muted text-sm font-bold tracking-wider uppercase mb-1">Paso 2</p>
                                <h3 className="text-text-main dark:text-white text-xl font-bold mb-2">Procesamiento con IA</h3>
                                <p className="text-text-secondary dark:text-text-muted">
                                    Nuestros algoritmos analizan millones de puntos de datos, reseñas y precios para construir tu viaje ideal.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center pt-1">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark text-text-muted dark:text-white flex items-center justify-center z-10 shadow-sm">
                                    <span className="material-symbols-outlined text-xl">map</span>
                                </div>
                            </div>
                            <div className="pt-1">
                                <p className="text-text-muted text-sm font-bold tracking-wider uppercase mb-1">Paso 3</p>
                                <h3 className="text-text-main dark:text-white text-xl font-bold mb-2">Tu Itinerario Perfecto</h3>
                                <p className="text-text-secondary dark:text-text-muted">
                                    Recibe una guía completa con reservas, mapas offline y recomendaciones personalizadas.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Map Visual */}
                    <div className="order-1 lg:order-2 h-full min-h-[400px] flex flex-col">
                        <div className="relative flex-1 rounded-3xl overflow-hidden bg-slate-100 dark:bg-surface-dark shadow-2xl shadow-slate-200 dark:shadow-black/20 border border-stroke dark:border-input-dark">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-105 duration-700 opacity-90"
                                style={{
                                    backgroundImage: `url("https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop")`
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 dark:from-background-dark/50 via-transparent to-transparent" />

                            {/* Search overlay */}
                            <div className="absolute top-6 left-6 right-6 flex items-center gap-3">
                                <div className="flex-1 bg-white/90 dark:bg-surface-dark/90 backdrop-blur border border-white/60 dark:border-input-dark rounded-xl h-12 flex items-center px-4 shadow-lg">
                                    <span className="material-symbols-outlined text-text-muted">search</span>
                                    <span className="ml-3 text-text-secondary dark:text-text-muted text-sm">Explorar rutas populares...</span>
                                </div>
                            </div>

                            {/* Map controls */}
                            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                                <button className="size-10 rounded-xl bg-white dark:bg-surface-dark text-text-main dark:text-white shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-input-dark transition-colors">
                                    <span className="material-symbols-outlined">near_me</span>
                                </button>
                                <div className="flex flex-col rounded-xl bg-white dark:bg-surface-dark shadow-lg overflow-hidden">
                                    <button className="size-10 flex items-center justify-center text-text-main dark:text-white hover:bg-slate-50 dark:hover:bg-input-dark border-b border-stroke dark:border-input-dark">
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                    <button className="size-10 flex items-center justify-center text-text-main dark:text-white hover:bg-slate-50 dark:hover:bg-input-dark">
                                        <span className="material-symbols-outlined">remove</span>
                                    </button>
                                </div>
                            </div>

                            {/* Floating Pin */}
                            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce duration-[2000ms]">
                                <div className="px-3 py-1.5 bg-white dark:bg-surface-dark rounded-lg shadow-xl text-xs font-bold text-text-main dark:text-white mb-2 border border-stroke dark:border-input-dark">
                                    París, 4 días
                                </div>
                                <span className="material-symbols-outlined text-voaya-primary text-4xl drop-shadow-xl fill">location_on</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
