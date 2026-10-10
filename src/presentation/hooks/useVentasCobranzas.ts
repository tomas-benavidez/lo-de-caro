import { useState, useEffect, useCallback, useMemo } from 'react';
import { Venta, NuevaVentaInput, ResumenFinancieroVentas } from '../../domain/models/venta.ts';
import {
  Cliente,
  NuevoClienteInput,
  RegistroPagoClienteInput,
} from '../../domain/models/cliente.ts';
import { Producto } from '../../domain/models/producto.ts';
import { calcularResumenFinanciero } from '../../domain/services/ventaServicio.ts';
import {
  VentaRepositorio,
  ventaRepositorio as ventaRepoDefault,
} from '../../infrastructure/repositories/ventaRepositorio.ts';
import {
  ClienteRepositorio,
  clienteRepositorio as clienteRepoDefault,
} from '../../infrastructure/repositories/clienteRepositorio.ts';

export interface UseVentasCobranzasResultado {
  ventas: Venta[];
  clientes: Cliente[];
  resumen: ResumenFinancieroVentas;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  registrarVenta: (input: NuevaVentaInput, productos?: Producto[]) => Promise<Venta>;
  anularVenta: (id: string) => Promise<void>;
  crearCliente: (input: NuevoClienteInput) => Promise<Cliente>;
  cobrarDeudaCliente: (input: RegistroPagoClienteInput) => Promise<Cliente>;
}

/**
 * Hook de aplicación para orquestar las ventas de mostrador, cobranzas y cuentas corrientes.
 */
export function useVentasCobranzas(
  ventaRepo: VentaRepositorio = ventaRepoDefault,
  clienteRepo: ClienteRepositorio = clienteRepoDefault
): UseVentasCobranzasResultado {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [ventasDatos, clientesDatos] = await Promise.all([
        ventaRepo.listar(),
        clienteRepo.listar(),
      ]);
      setVentas(ventasDatos);
      setClientes(clientesDatos);
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al cargar datos de ventas y clientes.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [ventaRepo, clienteRepo]);

  const registrarVenta = useCallback(
    async (input: NuevaVentaInput, productos: Producto[] = []): Promise<Venta> => {
      setError(null);
      try {
        const nuevaVenta = await ventaRepo.registrarVenta(input, productos);

        // Si la venta tiene cliente, resolvemos su nombre para mostrarlo inmediatamente
        let nombreCliente = 'Cliente Mostrador';
        if (input.clienteId) {
          const cli = clientes.find((c) => c.id === input.clienteId);
          if (cli) {
            nombreCliente = cli.nombreApellido;
          }
        }
        nuevaVenta.nombreCliente = nombreCliente;

        setVentas((prev) => [nuevaVenta, ...prev]);

        // Si fue a cuenta corriente (Pendiente), actualizar el saldo local del cliente
        if (input.estadoPago === 'Pendiente' && input.clienteId) {
          setClientes((prev) =>
            prev.map((c) =>
              c.id === input.clienteId
                ? { ...c, saldoPendiente: Math.round((c.saldoPendiente + nuevaVenta.total) * 100) / 100 }
                : c
            )
          );
        }

        return nuevaVenta;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al registrar venta.';
        setError(mensaje);
        throw err;
      }
    },
    [ventaRepo, clientes]
  );

  const anularVenta = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const ventaAAnular = ventas.find((v) => v.id === id);
        await ventaRepo.anularVenta(id);
        setVentas((prev) => prev.filter((v) => v.id !== id));

        // Si la venta estaba pendiente y tenía cliente, ajustar saldo pendiente local
        if (ventaAAnular && ventaAAnular.estadoPago === 'Pendiente' && ventaAAnular.clienteId) {
          setClientes((prev) =>
            prev.map((c) =>
              c.id === ventaAAnular.clienteId
                ? {
                    ...c,
                    saldoPendiente: Math.max(
                      0,
                      Math.round((c.saldoPendiente - ventaAAnular.total) * 100) / 100
                    ),
                  }
                : c
            )
          );
        }
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al anular venta.';
        setError(mensaje);
        throw err;
      }
    },
    [ventaRepo, ventas]
  );

  const crearCliente = useCallback(
    async (input: NuevoClienteInput): Promise<Cliente> => {
      setError(null);
      try {
        const nuevoCliente = await clienteRepo.crear(input);
        setClientes((prev) =>
          [...prev, nuevoCliente].sort((a, b) => a.nombreApellido.localeCompare(b.nombreApellido))
        );
        return nuevoCliente;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al crear cliente.';
        setError(mensaje);
        throw err;
      }
    },
    [clienteRepo]
  );

  const cobrarDeudaCliente = useCallback(
    async (input: RegistroPagoClienteInput): Promise<Cliente> => {
      setError(null);
      try {
        const clienteActualizado = await clienteRepo.registrarPagoDeuda(input);
        setClientes((prev) =>
          prev.map((c) => (c.id === clienteActualizado.id ? clienteActualizado : c))
        );
        return clienteActualizado;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al registrar cobro.';
        setError(mensaje);
        throw err;
      }
    },
    [clienteRepo]
  );

  const resumen = useMemo(() => {
    return calcularResumenFinanciero(ventas, clientes);
  }, [ventas, clientes]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return {
    ventas,
    clientes,
    resumen,
    cargando,
    error,
    recargar,
    registrarVenta,
    anularVenta,
    crearCliente,
    cobrarDeudaCliente,
  };
}
