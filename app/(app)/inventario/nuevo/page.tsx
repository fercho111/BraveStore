// app/inventario/nuevo/page.tsx

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NuevoInventarioForm } from './NuevoInventarioForm';


type ProductoOption = {
  id: string;
  codigo: string;
  nombre_producto: string;
};

export default async function NuevoInventarioPage() {
  const supabase = await createClient();

  // Productos activos para el dropdown
  const { data, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre_producto')
    .eq('activo', true)
    .order('nombre_producto', { ascending: true });

  if (error) {
    return (
      <>
        <h1 className="h4 fw-semibold mb-3">Nuevo movimiento</h1>
        <div className="alert alert-danger">
          Error cargando productos: {error.message}
        </div>
        <Link href="/inventario" className="btn btn-outline-light mt-3">
          Volver
        </Link>
      </>
    );
  }

  const productos: ProductoOption[] = data ?? [];

  return (
    <>
      <header className="d-flex justify-content-between align-items-baseline flex-wrap gap-3 mb-3">
        <div>
          <h1 className="h4 fw-semibold mb-1">Nuevo movimiento</h1>
          <p className="text-muted mb-0">
            REPOSICIÓN (entrada), AJUSTE (±), VENTA (salida)
          </p>
        </div>

        <Link href="/inventario" className="btn btn-outline-light">
          Volver
        </Link>
      </header>

      <NuevoInventarioForm productos={productos} />

    </>
  );
}
