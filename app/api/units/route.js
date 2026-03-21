import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import connectDB from '@/lib/mongodb';
import Unit from '@/models/Unit';
import { getAuthUser } from '@/lib/auth';
export async function GET() {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const units = await Unit.find({ isActive: true }).sort({ unitName: 1 });
    return NextResponse.json({ units });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
