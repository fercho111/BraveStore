'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createMovimiento } from '../actions';

type ProductoOption = {
  id: string;
  codigo: string;
  nombre_producto: string;
};

type Props = {
  productos: ProductoOption[];
};

type Tipo = 'REPOSICION' | 'AJUSTE' | 'VENTA';

export function NuevoInventarioForm({ productos }: Props) {
  const [tipo, setTipo] = useState<Tipo>('REPOSICION');

  const esReposicion = tipo === 'REPOSICION';
  const esAjuste = tipo === 'AJUSTE';
  const esVenta = tipo === 'VENTA';

  const ayudaCantidad = useMemo(() => {
    if (esReposicion) return 'REPOSICION: cantidad positiva (entrada).';
    if (esAjuste) return 'AJUSTE: puede ser positivo o negativo.';
    return 'VENTA: las salidas deben registrarse desde Ventas.';
  }, [esReposicion, esAjuste]);

  return (
    <form action={createMovimiento} className="mt-2" style={{ maxWidth: 720 }}>
      <div className="row g-3">
        {/* Producto */}
        <div className="col-12 col-md-6">
          <label htmlFor="producto-select" className="form-label">
            Producto
          </label>
          <select id="producto-select" name="producto_id" required className="form-select">
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
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Tipo)}
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
            defaultValue={1}
            className="form-control"
            // For AJUSTE allow negative; for others keep >= 1
            min={esAjuste ? undefined : 1}
            step={1}
            disabled={esVenta}
          />
          <div className="form-text">{ayudaCantidad}</div>
          {esVenta ? (
            <div className="alert alert-warning mt-2 mb-0">
              VENTA se registra desde el módulo de ventas (para mantener inventario, venta items y caja consistentes).
            </div>
          ) : null}
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
            disabled={!esReposicion}
            required={esReposicion}
          />
          {!esReposicion ? (
            <div className="form-text">Solo aplica en REPOSICION (actualiza WAC del producto).</div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={esVenta}>
          Guardar
        </button>

        <Link href="/inventario" className="btn btn-outline-light">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
