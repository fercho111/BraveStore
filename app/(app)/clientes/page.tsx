// app/clientes/page.tsx

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ClienteRow } from '@/lib/utils/types';

export default async function ClientesPage() {
  const supabase = await createClient();

  // Query explícita de clientes
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, documento, celular, creado_en')
    .order('nombre', { ascending: true });

  if (error) {
    return (
      <>
        <div className="container py-4">
          <h1 className="h4 fw-semibold">Clientes</h1>
          <div className="alert alert-danger mt-3">
            Error cargando clientes: {error.message}
          </div>
        </div>
      </>
    );
  }

  const clientes: ClienteRow[] = data ?? [];

  return (
    <>
      <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3 flex-wrap">
          <div>
          <h1 className="h4 fw-semibold mb-1">Clientes</h1>
          <p className="text-muted mb-0">Total: {clientes.length}</p>
          </div>

          <Link href="/clientes/nuevo" className="btn btn-primary">
          Nuevo cliente
          </Link>
      </header>

      <div className="table-responsive">
          <table className="table table-dark table-hover align-middle">
          <thead className="table-header-purple text-white">
              <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Documento</th>
              <th scope="col">Celular</th>
              </tr>
          </thead>

          <tbody>
              {clientes.length === 0 ? (
              <tr>
                  <td colSpan={3} className="py-3 text-muted">
                  No hay clientes registrados.
                  </td>
              </tr>
              ) : (
              clientes.map((c) => (
                  <tr key={c.id} className="table-row-clickable">
                  <td>
                      <Link
                      href={`/clientes/${c.id}`}
                      className="d-block w-100 h-100 py-2 text-reset text-decoration-none"
                      >
                      {c.nombre}
                      </Link>
                  </td>

                  <td className="text-nowrap">
                      {c.documento && c.documento.trim() !== '' ? c.documento : '—'}
                  </td>

                  <td className="text-nowrap">
                      {c.celular && c.celular.trim() !== '' ? c.celular : '—'}
                  </td>
                  </tr>
              ))
              )}
          </tbody>
          </table>
      </div>
    </>
  );
}
