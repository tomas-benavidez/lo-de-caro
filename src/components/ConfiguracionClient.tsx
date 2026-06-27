'use client';

import React, { useState, useTransition } from 'react';
import { Target, DollarSign, Briefcase, Plus, Percent } from 'lucide-react';
import { upsertConfiguracion } from '@/infrastructure/actions/configuracion';
import { createCostoFijo } from '@/infrastructure/actions/costos_fijos';
import { createInversion } from '@/infrastructure/actions/inversiones';

interface Props {
  inicialCostosFijos: any[];
  inicialInversiones: any[];
  inicialConfig: any[];
}

export default function ConfiguracionClient({
  inicialCostosFijos,
  inicialInversiones,
  inicialConfig,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<'meta' | 'costos' | 'inversiones'>('meta');
  
  // States
  const [costosFijos, setCostosFijos] = useState<any[]>(inicialCostosFijos);
  const [inversiones, setInversiones] = useState<any[]>(inicialInversiones);
  const [config, setConfig] = useState<any[]>(inicialConfig);

  // Form states
  const [metaVal, setMetaVal] = useState(
    config.find(c => c.clave === 'estimacion_mensual_produccion')?.valor || '1000'
  );
  const [costoConcepto, setCostoConcepto] = useState('');
  const [costoMonto, setCostoMonto] = useState('');
  const [invNombre, setInvNombre] = useState('');
  const [invMonto, setInvMonto] = useState('');
  const [invVidaUtil, setInvVidaUtil] = useState('');
  const [invFecha, setInvFecha] = useState(new Date().toISOString().split('T')[0]);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handlers
  const handleUpdateMeta = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const valNum = Number(metaVal);
    if (isNaN(valNum) || valNum <= 0) {
      setError('La meta debe ser un número entero positivo.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await upsertConfiguracion('estimacion_mensual_produccion', metaVal);
        setConfig(prev => {
          const exists = prev.some(c => c.clave === 'estimacion_mensual_produccion');
          if (exists) {
            return prev.map(c => c.clave === 'estimacion_mensual_produccion' ? res : c);
          }
          return [...prev, res];
        });
        setSuccessMsg('Meta mensual de producción actualizada correctamente.');
      } catch (err: any) {
        setError(err.message || 'Error al guardar la configuración.');
      }
    });
  };

  const handleAddCosto = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const montoNum = Number(costoMonto);
    if (!costoConcepto.trim() || isNaN(montoNum) || montoNum <= 0) {
      setError('Por favor completa todos los campos con valores válidos.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createCostoFijo(costoConcepto, montoNum);
        setCostosFijos(prev => [...prev, res].sort((a, b) => a.concepto.localeCompare(b.concepto)));
        setCostoConcepto('');
        setCostoMonto('');
        setSuccessMsg('Costo fijo agregado exitosamente.');
      } catch (err: any) {
        setError(err.message || 'Error al agregar costo fijo.');
      }
    });
  };

  const handleAddInversion = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const montoNum = Number(invMonto);
    const vidaNum = Number(invVidaUtil);

    if (!invNombre.trim() || isNaN(montoNum) || montoNum <= 0 || isNaN(vidaNum) || vidaNum <= 0 || !invFecha) {
      setError('Por favor completa todos los campos con valores válidos.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createInversion(invNombre, montoNum, vidaNum, invFecha);
        setInversiones(prev => [res, ...prev]);
        setInvNombre('');
        setInvMonto('');
        setInvVidaUtil('');
        setSuccessMsg('Inversión registrada correctamente.');
      } catch (err: any) {
        setError(err.message || 'Error al registrar la inversión.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration tabs */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => { setTab('meta'); setError(null); setSuccessMsg(null); }}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition min-h-[40px] flex items-center justify-center gap-1.5 ${
            tab === 'meta' ? 'bg-slate-800 text-slate-100' : 'text-slate-500'
          }`}
        >
          <Target className="h-4.5 w-4.5" />
          Meta
        </button>
        <button
          onClick={() => { setTab('costos'); setError(null); setSuccessMsg(null); }}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition min-h-[40px] flex items-center justify-center gap-1.5 ${
            tab === 'costos' ? 'bg-slate-800 text-slate-100' : 'text-slate-500'
          }`}
        >
          <DollarSign className="h-4.5 w-4.5" />
          Costos Fijos
        </button>
        <button
          onClick={() => { setTab('inversiones'); setError(null); setSuccessMsg(null); }}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition min-h-[40px] flex items-center justify-center gap-1.5 ${
            tab === 'inversiones' ? 'bg-slate-800 text-slate-100' : 'text-slate-500'
          }`}
        >
          <Briefcase className="h-4.5 w-4.5" />
          Inversiones
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-danger-rojo/10 p-3.5 text-sm border border-danger-rojo/20 text-danger-rojo font-medium">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-success-verde/10 p-3.5 text-sm border border-success-verde/20 text-success-verde font-medium">
          {successMsg}
        </div>
      )}

      {/* Meta Tab */}
      {tab === 'meta' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base">Meta de Producción Mensual</h3>
            <p className="text-xs text-slate-500 mt-1">Establece el objetivo de porciones a producir en el mes en curso.</p>
          </div>
          
          <form onSubmit={handleUpdateMeta} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Unidades Estimadas
              </label>
              <input
                type="number"
                required
                value={metaVal}
                onChange={(e) => setMetaVal(e.target.value)}
                placeholder="Ej. 1000"
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center bg-primary text-white py-3.5 px-4 rounded-xl font-bold hover:bg-primary/95 transition min-h-[48px]"
            >
              {isPending ? 'Guardando...' : 'Actualizar Meta'}
            </button>
          </form>
        </div>
      )}

      {/* Costos Fijos Tab */}
      {tab === 'costos' && (
        <div className="space-y-6">
          {/* Create form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-100 text-base">Agregar Costo Fijo Mensual</h3>
            
            <form onSubmit={handleAddCosto} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Concepto / Servicio</label>
                  <input
                    type="text"
                    required
                    value={costoConcepto}
                    onChange={(e) => setCostoConcepto(e.target.value)}
                    placeholder="Ej. Alquiler local, Internet"
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monto Mensual ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={costoMonto}
                    onChange={(e) => setCostoMonto(e.target.value)}
                    placeholder="Ej. 45000"
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-primary text-white py-3.5 px-4 rounded-xl font-bold hover:bg-primary/95 transition min-h-[48px]"
              >
                <Plus className="h-5 w-5 text-white" />
                <span>Agregar Costo Fijo</span>
              </button>
            </form>
          </div>

          {/* List of Fixed Costs */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Conceptos Registrados</h4>
            {costosFijos.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                No hay costos fijos mensuales cargados.
              </div>
            ) : (
              <div className="space-y-2">
                {costosFijos.map((costo) => (
                  <div key={costo.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                    <span className="font-bold text-slate-200 text-sm">{costo.concepto}</span>
                    <span className="font-black text-danger-rojo text-base">
                      ${Number(costo.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inversiones Tab */}
      {tab === 'inversiones' && (
        <div className="space-y-6">
          {/* Register Investment Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-100 text-base">Registrar Inversión (Bienes de Capital)</h3>
            
            <form onSubmit={handleAddInversion} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Bien / Máquina</label>
                  <input
                    type="text"
                    required
                    value={invNombre}
                    onChange={(e) => setInvNombre(e.target.value)}
                    placeholder="Ej. Sobadora Industrial, Freezer"
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monto ($)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={invMonto}
                      onChange={(e) => setInvMonto(e.target.value)}
                      placeholder="Ej. 180000"
                      className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vida Útil (Años)</label>
                    <input
                      type="number"
                      required
                      value={invVidaUtil}
                      onChange={(e) => setInvVidaUtil(e.target.value)}
                      placeholder="Ej. 5"
                      className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha de Compra</label>
                  <input
                    type="date"
                    required
                    value={invFecha}
                    onChange={(e) => setInvFecha(e.target.value)}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-primary text-white py-3.5 px-4 rounded-xl font-bold hover:bg-primary/95 transition min-h-[48px]"
              >
                <Plus className="h-5 w-5 text-white" />
                <span>Registrar Inversión</span>
              </button>
            </form>
          </div>

          {/* List of Investments with auto-calculated depreciation */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Bienes de Capital y Depreciación</h4>
            {inversiones.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                No hay inversiones registradas.
              </div>
            ) : (
              <div className="space-y-3">
                {inversiones.map((inv) => {
                  const depreciacionMensual = Number(inv.monto) / (Number(inv.vida_util_anios) * 12);
                  const fechaStr = new Date(inv.fecha_compra).toISOString().split('T')[0];
                  return (
                    <div key={inv.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-slate-200 text-sm">{inv.nombre}</h5>
                          <span className="text-[10px] text-slate-500">Fecha compra: {fechaStr}</span>
                        </div>
                        <span className="font-extrabold text-slate-100 text-sm">
                          ${Number(inv.monto).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800/40">
                        <span className="text-slate-500">Amortización Mensual ({inv.vida_util_anios} años):</span>
                        <span className="font-bold text-rose-400 flex items-center gap-0.5">
                          ${depreciacionMensual.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mes
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
