import { Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Helper to generate sequential auto-numbered Challan ID: CHAL-2026-0001
 */
async function generateNextChallanNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CHAL-${currentYear}-`;

  const lastChallan = await prisma.challan.findFirst({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { challanNumber: true },
  });

  if (!lastChallan) {
    return `${prefix}0001`;
  }

  const parts = lastChallan.challanNumber.split('-');
  const lastSeqStr = parts[parts.length - 1];
  const lastSeq = parseInt(lastSeqStr, 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Get list of all Sales Challans with filters
 * GET /api/challans
 */
export const getChallans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, status } = req.query;

    const whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = String(status).toUpperCase();
    }

    if (q) {
      const searchStr = String(q).trim();
      whereClause.OR = [
        { challanNumber: { contains: searchStr } },
        { customer: { name: { contains: searchStr } } },
        { customer: { businessName: { contains: searchStr } } },
      ];
    }

    const challans = await prisma.challan.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessName: true,
            mobile: true,
            email: true,
            customerType: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        items: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(challans);
  } catch (error: any) {
    console.error('Error fetching challans:', error);
    return res.status(500).json({ message: 'Failed to retrieve sales challans.', error: error.message });
  }
};

/**
 * Get single Challan details by ID with snapshot line items
 * GET /api/challans/:id
 */
export const getChallanById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ message: 'Sales Challan not found.' });
    }

    return res.status(200).json(challan);
  } catch (error: any) {
    console.error('Error fetching challan details:', error);
    return res.status(500).json({ message: 'Failed to retrieve challan details.', error: error.message });
  }
};

/**
 * Create a new Sales Challan (DRAFT or CONFIRMED)
 * POST /api/challans
 */
export const createChallan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, items, status } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authenticated user context required.' });
    }

    if (!customerId) {
      return res.status(400).json({ message: 'Customer selection is required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one product line item is required.' });
    }

    // Verify Customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Selected customer does not exist.' });
    }

    const challanStatus = status && String(status).toUpperCase() === 'CONFIRMED' ? 'CONFIRMED' : 'DRAFT';

    // Validate products & fetch live price/name snapshots
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let totalQuantity = 0;
    let totalAmount = 0;
    const processedItems: Array<{
      productId: string;
      productNameSnapshot: string;
      unitPriceSnapshot: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return res.status(400).json({ message: `Product ID '${item.productId}' not found in inventory.` });
      }

      const qty = Number(item.quantity);
      if (!qty || qty <= 0) {
        return res.status(400).json({ message: `Quantity for '${prod.name}' must be greater than 0.` });
      }

      // Check stock if CONFIRMED status
      if (challanStatus === 'CONFIRMED' && prod.currentStock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for '${prod.name}' (SKU: ${prod.sku}). Required: ${qty} units, Available in warehouse: ${prod.currentStock} units.`,
        });
      }

      const lineSubtotal = prod.unitPrice * qty;
      totalQuantity += qty;
      totalAmount += lineSubtotal;

      processedItems.push({
        productId: prod.id,
        productNameSnapshot: prod.name,
        unitPriceSnapshot: prod.unitPrice,
        quantity: qty,
      });
    }

    const challanNumber = await generateNextChallanNumber();

    // Execute atomic transaction for Challan creation & stock deduction
    const result = await prisma.$transaction(async (tx) => {
      const newChallan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status: challanStatus,
          createdBy: req.user!.id,
          items: {
            create: processedItems,
          },
        },
        include: {
          customer: true,
          items: true,
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // If CONFIRMED immediately on creation, deduct stock & record StockLogs
      if (challanStatus === 'CONFIRMED') {
        for (const item of processedItems) {
          const currentProd = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: currentProd.currentStock - item.quantity,
            },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan Confirmation #${challanNumber}`,
              createdBy: req.user!.id,
            },
          });
        }
      }

      return newChallan;
    });

    return res.status(201).json({
      message: `Sales Challan '${challanNumber}' created successfully as ${challanStatus}.`,
      challan: result,
    });
  } catch (error: any) {
    console.error('Error creating sales challan:', error);
    return res.status(500).json({ message: 'Failed to create sales challan.', error: error.message });
  }
};

/**
 * Update Sales Challan Status (DRAFT -> CONFIRMED or CANCELLED)
 * PATCH /api/challans/:id/status
 */
export const updateChallanStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authenticated user context required.' });
    }

    const targetStatus = String(status).toUpperCase();
    if (!['CONFIRMED', 'CANCELLED', 'DRAFT'].includes(targetStatus)) {
      return res.status(400).json({ message: 'Status must be CONFIRMED, CANCELLED, or DRAFT.' });
    }

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ message: 'Sales Challan not found.' });
    }

    if (challan.status === targetStatus) {
      return res.status(200).json({ message: `Challan is already in ${targetStatus} status.`, challan });
    }

    // Handle Transition to CONFIRMED
    if (targetStatus === 'CONFIRMED') {
      if (challan.status === 'CONFIRMED') {
        return res.status(400).json({ message: 'Challan is already confirmed.' });
      }

      // Check stock availability for all line items
      const productIds = challan.items.map((i) => i.productId);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      for (const item of challan.items) {
        const prod = productMap.get(item.productId);
        if (!prod) {
          return res.status(400).json({ message: `Product for line item '${item.productNameSnapshot}' no longer exists.` });
        }
        if (prod.currentStock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock to confirm challan for '${prod.name}' (SKU: ${prod.sku}). Required: ${item.quantity}, Available: ${prod.currentStock}.`,
          });
        }
      }

      // Perform transaction to confirm challan and deduct stock
      const updatedChallan = await prisma.$transaction(async (tx) => {
        const updated = await tx.challan.update({
          where: { id },
          data: { status: 'CONFIRMED' },
          include: { customer: true, items: true, author: true },
        });

        for (const item of challan.items) {
          const prod = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: prod.currentStock - item.quantity },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan Confirmation #${challan.challanNumber}`,
              createdBy: req.user!.id,
            },
          });
        }

        return updated;
      });

      return res.status(200).json({
        message: `Challan '${challan.challanNumber}' confirmed and inventory stock deducted.`,
        challan: updatedChallan,
      });
    }

    // Handle Transition to CANCELLED (restore stock if previously CONFIRMED)
    if (targetStatus === 'CANCELLED') {
      const updatedChallan = await prisma.$transaction(async (tx) => {
        const updated = await tx.challan.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: { customer: true, items: true, author: true },
        });

        // Restore stock if it was previously confirmed
        if (challan.status === 'CONFIRMED') {
          for (const item of challan.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { increment: item.quantity } },
            });

            await tx.stockLog.create({
              data: {
                productId: item.productId,
                quantityChanged: item.quantity,
                movementType: 'IN',
                reason: `Sales Challan Cancellation #${challan.challanNumber} (Restored Stock)`,
                createdBy: req.user!.id,
              },
            });
          }
        }

        return updated;
      });

      return res.status(200).json({
        message: `Challan '${challan.challanNumber}' cancelled successfully.`,
        challan: updatedChallan,
      });
    }

    // Fallback status update
    const updated = await prisma.challan.update({
      where: { id },
      data: { status: targetStatus },
      include: { customer: true, items: true, author: true },
    });

    return res.status(200).json({ message: `Challan status updated to ${targetStatus}.`, challan: updated });
  } catch (error: any) {
    console.error('Error updating challan status:', error);
    return res.status(500).json({ message: 'Failed to update challan status.', error: error.message });
  }
};
