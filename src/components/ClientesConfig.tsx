'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Users } from 'lucide-react';
import { createCliente } from '@/infrastructure/actions/clientes';

interface Props {
  clientes: any[];
  onAddCliente: (newCliente: any) => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

export default function ClientesConfig({
  clientes,
  onAddCliente,
  onError,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [cliNombre, setCliNombre] = useState('');
  const [cliTelefono, setCliTelefono] = useState('');
  const [cliNotas, setCliNotas] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    onSuccess(null);

    if (!cliNombre.trim()) {
      onError('El nombre y apellido del cliente es requerido.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createCliente(
          cliNombre.trim(),
          cliTelefono.trim() || undefined,
          cliNotas.trim() || undefined
        );
        onAddCliente(res);
        setCliNombre('');
        setCliTelefono('');
        setCliNotas('');
        onSuccess('Cliente registrado correctamente.');
      } catch (err: any) {
        onError(err.message || 'Error al registrar cliente.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-slate-100 text-base">Registrar Nuevo Cliente</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nombre y Apellido *
            </label>
            <input
              type="text"
              required
              value={cliNombre}
              onChange={(e) => setCliNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Teléfono / Celular
            </label>
            <input
              type="text"
              value={cliTelefono}
              onChange={(e) => setCliTelefono(e.target.value)}
              placeholder="Ej. 11 2345-6789"
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Notas / Observaciones
            </label>
            <textarea
              value={cliNotas}
              onChange={(e) => setCliNotas(e.target.value)}
              placeholder="Ej. Prefiere entrega los sábados, alergias, etc."
              rows={3}
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-1.5 bg-primary text-white py-3.5 px-4 rounded-xl font-bold hover:bg-primary/95 transition min-h-[48px] cursor-pointer"
          >
            <Plus className="h-5 w-5 text-white" />
            <span>{isPending ? 'Registrando...' : 'Registrar Cliente'}</span>
          </button>
        </form>
      </div>

      {/* List of registered clients */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-4.5 w-4.5 text-slate-400" />
          <span>Clientes Registrados ({clientes.length})</span>
        </h4>
        
        {clientes.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            No hay clientes registrados en el sistema.
          </div>
        ) : (
          <div className="space-y-2">
            {clientes.map((c) => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-200 text-sm">{c.nombre_apellido}</span>
                  {c.telefono && (
                    <span className="text-xs font-semibold text-slate-400">{c.telefono}</span>
                  )}
                </div>
                {c.notas && (
                  <p className="text-xs text-slate-500 bg-slate-950/40 p-2 rounded-lg mt-1 border border-slate-800/40">
                    {c.notas}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
