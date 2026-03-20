import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { getAuthUser } from '@/lib/auth';
export async function GET() {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ categoryName: 1 });
    return NextResponse.json({ categories });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
export async function POST(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const category = await Category.create(body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
