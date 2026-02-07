// app/caja/page.tsx

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatMoney, formatDateTime } from '@/lib/utils/helpers';
import { ClickableRow } from '@/lib/components/ClickableRow';

type CajaMovimientoRow = {
  id: string;
  tipo: 'CARGO' | 'PAGO';
  monto: string | number;
  medio: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO' | null;
  creado_en: string;
  clientes: {
    id: string;
    nombre: string;
  } | null;
  ventas: {
    id: string;
    total: string | number;
    pagado: string | number;
    creado_en: string;
  } | null;
  empleado: {
    id: string;
    nombre: string | null;
    rol: 'admin' | 'cajero';
  } | null;
};

type CajaPageProps = {
  searchParams?: { tipo?: string; from?: string; to?: string };
};

export default async function CajaPage({ searchParams }: CajaPageProps) {
  // odio el sistema de await, arreglar urgente
  const raw = await searchParams;
  const filtroTipoRaw = raw?.tipo;

  const filtroTipo: 'CARGO' | 'PAGO' | null =
    filtroTipoRaw === 'CARGO' || filtroTipoRaw === 'PAGO'
      ? filtroTipoRaw
      : null;

  const fromRaw = raw?.from?.trim();
  const toRaw = raw?.to?.trim();


  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const startLast6h = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  // Normalize strings for comparison
  const fromIsoRaw = fromRaw ? new Date(fromRaw).toISOString() : null;
  const toIsoRaw = toRaw ? new Date(toRaw).toISOString() : null;

  const startTodayIso = startToday.toISOString();
  const startLast6hIso = startLast6h.toISOString();
  const nowIso = now.toISOString();

  // Detect active filters
  const esHoy =
    fromIsoRaw === startTodayIso &&
    toIsoRaw &&
    new Date(toIsoRaw).getTime() - now.getTime() < 5_000; // allow small drift

  const esUltimas6h =
    fromIsoRaw === startLast6hIso &&
    toIsoRaw &&
    new Date(toIsoRaw).getTime() - now.getTime() < 5_000;

  const sinRango = !fromRaw && !toRaw;


  // We accept ISO-like strings (e.g. "2026-02-06T14:00").
  // Convert to full ISO with seconds if needed.
  const fromIso = fromRaw ? new Date(fromRaw).toISOString() : null;
  const toIso = toRaw ? new Date(toRaw).toISOString() : null;

  // Guard against invalid dates
  const fromOk = fromIso && !Number.isNaN(Date.parse(fromIso));
  const toOk = toIso && !Number.isNaN(Date.parse(toIso));


  const supabase = await createClient();

  // Movimientos de caja (últimos 200), opcionalmente filtrados por tipo (CARGO / PAGO)
  let query = supabase
    .from('caja')
    .select(
      `
      id,
      tipo,
      monto,
      medio,
      creado_en,
      clientes:cliente_id (
        id,
        nombre
      ),
      ventas:venta_id (
        id,
        total,
        pagado,
        creado_en
      ),
      empleado:empleado_id (
        id,
        nombre,
        rol
      )
    `,
    )
    .order('creado_en', { ascending: false });

  if (filtroTipo) {
    // Filtrar por enum exacto en la BD
    query = query.eq('tipo', filtroTipo);
  }


  if (fromOk) {
  query = query.gte('creado_en', fromIso!);
  }

  if (toOk) {
    query = query.lt('creado_en', toIso!);
  }


  const { data, error } = await query.limit(200);


  if (error) {
    return (
      <>
        <div className="container py-4">
          <h1 className="h4 fw-semibold">Movimientos de caja</h1>
          <div className="alert alert-danger mt-3">
            Error cargando movimientos de caja: {error.message}
          </div>
        </div>
      </>
    );
  }

  const movimientos = (data ?? []) as unknown as CajaMovimientoRow[];

  const totalCargos = movimientos
    .filter((m) => m.tipo === 'CARGO')
    .reduce((sum, m) => sum + Number(m.monto ?? 0), 0);

  const totalPagos = movimientos
    .filter((m) => m.tipo === 'PAGO')
    .reduce((sum, m) => sum + Number(m.monto ?? 0), 0);

  const saldo = totalCargos - totalPagos;

  const saldoClass =
    saldo > 0
      ? 'badge bg-warning-subtle text-warning-emphasis'
      : saldo < 0
      ? 'badge bg-success-subtle text-success-emphasis'
      : 'badge bg-secondary-subtle text-secondary-emphasis';




  return (
    <>
      {/* Header */}
      <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3 flex-wrap">
        <div>
          <h1 className="h4 fw-semibold mb-1">Caja</h1>
          <p className="text-muted mb-0">
            Últimos {movimientos.length} movimientos
            {filtroTipo ? ` (${filtroTipo === 'CARGO' ? 'solo cargos' : 'solo pagos'})` : ''}
          </p>
        </div>

        <div className="d-flex align-items-center gap-3 flex-wrap">
          {/* Filtro por tipo */}
          <div className="btn-group" role="group" aria-label="Filtro tipo de movimiento">
            <Link
              href="/caja"
              className={
                !filtroTipo
                  ? 'btn btn-primary'
                  : 'btn btn-outline-light'
              }
            >
              Todos
            </Link>
            <Link
              href="/caja?tipo=CARGO"
              className={
                filtroTipo === 'CARGO'
                  ? 'btn btn-primary'
                  : 'btn btn-outline-light'
              }
            >
              Cargos
            </Link>
            <Link
              href="/caja?tipo=PAGO"
              className={
                filtroTipo === 'PAGO'
                  ? 'btn btn-primary'
                  : 'btn btn-outline-light'
              }
            >
              Pagos
            </Link>
          </div>

          <div className="btn-group" role="group" aria-label="Filtro tiempo">
            <Link
              href={`/caja?${filtroTipo ? `tipo=${filtroTipo}&` : ''}from=${encodeURIComponent(startTodayIso)}&to=${encodeURIComponent(nowIso)}`}
              className={
                esHoy
                  ? 'btn btn-primary'
                  : 'btn btn-outline-light'
              }
            >
              Hoy
            </Link>

            <Link
              href={`/caja?${filtroTipo ? `tipo=${filtroTipo}&` : ''}from=${encodeURIComponent(startLast6hIso)}&to=${encodeURIComponent(nowIso)}`}
              className={
                esUltimas6h
                  ? 'btn btn-primary'
                  : 'btn btn-outline-light'
              }
            >
              Últimas 6h
            </Link>

            <Link
              href={`/caja${filtroTipo ? `?tipo=${filtroTipo}` : ''}`}
              className={
                sinRango
                  ? 'btn btn-primary'
                  : 'btn btn-outline-light'
              }
            >
              Sin rango
            </Link>
          </div>

          <Link href="/caja/nuevo" className="btn btn-primary">
            Nuevo Movimiento
          </Link>
        </div>
      </header>


      {/* Resumen de saldos */}
      <section className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-2">Resumen</h2>
              <div className="small">
                <div className="mb-1">
                  <span className="text-muted">Total cargos: </span>
                  <span className="fw-semibold">
                    {formatMoney(totalCargos)}
                  </span>
                </div>
                <div className="mb-1">
                  <span className="text-muted">Total pagos: </span>
                  <span className="fw-semibold">
                    {formatMoney(totalPagos)}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-muted">Saldo (cargos - pagos): </span>
                  <span className={saldoClass}>{formatMoney(saldo)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabla de movimientos */}
      <section>
        <h2 className="h6 fw-semibold mb-3">Movimientos</h2>

        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle">
            <thead className="table-header-purple text-white">
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Tipo</th>
                <th scope="col">Cliente</th>
                <th scope="col">Medio</th>
                <th scope="col" className="text-end">
                  Monto
                </th>
                <th scope="col">Empleado</th>
              </tr>
            </thead>

            <tbody>
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-muted">
                    No hay movimientos registrados.
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => {
                  const empleadoNombre =
                    m.empleado?.nombre && m.empleado.nombre.trim() !== ''
                      ? m.empleado.nombre
                      : m.empleado
                      ? shortId(m.empleado.id)
                      : '—';

                    return (
                    <ClickableRow key={m.id} href={`/caja/${m.id}`}>
                      {/* Fecha */}
                      <td className="text-nowrap">
                      {formatDateTime(m.creado_en)}
                      </td>

                      {/* Tipo */}
                      <td>
                      <span className={tipoBadgeClass(m.tipo)}>
                        {m.tipo === 'CARGO' ? 'Cargo' : 'Pago'}
                      </span>
                      </td>

                      {/* Cliente */}
                      <td>
                      {m.clientes ? (
                        <Link
                        href={`/clientes/${m.clientes.id}`}
                        className="text-reset text-decoration-none"
                        >
                        {m.clientes.nombre}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                      </td>

                      {/* Medio */}
                      <td className="text-nowrap">
                      {m.tipo === 'PAGO' && m.medio
                        ? formatMedio(m.medio)
                        : m.tipo === 'CARGO'
                        ? '—'
                        : '—'}
                      </td>

                      {/* Monto */}
                      <td className="text-end text-nowrap">
                      {formatMoney(m.monto)}
                      </td>

                      {/* Empleado */}
                      <td>
                      {m.empleado ? (
                        <>
                        <div>{empleadoNombre}</div>
                        <div className="small text-muted">
                          Rol: {m.empleado.rol}
                        </div>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                      </td>
                    </ClickableRow>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---- Helpers ---- */

function tipoBadgeClass(tipo: 'CARGO' | 'PAGO'): string {
  if (tipo === 'CARGO') {
    return 'badge rounded-pill border border-warning text-warning';
  }
  return 'badge rounded-pill border border-success text-success';
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function formatMedio(medio: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO'): string {
  if (medio === 'EFECTIVO') return 'Efectivo';
  if (medio === 'TRANSFERENCIA') return 'Transferencia';
  return 'Otro';
}
