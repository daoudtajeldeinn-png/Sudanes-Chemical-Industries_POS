import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { getAuthUser } from '@/lib/auth';
export async function GET(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const filter = { isActive: true };
    if (q) filter.$or = [{ customerName: { $regex: q, $options: 'i' } }, { phone: { $regex: q, $options: 'i' } }, { customerCode: { $regex: q, $options: 'i' } }];
    const customers = await Customer.find(filter).populate('group', 'groupName discountRate').sort({ customerName: 1 });
    return NextResponse.json({ customers });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
export async function POST(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const customer = await Customer.create(body);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
