
import { Request, Response, NextFunction } from 'express';
import { syncService } from '../services/sync.service';

export class SyncController {
  
  /**
   * GET /api/sync/pull
   * Returns all changes since the provided timestamp
   */
  async pull(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore - User is attached by auth middleware
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const lastSyncAtParam = req.query.lastSyncAt as string;
      const lastSyncAt = lastSyncAtParam ? new Date(lastSyncAtParam) : null;

      if (lastSyncAtParam && isNaN(lastSyncAt!.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid lastSyncAt date format' });
      }

      const result = await syncService.getChanges(tenantId, lastSyncAt);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sync/push
   * Accepts a batch of changes to apply to the server
   */
  async push(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { changes } = req.body;
      
      if (!changes || typeof changes !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid payload: changes object required' });
      }

      const result = await syncService.processChanges(tenantId, { changes });

      res.json({
        success: true,
        data: result,
        message: 'Sync push processed'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const syncController = new SyncController();
