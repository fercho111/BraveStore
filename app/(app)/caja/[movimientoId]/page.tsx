// app/caja/[movimientoId]/page.tsx

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime, formatMoney } from '@/lib/utils/helpers';

type PageProps = {
  params: { movimientoId: string };
};

type CajaMovimientoDetalleRow = {
  id: string;
  tipo: 'CARGO' | 'PAGO';
  monto: string | number;
  medio: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO' | null;
  creado_en: string;
  venta_id: string | null;
  clientes: { id: string; nombre: string; documento: string | null; celular: string | null } | null;
  empleado: { id: string; nombre: string | null; rol: 'admin' | 'cajero' } | null;
};

export default async function CajaMovimientoDetallePage({ params }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { movimientoId } = await params;

  const { data, error } = await supabase
    .from('caja')
    .select(
      `
      id,
      tipo,
      monto,
      medio,
      creado_en,
      venta_id,
      clientes:cliente_id (
        id,
        nombre,
        documento,
        celular
      ),
      empleado:empleado_id (
        id,
        nombre,
        rol
      )
    `,
    )
    .eq('id', movimientoId)
    .single();

  if (error || !data) {
    // If ID is valid format but not found
    if (error?.code === 'PGRST116') notFound();
    throw new Error(`Error cargando movimiento de caja: ${error?.message ?? 'No encontrado'}`);
  }

  const m = data as unknown as CajaMovimientoDetalleRow;

  return (
    <>
      <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3 flex-wrap">
        <div>
          <h1 className="h4 fw-semibold mb-1">Movimiento de caja</h1>
          <p className="text-muted mb-0">ID: {m.id}</p>
        </div>

        <Link href="/caja" className="btn btn-outline-light">
          Volver
        </Link>
      </header>

      <section className="row g-3">
        {/* Resumen */}
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-3">Detalle</h2>

              <dl className="row mb-0">
                <dt className="col-4">Fecha</dt>
                <dd className="col-8">{formatDateTime(m.creado_en)}</dd>

                <dt className="col-4">Tipo</dt>
                <dd className="col-8">
                  <span className={tipoBadgeClass(m.tipo)}>
                    {m.tipo === 'CARGO' ? 'Cargo' : 'Pago'}
                  </span>
                </dd>

                <dt className="col-4">Monto</dt>
                <dd className="col-8">
                  <span className="fw-semibold">{formatMoney(m.monto)}</span>
                </dd>

                <dt className="col-4">Medio</dt>
                <dd className="col-8">
                  {m.tipo === 'PAGO' && m.medio ? (
                    <span className="text-nowrap">{formatMedio(m.medio)}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </dd>

                <dt className="col-4">Venta</dt>
                <dd className="col-8">
                  {m.venta_id ? (
                    <Link href={`/ventas/${m.venta_id}`} className="text-primary text-decoration-none">
                      Venta #{shortId(m.venta_id)}
                    </Link>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-3">Cliente</h2>

              {m.clientes ? (
                <>
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div className="fw-semibold">{m.clientes.nombre}</div>
                      <div className="small text-muted">
                        {m.clientes.documento ? `Documento: ${m.clientes.documento}` : 'Documento: —'}
                        {m.clientes.celular ? ` • Celular: ${m.clientes.celular}` : ''}
                      </div>
                    </div>

                    <Link
                      href={`/clientes/${m.clientes.id}`}
                      className="btn btn-outline-light btn-sm text-nowrap"
                    >
                      Ver cliente
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-muted">—</div>
              )}
            </div>
          </div>
        </div>

        {/* Empleado */}
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-3">Empleado</h2>

              {m.empleado ? (
                <>
                  <div className="fw-semibold">{m.empleado.nombre?.trim() ? m.empleado.nombre : 'Sin nombre'}</div>
                  <div className="small text-muted">
                    Rol: {m.empleado.rol}
                  </div>
                </>
              ) : (
                <div className="text-muted">—</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4">
        <Link href="/caja" className="text-decoration-none">
          ← Volver a caja
        </Link>
      </div>
    </>
  );
}

/* ---- Helpers ---- */

function tipoBadgeClass(tipo: 'CARGO' | 'PAGO'): string {
  if (tipo === 'CARGO') return 'badge rounded-pill border border-warning text-warning';
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
