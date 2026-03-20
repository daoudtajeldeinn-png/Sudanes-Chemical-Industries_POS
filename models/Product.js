import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true, uppercase: true },
  barcode: { type: String, index: true },
  productName: { type: String, required: true },
  productNameAr: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  unitCode: { type: String }, // cached
  costPrice: { type: Number, default: 0 },
  wholesalePrice: { type: Number, default: 0 },
  retailPrice: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 0 },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ProductSchema.virtual('displayName').get(function() {
  return this.productNameAr || this.productName;
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
