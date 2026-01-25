// app/ventas/nueva/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NuevaVentaClient } from './NuevaVentaClient';

export default async function NuevaVentaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: productos } = await supabase
    .from('productos')
    .select('id, codigo, nombre_producto, precio, activo')
    .eq('activo', true)
    .order('nombre_producto');

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nombre, documento, celular')
    .order('nombre');

  return <NuevaVentaClient productos={productos ?? []} clientes={clientes ?? []} />;
}
