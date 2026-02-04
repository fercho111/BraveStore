// app/productos/nuevo/page.tsx

import Link from 'next/link';
import { createProducto } from '../actions';

export default function NuevoProductoPage() {
  return (
    <>
      <header className="d-flex justify-content-between align-items-baseline gap-3 mb-3 flex-wrap">
        <div>
          <h1 className="h4 fw-semibold mb-1">Nuevo producto</h1>
          <p className="text-muted mb-0">
            Crear un producto en el inventario.
          </p>
        </div>

        <Link href="/productos" className="btn btn-outline-light">
          Volver
        </Link>
      </header>

      <form action={createProducto} className="mt-3" style={{ maxWidth: 720 }}>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="codigo" className="form-label">
              Código (SKU)
            </label>
            <input
              id="codigo"
              name="codigo"
              required
              placeholder="PR-001"
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="nombre_producto" className="form-label">
              Producto
            </label>
            <input
              id="nombre_producto"
              name="nombre_producto"
              required
              placeholder="Proteína 2lb"
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="precio" className="form-label">
              Precio (venta)
            </label>
            <input
              id="precio"
              name="precio"
              required
              inputMode="decimal"
              placeholder="0.00"
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="costo" className="form-label">
              Costo (promedio inicial)
            </label>
            <input
              id="costo"
              name="costo"
              required
              inputMode="decimal"
              placeholder="0.00"
              className="form-control"
            />
          </div>

          <div className="col-12">
            <div className="form-check">
              <input
                id="activo"
                name="activo"
                type="checkbox"
                defaultChecked
                className="form-check-input"
              />
              <label htmlFor="activo" className="form-check-label">
                Activo
              </label>
            </div>
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>

          <Link href="/productos" className="btn btn-outline-light">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
