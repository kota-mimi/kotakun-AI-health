import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN?.substring(0, 10) + '...',
    hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    tokenLength: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0,
    NODE_ENV: process.env.NODE_ENV
  });
}