import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  roleName: { type: String, default: 'كاشير' }, // cached for speed
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
