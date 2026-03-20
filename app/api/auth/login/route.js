import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    // First run: create admin
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        passwordHash: '123456',
        fullName: 'مدير النظام',
        email: 'admin@sci.sd',
        roleName: 'مدير النظام',
      });
    }

    // Find by username or email
    const user = await User.findOne({
      $or: [{ email }, { username: email }],
      isActive: true,
    });
    if (!user) return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });

    const valid = await user.comparePassword(password);
    if (!valid) return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = signToken({ id: user._id, name: user.fullName, email: user.email, username: user.username, role: user.roleName });
    const cookieStore = cookies();
    cookieStore.set('sci_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800,
      path: '/',
    });

    return NextResponse.json({ user: { name: user.fullName, email: user.email, role: user.roleName } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
