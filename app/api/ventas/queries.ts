import { createClient } from '@/lib/supabase/server';
import type { ClienteRow, VentaRow } from '@/lib/utils/types';

type EmpleadoRow = {
  id: string;
  nombre: string | null;
  documento: string | null;
};

export type VentaApiRow = VentaRow & {
  clientes: ClienteRow | null;
  empleados: EmpleadoRow | null;
};

type VentasQueryResult = {
  data: VentaApiRow[];
  error: { message: string } | null;
};

export async function getVentas(): Promise<VentasQueryResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ventas')
    .select(
      `
      id,
      creado_en,
      total,
      pagado,
      clientes:cliente_id (
        id,
        nombre,
        documento,
        celular,
        creado_en
      ),
      empleados:empleado_id (
        id,
        nombre,
        documento
      )
    `,
    )
    .order('creado_en', { ascending: false });

  return {
    data: (data ?? []) as VentaApiRow[],
    error: error ? { message: error.message } : null,
  };
}
