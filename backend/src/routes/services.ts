import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// 构建查询条件
function buildWhere(req: AuthRequest) {
  const { name, address, serviceType, region, status, projectId } = req.query;
  const where: any = { status: { not: 'deleted' } };
  if (name) where.name = { contains: String(name) };
  if (address) where.address = { contains: String(address) };
  if (serviceType) where.serviceType = String(serviceType);
  if (region) where.region = String(region);
  if (status) where.status = String(status);
  if (projectId) where.projectId = Number(projectId);
  return where;
}

// GET / - 分页查询
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const where = buildWhere(req);

    const [list, total] = await Promise.all([
      prisma.convenienceServicePoint.findMany({
        where,
        skip,
        take,
        include: { project: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.convenienceServicePoint.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query service points error:', error);
    return fail(res, '查询便民服务点列表失败', 500);
  }
});

// GET /export - 导出
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const where = buildWhere(req);
    const list = await prisma.convenienceServicePoint.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
    await logOperation(req, '便民服务点', 'export', `导出${list.length}条便民服务点数据`);
    return success(res, list, '导出成功');
  } catch (error) {
    console.error('Export service points error:', error);
    return fail(res, '导出便民服务点数据失败', 500);
  }
});

// GET /:id - 详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const point = await prisma.convenienceServicePoint.findFirst({
      where: { id, status: { not: 'deleted' } },
      include: { project: true },
    });

    if (!point) {
      return fail(res, '便民服务点不存在', 404);
    }

    return success(res, point, '查询成功');
  } catch (error) {
    console.error('Get service point detail error:', error);
    return fail(res, '查询便民服务点详情失败', 500);
  }
});

// POST / - 新增
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, longitude, latitude } = req.body;

    if (!name || !address || longitude === undefined || latitude === undefined) {
      return fail(res, '服务点名称、地址、经纬度不能为空', 400);
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

    const point = await prisma.convenienceServicePoint.create({
      data: { ...req.body, status: req.body.status || 'published' },
      include: { project: true },
    });

    await logOperation(req, '便民服务点', 'create', `新增便民服务点:${point.name}`, JSON.stringify(point));

    return success(res, point, '新增便民服务点成功');
  } catch (error) {
    console.error('Create service point error:', error);
    return fail(res, '新增便民服务点失败', 500);
  }
});

// POST /import - 批量导入
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body.data;
    if (!Array.isArray(data) || data.length === 0) {
      return fail(res, '导入数据不能为空', 400);
    }

    const result = await prisma.convenienceServicePoint.createMany({
      data: data.map((item: any) => ({
        ...item,
        status: item.status || 'published',
      })),
    });

    await logOperation(req, '便民服务点', 'import', `批量导入${result.count}条便民服务点数据`);

    return success(res, { count: result.count }, `成功导入${result.count}条数据`);
  } catch (error) {
    console.error('Import service points error:', error);
    return fail(res, '批量导入便民服务点失败', 500);
  }
});

// PUT /:id - 修改
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const point = await prisma.convenienceServicePoint.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!point) {
      return fail(res, '便民服务点不存在', 404);
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

    const updated = await prisma.convenienceServicePoint.update({
      where: { id },
      data: updateData,
      include: { project: true },
    });

    await logOperation(req, '便民服务点', 'update', `修改便民服务点:${updated.name}`, JSON.stringify({ before: point, after: updated }));

    return success(res, updated, '修改便民服务点成功');
  } catch (error) {
    console.error('Update service point error:', error);
    return fail(res, '修改便民服务点失败', 500);
  }
});

// PUT /:id/publish - 发布
router.put('/:id/publish', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const point = await prisma.convenienceServicePoint.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!point) {
      return fail(res, '便民服务点不存在', 404);
    }

    const updated = await prisma.convenienceServicePoint.update({
      where: { id },
      data: { status: 'published' },
      include: { project: true },
    });

    await logOperation(req, '便民服务点', 'publish', `发布便民服务点:${point.name}`);

    return success(res, updated, '便民服务点已发布');
  } catch (error) {
    console.error('Publish service point error:', error);
    return fail(res, '发布便民服务点失败', 500);
  }
});

// PUT /:id/offline - 下架
router.put('/:id/offline', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const point = await prisma.convenienceServicePoint.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!point) {
      return fail(res, '便民服务点不存在', 404);
    }

    const updated = await prisma.convenienceServicePoint.update({
      where: { id },
      data: { status: 'offline' },
      include: { project: true },
    });

    await logOperation(req, '便民服务点', 'offline', `下架便民服务点:${point.name}`);

    return success(res, updated, '便民服务点已下架');
  } catch (error) {
    console.error('Offline service point error:', error);
    return fail(res, '下架便民服务点失败', 500);
  }
});

// DELETE /:id - 逻辑删除
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const point = await prisma.convenienceServicePoint.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!point) {
      return fail(res, '便民服务点不存在', 404);
    }

    await prisma.convenienceServicePoint.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await logOperation(req, '便民服务点', 'delete', `删除便民服务点:${point.name}`);

    return success(res, null, '删除便民服务点成功');
  } catch (error) {
    console.error('Delete service point error:', error);
    return fail(res, '删除便民服务点失败', 500);
  }
});

export default router;
