import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'API routes are working on Netlify',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'success',
    message: 'POST method working',
    timestamp: new Date().toISOString(),
  });
}
