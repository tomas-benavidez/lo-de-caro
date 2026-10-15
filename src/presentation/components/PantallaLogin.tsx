import React, { useState } from 'react';
import { CredencialesLogin } from '../../domain/models/auth.ts';
import { Boton } from './Boton.tsx';

export interface PantallaLoginProps {
  onIniciarSesion: (credenciales: CredencialesLogin) => Promise<void>;
  error?: string | null;
  onLimpiarError?: () => void;
}

/**
 * Pantalla de inicio de sesión privada y mobile-first para "Lo de Caro".
 * Cumple estrictamente con los 5 estados obligatorios en cada control UI.
 */
export const PantallaLogin: React.FC<PantallaLoginProps> = ({
  onIniciarSesion,
  error: errorExterno,
  onLimpiarError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const errorActual = errorExterno || errorLocal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    if (onLimpiarError) onLimpiarError();

    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim) {
      setErrorLocal('Ingresá tu correo electrónico.');
      return;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(emailTrim)) {
      setErrorLocal('Ingresá un correo electrónico válido.');
      return;
    }

    if (!password) {
      setErrorLocal('Ingresá tu contraseña.');
      return;
    }

    setCargando(true);
    try {
      await onIniciarSesion({ email: emailTrim, password });
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : 'El correo electrónico o la contraseña son incorrectos.';
      setErrorLocal(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 sm:px-6 relative bg-[url('/backgrounds/back_mobile_1.png')] md:bg-[url('/backgrounds/back_desktop_1.png')] bg-cover bg-center bg-fixed">
      {/* Capa de atmósfera cálida para armonizar fondo y legibilidad */}
      <div className="absolute inset-0 bg-marca-beige/40 backdrop-blur-[1.5px] pointer-events-none" />

      {/* Contenedor principal de Login con tarjeta limpia y de alto contraste */}
      <div className="relative w-full max-w-[400px] sm:max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-marca-canela/25 overflow-hidden">
        {/* Franja superior con acento de marca */}
        <div className="h-2 w-full bg-gradient-to-r from-marca-tomate via-marca-canela to-marca-otono" />

        {/* Cabecera con Logo Oficial, Ilustración de Caro y Saludo */}
        <div className="pt-6 pb-4 px-6 text-center border-b border-stone-100/90 relative">
          {/* Logo oficial de marca */}
          <div className="mb-3 flex justify-center">
            <img
              src="/logos/png rojo.svg"
              alt="Logo Lo de Caro"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Personaje Principal como anfitrión de bienvenida */}
          <div className="relative inline-block my-2">
            <div className="absolute inset-0 bg-marca-canela/15 rounded-full blur-xl transform scale-125" />
            <img
              src="/personajes/personaje_principal.png"
              alt="Caro, cocinera y creadora de Lo de Caro"
              className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain mx-auto drop-shadow-lg transition-transform duration-300 hover:scale-105"
            />
            {/* Globo de bienvenida tipo sticker artesanal */}
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-marca-beige border border-marca-canela/40 text-marca-canela text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
              ¡Hola! Qué lindo verte en la cocina
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-marca-canela tracking-tight mt-3">
            Obrador Digital
          </h1>
          <p className="text-xs sm:text-sm font-medium text-stone-600 mt-1">
            Ingresá a tu panel de gestión de recetas, stock y ventas
          </p>

          {/* Pequeño detalle de personaje secundario como sello de calidad */}
          <img
            src="/personajes/Recurso 7.svg"
            alt=""
            aria-hidden="true"
            className="absolute top-4 right-4 w-7 h-7 opacity-70 pointer-events-none"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4" noValidate>
          {/* Alerta de Error Accesible */}
          {errorActual && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-xl bg-marca-tomate/10 border border-marca-tomate/30 text-marca-tomate text-xs sm:text-sm font-medium flex items-start space-x-2 shadow-sm"
            >
              <svg
                className="w-5 h-5 flex-shrink-0 text-marca-tomate mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="flex-1">{errorActual}</span>
            </div>
          )}

          {/* Campo: Correo Electrónico */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="email"
              className="block text-xs sm:text-sm font-bold text-stone-700"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                disabled={cargando}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorActual) {
                    setErrorLocal(null);
                    if (onLimpiarError) onLimpiarError();
                  }
                }}
                placeholder="caro@lodecaro.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 bg-white text-stone-800 placeholder-stone-400 shadow-sm transition-all
                  hover:border-stone-400
                  active:border-marca-canela
                  focus:outline-none focus:ring-2 focus:ring-marca-canela focus:border-marca-canela
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1
                  disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-bold text-stone-700"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={cargando}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorActual) {
                    setErrorLocal(null);
                    if (onLimpiarError) onLimpiarError();
                  }
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-stone-300 bg-white text-stone-800 placeholder-stone-400 shadow-sm transition-all
                  hover:border-stone-400
                  active:border-marca-canela
                  focus:outline-none focus:ring-2 focus:ring-marca-canela focus:border-marca-canela
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1
                  disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                disabled={cargando}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 transition-colors
                  hover:text-stone-600
                  active:text-stone-800
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela rounded-lg
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mostrarPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Botón de Enviar (Ingresar) con 5 estados obligatorios */}
          <div className="pt-2">
            <Boton
              type="submit"
              variante="primario"
              tamano="grande"
              disabled={cargando}
              className="w-full flex justify-center py-3 text-sm font-bold shadow-md tracking-wide rounded-xl"
            >
              {cargando ? (
                <span className="inline-flex items-center space-x-2">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  <span>Ingresando a la cocina...</span>
                </span>
              ) : (
                'Ingresar a la cocina'
              )}
            </Boton>
          </div>
        </form>

        {/* Pie de tarjeta informativo */}
        <div className="bg-stone-50/80 border-t border-stone-100 py-3 px-6 text-center">
          <p className="text-xs text-stone-500 font-medium">
            Panel privado de administración • Lo de Caro — Comida Casera
          </p>
        </div>
      </div>
    </div>
  );
};
