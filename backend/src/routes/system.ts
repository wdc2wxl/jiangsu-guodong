import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// ==================== 用户管理 ====================

// GET /users - 用户列表(支持unit, role, status筛选)
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { unit, role, status, keyword } = req.query;
    const where: any = { status: { not: 'deleted' } };
    if (unit) where.unit = String(unit);
    if (role) where.role = String(role);
    if (status) where.status = String(status);
    if (keyword) {
      where.OR = [
        { username: { contains: String(keyword) } },
        { realName: { contains: String(keyword) } },
        { phone: { contains: String(keyword) } },
      ];
    }

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          realName: true,
          unit: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query users error:', error);
    return fail(res, '查询用户列表失败', 500);
  }
});

// POST /users - 新增用户
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, realName } = req.body;

    if (!username || !password || !realName) {
      return fail(res, '用户名、密码、真实姓名不能为空', 400);
    }

    const exists = await prisma.user.findFirst({
      where: { username, status: { not: 'deleted' } },
    });
    if (exists) {
      return fail(res, '用户名已存在', 400);
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = await prisma.user.create({
      data: {
        ...req.body,
        password: hashedPassword,
        role: req.body.role || 'viewer',
        status: req.body.status || 'active',
      },
      select: {
        id: true,
        username: true,
        realName: true,
        unit: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logOperation(req, '用户管理', 'create', `新增用户:${user.username}`, JSON.stringify(user));

    return success(res, user, '新增用户成功');
  } catch (error) {
    console.error('Create user error:', error);
    return fail(res, '新增用户失败', 500);
  }
});

// PUT /users/:id - 编辑用户
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, password: _pwd, ...updateData } = req.body;

    // 若修改了用户名，需校验唯一性
    if (updateData.username && updateData.username !== user.username) {
      const exists = await prisma.user.findFirst({
        where: { username: updateData.username, id: { not: id }, status: { not: 'deleted' } },
      });
      if (exists) {
        return fail(res, '用户名已存在', 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        realName: true,
        unit: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logOperation(req, '用户管理', 'update', `编辑用户:${updated.username}`, JSON.stringify({ before: user, after: updated }));

    return success(res, updated, '编辑用户成功');
  } catch (error) {
    console.error('Update user error:', error);
    return fail(res, '编辑用户失败', 500);
  }
});

// PUT /users/:id/disable - 禁用用户
router.put('/users/:id/disable', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (id === req.userId) {
      return fail(res, '不能禁用当前登录用户', 400);
    }

    const user = await prisma.user.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'disabled' },
      select: {
        id: true,
        username: true,
        realName: true,
        status: true,
      },
    });

    await logOperation(req, '用户管理', 'disable', `禁用用户:${user.username}`);

    return success(res, updated, '用户已禁用');
  } catch (error) {
    console.error('Disable user error:', error);
    return fail(res, '禁用用户失败', 500);
  }
});

// DELETE /users/:id - 删除用户(逻辑删除)
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (id === req.userId) {
      return fail(res, '不能删除当前登录用户', 400);
    }

    const user = await prisma.user.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    await prisma.user.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await logOperation(req, '用户管理', 'delete', `删除用户:${user.username}`);

    return success(res, null, '删除用户成功');
  } catch (error) {
    console.error('Delete user error:', error);
    return fail(res, '删除用户失败', 500);
  }
});

// ==================== 系统参数 ====================

// GET /params - 系统参数列表
router.get('/params', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { category, status, paramName } = req.query;
    const where: any = {};
    if (category) where.category = String(category);
    if (status) where.status = String(status);
    if (paramName) where.paramName = { contains: String(paramName) };

    const [list, total] = await Promise.all([
      prisma.systemParam.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemParam.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query system params error:', error);
    return fail(res, '查询系统参数列表失败', 500);
  }
});

// POST /params - 新增参数
router.post('/params', async (req: AuthRequest, res: Response) => {
  try {
    const { category, paramName, paramValue } = req.body;

    if (!category || !paramName || paramValue === undefined) {
      return fail(res, '参数分类、参数名、参数值不能为空', 400);
    }

    const param = await prisma.systemParam.create({
      data: {
        ...req.body,
        status: req.body.status || 'active',
        version: 1,
      },
    });

    await logOperation(req, '系统参数', 'create', `新增参数:${param.paramName}`, JSON.stringify(param));

    return success(res, param, '新增参数成功');
  } catch (error) {
    console.error('Create system param error:', error);
    return fail(res, '新增参数失败', 500);
  }
});

// PUT /params/:id - 编辑参数
router.put('/params/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const param = await prisma.systemParam.findFirst({ where: { id } });

    if (!param) {
      return fail(res, '系统参数不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    // 修改参数值时版本号自增
    if (updateData.paramValue !== undefined && updateData.paramValue !== param.paramValue) {
      updateData.version = param.version + 1;
      updateData.effectTime = new Date();
    }

    const updated = await prisma.systemParam.update({
      where: { id },
      data: updateData,
    });

    await logOperation(req, '系统参数', 'update', `编辑参数:${updated.paramName}`, JSON.stringify({ before: param, after: updated }));

    return success(res, updated, '编辑参数成功');
  } catch (error) {
    console.error('Update system param error:', error);
    return fail(res, '编辑参数失败', 500);
  }
});

