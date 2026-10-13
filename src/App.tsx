import React from 'react';
import { useAuth } from './presentation/hooks/useAuth.ts';
import { PantallaLogin } from './presentation/components/PantallaLogin.tsx';
import { PanelPrincipal } from './presentation/components/PanelPrincipal.tsx';

/**
 * Componente Raíz de "Lo de Caro".
 * Actúa como barrera de autenticación (Gatekeeper) estricta:
 * Si no hay una sesión activa, NINGÚN módulo o dato del negocio
 * se monta en el árbol de componentes ni se consulta a Supabase.
 */
export const App: React.FC = () => {
  const {
    usuario,
    cargandoSesion,
    errorAuth,
    iniciarSesion,
    cerrarSesion,
    limpiarError,
  } = useAuth();

  // 1. Estado de Carga Inicial: Verificando token persistido en Supabase
  if (cargandoSesion) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-marca-beige px-4">
        <div className="flex flex-col items-center space-y-4">
          <img
            src="/logos/png rojo.svg"
            alt="Logo Lo de Caro"
            className="h-16 w-auto object-contain animate-pulse"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex items-center space-x-2.5 text-marca-canela font-semibold text-sm">
            <svg
              className="animate-spin h-5 w-5 text-marca-canela"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Cargando Lo de Caro...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Sin Sesión Activa: Renderizado EXCLUSIVO de PantallaLogin
  // PanelPrincipal no se monta, impidiendo cualquier llamada a tablas de recetas, costos o clientes
  if (!usuario) {
    return (
      <PantallaLogin
        onIniciarSesion={iniciarSesion}
        error={errorAuth}
        onLimpiarError={limpiarError}
      />
    );
  }

  // 3. Sesión Autenticada Válida: Montaje del Panel Principal de Gestión
  return (
    <PanelPrincipal
      usuario={usuario}
      onCerrarSesion={cerrarSesion}
    />
  );
};

export default App;
