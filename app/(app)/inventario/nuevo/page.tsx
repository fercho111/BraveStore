// app/inventario/nuevo/page.tsx

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createMovimiento } from '../actions';

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

      <form action={createMovimiento} className="mt-2" style={{ maxWidth: 720 }}>
        <div className="row g-3">
          {/* Producto */}
          <div className="col-12 col-md-6">
            <label htmlFor="producto-select" className="form-label">
              Producto
            </label>
            <select
              id="producto-select"
              name="producto_id"
              required
              className="form-select"
            >
              <option value="">Seleccione un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.nombre_producto}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div className="col-12 col-md-6">
            <label htmlFor="tipo-select" className="form-label">
              Tipo
            </label>
            <select
              id="tipo-select"
              name="tipo"
              required
              defaultValue="REPOSICION"
              className="form-select"
            >
              <option value="REPOSICION">REPOSICION (entrada)</option>
              <option value="AJUSTE">AJUSTE (±)</option>
              <option value="VENTA">VENTA (salida)</option>
            </select>
          </div>

          {/* Cantidad */}
          <div className="col-12 col-md-6">
            <label htmlFor="cantidad-input" className="form-label">
              Cantidad
            </label>
            <input
              id="cantidad-input"
              name="cantidad"
              type="number"
              required
              min={1}
              defaultValue={1}
              className="form-control"
            />
            <div className="form-text">
              REPOSICION y VENTA usan valor positivo (VENTA se registra como salida).  
              AJUSTE puede ser positivo o negativo.
            </div>
          </div>

          {/* Costo unitario */}
          <div className="col-12 col-md-6">
            <label htmlFor="costo-input" className="form-label">
              Costo unitario (solo para REPOSICION)
            </label>
            <input
              id="costo-input"
              name="costo_unitario_entrada"
              inputMode="decimal"
              placeholder="0.00"
              className="form-control"
            />
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>

          <Link href="/inventario" className="btn btn-outline-light">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
