import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  categoryNameAr: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
