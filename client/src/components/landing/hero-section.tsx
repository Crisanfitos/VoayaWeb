import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative w-full">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-8 sm:py-12 lg:py-20">
        <div className="rounded-3xl overflow-hidden relative min-h-[560px] flex flex-col items-center justify-center p-6 sm:p-12 text-center isolate shadow-2xl shadow-slate-900/20">
          {/* Background Image */}
          <div
            className="absolute inset-0 z-[-1] bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%), url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop")`
            }}
          />

          {/* Content */}
          <div className="flex flex-col gap-6 max-w-3xl mx-auto items-center animate-fade-in-up">
            {/* AI Badge */}
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md text-xs font-bold text-white mb-2 shadow-sm">
              <span className="material-symbols-outlined text-sm text-sky-300">auto_awesome</span>
              Potenciado por Inteligencia Artificial
            </span>

            {/* Heading */}
            <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight drop-shadow-lg">
              Descubre el mundo,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-white">
                curado por IA
              </span>
            </h1>

            {/* Description */}
            <p className="text-slate-100 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed drop-shadow-md">
              Voaya crea itinerarios personalizados en segundos basados en tu estilo de viaje único. Deja de buscar y empieza a viajar.
            </p>

            {/* Search Bar */}
            <label className="flex flex-col w-full max-w-lg mt-6 group">
              <div className="flex w-full items-center h-14 sm:h-16 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/40 focus-within:border-voaya-primary focus-within:ring-4 focus-within:ring-voaya-primary/20 transition-all overflow-hidden">
                <div className="pl-4 sm:pl-6 text-slate-400">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="w-full bg-transparent border-none text-slate-800 placeholder:text-slate-400 focus:ring-0 px-4 text-base sm:text-lg font-medium outline-none"
                  placeholder="¿A dónde quieres ir?"
                />
                <div className="pr-2">
                  <Link href="/plan">
                    <button className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl bg-voaya-primary hover:bg-voaya-primary-dark text-white text-sm sm:text-base font-bold transition-colors shadow-md">
                      Viajar
                    </button>
                  </Link>
                </div>
              </div>
            </label>

            {/* Social Proof */}
            <div className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-white/50 bg-gradient-to-br from-blue-400 to-purple-500" />
                <div className="w-8 h-8 rounded-full border-2 border-white/50 bg-gradient-to-br from-green-400 to-teal-500" />
                <div className="w-8 h-8 rounded-full border-2 border-white/50 bg-gradient-to-br from-orange-400 to-red-500" />
              </div>
              <p className="text-sm text-white font-semibold drop-shadow-md">
                +10,000 viajeros felices
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
