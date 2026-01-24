// app/ventas/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDateTime } from "@/lib/utils/helpers";
import type { VentaRow, ClienteRow } from "@/lib/utils/types";

type EmpleadoRow = {
  id: string;
  nombre: string | null;
  documento: string | null;
};

export default async function VentasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1) Ventas (incluyendo cliente_id y empleado_id)
  const { data: ventasData, error: ventasError } = await supabase
    .from("ventas")
    .select("id, creado_en, total, pagado, cliente_id, empleado_id")
    .order("creado_en", { ascending: false });

  if (ventasError) {
    return (
      <main>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Ventas</h1>
        <p style={{ marginTop: "1rem", color: "crimson" }}>
          Error cargando ventas: {ventasError.message}
        </p>
      </main>
    );
  }

  const ventas =
    (ventasData ?? []) as (VentaRow & {
      cliente_id: string | null;
      empleado_id: string | null;
    })[];

  // Si no hay ventas, no vale la pena hacer más queries
  if (ventas.length === 0) {
    return (
      <main>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h1>Ventas</h1>
            <p style={{ marginTop: "0.25rem", color: "#555" }}>Total: 0</p>
          </div>

          <Link href="/ventas/nueva" className="btn-primary">
            Nueva venta
          </Link>
        </header>

        <div style={{ marginTop: "1rem", overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Creado</th>
                <th>Cliente</th>
                <th>Empleado</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: "0.75rem", color: "#666" }}
                >
                  No hay ventas registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  // 2) Reunimos ids únicos de clientes y empleados
  const clienteIds = Array.from(
    new Set(
      ventas
        .map((v) => v.cliente_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const empleadoIds = Array.from(
    new Set(
      ventas
        .map((v) => v.empleado_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  // 3) Cargamos solo los clientes necesarios
  const clientesById = new Map<string, ClienteRow>();
  if (clienteIds.length > 0) {
    const { data: clientesData } = await supabase
      .from("clientes")
      .select("id, nombre, documento, celular, creado_en")
      .in("id", clienteIds);

    (clientesData ?? []).forEach((c) => {
      const cliente = c as ClienteRow;
      clientesById.set(cliente.id, cliente);
    });
  }

  // 4) Cargamos solo los empleados necesarios
  const empleadosById = new Map<string, EmpleadoRow>();
  if (empleadoIds.length > 0) {
    const { data: empleadosData } = await supabase
      .from("empleados")
      .select("id, nombre, documento")
      .in("id", empleadoIds);

    (empleadosData ?? []).forEach((e) => {
      const empleado = e as EmpleadoRow;
      empleadosById.set(empleado.id, empleado);
    });
  }

  return (
    <main>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1>Ventas</h1>
          <p style={{ marginTop: "0.25rem", color: "#555" }}>
            Total: {ventas.length}
          </p>
        </div>

        <Link href="/ventas/nueva" className="btn-primary">
          Nueva venta
        </Link>
      </header>

      <div style={{ marginTop: "1rem", overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Creado</th>
              <th>Cliente</th>
              <th>Empleado</th>
              <th>Total</th>
              <th>Pagado</th>
              <th>Detalle</th>
            </tr>
          </thead>

          <tbody>
            {ventas.map((v) => {
              const cliente = v.cliente_id
                ? clientesById.get(v.cliente_id)
                : undefined;
              const empleado = v.empleado_id
                ? empleadosById.get(v.empleado_id)
                : undefined;

              const clienteTexto = cliente ? cliente.nombre : "—";

              const empleadoTexto = empleado ? empleado.nombre ?? "Sin nombre" : "—";

              return (
                <tr key={v.id}>
                  <td style={tdStyle}>
                    {v.creado_en ? formatDateTime(v.creado_en) : "—"}
                  </td>
                  <td style={tdStyle}>
                    {cliente ? (
                      <Link
                        href={`/clientes/${cliente.id}`}
                        style={{ color: "#0a58ca", textDecoration: "none" }}
                      >
                        {clienteTexto}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={tdStyle}>{empleadoTexto}</td>
                  <td style={tdStyle}>{formatMoney(v.total)}</td>
                  <td style={tdStyle}>{formatMoney(v.pagado)}</td>
                  <td style={tdStyle}>
                    <Link
                      href={`/ventas/${v.id}`}
                      style={{ color: "#0a58ca", textDecoration: "none" }}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};