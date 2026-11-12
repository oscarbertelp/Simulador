import { RotateCcw } from 'lucide-react';

interface TopBarProps {
  onResetAll: () => void;
}

export function TopBar({ onResetAll }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#07090E]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        <a
          href="#simulador"
          className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
        >
          LorentzLab
        </a>

        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
        >
          <a
            href="#simulador"
            className="hover:text-slate-100 hover:underline hover:underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
          >
            Simulador
          </a>
          <a
            href="#curvas"
            className="hover:text-slate-100 hover:underline hover:underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
          >
            Curvas en Vivo
          </a>
          <a
            href="#ecuaciones"
            className="hover:text-slate-100 hover:underline hover:underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
          >
            Ecuaciones
          </a>
          <a
            href="#github-pages"
            className="hover:text-slate-100 hover:underline hover:underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
          >
            GitHub Pages
          </a>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100 hover:border-cyan-500/70 hover:text-cyan-200 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
