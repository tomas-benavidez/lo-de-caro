import React from 'react';
import { getCostosFijos } from '@/infrastructure/actions/costos_fijos';
import { getInversiones } from '@/infrastructure/actions/inversiones';
import { getConfiguraciones } from '@/infrastructure/actions/configuracion';
import ConfiguracionClient from '@/components/ConfiguracionClient';

export const revalidate = 0;

export default async function ConfigPage() {
  const costosFijos = await getCostosFijos().catch(() => []);
  const inversiones = await getInversiones().catch(() => []);
  const config = await getConfiguraciones().catch(() => []);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configuración del Negocio</h1>
        <p className="text-sm text-slate-500 mt-1">Gastos de estructura, amortizaciones y metas</p>
      </div>

      <ConfiguracionClient
        inicialCostosFijos={costosFijos}
        inicialInversiones={inversiones}
        inicialConfig={config}
      />
    </div>
  );
}
