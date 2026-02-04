// app/ventas/nueva/NuevaVentaClient.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClienteRow as Cliente, ProductoRow as Producto } from '@/lib/utils/types';
import { formatMoney } from '@/lib/utils/helpers';
import { crearVenta } from '../actions';

type LineaDeVenta = {
  id: string;
  productoId: string;
  cantidad: number;
  locked: boolean;
  codigoTexto: string;
  nombreTexto: string;
};

type Props = {
  productos: Producto[];
  clientes: Cliente[];
};

type Medio = 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';

function nuevaLinea(): LineaDeVenta {
  return {
    id: String(Date.now() + Math.random()),
    productoId: '',
    cantidad: 1,
    locked: false,
    codigoTexto: '',
    nombreTexto: '',
  };
}

export function NuevaVentaClient({ productos, clientes }: Props) {
  const [lineas, setLineas] = useState<LineaDeVenta[]>([nuevaLinea()]);

  // --- Cliente ---
  const [documento, setDocumento] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [clienteError, setClienteError] = useState<string | null>(null);

  // --- Pago ---
  const [pagoCliente, setPagoCliente] = useState<string>('');
  const [pagoError, setPagoError] = useState<string | null>(null);

  // --- Medio de pago (EFECTIVO | TRANSFERENCIA | OTRO) ---
  const [medio, setMedio] = useState<Medio | null>(null);

  const productosById = useMemo(() => {
    const m = new Map<string, Producto>();
    for (const p of productos) m.set(p.id, p);
    return m;
  }, [productos]);

  const productoIdByCodigo = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of productos) if (p.codigo) m.set(p.codigo, p.id);
    return m;
  }, [productos]);

  const productoIdByNombre = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of productos) if (p.nombre_producto) m.set(p.nombre_producto, p.id);
    return m;
  }, [productos]);

  function calcularTotalVenta(ls: LineaDeVenta[]): number {
    let total = 0;
    for (const l of ls) {
      if (!l.locked || !l.productoId || l.cantidad < 1) continue;
      const p = productosById.get(l.productoId);
      if (!p) continue;
      total += p.precio * l.cantidad;
    }
    return total;
  }

  const totalVenta = useMemo(() => calcularTotalVenta(lineas), [lineas, productosById]);

  function updateLinea(lineaId: string, patch: Partial<LineaDeVenta>) {
    setLineas((prev) => prev.map((l) => (l.id === lineaId ? { ...l, ...patch } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, nuevaLinea()]);
  }

  function eliminarLinea(lineaId: string) {
    setLineas((prev) => {
      const next = prev.filter((l) => l.id !== lineaId);
      return next.length ? next : [nuevaLinea()];
    });
  }

  function editarLinea(lineaId: string) {
    updateLinea(lineaId, { locked: false });
  }

  function cambiarCodigo(lineaId: string, valor: string) {
    const raw = valor;
    const id = productoIdByCodigo.get(raw) ?? '';
    const p = id ? productosById.get(id) ?? null : null;

    updateLinea(lineaId, {
      codigoTexto: raw,
      productoId: id,
      nombreTexto: p ? p.nombre_producto : '',
      locked: false,
    });
  }

  function cambiarNombre(lineaId: string, valor: string) {
    const raw = valor;
    const id = productoIdByNombre.get(raw) ?? '';
    const p = id ? productosById.get(id) ?? null : null;

    updateLinea(lineaId, {
      nombreTexto: raw,
      productoId: id,
      codigoTexto: p ? p.codigo : '',
      locked: false,
    });
  }

  function cambiarCantidad(lineaId: string, n: number) {
    if (!Number.isFinite(n) || n < 1) return;
    updateLinea(lineaId, { cantidad: Math.floor(n) });
  }

  function confirmarLinea(lineaId: string) {
    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.id === lineaId);
      if (idx === -1) return prev;

      const linea = prev[idx];
      if (!linea.productoId || linea.cantidad < 1) return prev;

      // Merge si hay duplicado
      const dupIdx = prev.findIndex((l, i) => i !== idx && l.productoId === linea.productoId);
      if (dupIdx !== -1) {
        const next = [...prev];
        next[dupIdx] = {
          ...next[dupIdx],
          cantidad: next[dupIdx].cantidad + linea.cantidad,
          locked: true,
        };
        next.splice(idx, 1);
        return next.length ? next : [nuevaLinea()];
      }

      // No dup -> lock
      return prev.map((l) => (l.id === lineaId ? { ...l, locked: true } : l));
    });
  }

  // ---- Cliente: buscar por documento ----
  function buscarClientePorDocumento(doc: string): Cliente | null {
    const normalizado = doc.trim();
    if (!normalizado) return null;

    return (
      clientes.find((c) => (c.documento ?? '').trim() === normalizado) ?? null
    );
  }

  function validarCliente() {
    const c = buscarClientePorDocumento(documento);
    if (c) {
      setClienteSeleccionado(c);
      setClienteError(null);
    } else {
      setClienteSeleccionado(null);
      setClienteError('No se encontró ningún cliente con ese documento.');
    }
  }

  // ---- Pago ----
  function validarPago(valor: string) {
    setPagoCliente(valor);

    if (valor === '') {
      setPagoError('Ingrese cuánto paga el cliente.');
      return;
    }

    const numero = Number(valor);

    if (!Number.isInteger(numero)) {
      setPagoError('El valor debe ser un número entero.');
      return;
    }

    if (Number.isNaN(numero) || numero < 0) {
      setPagoError('El valor no puede ser negativo.');
      return;
    }

    if (numero > totalVenta) {
      setPagoError('El valor no puede ser mayor al total de la venta.');
      return;
    }

    setPagoError(null);
  }

  const todasBloqueadasYValidas =
    lineas.length > 0 &&
    lineas.every((l) => l.locked && l.productoId !== '' && l.cantidad >= 1);

  const ventaLista = todasBloqueadasYValidas && clienteSeleccionado !== null;
  const pagoValido = pagoCliente !== '' && pagoError === null;
  const medioValido = medio !== null;

  const ventaConfirmable = ventaLista && pagoValido && medioValido;

  // ---- Payload submit ----
  const itemsParaEnviar = useMemo(() => {
    return lineas
      .filter((l) => l.locked && l.productoId && l.cantidad >= 1)
      .map((l) => ({ productoId: l.productoId, cantidad: l.cantidad }));
  }, [lineas]);

  const clienteIdParaEnviar = clienteSeleccionado?.id ?? '';

  return (
    <>
      <form action={crearVenta}>
        <input type="hidden" name="clienteId" value={clienteIdParaEnviar} />
        <input type="hidden" name="items" value={JSON.stringify(itemsParaEnviar)} />
        {/* medio is sent via standard radio inputs below */}

        {/* Header */}
        <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3 flex-wrap">
          <div>
            <h1 className="h4 fw-semibold mb-1">Nueva venta</h1>
            <p className="text-muted mb-0">
              <Link href="/ventas" className="text-decoration-none">
                ← Volver a ventas
              </Link>
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-success"
            disabled={!ventaConfirmable}
            aria-disabled={!ventaConfirmable}
            title={
              !ventaConfirmable
                ? 'Complete cliente, productos, medio de pago y pago'
                : 'Confirmar venta'
            }
          >
            Confirmar venta
          </button>
        </header>

        {/* Cliente */}
        <div className="card mb-3">
          <div className="card-body">
            <h2 className="h6 fw-semibold mb-3">Cliente</h2>

            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-6 col-lg-4">
                <label htmlFor="documento-cliente" className="form-label mb-1">
                  Documento
                </label>
                <input
                  id="documento-cliente"
                  type="text"
                  className="form-control"
                  value={documento}
                  onChange={(e) => {
                    setDocumento(e.target.value);
                    setClienteSeleccionado(null);
                    setClienteError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      validarCliente();
                    }
                  }}
                  placeholder="Digite el número de documento"
                />
              </div>

              <div className="col-12 col-md-auto">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={validarCliente}
                >
                  Buscar
                </button>
              </div>
            </div>

            {clienteError && (
              <div className="alert alert-danger mt-3 mb-0">{clienteError}</div>
            )}

            {clienteSeleccionado && (
              <div className="alert alert-secondary mt-3 mb-0">
                <div className="fw-semibold">{clienteSeleccionado.nombre}</div>
                <div className="small text-muted">
                  {clienteSeleccionado.documento
                    ? `Documento: ${clienteSeleccionado.documento}`
                    : null}
                  {clienteSeleccionado.celular
                    ? ` • Celular: ${clienteSeleccionado.celular}`
                    : null}
                </div>
              </div>
            )}

            {!clienteSeleccionado && !clienteError && (
              <p className="text-muted mt-3 mb-0">
                Busque el cliente por documento. La venta no podrá confirmarse sin
                un cliente válido.
              </p>
            )}
          </div>
        </div>

        {/* Productos */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex align-items-baseline justify-content-between gap-2 flex-wrap mb-2">
              <h2 className="h6 fw-semibold mb-0">Productos</h2>
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={agregarLinea}
              >
                + Agregar
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead className="table-header-purple text-white">
                  <tr>
                    <th scope="col" style={{ minWidth: 160 }}>
                      Código
                    </th>
                    <th scope="col" style={{ minWidth: 240 }}>
                      Producto
                    </th>
                    <th scope="col" style={{ width: 130 }}>
                      Cantidad
                    </th>
                    <th scope="col" style={{ width: 160 }}>
                      Subtotal
                    </th>
                    <th scope="col" style={{ width: 180 }} className="text-end">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lineas.map((l) => {
                    const p = l.productoId ? productosById.get(l.productoId) : undefined;
                    const subtotal = p ? p.precio * l.cantidad : 0;

                    const lineaValida = Boolean(l.productoId) && l.cantidad >= 1;

                    const idCodigos = `codigos-${l.id}`;
                    const idNombres = `nombres-${l.id}`;

                    return (
                      <tr key={l.id} className="table-row-clickable">
                        {/* Código */}
                        <td>
                          {l.locked ? (
                            <span className="d-block py-2">{p?.codigo ?? '—'}</span>
                          ) : (
                            <>
                              <input
                                list={idCodigos}
                                className="form-control form-control-sm"
                                value={l.codigoTexto}
                                onChange={(e) => cambiarCodigo(l.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    confirmarLinea(l.id);
                                  }
                                }}
                                placeholder="Código"
                              />
                              <datalist id={idCodigos}>
                                {productos.map((pp) => (
                                  <option key={pp.id} value={pp.codigo}>
                                    {pp.codigo} — {pp.nombre_producto}
                                  </option>
                                ))}
                              </datalist>
                            </>
                          )}
                        </td>

                        {/* Nombre */}
                        <td>
                          {l.locked ? (
                            <div className="py-2">
                              <div className="fw-semibold">
                                {p?.nombre_producto ?? '—'}
                              </div>
                              {p ? (
                                <div className="small text-muted">
                                  Precio: {formatMoney(p.precio)}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <>
                              <input
                                list={idNombres}
                                className="form-control form-control-sm"
                                value={l.nombreTexto}
                                onChange={(e) => cambiarNombre(l.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    confirmarLinea(l.id);
                                  }
                                }}
                                placeholder="Nombre"
                              />
                              <datalist id={idNombres}>
                                {productos.map((pp) => (
                                  <option key={pp.id} value={pp.nombre_producto}>
                                    {pp.nombre_producto} — {pp.codigo}
                                  </option>
                                ))}
                              </datalist>
                            </>
                          )}
                        </td>

                        {/* Cantidad */}
                        <td>
                          {l.locked ? (
                            <span className="d-block py-2">{l.cantidad}</span>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              className="form-control form-control-sm"
                              value={l.cantidad}
                              onChange={(e) =>
                                cambiarCantidad(l.id, Number(e.target.value))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  confirmarLinea(l.id);
                                }
                              }}
                            />
                          )}
                        </td>

                        {/* Subtotal */}
                        <td>
                          <span className="d-block py-2">
                            {p ? formatMoney(subtotal) : '—'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="text-end">
                          <div
                            className="btn-group"
                            role="group"
                            aria-label="Acciones línea"
                          >
                            {l.locked ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-light btn-sm"
                                  onClick={() => editarLinea(l.id)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => eliminarLinea(l.id)}
                                  aria-label="Eliminar"
                                  title="Eliminar"
                                >
                                  X
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => confirmarLinea(l.id)}
                                  disabled={!lineaValida}
                                  title={
                                    !lineaValida
                                      ? 'Seleccione producto y cantidad válida'
                                      : 'Confirmar línea'
                                  }
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => eliminarLinea(l.id)}
                                  aria-label="Eliminar"
                                  title="Eliminar"
                                >
                                  X
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {lineas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-muted">
                        No hay productos. Use “Agregar”.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div className="text-muted small">Total</div>
                <div className="h5 mb-0">{formatMoney(totalVenta)}</div>
              </div>

              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-end gap-3">
                {/* Medio de pago (píldoras Bootstrap) */}
                <div>
                  <div className="form-label mb-1">Medio de pago</div>
                  <div
                    className="btn-group"
                    role="group"
                    aria-label="Medio de pago"
                  >
                    {/* EFECTIVO */}
                    <input
                      type="radio"
                      className="btn-check"
                      name="medio"
                      id="medio-efectivo"
                      value="EFECTIVO"
                      checked={medio === 'EFECTIVO'}
                      onChange={() => setMedio('EFECTIVO')}
                    />
                    <label
                      className={`btn btn-outline-light btn-sm rounded-pill ${
                        medio === 'EFECTIVO' ? 'active' : ''
                      }`}
                      htmlFor="medio-efectivo"
                    >
                      Efectivo
                    </label>

                    {/* TRANSFERENCIA */}
                    <input
                      type="radio"
                      className="btn-check"
                      name="medio"
                      id="medio-transferencia"
                      value="TRANSFERENCIA"
                      checked={medio === 'TRANSFERENCIA'}
                      onChange={() => setMedio('TRANSFERENCIA')}
                    />
                    <label
                      className={`btn btn-outline-light btn-sm rounded-pill ${
                        medio === 'TRANSFERENCIA' ? 'active' : ''
                      }`}
                      htmlFor="medio-transferencia"
                    >
                      Transferencia
                    </label>

                    {/* OTRO */}
                    <input
                      type="radio"
                      className="btn-check"
                      name="medio"
                      id="medio-otro"
                      value="OTRO"
                      checked={medio === 'OTRO'}
                      onChange={() => setMedio('OTRO')}
                    />
                    <label
                      className={`btn btn-outline-light btn-sm rounded-pill ${
                        medio === 'OTRO' ? 'active' : ''
                      }`}
                      htmlFor="medio-otro"
                    >
                      Otro
                    </label>
                  </div>
                </div>

                {/* Paga ahora */}
                <div>
                  <label className="form-label mb-1">Paga ahora</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    name="pagoCliente"
                    className={`form-control ${pagoError ? 'is-invalid' : ''}`}
                    style={{ width: 180, textAlign: 'right' }}
                    value={pagoCliente}
                    onChange={(e) => validarPago(e.target.value)}
                    disabled={!ventaLista || !medioValido}
                    placeholder={
                      !ventaLista
                        ? 'Seleccione cliente y productos'
                        : !medioValido
                        ? 'Seleccione medio de pago'
                        : '0'
                    }
                  />
                  {pagoError ? (
                    <div className="invalid-feedback">{pagoError}</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Estado general */}
            <div className="mt-3">
              {!ventaLista ? (
                <div className="alert alert-danger mb-0">
                  Para confirmar la venta: seleccione un cliente válido y
                  confirme todas las líneas.
                </div>
              ) : !medioValido ? (
                <div className="alert alert-warning mb-0">
                  Seleccione el medio de pago para continuar.
                </div>
              ) : !pagoValido ? (
                <div className="alert alert-warning mb-0">
                  Ingrese un pago válido para poder confirmar.
                </div>
              ) : (
                <div className="alert alert-success mb-0">
                  Listo. Puede pulsar <strong>“Confirmar venta”</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
