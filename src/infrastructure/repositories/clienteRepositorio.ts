import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '../supabase/cliente.ts';
import {
  Cliente,
  NuevoClienteInput,
  RegistroPagoClienteInput,
} from '../../domain/models/cliente.ts';

export interface ClienteFila {
  id: string;
  nombre_apellido: string;
  telefono: string | null;
  saldo_pendiente: number | null;
  created_at?: string;
}

/**
 * Mapea una fila de la base de datos Postgres a la entidad de dominio Cliente.
 */
export const mapearFilaACliente = (fila: ClienteFila): Cliente => {
  return {
    id: fila.id,
    nombreApellido: fila.nombre_apellido,
    telefono: fila.telefono,
    saldoPendiente: Number(fila.saldo_pendiente || 0),
    fechaCreacion: fila.created_at,
  };
};

export class ClienteRepositorio {
  private cliente: SupabaseClient;

  constructor(clienteSupabase?: SupabaseClient) {
    this.cliente = clienteSupabase || defaultClient;
  }

  /**
   * Obtiene la lista de todos los clientes ordenados alfabéticamente.
   */
  async listar(): Promise<Cliente[]> {
    const { data, error } = await this.cliente
      .from('clientes')
      .select('*')
      .order('nombre_apellido', { ascending: true });

    if (error) {
      throw new Error(`Error al listar clientes: ${error.message}`);
    }

    return (data || []).map(mapearFilaACliente);
  }

  /**
   * Obtiene un cliente por su ID.
   */
  async obtenerPorId(id: string): Promise<Cliente | null> {
    const { data, error } = await this.cliente
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al obtener cliente: ${error.message}`);
    }

    return data ? mapearFilaACliente(data) : null;
  }

  /**
   * Registra un nuevo cliente con saldo inicial en cero.
   */
  async crear(input: NuevoClienteInput): Promise<Cliente> {
    const nombreLimpio = input.nombreApellido?.trim();
    if (!nombreLimpio) {
      throw new Error('El nombre y apellido del cliente es obligatorio.');
    }

    const { data, error } = await this.cliente
      .from('clientes')
      .insert({
        nombre_apellido: nombreLimpio,
        telefono: input.telefono?.trim() || null,
        saldo_pendiente: 0,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al crear cliente: ${error?.message || 'Error desconocido'}`);
    }

    return mapearFilaACliente(data);
  }

  /**
   * Ajusta el saldo pendiente del cliente sumando o restando un delta.
   * Evita saldos negativos.
   */
  async actualizarSaldo(clienteId: string, delta: number): Promise<Cliente> {
    const { data: clienteActual, error: errorFetch } = await this.cliente
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (errorFetch || !clienteActual) {
      throw new Error(
        `Error al obtener cliente para actualizar saldo: ${errorFetch?.message || 'No encontrado'}`
      );
    }

    const saldoActual = Number(clienteActual.saldo_pendiente || 0);
    const nuevoSaldo = Math.max(0, Math.round((saldoActual + delta) * 100) / 100);

    const { data: clienteActualizado, error: errorUpdate } = await this.cliente
      .from('clientes')
      .update({ saldo_pendiente: nuevoSaldo })
      .eq('id', clienteId)
      .select('*')
      .single();

    if (errorUpdate || !clienteActualizado) {
      throw new Error(`Error al actualizar saldo del cliente: ${errorUpdate?.message || 'Fallo de actualización'}`);
    }

    return mapearFilaACliente(clienteActualizado);
  }

  /**
   * Registra el pago o amortización de deuda de un cliente.
   */
  async registrarPagoDeuda(input: RegistroPagoClienteInput): Promise<Cliente> {
    const montoLimpio = Math.round(Number(input.monto) * 100) / 100;
    if (isNaN(montoLimpio) || montoLimpio <= 0) {
      throw new Error('El monto a abonar debe ser mayor a cero.');
    }
    return this.actualizarSaldo(input.clienteId, -montoLimpio);
  }

  /**
   * Actualiza los datos de un cliente existente (nombre y teléfono).
   */
  async actualizar(id: string, input: NuevoClienteInput): Promise<Cliente> {
    const nombreLimpio = input.nombreApellido?.trim();
    if (!nombreLimpio) {
      throw new Error('El nombre y apellido del cliente es obligatorio.');
    }

    const { data, error } = await this.cliente
      .from('clientes')
      .update({
        nombre_apellido: nombreLimpio,
        telefono: input.telefono?.trim() || null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al actualizar cliente: ${error?.message || 'Error desconocido'}`);
    }

    return mapearFilaACliente(data);
  }

  /**
   * Elimina un cliente por su ID.
   */
  async eliminar(id: string): Promise<void> {
    const { error } = await this.cliente
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar cliente: ${error.message}`);
    }
  }
}

export const clienteRepositorio = new ClienteRepositorio();
