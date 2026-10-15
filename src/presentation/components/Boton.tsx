import React from 'react';

export interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'peligro' | 'tomate' | 'cancelar';
  tamano?: 'chico' | 'mediano' | 'grande';
  children: React.ReactNode;
}

/**
 * Componente Botón con los 5 estados obligatorios de UI:
 * 1. Default (reposo)
 * 2. Hover (hover:...)
 * 3. Active (active:...)
 * 4. Focus (:focus-visible con anillo de alto contraste, 100% accesible)
 * 5. Disabled (disabled:...)
 */
export const Boton = React.forwardRef<HTMLButtonElement, BotonProps>(
  (
    {
      variante = 'primario',
      tamano = 'mediano',
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const estilosBase =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const estilosVariante = {
      primario:
        'bg-marca-canela text-white hover:bg-[#8e5230] active:bg-[#7b4629] focus-visible:ring-marca-canela focus-visible:ring-offset-marca-beige shadow-sm',
      secundario:
        'bg-transparent text-marca-canela border-2 border-marca-canela hover:bg-marca-canela/10 active:bg-marca-canela/20 focus-visible:ring-marca-canela focus-visible:ring-offset-marca-beige',
      peligro:
        'bg-marca-tomate text-white hover:bg-[#a62f22] active:bg-[#8f281d] focus-visible:ring-marca-tomate focus-visible:ring-offset-marca-beige shadow-sm',
      tomate:
        'bg-marca-tomate text-white font-bold hover:bg-marca-tomate/90 active:bg-[#9f1f13] focus-visible:ring-marca-tomate focus-visible:ring-offset-marca-beige shadow-md rounded-xl',
      cancelar:
        'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 hover:text-stone-900 active:bg-stone-100 focus-visible:ring-marca-canela focus-visible:ring-offset-marca-beige rounded-xl',
    };

    const estilosTamano = {
      chico: 'px-3 py-1.5 text-xs',
      mediano: 'px-4 py-2.5 text-sm',
      grande: 'px-6 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${estilosBase} ${estilosVariante[variante]} ${estilosTamano[tamano]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Boton.displayName = 'Boton';
