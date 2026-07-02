import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  user?: any;
}

// JWT认证中间件
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录或token已过期', data: null });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, status: 'active' },
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在或已被禁用', data: null });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: 'token无效或已过期', data: null });
  }
}

// 角色权限检查
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ code: 403, message: '无权限执行此操作', data: null });
    }
    next();
  };
}
