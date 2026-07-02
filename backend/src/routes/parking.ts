import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// 构建查询条件
function buildWhere(req: AuthRequest) {
  const { location, region, status, projectId, areaType } = req.query;
  const where: any = { status: { not: 'deleted' } };
  if (location) where.location = { contains: String(location) };
  if (region) where.region = String(region);
  if (status) where.status = String(status);
  if (projectId) where.projectId = Number(projectId);
  if (areaType) where.areaType = String(areaType);
  return where;
}

// GET / - 分页查询
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const where = buildWhere(req);

    const [list, total] = await Promise.all([
      prisma.parkingSpace.findMany({
        where,
        skip,
        take,
        include: { project: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.parkingSpace.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query parking spaces error:', error);
    return fail(res, '查询人防车位列表失败', 500);
  }
});

// GET /export - 导出
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const where = buildWhere(req);
    const list = await prisma.parkingSpace.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
    await logOperation(req, '人防车位', 'export', `导出${list.length}条人防车位数据`);
    return success(res, list, '导出成功');
  } catch (error) {
    console.error('Export parking spaces error:', error);
    return fail(res, '导出人防车位数据失败', 500);
  }
});

// GET /:id - 详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const space = await prisma.parkingSpace.findFirst({
      where: { id, status: { not: 'deleted' } },
      include: { project: true },
    });

    if (!space) {
      return fail(res, '人防车位不存在', 404);
    }

    return success(res, space, '查询成功');
  } catch (error) {
    console.error('Get parking space detail error:', error);
    return fail(res, '查询人防车位详情失败', 500);
  }
});

// POST / - 新增
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { location, totalSpaces } = req.body;

    if (!location || totalSpaces === undefined) {
      return fail(res, '车位位置和总车位数不能为空', 400);
    }

    // 校验关联工程是否存在
    if (req.body.projectId) {
      const project = await prisma.civilAirDefenseProject.findFirst({
        where: { id: Number(req.body.projectId), status: { not: 'deleted' } },
      });
      if (!project) {
        return fail(res, '关联的人防工程不存在', 400);
      }
    }

    const space = await prisma.parkingSpace.create({
      data: { ...req.body, status: req.body.status || 'published' },
      include: { project: true },
    });

    await logOperation(req, '人防车位', 'create', `新增人防车位:${space.location}`, JSON.stringify(space));

    return success(res, space, '新增人防车位成功');
  } catch (error) {
    console.error('Create parking space error:', error);
    return fail(res, '新增人防车位失败', 500);
  }
});

// POST /import - 批量导入
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body.data;
    if (!Array.isArray(data) || data.length === 0) {
      return fail(res, '导入数据不能为空', 400);
    }

    const result = await prisma.parkingSpace.createMany({
      data: data.map((item: any) => ({
        ...item,
        status: item.status || 'published',
      })),
    });

    await logOperation(req, '人防车位', 'import', `批量导入${result.count}条人防车位数据`);

    return success(res, { count: result.count }, `成功导入${result.count}条数据`);
  } catch (error) {
    console.error('Import parking spaces error:', error);
    return fail(res, '批量导入人防车位失败', 500);
  }
});

// PUT /:id - 修改
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const space = await prisma.parkingSpace.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!space) {
      return fail(res, '人防车位不存在', 404);
    }

    // 校验关联工程是否存在
    if (req.body.projectId) {
      const project = await prisma.civilAirDefenseProject.findFirst({
        where: { id: Number(req.body.projectId), status: { not: 'deleted' } },
      });
      if (!project) {
        return fail(res, '关联的人防工程不存在', 400);
      }
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    const updated = await prisma.parkingSpace.update({
      where: { id },
      data: updateData,
      include: { project: true },
    });

    await logOperation(req, '人防车位', 'update', `修改人防车位:${updated.location}`, JSON.stringify({ before: space, after: updated }));

    return success(res, updated, '修改人防车位成功');
  } catch (error) {
    console.error('Update parking space error:', error);
    return fail(res, '修改人防车位失败', 500);
  }
});

// DELETE /:id - 逻辑删除
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const space = await prisma.parkingSpace.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!space) {
      return fail(res, '人防车位不存在', 404);
    }

    await prisma.parkingSpace.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await logOperation(req, '人防车位', 'delete', `删除人防车位:${space.location}`);

    return success(res, null, '删除人防车位成功');
  } catch (error) {
    console.error('Delete parking space error:', error);
    return fail(res, '删除人防车位失败', 500);
  }
});

export default router;
