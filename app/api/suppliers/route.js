import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import connectDB from '@/lib/mongodb';
import Supplier from '@/models/Supplier';
import { getAuthUser } from '@/lib/auth';
export async function GET(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const filter = { isActive: true };
    if (q) filter.$or = [{ supplierName: { $regex: q, $options: 'i' } }, { supplierCode: { $regex: q, $options: 'i' } }];
    const suppliers = await Supplier.find(filter).sort({ supplierName: 1 });
    return NextResponse.json({ suppliers });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
export async function POST(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const supplier = await Supplier.create(body);
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
