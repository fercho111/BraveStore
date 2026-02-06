// app/deudas/page.tsx

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/utils/helpers';

type SaldoClienteRow = {
  cliente_id: string;
  nombre: string | null;
  documento: string | null;
  celular: string | null;
  saldo: number | string | null;
};

export default async function DeudasPage() {
  const supabase = await createClient();

  // Query explícita sobre la vista v_saldo_clientes:
  // Solo clientes con saldo > 0 (deuda), ordenados por saldo descendente.
  const { data, error } = await supabase
    .from('v_saldo_clientes')
    .select('cliente_id, nombre, documento, celular, saldo')
    .gt('saldo', 0)
    .order('saldo', { ascending: false });

  if (error) {
    return (
      <>
        <div className="container py-4">
          <h1 className="h4 fw-semibold">Deudas</h1>
          <div className="alert alert-danger mt-3">
            Error cargando deudas: {error.message}
          </div>
        </div>
      </>
    );
  }

  const filas: SaldoClienteRow[] = (data ?? []) as SaldoClienteRow[];

  return (
    <>
      <header className="d-flex align-items-baseline justify-content-between mb-3 flex-wrap">
        <div>
          <h1 className="h4 fw-semibold mb-1">Deudas</h1>
          <p className="text-muted mb-0">
            Clientes con saldo pendiente: {filas.length}
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link href="/clientes" className="btn btn-outline-light">
            Ver clientes
          </Link>
          <Link href="/caja/nuevo" className="btn btn-primary">
            Registrar pago
          </Link>
        </div>
      </header>

      <div className="table-responsive">
          <table className="table table-dark table-hover align-middle">
            <thead className="table-header-purple text-white">
                <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Documento</th>
                <th scope="col">Celular</th>
                <th scope="col" className="text-end">
                    Saldo
                </th>
                </tr>
            </thead>
            <tbody>
            {filas.length === 0 ? (
              <tr>
              <td colSpan={4} className="py-3 text-muted">
                No hay clientes con deudas registradas.
              </td>
              </tr>
            ) : (
              filas.map((row) => {
              const saldoNumber = Number(row.saldo ?? 0);
              const rowHref = `/clientes/${row.cliente_id}`;

              return (
                <tr key={row.cliente_id}>
                <td>
                  <Link href={rowHref} className="text-decoration-none text-reset">
                  <div className="fw-semibold">
                    {row.nombre ?? 'Sin nombre'}
                  </div>
                  </Link>
                </td>
                <td className="text-nowrap">
                  <Link href={rowHref} className="text-decoration-none text-reset">
                  {row.documento && row.documento.trim() !== ''
                    ? row.documento
                    : '—'}
                  </Link>
                </td>
                <td className="text-nowrap">
                  <Link href={rowHref} className="text-decoration-none text-reset">
                  {row.celular && row.celular.trim() !== ''
                    ? row.celular
                    : '—'}
                  </Link>
                </td>
                <td className="text-end text-nowrap">
                  <Link href={rowHref} className="text-decoration-none text-reset">
                  <span className="fw-semibold text-warning">
                    {formatMoney(saldoNumber)}
                  </span>
                  </Link>
                </td>
                </tr>
              );
              })
            )}
            </tbody>
          </table>
      </div>
    </>
  );
}
