import mongoose from 'mongoose';

const StockMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  movementType: { type: String, enum: ['IN', 'OUT', 'TRANSFER', 'ADJUST'], required: true },
  referenceType: { type: String, enum: ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', null] },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  quantity: { type: Number, required: true }, // positive = in, negative = out
  unitCost: { type: Number },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null }, // v3.1
  notes: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  movementDate: { type: Date, default: Date.now },
});

StockMovementSchema.index({ product: 1 });
StockMovementSchema.index({ movementDate: -1 });

export default mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema);
