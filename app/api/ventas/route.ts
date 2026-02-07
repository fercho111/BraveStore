import { NextResponse } from 'next/server';
import { getVentas } from './queries';

export async function GET() {
  const { data, error } = await getVentas();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ventas: data });
}
