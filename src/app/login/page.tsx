'use client';

import React, { useTransition, useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-3xl font-extrabold tracking-tight text-primary">
          La Casa Cocina
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Gestión de Costos, Stock y Ventas
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-400">
              Correo Electrónico
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ejemplo@correo.com"
                className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-400">
              Contraseña
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-danger-rojo/10 p-3 text-sm border border-danger-rojo/20 text-danger-rojo font-medium">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center items-center rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-white shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition disabled:opacity-50 min-h-[48px]"
            >
              {isPending ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
