import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import prisma from '../lib/prisma';

// 记录操作日志
export async function logOperation(
  req: AuthRequest,
  module: string,
  action: string,
  target: string,
  detail?: string
) {
  try {
    await prisma.operationLog.create({
      data: {
        userId: req.userId || 0,
        module,
        action,
        target,
        detail: detail || null,
        ip: req.ip || req.socket.remoteAddress,
        result: 'success',
      },
    });
  } catch (error) {
    console.error('Failed to log operation:', error);
  }
}
