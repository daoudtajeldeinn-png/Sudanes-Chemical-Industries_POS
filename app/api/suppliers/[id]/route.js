import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Supplier from '@/models/Supplier';
import { getAuthUser } from '@/lib/auth';
export async function PUT(req, { params }) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const supplier = await Supplier.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ supplier });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
export async function DELETE(req, { params }) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    await Supplier.findByIdAndUpdate(params.id, { isActive: false });
    return NextResponse.json({ ok: true });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
