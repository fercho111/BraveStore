import { NextResponse } from 'next/server';
import { getCajaMovimientos } from '../queries';

function csvValue(value: string | number | null | undefined): string {
  const normalized = value === null || value === undefined ? '' : String(value);
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request: Request) {
  const { data, error } = await getCajaMovimientos(
    new URL(request.url).searchParams,
  );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const header = [
    'fecha',
    'tipo',
    'cliente',
    'medio',
    'monto',
    'empleado',
    'venta_id',
  ];

  const rows = data.map((movimiento) => [
    csvValue(movimiento.creado_en),
    csvValue(movimiento.tipo),
    csvValue(movimiento.clientes?.nombre ?? ''),
    csvValue(movimiento.medio ?? ''),
    csvValue(movimiento.monto ?? ''),
    csvValue(movimiento.empleado?.nombre ?? movimiento.empleado?.id ?? ''),
    csvValue(movimiento.ventas?.id ?? ''),
  ]);

  const csv = [header.map(csvValue).join(','), ...rows.map((row) => row.join(','))].join(
    '\n',
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="caja.csv"',
    },
  });
}
