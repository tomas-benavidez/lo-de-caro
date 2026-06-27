import React from 'react';
import { getVentas } from '@/infrastructure/actions/ventas';
import { getProductos } from '@/infrastructure/actions/productos';
import { getClientes } from '@/infrastructure/actions/clientes';
import VentasPageClient from '@/components/VentasPageClient';

export const revalidate = 0;

export default async function VentasPage() {
  const ventas = await getVentas().catch(() => []);
  const productos = await getProductos().catch(() => []);
  const clientes = await getClientes().catch(() => []);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Mostrador de Ventas</h1>
        <p className="text-sm text-slate-500 mt-1">Cobro de productos terminados y control de deudas</p>
      </div>

      <VentasPageClient inicialVentas={ventas} productos={productos} clientes={clientes} />
    </div>
  );
}
