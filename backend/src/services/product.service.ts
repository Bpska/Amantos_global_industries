import { prisma } from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';

const INITIAL_PRODUCTS = [
  { name: 'Mixture Pack', unitPrice: 10, category: 'Snacks' },
  { name: 'CTC Chai 1kg', unitPrice: 240, category: 'Beverages' },
  { name: 'Roasted Peanuts', unitPrice: 50, category: 'Snacks' },
  { name: 'Khakhra Masala', unitPrice: 65, category: 'Namkeen' },
  { name: 'Besan Ladoo 500g', unitPrice: 180, category: 'Sweets' },
];

export class ProductService {
  static async seedInitialIfEmpty(): Promise<void> {
    const count = await prisma.product.count();
    if (count === 0) {
      for (const item of INITIAL_PRODUCTS) {
        await prisma.product.create({
          data: {
            name: item.name,
            unitPrice: item.unitPrice,
            category: item.category,
            isActive: true,
          },
        });
      }
    }
  }

  static async listActive() {
    await this.seedInitialIfEmpty();
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      unitPrice: Number(p.unitPrice),
      category: p.category || 'General',
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  static async listAll() {
    await this.seedInitialIfEmpty();
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      unitPrice: Number(p.unitPrice),
      category: p.category || 'General',
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  static async create(data: { name: string; unitPrice?: number; category?: string }) {
    const trimmed = (data.name || '').trim();
    if (!trimmed) {
      throw new BadRequestError('Product name is required');
    }

    const existing = await prisma.product.findUnique({
      where: { name: trimmed },
    });

    if (existing) {
      if (!existing.isActive) {
        const reactivated = await prisma.product.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : existing.unitPrice,
            category: data.category?.trim() || existing.category,
          },
        });
        return {
          id: reactivated.id,
          name: reactivated.name,
          unitPrice: Number(reactivated.unitPrice),
          category: reactivated.category,
          isActive: reactivated.isActive,
          createdAt: reactivated.createdAt.toISOString(),
        };
      }
      throw new BadRequestError(`A product with name "${trimmed}" already exists`);
    }

    const created = await prisma.product.create({
      data: {
        name: trimmed,
        unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : 0,
        category: data.category?.trim() || 'General',
        isActive: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      unitPrice: Number(created.unitPrice),
      category: created.category,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
    };
  }

  static async update(
    id: string,
    data: { name?: string; unitPrice?: number; category?: string; isActive?: boolean }
  ) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.unitPrice !== undefined) updateData.unitPrice = Number(data.unitPrice);
    if (data.category !== undefined) updateData.category = data.category.trim();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id,
      name: updated.name,
      unitPrice: Number(updated.unitPrice),
      category: updated.category,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  static async delete(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { id, success: true };
  }
}

