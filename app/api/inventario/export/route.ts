import { NextResponse } from 'next/server';
import { getInventarioMovimientos } from '../queries';

function csvValue(value: string | number | null | undefined): string {
  const normalized = value === null || value === undefined ? '' : String(value);
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET() {
  const { data, error } = await getInventarioMovimientos();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const header = [
    'fecha',
    'producto',
    'tipo',
    'cantidad',
    'costo_unitario_entrada',
    'empleado',
    'referencia_venta_id',
  ];
  const rows = data.map((movimiento) => [
    csvValue(movimiento.creado_en),
    csvValue(
      movimiento.productos
        ? `${movimiento.productos.codigo} — ${movimiento.productos.nombre_producto}`
        : '',
    ),
    csvValue(movimiento.tipo),
    csvValue(movimiento.cantidad_cambio),
    csvValue(movimiento.costo_unitario_entrada ?? ''),
    csvValue(movimiento.empleados?.nombre ?? movimiento.empleados?.id ?? ''),
    csvValue(movimiento.referencia_venta_id ?? ''),
  ]);

  const csv = [header.map(csvValue).join(','), ...rows.map((row) => row.join(','))].join(
    '\n',
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="inventario.csv"',
    },
  });
}
