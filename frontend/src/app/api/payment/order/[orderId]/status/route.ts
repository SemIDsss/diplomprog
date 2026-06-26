import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  return NextResponse.json({ message: 'Proxy works', orderId: params.orderId });
}