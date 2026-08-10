import { Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

// Fetch customers list with search filter & category tabs
export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, customerType, status } = req.query;

    // Build dynamic query filters
    const where: any = {};

    if (customerType && customerType !== 'ALL') {
      where.customerType = String(customerType);
    }

    if (status && status !== 'ALL') {
      where.status = String(status);
    }

    if (search) {
      const searchStr = String(search).trim();
      where.OR = [
        { name: { contains: searchStr } },
        { businessName: { contains: searchStr } },
        { email: { contains: searchStr } },
        { mobile: { contains: searchStr } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { followUpLogs: true },
        },
      },
    });

    return res.status(200).json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ message: 'Failed to retrieve customer list' });
  }
};

// Fetch single customer detail profile with follow-up history logs
export const getCustomerById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUpLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer record not found' });
    }

    return res.status(200).json({ customer });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({ message: 'Failed to load customer details' });
  }
};

// Add new customer record
export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    if (!name || !mobile || !email || !businessName || !address) {
      return res.status(400).json({
        message: 'Name, mobile, email, business name, and address are required.',
      });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        businessName: businessName.trim(),
        gstNumber: gstNumber ? gstNumber.trim() : null,
        customerType: customerType || 'RETAIL',
        address: address.trim(),
        status: status || 'LEAD',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes ? notes.trim() : null,
      },
    });

    return res.status(201).json({
      message: 'Customer added successfully',
      customer: newCustomer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ message: 'Failed to create customer record' });
  }
};

// Update existing customer record
export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer record not found' });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        mobile: mobile !== undefined ? mobile.trim() : existing.mobile,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        businessName: businessName !== undefined ? businessName.trim() : existing.businessName,
        gstNumber: gstNumber !== undefined ? (gstNumber ? gstNumber.trim() : null) : existing.gstNumber,
        customerType: customerType !== undefined ? customerType : existing.customerType,
        address: address !== undefined ? address.trim() : existing.address,
        status: status !== undefined ? status : existing.status,
        followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : existing.followUpDate,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    return res.status(200).json({
      message: 'Customer profile updated successfully',
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({ message: 'Failed to update customer details' });
  }
};

// Add follow-up note to customer profile
export const addCustomerNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // customer ID
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Note content cannot be empty' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'User context required' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer record not found' });
    }

    const newNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        note: note.trim(),
        createdBy: req.user.id,
      },
      include: {
        author: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    return res.status(201).json({
      message: 'Follow-up note logged successfully',
      note: newNote,
    });
  } catch (error) {
    console.error('Error logging customer note:', error);
    return res.status(500).json({ message: 'Failed to add follow-up note' });
  }
};
