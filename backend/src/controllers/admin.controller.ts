import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';

export class AdminController {
  static async createSalesperson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const salesperson = await AdminService.createSalesperson(req.body);
      sendSuccess(res, salesperson, 'Salesperson created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async listSalespersons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const salespersons = await AdminService.listSalespersons();
      sendSuccess(res, salespersons);
    } catch (error) {
      next(error);
    }
  }

  static async updateSalesperson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.updateSalesperson(req.params.id, req.body);
      sendSuccess(res, updated, 'Salesperson updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.resetSalespersonPassword(req.params.id, req.body.password);
      sendSuccess(res, result, 'Salesperson password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getShops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getShops(req.query as any);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getShopById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shop = await AdminService.getShopById(req.params.id);
      sendSuccess(res, shop);
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getOrders(req.query as any);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getDashboard(req.query as any);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async exportOrdersCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await AdminService.exportOrdersCsv(req.query as any);
      const filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async getBillingSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await AdminService.getBillingSettings();
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }

  static async updateBillingSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await AdminService.updateBillingSettings(req.body);
      sendSuccess(res, settings, 'Billing settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