// DELETE /params/:id - 删除参数
router.delete('/params/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const param = await prisma.systemParam.findFirst({ where: { id } });

    if (!param) {
      return fail(res, '系统参数不存在', 404);
    }

    await prisma.systemParam.delete({ where: { id } });

    await logOperation(req, '系统参数', 'delete', `删除参数:${param.paramName}`);

    return success(res, null, '删除参数成功');
  } catch (error) {
    console.error('Delete system param error:', error);
    return fail(res, '删除参数失败', 500);
  }
});

// ==================== 操作日志 ====================

// GET /logs - 操作日志列表(支持module, action, userId, 时间范围筛选)
router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { module, action, userId, startTime, endTime } = req.query;
    const where: any = {};
    if (module) where.module = { contains: String(module) };
    if (action) where.action = { contains: String(action) };
    if (userId) where.userId = Number(userId);
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt.gte = new Date(String(startTime));
      if (endTime) where.createdAt.lte = new Date(String(endTime));
    }

    const [list, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: { id: true, username: true, realName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.operationLog.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query operation logs error:', error);
    return fail(res, '查询操作日志列表失败', 500);
  }
});

// GET /logs/:id - 日志详情
router.get('/logs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const log = await prisma.operationLog.findFirst({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    if (!log) {
      return fail(res, '操作日志不存在', 404);
    }

    return success(res, log, '查询成功');
  } catch (error) {
    console.error('Get operation log detail error:', error);
    return fail(res, '查询操作日志详情失败', 500);
  }
});

// ==================== 公告管理 ====================

// GET /announcements - 公告列表
router.get('/announcements', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { type, scope, region, status, title } = req.query;
    const where: any = { status: { not: 'deleted' } };
    if (type) where.type = String(type);
    if (scope) where.scope = String(scope);
    if (region) where.region = String(region);
    if (status) where.status = String(status);
    if (title) where.title = { contains: String(title) };

    const [list, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take,
        include: {
          creator: {
            select: { id: true, username: true, realName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.announcement.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query announcements error:', error);
    return fail(res, '查询公告列表失败', 500);
  }
});

// POST /announcements - 新增公告
router.post('/announcements', async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, type } = req.body;

    if (!title || !content || !type) {
      return fail(res, '公告标题、内容、类型不能为空', 400);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        scope: req.body.scope || 'public',
        region: req.body.region || null,
        status: req.body.status || 'draft',
        createdBy: req.userId as number,
      },
      include: {
        creator: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    await logOperation(req, '公告管理', 'create', `新增公告:${announcement.title}`, JSON.stringify(announcement));

    return success(res, announcement, '新增公告成功');
  } catch (error) {
    console.error('Create announcement error:', error);
    return fail(res, '新增公告失败', 500);
  }
});

// PUT /announcements/:id - 编辑公告
router.put('/announcements/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const announcement = await prisma.announcement.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!announcement) {
      return fail(res, '公告不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, createdBy: _cb, ...updateData } = req.body;

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    await logOperation(req, '公告管理', 'update', `编辑公告:${updated.title}`, JSON.stringify({ before: announcement, after: updated }));

    return success(res, updated, '编辑公告成功');
  } catch (error) {
    console.error('Update announcement error:', error);
    return fail(res, '编辑公告失败', 500);
  }
});

// PUT /announcements/:id/publish - 发布公告
router.put('/announcements/:id/publish', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const announcement = await prisma.announcement.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!announcement) {
      return fail(res, '公告不存在', 404);
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { status: 'published', publishTime: new Date() },
      include: {
        creator: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    await logOperation(req, '公告管理', 'publish', `发布公告:${announcement.title}`);

    return success(res, updated, '公告已发布');
  } catch (error) {
    console.error('Publish announcement error:', error);
    return fail(res, '发布公告失败', 500);
  }
});

// PUT /announcements/:id/offline - 下架公告
router.put('/announcements/:id/offline', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const announcement = await prisma.announcement.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!announcement) {
      return fail(res, '公告不存在', 404);
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { status: 'offline' },
      include: {
        creator: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    await logOperation(req, '公告管理', 'offline', `下架公告:${announcement.title}`);

    return success(res, updated, '公告已下架');
  } catch (error) {
    console.error('Offline announcement error:', error);
    return fail(res, '下架公告失败', 500);
  }
});

// DELETE /announcements/:id - 删除公告
router.delete('/announcements/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const announcement = await prisma.announcement.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!announcement) {
      return fail(res, '公告不存在', 404);
    }

    await prisma.announcement.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await logOperation(req, '公告管理', 'delete', `删除公告:${announcement.title}`);

    return success(res, null, '删除公告成功');
  } catch (error) {
    console.error('Delete announcement error:', error);
    return fail(res, '删除公告失败', 500);
  }
});

export default router;
