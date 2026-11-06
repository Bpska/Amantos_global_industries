import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { sendSuccess } from '../utils/response';

export class ProductController {
  static async listActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await ProductService.listActive();
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  static async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await ProductService.listAll();
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.create(req.body);
      sendSuccess(res, product, 'Product added to catalog successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.update(req.params.id, req.body);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.delete(req.params.id);
      sendSuccess(res, result, 'Product removed from active catalog');
    } catch (error) {
      next(error);
    }
  }
}

