import React from 'react';
import { getCostosFijos } from '@/infrastructure/actions/costos_fijos';
import { getInversiones } from '@/infrastructure/actions/inversiones';
import { getConfiguraciones } from '@/infrastructure/actions/configuracion';
import { getInsumos } from '@/infrastructure/actions/insumos';
import { getRecetas } from '@/infrastructure/actions/recetas';
import { getProductos } from '@/infrastructure/actions/productos';
import { getClientes } from '@/infrastructure/actions/clientes';
import ConfiguracionClient from '@/components/ConfiguracionClient';

export const revalidate = 0;

export default async function ConfigPage() {
  const costosFijos = await getCostosFijos().catch(() => []);
  const inversiones = await getInversiones().catch(() => []);
  const config = await getConfiguraciones().catch(() => []);
  const insumos = await getInsumos().catch(() => []);
  const recetas = await getRecetas().catch(() => []);
  const productos = await getProductos().catch(() => []);
  const clientes = await getClientes().catch(() => []);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configuración del Negocio</h1>
        <p className="text-sm text-slate-500 mt-1">Gastos de estructura, amortizaciones, metas y catálogos</p>
      </div>

      <ConfiguracionClient
        inicialCostosFijos={costosFijos}
        inicialInversiones={inversiones}
        inicialConfig={config}
        inicialInsumos={insumos}
        inicialRecetas={recetas}
        inicialProductos={productos}
        inicialClientes={clientes}
      />
    </div>
  );
}
