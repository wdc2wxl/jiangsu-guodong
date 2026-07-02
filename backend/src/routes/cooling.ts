import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// 构建查询条件
function buildWhere(req: AuthRequest) {
  const { name, address, region, status } = req.query;
  const where: any = { status: { not: 'deleted' } };
  if (name) where.name = { contains: String(name) };
  if (address) where.address = { contains: String(address) };
  if (region) where.region = String(region);
  if (status) where.status = String(status);
  return where;
}

// GET / - 分页查询
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const where = buildWhere(req);

    const [list, total] = await Promise.all([
      prisma.coolingSpot.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coolingSpot.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query cooling spots error:', error);
    return fail(res, '查询纳凉点列表失败', 500);
  }
});

// GET /export - 导出
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const where = buildWhere(req);
    const list = await prisma.coolingSpot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    await logOperation(req, '纳凉点', 'export', `导出${list.length}条纳凉点数据`);
    return success(res, list, '导出成功');
  } catch (error) {
    console.error('Export cooling spots error:', error);
    return fail(res, '导出纳凉点数据失败', 500);
  }
});

// GET /:id - 详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const spot = await prisma.coolingSpot.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!spot) {
      return fail(res, '纳凉点不存在', 404);
    }

    return success(res, spot, '查询成功');
  } catch (error) {
    console.error('Get cooling spot detail error:', error);
    return fail(res, '查询纳凉点详情失败', 500);
  }
});

// POST / - 新增
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, longitude, latitude } = req.body;

    if (!name || !address || longitude === undefined || latitude === undefined) {
      return fail(res, '纳凉点名称、地址、经纬度不能为空', 400);
    }

    const spot = await prisma.coolingSpot.create({
      data: { ...req.body, status: req.body.status || 'active' },
    });

    await logOperation(req, '纳凉点', 'create', `新增纳凉点:${spot.name}`, JSON.stringify(spot));

    return success(res, spot, '新增纳凉点成功');
  } catch (error) {
    console.error('Create cooling spot error:', error);
    return fail(res, '新增纳凉点失败', 500);
  }
});

// POST /import - 批量导入
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body.data;
    if (!Array.isArray(data) || data.length === 0) {
      return fail(res, '导入数据不能为空', 400);
    }

    const result = await prisma.coolingSpot.createMany({
      data: data.map((item: any) => ({
        ...item,
        status: item.status || 'active',
      })),
    });

    await logOperation(req, '纳凉点', 'import', `批量导入${result.count}条纳凉点数据`);

    return success(res, { count: result.count }, `成功导入${result.count}条数据`);
  } catch (error) {
    console.error('Import cooling spots error:', error);
    return fail(res, '批量导入纳凉点失败', 500);
  }
});

// PUT /:id - 修改
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const spot = await prisma.coolingSpot.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!spot) {
      return fail(res, '纳凉点不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    const updated = await prisma.coolingSpot.update({
      where: { id },
      data: updateData,
    });

    await logOperation(req, '纳凉点', 'update', `修改纳凉点:${updated.name}`, JSON.stringify({ before: spot, after: updated }));

    return success(res, updated, '修改纳凉点成功');
  } catch (error) {
    console.error('Update cooling spot error:', error);
    return fail(res, '修改纳凉点失败', 500);
  }
});

// PUT /:id/close - 关闭(status=closed)
router.put('/:id/close', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const spot = await prisma.coolingSpot.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!spot) {
      return fail(res, '纳凉点不存在', 404);
    }

    const updated = await prisma.coolingSpot.update({
      where: { id },
      data: { status: 'closed' },
    });

    await logOperation(req, '纳凉点', 'close', `关闭纳凉点:${spot.name}`);

    return success(res, updated, '纳凉点已关闭');
  } catch (error) {
    console.error('Close cooling spot error:', error);
    return fail(res, '关闭纳凉点失败', 500);
  }
});

// PUT /:id/activate - 激活(status=active)
router.put('/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const spot = await prisma.coolingSpot.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!spot) {
      return fail(res, '纳凉点不存在', 404);
    }

    const updated = await prisma.coolingSpot.update({
      where: { id },
      data: { status: 'active' },
    });

    await logOperation(req, '纳凉点', 'activate', `激活纳凉点:${spot.name}`);

    return success(res, updated, '纳凉点已激活');
  } catch (error) {
    console.error('Activate cooling spot error:', error);
    return fail(res, '激活纳凉点失败', 500);
  }
});

// DELETE /:id - 逻辑删除
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const spot = await prisma.coolingSpot.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!spot) {
      return fail(res, '纳凉点不存在', 404);
    }

    await prisma.coolingSpot.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await logOperation(req, '纳凉点', 'delete', `删除纳凉点:${spot.name}`);

    return success(res, null, '删除纳凉点成功');
  } catch (error) {
    console.error('Delete cooling spot error:', error);
    return fail(res, '删除纳凉点失败', 500);
  }
});

export default router;
