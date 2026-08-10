import { Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get all products with optional filters (search, category, low stock)
 * GET /api/products
 */
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, category, lowStock } = req.query;

    const whereClause: any = {};

    if (q) {
      const searchString = String(q).trim();
      whereClause.OR = [
        { name: { contains: searchString } },
        { sku: { contains: searchString } },
        { category: { contains: searchString } },
        { location: { contains: searchString } },
      ];
    }

    if (category && category !== 'ALL') {
      whereClause.category = String(category);
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { stockLogs: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Map low stock flag client helper if lowStock filter is requested
    let filteredProducts = products.map((product) => ({
      ...product,
      isLowStock: product.currentStock <= product.minStockAlert,
    }));

    if (lowStock === 'true') {
      filteredProducts = filteredProducts.filter((p) => p.isLowStock);
    }

    return res.status(200).json(filteredProducts);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Failed to retrieve products catalog.', error: error.message });
  }
};

/**
 * Get single product by ID with stock movement audit logs
 * GET /api/products/:id
 */
export const getProductById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          include: {
            user: {
              select: { id: true, name: true, role: true, email: true }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json({
      ...product,
      isLowStock: product.currentStock <= product.minStockAlert,
    });
  } catch (error: any) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({ message: 'Failed to retrieve product details.', error: error.message });
  }
};

/**
 * Create a new product in inventory
 * POST /api/products
 */
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

    if (!name || !sku || !category || unitPrice === undefined) {
      return res.status(400).json({ message: 'Name, SKU, category, and unit price are required.' });
    }

    // Check SKU uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { sku: String(sku).trim().toUpperCase() }
    });

    if (existingProduct) {
      return res.status(400).json({ message: `SKU '${sku}' already exists. SKU must be unique.` });
    }

    const initialStock = Number(currentStock) || 0;
    const minAlert = Number(minStockAlert) || 5;
    const price = FloatParse(unitPrice);

    // Create product and initial stock log if initial stock > 0
    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: String(name).trim(),
          sku: String(sku).trim().toUpperCase(),
          category: String(category).trim(),
          unitPrice: price,
          currentStock: initialStock,
          minStockAlert: minAlert,
          location: location ? String(location).trim() : 'Main Warehouse',
        }
      });

      if (initialStock > 0 && req.user) {
        await tx.stockLog.create({
          data: {
            productId: product.id,
            quantityChanged: initialStock,
            movementType: 'IN',
            reason: 'Initial Stock Setup',
            createdBy: req.user.id,
          }
        });
      }

      return product;
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Failed to create product.', error: error.message });
  }
};

/**
 * Update product details
 * PUT /api/products/:id
 */
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, unitPrice, minStockAlert, location } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : existing.name,
        category: category ? String(category).trim() : existing.category,
        unitPrice: unitPrice !== undefined ? FloatParse(unitPrice) : existing.unitPrice,
        minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : existing.minStockAlert,
        location: location !== undefined ? String(location).trim() : existing.location,
      }
    });

    return res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Failed to update product.', error: error.message });
  }
};

/**
 * Adjust stock quantity (IN or OUT movement)
 * POST /api/products/:id/stock
 */
export const adjustStock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityChanged, movementType, reason } = req.body;

    const qty = Number(quantityChanged);
    const mType = String(movementType).toUpperCase();

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: 'Quantity changed must be a positive number greater than 0.' });
    }

    if (mType !== 'IN' && mType !== 'OUT') {
      return res.status(400).json({ message: "Movement type must be either 'IN' or 'OUT'." });
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Reason for stock adjustment is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Authenticated user required for stock movement audit.' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Validate negative stock prevention
    if (mType === 'OUT' && product.currentStock - qty < 0) {
      return res.status(400).json({
        message: `Insufficient stock! Current stock is ${product.currentStock} units, cannot deduct ${qty} units.`
      });
    }

    const newStockLevel = mType === 'IN' ? product.currentStock + qty : product.currentStock - qty;

    // Transactionally update stock and log movement
    const result = await prisma.$transaction(async (tx) => {
      const updatedProd = await tx.product.update({
        where: { id },
        data: { currentStock: newStockLevel }
      });

      const stockLog = await tx.stockLog.create({
        data: {
          productId: id,
          quantityChanged: qty,
          movementType: mType,
          reason: String(reason).trim(),
          createdBy: req.user!.id,
        },
        include: {
          user: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      return { product: updatedProd, stockLog };
    });

    return res.status(200).json({
      message: `Stock successfully updated (${mType} ${qty} units).`,
      product: result.product,
      log: result.stockLog,
      isLowStock: result.product.currentStock <= result.product.minStockAlert,
    });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return res.status(500).json({ message: 'Failed to adjust stock quantity.', error: error.message });
  }
};

// Helper for price parsing
function FloatParse(val: any): number {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}
