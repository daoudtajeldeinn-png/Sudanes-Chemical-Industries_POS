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
    
    // To trigger the pre-save password hashing hook, we must use .save() instead of findByIdAndUpdate
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    Object.assign(userToUpdate, body);
    await userToUpdate.save();
    
    return NextResponse.json({ user: userToUpdate });
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
