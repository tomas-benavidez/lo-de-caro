import React from 'react';
import Link from 'next/link';
import { ShoppingCart, ChefHat, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { getVentas } from '@/infrastructure/actions/ventas';
import { getInsumos } from '@/infrastructure/actions/insumos';
import { getCostosFijos } from '@/infrastructure/actions/costos_fijos';
import { getInversiones } from '@/infrastructure/actions/inversiones';
import { getConfiguraciones } from '@/infrastructure/actions/configuracion';
import { getLotes } from '@/infrastructure/actions/lotes';

export const revalidate = 0; // Avoid caching to see real-time updates

export default async function DashboardPage() {
  // 1. Fetch data from all sources
  const ventas = await getVentas().catch(() => []);
  const insumos = await getInsumos().catch(() => []);
  const costosFijosList = await getCostosFijos().catch(() => []);
  const inversionesList = await getInversiones().catch(() => []);
  const configMeta = await getConfiguraciones().catch(() => []);
  const lotes = await getLotes().catch(() => []);

  // 2. Monthly production meta
  const metaProduccion = Number(configMeta.find(c => c.clave === 'estimacion_mensual_produccion')?.valor || 1000);

  // 3. Process current month's KPIs (filtering locally by date)
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const ventasDelMes = ventas.filter(v => new Date(v.fecha) >= primerDiaMes);
  const lotesDelMes = lotes.filter(l => new Date(l.fecha) >= primerDiaMes);

  // Total units produced
  const totalElaborado = lotesDelMes.reduce((sum, l) => sum + Number(l.cantidad_producida), 0);
  const porcentajeCompletado = metaProduccion > 0 ? Math.min(Math.round((totalElaborado / metaProduccion) * 100), 100) : 0;

  // Sales total cobrado (paid)
  const totalCobrado = ventasDelMes
    .filter(v => v.estado_cobro === 'Cobrada')
    .reduce((sum, v) => sum + (v.venta_items?.reduce((s: number, i: any) => s + (Number(i.precio_cobrado_real) * i.cantidad), 0) || 0), 0);

  // Sales total pendiente (unpaid/debt)
  const totalPendiente = ventasDelMes
    .filter(v => v.estado_cobro === 'Pendiente')
    .reduce((sum, v) => sum + (v.venta_items?.reduce((s: number, i: any) => s + (Number(i.precio_cobrado_real) * i.cantidad), 0) || 0), 0);

  // Amortized fixed costs
  const costosFijosDirectos = costosFijosList.reduce((sum, c) => sum + Number(c.monto), 0);
  const depreciacionMaquinas = inversionesList.reduce((sum, inv) => {
    const depMensual = Number(inv.monto) / (Number(inv.vida_util_anios) * 12);
    return sum + depMensual;
  }, 0);
  const costosFijosTotales = costosFijosDirectos + depreciacionMaquinas;

  // Low stock items count
  const insumosBajoMinimo = insumos.filter(ins => ins.stock_minimo && ins.stock_actual <= ins.stock_minimo);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Resumen Mensual</h1>
        <p className="text-sm text-slate-500 mt-1">Margen y rentabilidad real del negocio</p>
      </div>

      {/* Critical Stock Notification */}
      {insumosBajoMinimo.length > 0 && (
        <Link 
          href="/insumos" 
          className="flex items-center gap-3 bg-danger-rojo/10 border border-danger-rojo/20 text-danger-rojo p-4 rounded-2xl active:scale-98 transition-transform"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-danger-rojo" />
          <div className="text-sm">
            <span className="font-bold">{insumosBajoMinimo.length} insumos</span> están por debajo de su stock mínimo. Reabastecer alacena.
          </div>
        </Link>
      )}

      {/* Financial KPIs grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Sales Cobradas */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas Cobradas</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-verde/10 text-success-verde">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-success-verde mt-2">
              ${totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800/50">
            Margen operativo real percibido este mes
          </div>
        </div>

        {/* Cuentas Pendientes (Por Cobrar) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuentas Pendientes (Por Cobrar)</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Activity className="h-4 w-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-accent mt-2">
              ${totalPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800/50">
            Dinero entregado en mercadería por cobrar
          </div>
        </div>

        {/* Costos Estructurales */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costos Estructurales (Fijos + Amortización)</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger-rojo/10 text-danger-rojo">
                <ArrowDownRight className="h-4 w-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-danger-rojo mt-2">
              ${costosFijosTotales.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800/50 flex justify-between">
            <span>Fijos: ${costosFijosDirectos.toLocaleString('es-AR')}</span>
            <span>Amortización: ${depreciacionMaquinas.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Quick Action buttons (Touch size optimized) */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/ventas"
          className="flex flex-col items-center justify-center bg-primary text-white p-5 rounded-2xl font-bold shadow-md hover:bg-primary/95 active:scale-95 transition min-h-[100px]"
        >
          <ShoppingCart className="h-7 w-7 mb-2 text-white" />
          <span className="text-sm">Cobrar Venta</span>
        </Link>
        <Link
          href="/cocina"
          className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 text-slate-100 p-5 rounded-2xl font-bold shadow-sm hover:bg-slate-800 active:scale-95 transition min-h-[100px]"
        >
          <ChefHat className="h-7 w-7 mb-2 text-primary" />
          <span className="text-sm">Registrar Cocina</span>
        </Link>
      </div>

      {/* Monthly Production Goal progress bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center text-sm font-semibold">
          <span className="text-slate-400">Meta de Producción Mensual</span>
          <span className="text-primary font-bold">{metaProduccion} u.</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full bg-slate-800 h-3 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-300" 
            style={{ width: `${porcentajeCompletado}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>{totalElaborado} u. elaboradas</span>
          <span>{porcentajeCompletado}% completado</span>
        </div>
      </div>
    </div>
  );
}
