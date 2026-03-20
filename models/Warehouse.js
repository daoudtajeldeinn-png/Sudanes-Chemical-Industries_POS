import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema({
  warehouseName: { type: String, required: true },
  location: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);
