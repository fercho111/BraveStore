import { NextResponse } from 'next/server';
import { getVentas } from '../queries';

function csvValue(value: string | number | null | undefined): string {
  const normalized = value === null || value === undefined ? '' : String(value);
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET() {
  const { data, error } = await getVentas();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const header = ['fecha', 'cliente', 'empleado', 'total', 'pagado', 'venta_id'];
  const rows = data.map((venta) => [
    csvValue(venta.creado_en ?? ''),
    csvValue(venta.clientes?.nombre ?? ''),
    csvValue(venta.empleados?.nombre ?? venta.empleados?.id ?? ''),
    csvValue(venta.total ?? ''),
    csvValue(venta.pagado ?? ''),
    csvValue(venta.id),
  ]);

  const csv = [header.map(csvValue).join(','), ...rows.map((row) => row.join(','))].join(
    '\n',
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ventas.csv"',
    },
  });
}
