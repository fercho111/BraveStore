import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductoRow } from '@/lib/utils/types';
import { formatMoney } from '@/lib/utils/helpers';
import { toggleProductoActivo } from './actions';
import { ClickableRow } from '@/lib/components/ClickableRow';

export default async function ProductosPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre_producto, costo, precio, activo, creado_en')
    .order('nombre_producto', { ascending: true });

  if (error) {
    return (
      <main className="container py-4">
        <h1 className="h4 fw-semibold">Productos</h1>
        <p className="mt-3 text-danger">
          Error cargando productos: {error.message}
        </p>
      </main>
    );
  }

  const { data: stockData } = await supabase
  .from('v_stock_actual')
  .select('producto_id, stock');

  const productos: ProductoRow[] = data ?? [];

  type StockRow = { producto_id: string; stock: number | null };

  const stockByProductoId = new Map<string, number>(
    ((stockData ?? []) as StockRow[]).map((row) => [
      row.producto_id,
      row.stock ?? 0,
    ]),
  );

  return (
    <>
      <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h4 fw-semibold mb-1">Productos</h1>
          <p className="text-muted mb-0">Total: {productos.length}</p>
        </div>
        <Link href="/productos/nuevo" className="btn btn-primary">
          Nuevo producto
        </Link>
      </header>

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle">
          <thead className="table-header-purple text-white">
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Producto</th>
              <th scope="col">Costo</th>
              <th scope="col">Precio</th>
              <th scope="col">Stock</th>
              <th scope="col">Activo</th>
              <th scope="col" style={{ width: 90 }}></th>
            </tr>
          </thead>

          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 text-muted">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              productos.map((p) => {
                const rowHref = `/productos/${p.id}`;

                return (
                  <ClickableRow
                    key={p.id}
                    href={rowHref}
                    className="align-middle table-row-clickable"
                  >
                    <td>{p.codigo}</td>

                    <td>{p.nombre_producto}</td>

                    <td>{formatMoney(p.costo)}</td>

                    <td>{formatMoney(p.precio)}</td>

                    <td>{stockByProductoId.get(p.id) ?? 0}</td>

                    <td>
                      {/* Interactive element: the ClickableRow ignores clicks on buttons/forms */}
                      <form action={toggleProductoActivo} className="d-inline">
                        <input type="hidden" name="producto_id" value={p.id} />
                        <button
                          type="submit"
                          className={`btn ${
                            p.activo ? 'btn-outline-success' : 'btn-outline-danger'
                          }`}
                          aria-label={`Marcar producto como ${p.activo ? 'inactivo' : 'activo'}`}
                          title="Cambiar estado"
                        >
                          {p.activo ? 'Sí' : 'No'}
                        </button>
                      </form>
                    </td>

                    <td className="text-center">
                      {/* Interactive element: ignored by ClickableRow due to 'a' selector */}
                      <Link
                        href={`/productos/${p.id}/editar`}
                        className="btn btn-outline-secondary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Editar
                      </Link>
                    </td>
                  </ClickableRow>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}