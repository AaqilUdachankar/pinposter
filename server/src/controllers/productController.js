import Product from '../models/Product.js';
import { extractProductMetadata, validateSafeUrl } from '../services/scraperService.js';

export async function extractMetadata(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    await validateSafeUrl(url);
    const metadata = await extractProductMetadata(url);

    res.json({
      success: true,
      data: metadata,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to extract product details from URL',
    });
  }
}

export async function getProducts(req, res, next) {
  try {
    const products = await Product.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      products,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { title, description, price, currency, brand, category, features, images } = req.body;
    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (title) product.title = title.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = String(price).trim();
    if (currency !== undefined) product.currency = currency.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (category !== undefined) product.category = category.trim();
    if (features && Array.isArray(features)) product.features = features;
    if (images && Array.isArray(images)) product.images = images;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (err) {
    next(err);
  }
}
