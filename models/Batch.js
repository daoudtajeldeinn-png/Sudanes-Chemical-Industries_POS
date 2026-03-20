import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  productionDate: { type: Date },
  expiryDate: { type: Date, required: true },
  initialQty: { type: Number, required: true },
  currentQty: { type: Number, required: true },
  purchasePrice: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Expired', 'Empty', 'Under Review', 'Rejected'], default: 'Active' },
  notes: { type: String },
}, { timestamps: true });

// Index for quick search and unique constraint per batch-product-warehouse
BatchSchema.index({ batchNumber: 1, product: 1, warehouse: 1 }, { unique: true });
BatchSchema.index({ expiryDate: 1 });

// Helper to check if expired
BatchSchema.methods.checkExpiry = function() {
  if (this.expiryDate < new Date()) {
    this.status = 'Expired';
  } else if (this.currentQty <= 0) {
    this.status = 'Empty';
  }
};

export default mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
