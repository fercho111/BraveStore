'use client';

import React from 'react';

type ProductoOption = {
  id: string;
  codigo: string;
  nombre_producto: string;
  precio: number;
};

type NuevaVentaFormProps = {
  productos: ProductoOption[];
  createVenta: (formData: FormData) => Promise<void>;
};

type LineItem = {
  key: string;
  productoId: string | null;
  searchTerm: string;
  cantidad: number;
};

export default function NuevaVentaForm({
  productos,
  createVenta,
}: NuevaVentaFormProps) {
  const [items, setItems] = React.useState<LineItem[]>([
    {
      key: crypto.randomUUID(),
      productoId: null,
      searchTerm: '',
      cantidad: 1,
    },
  ]);

  const [submitting, setSubmitting] = React.useState(false);

  function handleAddLine() {
    setItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productoId: null,
        searchTerm: '',
        cantidad: 1,
      },
    ]);
  }

  function handleRemoveLine(key: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.key !== key)));
  }

  function handleSearchChange(key: string, value: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? { ...i, searchTerm: value, productoId: value === '' ? null : i.productoId }
          : i
      )
    );
  }

  function handleSelectProducto(lineKey: string, productoId: string) {
    const producto = productos.find((p) => p.id === productoId);
    setItems((prev) =>
      prev.map((i) =>
        i.key === lineKey
          ? {
              ...i,
              productoId,
              searchTerm: producto
                ? `${producto.codigo} – ${producto.nombre_producto}`
                : i.searchTerm,
            }
          : i
      )
    );
  }

  function handleCantidadChange(key: string, value: string) {
    const n = Number(value.replace(/[^\d]/g, ''));
    const safe = Number.isNaN(n) || n <= 0 ? 1 : n;
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, cantidad: safe } : i)));
  }

  function getFilteredProductos(term: string) {
    const t = term.trim().toLowerCase();
    if (!t) return productos.slice(0, 10);

    return productos
      .filter((p) => {
        const byCode = p.codigo.toLowerCase().includes(t);
        const byName = p.nombre_producto.toLowerCase().includes(t);
        return byCode || byName;
      })
      .slice(0, 10);
  }

  async function handleSubmit(formData: FormData) {
    // prevent submit if no valid lines
    const validLines = items.filter((i) => i.productoId && i.cantidad > 0);
    if (validLines.length === 0) {
      alert('Agregue al menos un producto a la venta.');
      return;
    }

    // inject current state into formData (hidden inputs already mirror state,
    // but we ensure only valid lines go through)
    formData.delete('producto_ids[]');
    formData.delete('cantidades[]');

    for (const line of validLines) {
      formData.append('producto_ids[]', line.productoId as string);
      formData.append('cantidades[]', String(line.cantidad));
    }

    try {
      setSubmitting(true);
      await createVenta(formData);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Optional: info like cliente, nota, etc. can go here later */}

      <div
        style={{
          marginTop: '0.75rem',
          border: '1px solid #eee',
          borderRadius: 8,
          padding: '0.75rem',
        }}
      >
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
          <div>Buscar producto (código o nombre)</div>
          <div style={{ textAlign: 'right' }}>Cantidad</div>
          <div />
        </div>

        {items.map((item) => {
          const suggestions = getFilteredProductos(item.searchTerm);

          const selectedProducto =
            item.productoId && productos.find((p) => p.id === item.productoId);

          return (
            <div
              key={item.key}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr) auto',
                columnGap: '0.5rem',
                rowGap: '0.25rem',
                alignItems: 'flex-start',
                padding: '0.35rem 0',
                borderBottom: '1px solid #fafafa',
              }}
            >
              {/* Search + dropdown */}
              <div style={{ position: 'relative' }}>
                <input
                  value={item.searchTerm}
                  onChange={(e) => handleSearchChange(item.key, e.target.value)}
                  placeholder="Escriba código o nombre..."
                  style={inputStyle}
                  autoComplete="off"
                />

                {item.searchTerm.trim() !== '' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      maxHeight: 220,
                      overflowY: 'auto',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      marginTop: 4,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                    }}
                  >
                    {suggestions.length === 0 ? (
                      <div
                        style={{
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.85rem',
                          color: '#777',
                        }}
                      >
                        Sin resultados.
                      </div>
                    ) : (
                      suggestions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProducto(item.key, p.id)}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.4rem 0.6rem',
                            border: 'none',
                            background: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontSize: '0.9rem' }}>
                            <strong>{p.codigo}</strong> – {p.nombre_producto}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: '#777',
                              marginTop: 2,
                            }}
                          >
                            Precio: {p.precio.toFixed(2)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedProducto && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: '0.8rem',
                      color: '#555',
                    }}
                  >
                    Seleccionado:{' '}
                    <strong>
                      {selectedProducto.codigo} – {selectedProducto.nombre_producto}
                    </strong>
                    <span style={{ marginLeft: 6 }}>
                      (Precio: {selectedProducto.precio.toFixed(2)})
                    </span>
                  </div>
                )}

                {/* Hidden field for producto_id[] tied to this line */}
                <input
                  type="hidden"
                  name="producto_ids[]"
                  value={item.productoId ?? ''}
                />
              </div>

              {/* Cantidad */}
              <div style={{ textAlign: 'right' }}>
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) => handleCantidadChange(item.key, e.target.value)}
                  style={{
                    ...inputStyle,
                    maxWidth: 110,
                    textAlign: 'right',
                    marginLeft: 'auto',
                  }}
                />
                {/* Hidden field for cantidad[] */}
                <input
                  type="hidden"
                  name="cantidades[]"
                  value={item.cantidad}
                />
              </div>

              {/* Remove button */}
              <div style={{ alignSelf: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleRemoveLine(item.key)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#c00',
                    cursor: items.length > 1 ? 'pointer' : 'default',
                    opacity: items.length > 1 ? 1 : 0.4,
                    padding: '0.25rem 0.4rem',
                  }}
                  disabled={items.length <= 1}
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
            onClick={handleAddLine}
            style={secondaryButtonStyle}
          >
            + Agregar producto
          </button>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
        <button
          type="submit"
          style={buttonStyle}
          disabled={submitting}
        >
          {submitting ? 'Guardando…' : 'Guardar venta'}
        </button>
      </div>
    </form>
  );
}

/* ---- Styles (keep consistent with your other pages) ---- */

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.7rem',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontWeight: 400,
  width: '100%',
  fontSize: '0.9rem',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.6rem 0.9rem',
  borderRadius: 8,
  border: '1px solid #222',
  background: '#222',
  color: '#fff',
  cursor: 'pointer',
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
