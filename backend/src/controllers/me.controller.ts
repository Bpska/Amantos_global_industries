import { Request, Response, NextFunction } from 'express';
import { MeService } from '../services/me.service';
import { sendSuccess } from '../utils/response';

export class MeController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await MeService.getSalespersonSummary(req.user!.id);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}
