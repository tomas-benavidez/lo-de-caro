export const CLAVE_STORAGE_GASTO_FIJO = 'lo_de_caro_gasto_fijo_porcion';
export const CLAVE_STORAGE_META_MENSUAL = 'lo_de_caro_meta_mensual_default';
export const CLAVE_STORAGE_METAS_POR_MES = 'lo_de_caro_metas_por_mes';
export const META_MENSUAL_DEFAULT = 300000;

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

  /**
   * Obtiene el mapa de metas configuradas por mes { 'YYYY-MM': monto }.
   */
  obtenerMetasPorMes(): Record<string, number> {
    try {
      if (typeof localStorage !== 'undefined') {
        const guardado = localStorage.getItem(CLAVE_STORAGE_METAS_POR_MES);
        if (guardado) {
          const parseado = JSON.parse(guardado);
          if (typeof parseado === 'object' && parseado !== null && !Array.isArray(parseado)) {
            const resultado: Record<string, number> = {};
            for (const [clave, valor] of Object.entries(parseado)) {
              if (valor !== null && valor !== undefined && typeof valor !== 'boolean') {
                const num = Number(valor);
                if (!isNaN(num) && num >= 0) {
                  resultado[clave] = Math.round(num);
                }
              }
            }
            return resultado;
          }
        }
      }
    } catch {
      // Fallback silencioso
    }
    return {};
  }

  /**
   * Obtiene la meta de retiro mensual para un mes específico (ej: '2026-10') o la meta general.
   * Si no hay meta personalizada para ese mes, retorna la meta por defecto ($300.000).
   */
  obtenerMetaMensual(mes?: string): number {
    try {
      if (typeof localStorage !== 'undefined') {
        if (mes && mes !== 'TODOS') {
          const metas = this.obtenerMetasPorMes();
          const valorMes = metas[mes];
          if (typeof valorMes === 'number' && !isNaN(valorMes) && valorMes >= 0) {
            return valorMes;
          }
        }

        const guardadoDefault = localStorage.getItem(CLAVE_STORAGE_META_MENSUAL);
        if (guardadoDefault !== null) {
          const num = parseFloat(guardadoDefault);
          if (!isNaN(num) && num >= 0) {
            return num;
          }
        }
      }
    } catch {
      // Fallback silencioso
    }
    return META_MENSUAL_DEFAULT;
  }

  /**
   * Guarda la meta de retiro mensual.
   * Si se especifica un mes ('YYYY-MM'), se persiste de forma individual para ese período.
   * Si no se especifica un mes o es 'TODOS', se actualiza la meta general por defecto.
   */
  guardarMetaMensual(monto: number, mes?: string): number {
    const limpio = Math.max(0, Math.round(Number(monto || 0)));
    try {
      if (typeof localStorage !== 'undefined') {
        if (mes && mes !== 'TODOS') {
          const metas = this.obtenerMetasPorMes();
          metas[mes] = limpio;
          localStorage.setItem(CLAVE_STORAGE_METAS_POR_MES, JSON.stringify(metas));
        } else {
          localStorage.setItem(CLAVE_STORAGE_META_MENSUAL, limpio.toString());
        }
      }
    } catch {
      // Fallback silencioso
    }
    return limpio;
  }
}

export const configuracionRepositorio = new ConfiguracionRepositorio();
