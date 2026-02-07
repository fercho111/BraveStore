import { NextResponse } from 'next/server';
import { getInventarioMovimientos } from './queries';

export async function GET() {
  const { data, error } = await getInventarioMovimientos();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ movimientos: data });
}
