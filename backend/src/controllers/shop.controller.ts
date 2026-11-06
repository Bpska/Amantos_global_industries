import { Request, Response, NextFunction } from 'express';
import { ShopService } from '../services/shop.service';
import { sendSuccess } from '../utils/response';

export class ShopController {
  static async onboardShop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ShopService.onboardShop(req.user!.id, req.body);
      sendSuccess(res, result, 'Shop onboarded and first order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyShops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ShopService.getMyShops(req.user!.id, req.query as any);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getShopById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shop = await ShopService.getShopById(req.params.id, req.user!);
      sendSuccess(res, shop);
    } catch (error) {
      next(error);
    }
  }
}
