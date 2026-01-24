// app/ventas/nueva/NuevaVentaClient.tsx
"use client";

import { useState } from "react";
import { ClienteRow as Cliente, ProductoRow as Producto } from "@/lib/utils/types";
import { crearVenta } from "../actions";

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

export function NuevaVentaClient({ productos, clientes }: Props) {
  const [lineas, setLineas] = useState<LineaDeVenta[]>([
    {
      id: "1",
      productoId: "",
      cantidad: 1,
      locked: false,
      codigoTexto: "",
      nombreTexto: "",
    },
  ]);

  // Add this helper near the top (inside the component file, outside functions is fine)
  function crearLineaVacia(): LineaDeVenta {
    return {
      id: String(Date.now()),
      productoId: "",
      cantidad: 1,
      locked: false,
      codigoTexto: "",
      nombreTexto: "",
    };
  }

  // --- ESTADO DEL CLIENTE ---
  const [documento, setDocumento] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [clienteError, setClienteError] = useState<string | null>(null);
  const [pagoCliente, setPagoCliente] = useState<string>("");
  const [pagoError, setPagoError] = useState<string | null>(null);


  function getProductoById(id: string) {
    return productos.find((p) => p.id === id) || null;
  }
  function calcularTotalVenta(lineas: LineaDeVenta[], productos: Producto[]): number {
    return lineas
      .filter((l) => l.locked && l.productoId && l.cantidad >= 1)
      .reduce((total, linea) => {
        const producto = productos.find((p) => p.id === linea.productoId);
        if (!producto) return total;
        return total + producto.precio * linea.cantidad;
      }, 0);
  }


  function agregarLinea() {
    setLineas((prev) => [...prev, crearLineaVacia()]);
  }

  // Cambiar por código (con autocomplete)
  function cambiarCodigo(lineaId: string, valor: string) {
    setLineas((prev) =>
      prev.map((linea) => {
        if (linea.id !== lineaId) return linea;

        const actualizado: LineaDeVenta = {
          ...linea,
          codigoTexto: valor,
        };

        const producto = productos.find((p) => p.codigo === valor);
        if (producto) {
          actualizado.productoId = producto.id;
          actualizado.nombreTexto = producto.nombre_producto;
          actualizado.locked = false; // <-- no bloquear aquí
        } else {
          actualizado.productoId = "";
          actualizado.nombreTexto = "";
          actualizado.locked = false;
        }

        return actualizado;
      })
    );
  }

  // Cambiar por nombre (con autocomplete)
  function cambiarNombre(lineaId: string, valor: string) {
    setLineas((prev) =>
      prev.map((linea) => {
        if (linea.id !== lineaId) return linea;

        const actualizado: LineaDeVenta = {
          ...linea,
          nombreTexto: valor,
        };

        const producto = productos.find((p) => p.nombre_producto === valor);
        if (producto) {
          actualizado.productoId = producto.id;
          actualizado.codigoTexto = producto.codigo;
          actualizado.locked = false; // <-- no bloquear aquí
        } else {
          actualizado.productoId = "";
          actualizado.codigoTexto = "";
          actualizado.locked = false;
        }

        return actualizado;
      })
    );
  }


  function cambiarCantidad(lineaId: string, nuevaCantidad: number) {
    if (Number.isNaN(nuevaCantidad) || nuevaCantidad < 1) return;
    setLineas((prev) =>
      prev.map((linea) =>
        linea.id === lineaId
          ? {
              ...linea,
              cantidad: nuevaCantidad,
            }
          : linea
      )
    );
  }

  function editarLinea(lineaId: string) {
    setLineas((prev) =>
      prev.map((linea) =>
        linea.id === lineaId
          ? {
              ...linea,
              locked: false,
            }
          : linea
      )
    );
  }

  function eliminarLinea(lineaId: string) {
    setLineas((prev) => prev.filter((linea) => linea.id !== lineaId));
  }

  function bloquearLineaSiValida(lineaId: string) {
    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.id === lineaId);
      if (idx === -1) return prev;

      const linea = prev[idx];
      if (!linea.productoId || linea.cantidad < 1) return prev;

      // Buscar otra línea con el mismo producto (duplicado)
      const dupIdx = prev.findIndex(
        (l, i) => i !== idx && l.productoId === linea.productoId
      );

      // Si existe duplicado -> sumar cantidad al existente y eliminar la línea actual
      if (dupIdx !== -1) {
        const next = [...prev];

        next[dupIdx] = {
          ...next[dupIdx],
          cantidad: next[dupIdx].cantidad + linea.cantidad,
          locked: true, // queda confirmada
        };

        next.splice(idx, 1); // elimina la línea duplicada que se intentó agregar
        return next.length ? next : [crearLineaVacia()];
      }

      // Si no hay duplicado -> simplemente bloquear la línea actual
      return prev.map((l) =>
        l.id === lineaId ? { ...l, locked: true } : l
      );
    });
  }


  // ---------- CLIENTE: BÚSQUEDA POR DOCUMENTO (SIN AUTOCOMPLETE) ----------

  function buscarClientePorDocumento(doc: string): Cliente | null {
    const normalizado = doc.trim();
    if (!normalizado) return null;
    return (
      clientes.find(
        (c) => (c.documento ?? "").trim() === normalizado
      ) || null
    );
  }

  function validarCliente() {
    const cliente = buscarClientePorDocumento(documento);
    if (cliente) {
      setClienteSeleccionado(cliente);
      setClienteError(null);
    } else {
      setClienteSeleccionado(null);
      setClienteError("No se encontró ningún cliente con ese documento.");
    }
  }

  const todasBloqueadasYValidas =
    lineas.length > 0 &&
    lineas.every(
      (l) => l.locked && l.productoId !== "" && l.cantidad >= 1
    );

  const ventaLista = todasBloqueadasYValidas && clienteSeleccionado !== null;

  const totalVenta = calcularTotalVenta(lineas, productos);

  function validarPago(valor: string) {
    setPagoCliente(valor);

    if (valor === "") {
      setPagoError("Ingrese cuánto paga el cliente.");
      return;
    }

    const numero = Number(valor);

    if (!Number.isInteger(numero)) {
      setPagoError("El valor debe ser un número entero.");
      return;
    }

    if (Number.isNaN(numero) || numero < 0) {
      setPagoError("El valor no puede ser negativo.");
      return;
    }

    if (numero > totalVenta) {
      setPagoError("El valor no puede ser mayor al total de la venta.");
      return;
    }

    setPagoError(null);
  }

  const pagoValido = pagoCliente !== "" && pagoError === null;
  const ventaConfirmable = ventaLista && pagoValido;


  // --------- DATOS QUE REALMENTE SE VAN A ENVIAR AL SERVIDOR ---------

  type ItemSubmit = {
    productoId: string;
    cantidad: number;
  };

  const itemsParaEnviar: ItemSubmit[] = lineas
    .filter((l) => l.locked && l.productoId && l.cantidad >= 1)
    .map((l) => ({
      productoId: l.productoId,
      cantidad: l.cantidad,
    }));

  const clienteIdParaEnviar = clienteSeleccionado?.id ?? "";

  return (
    <main>
      {/* El formulario que envía todo a la server action */}
      <form action={crearVenta}>
        {/* Hidden inputs con los datos mínimos que necesita el servidor */}
        <input
          type="hidden"
          name="clienteId"
          value={clienteIdParaEnviar}
        />
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(itemsParaEnviar)}
        />

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 600,
                marginBottom: "0.25rem",
              }}
            >
              Nueva venta
            </h1>
          </div>

          <button
            type="submit"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "0.5rem",
              border: "none",
              cursor: ventaConfirmable ? "pointer" : "not-allowed",
              backgroundColor: ventaConfirmable ? "#16a34a" : "#9ca3af",
              color: "white",
              whiteSpace: "nowrap",
            }}
            disabled={!ventaConfirmable}
          >
            Confirmar venta
          </button>
        </header>

        {/* ----------- SECCIÓN CLIENTE ----------- */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            Cliente
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "flex-end",
              marginBottom: "0.5rem",
            }}
          >
            <div style={{ minWidth: "220px" }}>
              <label
                htmlFor="documento-cliente"
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  marginBottom: "0.15rem",
                }}
              >
                Documento del cliente
              </label>
              <input
                id="documento-cliente"
                type="text"
                value={documento}
                onChange={(e) => {
                  setDocumento(e.target.value);
                  setClienteSeleccionado(null);
                  setClienteError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    validarCliente();
                  }
                }}
                placeholder="Digite el número de documento"
                style={{
                  width: "100%",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <button
              type="button"
              onClick={validarCliente}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Buscar cliente
            </button>
          </div>

          {clienteError && (
            <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>
              {clienteError}
            </p>
          )}

          {clienteSeleccionado && (
            <div
              style={{
                marginTop: "0.25rem",
                padding: "0.6rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              <div>
                <strong>Cliente:</strong> {clienteSeleccionado.nombre}
              </div>
              {clienteSeleccionado.documento && (
                <div>
                  <strong>Documento:</strong> {clienteSeleccionado.documento}
                </div>
              )}
              {clienteSeleccionado.celular && (
                <div>
                  <strong>Celular:</strong> {clienteSeleccionado.celular}
                </div>
              )}
            </div>
          )}

          {!clienteSeleccionado && !clienteError && (
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: "0.9rem",
                color: "#6b7280",
              }}
            >
              Busque el cliente por documento. La venta no podrá confirmarse sin
              un cliente válido.
            </p>
          )}
        </section>

        {/* ----------- SECCIÓN PRODUCTOS ----------- */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              Productos de la venta
            </h2>

            <button
              type="button"
              onClick={agregarLinea}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              + Agregar producto
            </button>
          </div>

          {lineas.length === 0 ? (
            <p style={{ fontSize: "0.95rem", color: "#6b7280" }}>
              No hay productos. Use el botón <strong>“Agregar producto”</strong>.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {lineas.map((linea) => {
                const producto = getProductoById(linea.productoId);
                const idCodigos = `codigos-${linea.id}`;
                const idNombres = `nombres-${linea.id}`;

                return (
                  <div
                    key={linea.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0, 1.3fr) minmax(0, 1.3fr) minmax(0, 0.7fr) auto",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    {linea.locked && producto ? (
                      <>
                        {/* Vista bloqueada */}
                        <div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              marginBottom: "0.15rem",
                            }}
                          >
                            Producto
                          </div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 500 }}>
                            {producto.nombre_producto} ({producto.codigo})
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                            Precio: $
                            {producto.precio.toLocaleString("es-CO")}
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              marginBottom: "0.15rem",
                            }}
                          >
                            Cantidad
                          </div>
                          <div
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 500,
                            }}
                          >
                            {linea.cantidad}
                          </div>
                        </div>

                        <div
                          style={{
                            justifySelf: "end",
                            display: "flex",
                            gap: "0.25rem",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => editarLinea(linea.id)}
                            style={{
                              padding: "0.35rem 0.75rem",
                              borderRadius: "0.375rem",
                              border: "1px solid #d1d5db",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarLinea(linea.id)}
                            style={{
                              padding: "0.35rem 0.75rem",
                              borderRadius: "0.375rem",
                              border: "1px solid #e81313",
                              cursor: "pointer",
                              color: "#e81313",
                              fontSize: "0.85rem",
                            }}
                          >
                            X
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Vista editable con autocomplete */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              marginBottom: "0.15rem",
                            }}
                          >
                            Buscar por código
                          </label>
                          <input
                            list={idCodigos}
                            value={linea.codigoTexto}
                            onChange={(e) =>
                              cambiarCodigo(linea.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                bloquearLineaSiValida(linea.id);
                              }
                            }}
                            placeholder="Escriba o seleccione el código"
                            style={{
                              width: "100%",
                              padding: "0.4rem 0.6rem",
                              borderRadius: "0.5rem",
                              border: "1px solid #d1d5db",
                              fontSize: "0.9rem",
                            }}
                          />
                          <datalist id={idCodigos}>
                            {productos.map((p) => (
                              <option key={p.id} value={p.codigo}>
                                {p.codigo} — {p.nombre_producto}
                              </option>
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              marginBottom: "0.15rem",
                            }}
                          >
                            Buscar por nombre
                          </label>
                          <input
                            list={idNombres}
                            value={linea.nombreTexto}
                            onChange={(e) =>
                              cambiarNombre(linea.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                bloquearLineaSiValida(linea.id);
                              }
                            }}
                            placeholder="Escriba o seleccione el nombre"
                            style={{
                              width: "100%",
                              padding: "0.4rem 0.6rem",
                              borderRadius: "0.5rem",
                              border: "1px solid #d1d5db",
                              fontSize: "0.9rem",
                            }}
                          />
                          <datalist id={idNombres}>
                            {productos.map((p) => (
                              <option key={p.id} value={p.nombre_producto}>
                                {p.nombre_producto} — {p.codigo}
                              </option>
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              marginBottom: "0.15rem",
                            }}
                          >
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={linea.cantidad}
                            onChange={(e) =>
                              cambiarCantidad(linea.id, Number(e.target.value))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                bloquearLineaSiValida(linea.id);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "0.4rem 0.6rem",
                              borderRadius: "0.5rem",
                              border: "1px solid #d1d5db",
                              fontSize: "0.9rem",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              marginBottom: "0.15rem",
                            }}
                          >
                            .
                          </label>
                          <button
                            type="button"
                            onClick={() => eliminarLinea(linea.id)}
                            style={{
                              padding: "0.35rem 0.75rem",
                              borderRadius: "0.375rem",
                              border: "1px solid #e81313",
                              cursor: "pointer",
                              color: "#e81313",
                              fontSize: "0.85rem",
                            }}
                          >
                            X
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ----------- RESUMEN TOTAL ----------- */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Total de la venta:{" "}
              <span style={{ fontWeight: 700 }}>
                ${totalVenta.toLocaleString("es-CO")}
              </span>
            </div>

            {ventaLista && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "0.25rem",
                  marginTop: "0.25rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                  }}
                >
                  ¿Cuánto paga el cliente ahora?
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  name='pagoCliente'
                  value={pagoCliente}
                  onChange={(e) => validarPago(e.target.value)}
                  style={{
                    width: "160px",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.9rem",
                    textAlign: "right",
                  }}
                />
                {pagoError && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#b91c1c",
                      textAlign: "right",
                    }}
                  >
                    {pagoError}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>


        <section style={{ marginTop: "1.5rem", fontSize: "0.95rem" }}>
          {!ventaLista ? (
            <p style={{ color: "#b91c1c" }}>
              Para confirmar la venta, seleccione un cliente válido y bloquee
              todos los productos.
            </p>
          ) : (
            <p style={{ color: "#16a34a" }}>
              Pulsar <strong>“Confirmar venta”</strong>.
            </p>
          )}
        </section>
      </form>
    </main>
  );
}
