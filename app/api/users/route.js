import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user || user.role !== 'مدير النظام') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user || user.role !== 'مدير النظام') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const newUser = await User.create(body);
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
