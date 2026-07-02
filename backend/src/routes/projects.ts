import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// 构建查询条件
function buildWhere(req: AuthRequest) {
  const { name, code, buildType, projectType, region } = req.query;
  const where: any = { status: { not: 'deleted' } };
  if (name) where.name = { contains: String(name) };
  if (code) where.code = { contains: String(code) };
  if (buildType) where.buildType = String(buildType);
  if (projectType) where.projectType = String(projectType);
  if (region) where.region = String(region);
  return where;
}

// GET / - 分页查询(支持name, code, buildType, projectType, region筛选)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const where = buildWhere(req);

    const [list, total] = await Promise.all([
      prisma.civilAirDefenseProject.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.civilAirDefenseProject.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query projects error:', error);
    return fail(res, '查询人防工程列表失败', 500);
  }
});

// GET /export - 导出(返回全部数据)
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const where = buildWhere(req);
    const list = await prisma.civilAirDefenseProject.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    await logOperation(req, '人防工程', 'export', `导出${list.length}条人防工程数据`);
    return success(res, list, '导出成功');
  } catch (error) {
    console.error('Export projects error:', error);
    return fail(res, '导出人防工程数据失败', 500);
  }
});

// GET /:id - 详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const project = await prisma.civilAirDefenseProject.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!project) {
      return fail(res, '人防工程不存在', 404);
    }

    return success(res, project, '查询成功');
  } catch (error) {
    console.error('Get project detail error:', error);
    return fail(res, '查询人防工程详情失败', 500);
  }
});

// POST / - 新增
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, longitude, latitude } = req.body;

    if (!name || !code || longitude === undefined || latitude === undefined) {
      return fail(res, '工程名称、编号、经纬度不能为空', 400);
    }

    const exists = await prisma.civilAirDefenseProject.findFirst({
      where: { code },
    });
    if (exists) {
      return fail(res, '工程编号已存在', 400);
    }

    const project = await prisma.civilAirDefenseProject.create({
      data: { ...req.body, status: req.body.status || 'published' },
    });

    await logOperation(req, '人防工程', 'create', `新增人防工程:${project.name}`, JSON.stringify(project));

    return success(res, project, '新增人防工程成功');
  } catch (error) {
    console.error('Create project error:', error);
    return fail(res, '新增人防工程失败', 500);
  }
});

// POST /import - 批量导入(接收数组)
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body.data;
    if (!Array.isArray(data) || data.length === 0) {
      return fail(res, '导入数据不能为空', 400);
    }

    // 校验编号唯一性
    const codes = data.map((item: any) => item.code).filter(Boolean);
    if (codes.length > 0) {
      const existList = await prisma.civilAirDefenseProject.findMany({
        where: { code: { in: codes } },
        select: { code: true },
      });
      if (existList.length > 0) {
        return fail(res, `编号已存在: ${existList.map((i) => i.code).join(', ')}`, 400);
      }
    }

    const result = await prisma.civilAirDefenseProject.createMany({
      data: data.map((item: any) => ({
        ...item,
        status: item.status || 'published',
      })),
    });

    await logOperation(req, '人防工程', 'import', `批量导入${result.count}条人防工程数据`);

    return success(res, { count: result.count }, `成功导入${result.count}条数据`);
  } catch (error) {
    console.error('Import projects error:', error);
    return fail(res, '批量导入人防工程失败', 500);
  }
});

// PUT /:id - 修改
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const project = await prisma.civilAirDefenseProject.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!project) {
      return fail(res, '人防工程不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    // 若修改了编号，需校验唯一性
    if (updateData.code && updateData.code !== project.code) {
      const exists = await prisma.civilAirDefenseProject.findFirst({
        where: { code: updateData.code, id: { not: id } },
      });
      if (exists) {
        return fail(res, '工程编号已存在', 400);
      }
    }

    const updated = await prisma.civilAirDefenseProject.update({
      where: { id },
      data: updateData,
    });

    await logOperation(req, '人防工程', 'update', `修改人防工程:${updated.name}`, JSON.stringify({ before: project, after: updated }));

    return success(res, updated, '修改人防工程成功');
  } catch (error) {
    console.error('Update project error:', error);
    return fail(res, '修改人防工程失败', 500);
  }
});

// DELETE /:id - 逻辑删除(status改为deleted)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const project = await prisma.civilAirDefenseProject.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!project) {
      return fail(res, '人防工程不存在', 404);
    }

    await prisma.civilAirDefenseProject.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await logOperation(req, '人防工程', 'delete', `删除人防工程:${project.name}`);

    return success(res, null, '删除人防工程成功');
  } catch (error) {
    console.error('Delete project error:', error);
    return fail(res, '删除人防工程失败', 500);
  }
});

// POST /:id/audit - 工程审核(action: pass/reject)
router.post('/:id/audit', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { action } = req.body as { action: 'pass' | 'reject' };

    const project = await prisma.civilAirDefenseProject.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!project) {
      return fail(res, '人防工程不存在', 404);
    }

    if (project.status !== 'pending') {
      return fail(res, '该工程当前状态不支持审核', 400);
    }

    const newStatus = action === 'pass' ? 'published' : 'draft';
    const updated = await prisma.civilAirDefenseProject.update({
      where: { id },
      data: { status: newStatus },
    });

    await logOperation(req, '人防工程', `audit_${action}`, `审核人防工程:${project.name} - ${action === 'pass' ? '通过' : '驳回'}`);

    return success(res, updated, action === 'pass' ? '审核通过' : '已驳回');
  } catch (error) {
    console.error('Audit project error:', error);
    return fail(res, '审核操作失败', 500);
  }
});

export default router;
