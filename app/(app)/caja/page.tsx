import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';



export default async function CajaPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
    .from('caja')
    .select(
        `
        id,
        tipo,
        monto,
        nota,
        creado_en,
        clientes:cliente_id ( id, nombre),
        ventas: venta_id ( id, total, pagado, nota, creado_en),
        empleado:empleado_id ( id, nombre, rol),
        `
    )
    .order('creado_en', { ascending: false})
    .limit(200);
    if (error) {
    return (
      <main style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Movimientos</h1>
        <p style={{ marginTop: '1rem', color: 'crimson' }}>
          Error cargando inventario: {error.message}
        </p>
      </main>
    );
  }

  

}
