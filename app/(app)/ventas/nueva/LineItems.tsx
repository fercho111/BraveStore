'use client';

import React from 'react';

type ProductoOption = {
  id: string;
  codigo: string;
  nombre_producto: string;
  precio: number;
};

type LineItemsProps = {
  productos: ProductoOption[];
};

type LineState = {
  key: number;
  search: string;
  productoId: string | null;
  cantidad: number;
};

export default function LineItems({ productos }: LineItemsProps) {
  const [rows, setRows] = React.useState<LineState[]>([
    { key: 0, search: '', productoId: null, cantidad: 1 },
  ]);

  function handleAddRow() {
    setRows((prev) => {
      const nextKey = prev.length === 0 ? 0 : Math.max(...prev.map((r) => r.key)) + 1;
      return [...prev, { key: nextKey, search: '', productoId: null, cantidad: 1 }];
    });
  }

  function handleRemoveRow(key: number) {
    setRows((prev) => {
      if (prev.length <= 1) return prev; // siempre dejar al menos una fila
      return prev.filter((r) => r.key !== key);
    });
  }

  function handleSearchChange(key: number, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              search: value,
              // si el usuario cambia el texto a algo que no reconocemos, limpiamos productoId
              productoId: matchProductoFromInput(value, productos)?.id ?? null,
            }
          : r
      )
    );
  }

  function handleCantidadChange(key: number, value: string) {
    const n = Number(value.replace(/[^\d]/g, ''));
    const safe = Number.isNaN(n) || n <= 0 ? 1 : n;
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, cantidad: safe } : r))
    );
  }

  // Deducir producto a partir del texto del input
  function matchProductoFromInput(
    input: string,
    productos: ProductoOption[]
  ): ProductoOption | undefined {
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    // formato exacto de opción: "CODIGO — NOMBRE"
    const exact = productos.find(
      (p) => `${p.codigo} — ${p.nombre_producto}` === trimmed
    );
    if (exact) return exact;

    // si el usuario escribe solo el código
    const byCode = productos.find((p) => p.codigo === trimmed);
    if (byCode) return byCode;

    // si escribe solo el nombre exacto
    const byName = productos.find((p) => p.nombre_producto === trimmed);
    if (byName) return byName;

    return undefined;
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr) auto',
          columnGap: '0.5rem',
          rowGap: '0.5rem',
          fontWeight: 600,
          paddingBottom: '0.35rem',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '0.5rem',
        }}
      >
        <div>Producto (escriba código o nombre)</div>
        <div style={{ textAlign: 'right' }}>Cantidad</div>
        <div />
      </div>

      {rows.map((row) => {
        const datalistId = `productos-list-${row.key}`;
        const matched = row.productoId
          ? productos.find((p) => p.id === row.productoId)
          : undefined;

        return (
          <div
            key={row.key}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr) auto',
              columnGap: '0.5rem',
              rowGap: '0.25rem',
              alignItems: 'center',
              padding: '0.35rem 0',
              borderBottom: '1px solid #fafafa',
            }}
          >
            {/* Campo de búsqueda con datalist nativo */}
            <div>
              <input
                list={datalistId}
                value={row.search}
                onChange={(e) => handleSearchChange(row.key, e.target.value)}
                placeholder="Código o nombre…"
                style={inputStyle}
              />
              <datalist id={datalistId}>
                {productos.map((p) => (
                  <option
                    key={p.id}
                    value={`${p.codigo} — ${p.nombre_producto}`}
                  >
                    {p.precio.toFixed(2)}
                  </option>
                ))}
              </datalist>

              {/* información pequeña del producto seleccionado (opcional) */}
              {matched && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: '0.8rem',
                    color: '#555',
                  }}
                >
                  Seleccionado:{' '}
                  <strong>
                    {matched.codigo} — {matched.nombre_producto}
                  </strong>
                  <span style={{ marginLeft: 6 }}>
                    (Precio: {matched.precio.toFixed(2)})
                  </span>
                </div>
              )}

              {/* campo oculto con el id real del producto */}
              <input
                type="hidden"
                name="producto_ids[]"
                value={row.productoId ?? ''}
              />
            </div>

            {/* Cantidad */}
            <div style={{ textAlign: 'right' }}>
              <input
                name="cantidades[]"
                type="number"
                min={1}
                required
                value={row.cantidad}
                onChange={(e) => handleCantidadChange(row.key, e.target.value)}
                style={{
                  ...inputStyle,
                  maxWidth: 110,
                  textAlign: 'right',
                  marginLeft: 'auto',
                }}
              />
            </div>

            {/* Quitar fila */}
            <div>
              <button
                type="button"
                onClick={() => handleRemoveRow(row.key)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#c00',
                  cursor: rows.length > 1 ? 'pointer' : 'default',
                  opacity: rows.length > 1 ? 1 : 0.4,
                  padding: '0.25rem 0.4rem',
                }}
                disabled={rows.length <= 1}
              >
                Quitar
              </button>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: '0.75rem' }}>
        <button
          type="button"
          onClick={handleAddRow}
          style={secondaryButtonStyle}
        >
          + Agregar producto
        </button>
      </div>
    </div>
  );
}

/* ---- estilos coherentes con el resto de la app ---- */

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.7rem',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontWeight: 400,
  width: '100%',
  fontSize: '0.9rem',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#f7f7f7',
  color: '#222',
  cursor: 'pointer',
  fontSize: '0.85rem',
};
