import mongoose from 'mongoose';

const PermissionSchema = new mongoose.Schema({
  permissionName: { type: String, required: true, unique: true },
  moduleName: { type: String, required: true },
  description: { type: String },
});

const RoleSchema = new mongoose.Schema({
  roleName: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [{ type: String }], // array of permissionName strings
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
export default mongoose.models.Role || mongoose.model('Role', RoleSchema);
