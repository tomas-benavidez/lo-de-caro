import {
  Gasto,
  NuevoGastoInput,
  ResumenGastos,
  CategoriaGastoFiltro,
  MetodoPagoGasto,
  CATEGORIAS_GASTO_VALIDAS,
  METODOS_PAGO_GASTO_VALIDOS,
} from '../models/gasto.ts';

/**
 * Calcula el resumen financiero de gastos acumulados.
 */
export function calcularResumenGastos(gastos: Gasto[]): ResumenGastos {
  if (!gastos || gastos.length === 0) {
    return {
      totalGastos: 0,
      totalMateriaPrima: 0,
      totalOperativos: 0,
      totalEfectivo: 0,
      totalTransferencia: 0,
      cantidadGastos: 0,
    };
  }

  let totalGastos = 0;
  let totalMateriaPrima = 0;
  let totalOperativos = 0;
  let totalEfectivo = 0;
  let totalTransferencia = 0;

  for (const gasto of gastos) {
    const monto = Number(gasto.monto) || 0;
    totalGastos += monto;

    if (gasto.categoria === 'Materia Prima') {
      totalMateriaPrima += monto;
    } else {
      totalOperativos += monto;
    }

    if (gasto.metodoPago === 'Transferencia') {
      totalTransferencia += monto;
    } else {
      totalEfectivo += monto;
    }
  }

  const redondear2 = (num: number) => Math.round(num * 100) / 100;

  return {
    totalGastos: redondear2(totalGastos),
    totalMateriaPrima: redondear2(totalMateriaPrima),
    totalOperativos: redondear2(totalOperativos),
    totalEfectivo: redondear2(totalEfectivo),
    totalTransferencia: redondear2(totalTransferencia),
    cantidadGastos: gastos.length,
  };
}

/**
 * Calcula el costo unitario a partir del monto total y la cantidad comprada.
 * Retorna el resultado redondeado a 4 decimales.
 */
export function calcularNuevoCostoUnitario(monto: number, cantidad: number): number {
  if (cantidad <= 0 || monto <= 0 || !Number.isFinite(cantidad) || !Number.isFinite(monto)) {
    return 0;
  }
  const costo = monto / cantidad;
  return Math.round(costo * 10000) / 10000;
}

/**
 * Filtra la lista de gastos por categoría, método de pago y texto de búsqueda en concepto.
 */
export function filtrarGastos(
  gastos: Gasto[],
  categoria: CategoriaGastoFiltro = 'Todas',
  metodo: 'Todos' | MetodoPagoGasto = 'Todos',
  busqueda: string = ''
): Gasto[] {
  const termino = busqueda.trim().toLowerCase();

  return gastos.filter((g) => {
    // Filtro por categoría
    if (categoria !== 'Todas' && g.categoria !== categoria) {
      return false;
    }

    // Filtro por método de pago
    if (metodo !== 'Todos' && g.metodoPago !== metodo) {
      return false;
    }

    // Filtro por texto en el concepto
    if (termino && !g.concepto.toLowerCase().includes(termino)) {
      return false;
    }

    return true;
  });
}

/**
 * Valida los datos requeridos para registrar un nuevo gasto.
 */
export function validarNuevoGasto(input: NuevoGastoInput): { valido: boolean; error?: string } {
  const conceptoLimpio = (input.concepto || '').trim();
  if (!conceptoLimpio) {
    return { valido: false, error: 'El concepto del gasto es obligatorio.' };
  }

  if (!input.categoria || !CATEGORIAS_GASTO_VALIDAS.includes(input.categoria)) {
    return {
      valido: false,
      error: `La categoría seleccionada no es válida. Debe ser una de: ${CATEGORIAS_GASTO_VALIDAS.join(', ')}.`,
    };
  }

  const monto = Number(input.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    return { valido: false, error: 'El monto debe ser un número mayor a 0.' };
  }

  if (input.metodoPago && !METODOS_PAGO_GASTO_VALIDOS.includes(input.metodoPago)) {
    return {
      valido: false,
      error: `El método de pago no es válido. Debe ser uno de: ${METODOS_PAGO_GASTO_VALIDOS.join(', ')}.`,
    };
  }

  if (input.compraMateriaPrima) {
    const { materiaPrimaId, cantidadComprada } = input.compraMateriaPrima;
    if (!materiaPrimaId || !materiaPrimaId.trim()) {
      return { valido: false, error: 'Debe seleccionar una materia prima para vincular.' };
    }
    const cant = Number(cantidadComprada);
    if (!Number.isFinite(cant) || cant <= 0) {
      return { valido: false, error: 'La cantidad comprada de materia prima debe ser mayor a 0.' };
    }
  }

  return { valido: true };
}
