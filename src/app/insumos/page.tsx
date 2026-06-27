import React from 'react';
import { getInsumos } from '@/infrastructure/actions/insumos';
import InsumosListClient from '@/components/InsumosListClient';

export const revalidate = 0;

export default async function InsumosPage() {
  const insumos = await getInsumos().catch(() => []);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Alacena de Insumos</h1>
        <p className="text-sm text-slate-500 mt-1">Control de materias primas y costos unitarios</p>
      </div>

      {/* Client component to handle real-time search, listing and modal */}
      <InsumosListClient inicialInsumos={insumos} />
    </div>
  );
}
