import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user || user.role !== 'مدير النظام') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { id } = params;
    const body = await req.json();
    
    // If updating password, it will be hashed by the pre-save hook in User model
    const updatedUser = await User.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ user: updatedUser });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}

export async function DELETE(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user || user.role !== 'مدير النظام') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { id } = params;
    await User.findByIdAndUpdate(id, { isActive: false });
    return NextResponse.json({ message: 'User deactivated' });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
