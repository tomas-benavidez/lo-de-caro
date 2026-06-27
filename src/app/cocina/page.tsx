import React from 'react';
import { getLotes } from '@/infrastructure/actions/lotes';
import { getRecetas } from '@/infrastructure/actions/recetas';
import { getInsumos } from '@/infrastructure/actions/insumos';
import LotesListClient from '@/components/LotesListClient';

export const revalidate = 0;

export default async function CocinaPage() {
  const lotes = await getLotes().catch(() => []);
  const recetas = await getRecetas().catch(() => []);
  const insumos = await getInsumos().catch(() => []);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Cocina Diaria</h1>
        <p className="text-sm text-slate-500 mt-1">Registro de lotes y control físico de insumos</p>
      </div>

      <LotesListClient inicialLotes={lotes} recetas={recetas} insumos={insumos} />
    </div>
  );
}
