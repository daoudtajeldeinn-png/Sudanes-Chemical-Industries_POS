import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  finishedProduct: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true,
    unique: true // One main recipe per finished good
  },
  ingredients: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }
  }],
  standardBatchSize: { type: Number, default: 1000 }, 
  instructions: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);
