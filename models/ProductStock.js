import mongoose from 'mongoose';

const ProductStockSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, default: 0 },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null }, // v3.1
}, { timestamps: true });

ProductStockSchema.index({ product: 1, warehouse: 1, batchId: 1 }, { unique: true });

export default mongoose.models.ProductStock || mongoose.model('ProductStock', ProductStockSchema);
