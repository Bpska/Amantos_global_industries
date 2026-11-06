import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';

export class OrderController {
  static async createRepeatOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.createRepeatOrder(req.params.id, req.user!, req.body);
      sendSuccess(res, order, 'Repeat order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OrderService.recordPayment(req.params.id, req.user!, req.body);
      sendSuccess(res, result, 'Payment recorded and balance updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}
