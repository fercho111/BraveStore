import { NextResponse } from 'next/server';
import { getCajaMovimientos } from './queries';

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

  return NextResponse.json({ movimientos: data });
}
