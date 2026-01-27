import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { updateProducto } from '../../actions';

type PageProps = {
  params: { productoId: string };
};

export default async function EditarProductoPage({ params }: PageProps) {
  const supabase = await createClient();
  const { productoId } = await params;

  // Fetch product explicitly
  const { data: producto, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre_producto, costo, precio, activo')
    .eq('id', productoId)
    .single();

  if (error || !producto) {
    return (
      <>
        <h1 className="h4 fw-semibold mb-2">Editar producto</h1>
        <div className="alert alert-danger" role="alert">
          No se pudo cargar el producto. {error?.message ?? ''}
        </div>

        <Link href="/productos" className="btn btn-outline-light btn-sm">
          Volver a productos
        </Link>
      </>
    );
  }

  return (
    <>
      <header className="d-flex justify-content-between align-items-baseline flex-wrap gap-3 mb-3">
        <div>
          <h1 className="h4 fw-semibold mb-1">Editar producto</h1>
          <p className="text-muted mb-0">
            {producto.nombre_producto} ({producto.codigo})
          </p>
        </div>

        <Link href={`/productos/${productoId}`} className="btn btn-outline-light btn-sm">
          Volver
        </Link>
      </header>

      <form action={updateProducto} style={{ maxWidth: 720 }}>
        {/* Pass product ID to server action explicitly */}
        <input type="hidden" name="producto_id" value={producto.id} />

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label">Código (SKU)</label>
            <input
              name="codigo"
              defaultValue={producto.codigo ?? ''}
              required
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Producto</label>
            <input
              name="nombre_producto"
              defaultValue={producto.nombre_producto ?? ''}
              required
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Precio (venta)</label>
            <input
              name="precio"
              defaultValue={String(producto.precio ?? '')}
              required
              inputMode="decimal"
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Costo (promedio)</label>
            <input
              name="costo"
              defaultValue={String(producto.costo ?? '')}
              required
              inputMode="decimal"
              className="form-control"
            />
          </div>

          <div className="col-12">
            <div className="form-check">
              <input
                name="activo"
                type="checkbox"
                defaultChecked={!!producto.activo}
                className="form-check-input"
                id="activoCheck"
              />
              <label htmlFor="activoCheck" className="form-check-label">
                Activo
              </label>
            </div>
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            Guardar cambios
          </button>

          <Link href={`/productos/${productoId}`} className="btn btn-outline-light btn-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
