export const CLAVE_STORAGE_GASTO_FIJO = 'lo_de_caro_gasto_fijo_porcion';

export class ConfiguracionRepositorio {
  /**
   * Obtiene el gasto fijo por porción configurado (default 0).
   */
  obtenerGastoFijoPorcion(): number {
    try {
      if (typeof localStorage !== 'undefined') {
        const guardado = localStorage.getItem(CLAVE_STORAGE_GASTO_FIJO);
        if (guardado !== null) {
          const num = parseFloat(guardado);
          return isNaN(num) || num < 0 ? 0 : num;
        }
      }
    } catch {
      // Si localStorage no está disponible
    }
    return 0;
  }

  /**
   * Persiste el gasto fijo por porción configurado.
   */
  guardarGastoFijoPorcion(monto: number): number {
    const limpio = Math.max(0, Math.round(Number(monto || 0) * 100) / 100);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CLAVE_STORAGE_GASTO_FIJO, limpio.toString());
      }
    } catch {
      // Fallback silencioso
    }
    return limpio;
  }
}

export const configuracionRepositorio = new ConfiguracionRepositorio();
