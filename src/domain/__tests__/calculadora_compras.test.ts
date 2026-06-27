import { expect, test, describe } from 'vitest';
import { ProductoVenta } from '@/domain/producto';
import { Receta, IngredienteReceta } from '@/domain/receta';
import { Insumo } from '@/domain/insumo';
import {
  calcularRequerimientoInsumos,
  calcularComprasFaltantes
} from '@/domain/calculadora_compras';

describe('Calculadora de Compras para Eventos domain logic', () => {
  const insumoHarina: Insumo = {
    id: 'ins-harina',
    nombre: 'Harina',
    unidad_medida: 'g',
    costo_bruto_unitario: 0.002,
    stock_actual: 500,
    created_at: new Date()
  };

  const insumoManteca: Insumo = {
    id: 'ins-manteca',
    nombre: 'Manteca',
    unidad_medida: 'g',
    costo_bruto_unitario: 0.01,
    stock_actual: 100,
    created_at: new Date()
  };

  const recetaMasa: Receta = {
    id: 'rec-masa',
    nombre: 'Masa de Tarta',
    porciones_rendimiento: 2, // yields 2 base tarta bases
    costo_envase: 0,
    created_at: new Date()
  };

  const ingredienteHarina: IngredienteReceta = {
    id: 'ing-harina',
    receta_id: 'rec-masa',
    insumo_id: 'ins-harina',
    peso_limpio: 200,
    porcentaje_merma: 0 // 0% waste
  };

  const ingredienteManteca: IngredienteReceta = {
    id: 'ing-manteca',
    receta_id: 'rec-masa',
    insumo_id: 'ins-manteca',
    peso_limpio: 90,
    porcentaje_merma: 10 // 10% waste -> gross = 90 / 0.9 = 100g
  };

  const productoTartaFamiliar: ProductoVenta = {
    id: 'prod-tarta',
    nombre: 'Tarta Familiar',
    receta_id: 'rec-masa',
    unidad_venta: 'unidad',
    cantidad_unidades_base: 1, // 1 base unit
    precio_lista: 300,
    created_at: new Date()
  };

  const productoPorciones: ProductoVenta = {
    id: 'prod-porciones',
    nombre: 'Pack 8 Porciones',
    receta_id: 'rec-masa',
    unidad_venta: 'pack',
    cantidad_unidades_base: 8, // 8 base units
    precio_lista: 2000,
    created_at: new Date()
  };

  test('calculates and groups total gross raw material requirements', () => {
    const pedidos = [
      {
        producto: productoTartaFamiliar,
        receta: recetaMasa,
        ingredientes: [
          { ingrediente: ingredienteHarina, insumo: insumoHarina },
          { ingrediente: ingredienteManteca, insumo: insumoManteca }
        ],
        cantidad: 4 // 4 families -> needs 4 base units. Yield = 2 -> multiplier = 4/2 = 2.
        // Harina required: 200 * 2 = 400
        // Manteca required: 100 * 2 = 200
      },
      {
        producto: productoPorciones,
        receta: recetaMasa,
        ingredientes: [
          { ingrediente: ingredienteHarina, insumo: insumoHarina },
          { ingrediente: ingredienteManteca, insumo: insumoManteca }
        ],
        cantidad: 1 // 1 pack of 8 -> needs 8 base units. Yield = 2 -> multiplier = 8/2 = 4.
        // Harina required: 200 * 4 = 800
        // Manteca required: 100 * 4 = 400
      }
    ];

    // Total Harina required: 400 + 800 = 1200.00
    // Total Manteca required: 200 + 400 = 600.00
    const requirements = calcularRequerimientoInsumos(pedidos);

    expect(requirements).toHaveLength(2);

    const harinaReq = requirements.find(r => r.insumoId === 'ins-harina');
    const mantecaReq = requirements.find(r => r.insumoId === 'ins-manteca');

    expect(harinaReq).toBeDefined();
    expect(harinaReq?.nombre).toBe('Harina');
    expect(harinaReq?.cantidadRequeridaBruta).toBe(1200.00);

    expect(mantecaReq).toBeDefined();
    expect(mantecaReq?.nombre).toBe('Manteca');
    expect(mantecaReq?.cantidadRequeridaBruta).toBe(600.00);
  });

  test('calculates missing purchases in Service Mode (ignores stock)', () => {
    const requirements = [
      { insumoId: 'ins-harina', nombre: 'Harina', cantidadRequeridaBruta: 1200.00 },
      { insumoId: 'ins-manteca', nombre: 'Manteca', cantidadRequeridaBruta: 600.00 }
    ];

    const stock = [
      { insumoId: 'ins-harina', stockActual: 500 },
      { insumoId: 'ins-manteca', stockActual: 100 }
    ];

    // In Service Mode (modoServicio = true), we ignore stock and buy everything
    const purchases = calcularComprasFaltantes(requirements, stock, true);

    const harinaPurchase = purchases.find(p => p.insumoId === 'ins-harina');
    const mantecaPurchase = purchases.find(p => p.insumoId === 'ins-manteca');

    expect(harinaPurchase?.cantidadAComprar).toBe(1200.00);
    expect(mantecaPurchase?.cantidadAComprar).toBe(600.00);
  });

  test('calculates missing purchases in Standard Mode (subtracts stock)', () => {
    const requirements = [
      { insumoId: 'ins-harina', nombre: 'Harina', cantidadRequeridaBruta: 1200.00 },
      { insumoId: 'ins-manteca', nombre: 'Manteca', cantidadRequeridaBruta: 600.00 },
      { insumoId: 'ins-sal', nombre: 'Sal', cantidadRequeridaBruta: 10.00 } // not in stock list
    ];

    const stock = [
      { insumoId: 'ins-harina', stockActual: 500 },
      { insumoId: 'ins-manteca', stockActual: 100 },
      { insumoId: 'ins-azucar', stockActual: 1000 } // surplus stock
    ];

    // In Standard Mode (modoServicio = false), we subtract stock:
    // Harina: 1200 - 500 = 700.00
    // Manteca: 600 - 100 = 500.00
    // Sal: 10 - 0 = 10.00
    const purchases = calcularComprasFaltantes(requirements, stock, false);

    const harinaPurchase = purchases.find(p => p.insumoId === 'ins-harina');
    const mantecaPurchase = purchases.find(p => p.insumoId === 'ins-manteca');
    const salPurchase = purchases.find(p => p.insumoId === 'ins-sal');

    expect(harinaPurchase?.cantidadAComprar).toBe(700.00);
    expect(mantecaPurchase?.cantidadAComprar).toBe(500.00);
    expect(salPurchase?.cantidadAComprar).toBe(10.00);
  });
});
