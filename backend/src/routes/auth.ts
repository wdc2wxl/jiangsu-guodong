import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { success, fail } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

// POST /login - 登录(用户名+密码, 返回JWT token和用户信息)
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return fail(res, '用户名和密码不能为空', 400);
    }

    const user = await prisma.user.findFirst({
      where: { username, status: { not: 'deleted' } },
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    if (user.status === 'disabled') {
      return fail(res, '该账号已被禁用，请联系管理员', 403);
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return fail(res, '密码错误', 400);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    await logOperation(req, '认证', 'login', `用户${user.username}登录`);

    // 不返回密码
    const { password: _, ...userInfo } = user;

    return success(res, { token, user: userInfo }, '登录成功');
  } catch (error) {
    console.error('Login error:', error);
    return fail(res, '登录失败，请稍后重试', 500);
  }
});

// GET /profile - 获取当前用户信息 (需authMiddleware)
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.userId },
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    const { password: _, ...userInfo } = user;
    return success(res, userInfo, '获取用户信息成功');
  } catch (error) {
    console.error('Get profile error:', error);
    return fail(res, '获取用户信息失败', 500);
  }
});

// PUT /password - 修改密码 (需authMiddleware)
router.put('/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return fail(res, '原密码和新密码不能为空', 400);
    }

    if (newPassword.length < 6) {
      return fail(res, '新密码长度不能少于6位', 400);
    }

    const user = await prisma.user.findFirst({
      where: { id: req.userId },
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) {
      return fail(res, '原密码错误', 400);
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    await logOperation(req, '认证', 'update_password', `用户${user.username}修改密码`);

    return success(res, null, '密码修改成功');
  } catch (error) {
    console.error('Update password error:', error);
    return fail(res, '修改密码失败', 500);
  }
});

// POST /logout - 登出
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await logOperation(req, '认证', 'logout', `用户ID:${req.userId}登出`);
    // JWT 为无状态，客户端删除 token 即可；服务端可在此处记录登出日志
    return success(res, null, '登出成功');
  } catch (error) {
    console.error('Logout error:', error);
    return fail(res, '登出失败', 500);
  }
});

export default router;
