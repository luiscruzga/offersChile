const Schema = mongoose.Schema;
const ProductSchema = Schema({
  store: String,
  sku: String,
  name: String,
  description: String,
  brand: String,
  url: String,
  images: [String],
  thumbnail: String,
  category: String,
  categoryName: String,
  discountPercentage: Number,
  discount: Number,
  normalPrice: Number,
  offerPrice: Number,
  cardPrice: Number,
  isOutOfStock: Boolean,
  isUnavailable: Boolean,
  createdAt: { type: Date, default: Date.now },
  version: Number
});

module.exports = mongoose.model('Product', ProductSchema);