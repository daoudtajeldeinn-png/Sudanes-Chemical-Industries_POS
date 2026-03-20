import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { getAuthUser } from '@/lib/auth';
export async function PUT(req, { params }) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const customer = await Customer.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ customer });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
export async function DELETE(req, { params }) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    await Customer.findByIdAndUpdate(params.id, { isActive: false });
    return NextResponse.json({ ok: true });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
