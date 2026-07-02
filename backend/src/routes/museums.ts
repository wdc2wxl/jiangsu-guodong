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
      prisma.educationMuseum.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.educationMuseum.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query museums error:', error);
    return fail(res, '查询宣教体验馆列表失败', 500);
  }
});

// GET /export - 导出
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const where = buildWhere(req);
    const list = await prisma.educationMuseum.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    await logOperation(req, '宣教体验馆', 'export', `导出${list.length}条宣教体验馆数据`);
    return success(res, list, '导出成功');
  } catch (error) {
    console.error('Export museums error:', error);
    return fail(res, '导出宣教体验馆数据失败', 500);
  }
});

// GET /:id - 详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const museum = await prisma.educationMuseum.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!museum) {
      return fail(res, '宣教体验馆不存在', 404);
    }

    return success(res, museum, '查询成功');
  } catch (error) {
    console.error('Get museum detail error:', error);
    return fail(res, '查询宣教体验馆详情失败', 500);
  }
});

// POST / - 新增
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, longitude, latitude } = req.body;

    if (!name || !address || longitude === undefined || latitude === undefined) {
      return fail(res, '体验馆名称、地址、经纬度不能为空', 400);
    }

    const museum = await prisma.educationMuseum.create({
      data: { ...req.body, status: req.body.status || 'published' },
    });

    await logOperation(req, '宣教体验馆', 'create', `新增宣教体验馆:${museum.name}`, JSON.stringify(museum));

    return success(res, museum, '新增宣教体验馆成功');
  } catch (error) {
    console.error('Create museum error:', error);
    return fail(res, '新增宣教体验馆失败', 500);
  }
});

// POST /import - 批量导入
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body.data;
    if (!Array.isArray(data) || data.length === 0) {
      return fail(res, '导入数据不能为空', 400);
    }

    const result = await prisma.educationMuseum.createMany({
      data: data.map((item: any) => ({
        ...item,
        status: item.status || 'published',
      })),
    });

    await logOperation(req, '宣教体验馆', 'import', `批量导入${result.count}条宣教体验馆数据`);

    return success(res, { count: result.count }, `成功导入${result.count}条数据`);
  } catch (error) {
    console.error('Import museums error:', error);
    return fail(res, '批量导入宣教体验馆失败', 500);
  }
});

// PUT /:id - 修改
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const museum = await prisma.educationMuseum.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!museum) {
      return fail(res, '宣教体验馆不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    const updated = await prisma.educationMuseum.update({
      where: { id },
      data: updateData,
    });

    await logOperation(req, '宣教体验馆', 'update', `修改宣教体验馆:${updated.name}`, JSON.stringify({ before: museum, after: updated }));

    return success(res, updated, '修改宣教体验馆成功');
  } catch (error) {
    console.error('Update museum error:', error);
    return fail(res, '修改宣教体验馆失败', 500);
  }
});

// DELETE /:id - 逻辑删除
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const museum = await prisma.educationMuseum.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!museum) {
      return fail(res, '宣教体验馆不存在', 404);
    }

    await prisma.educationMuseum.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await logOperation(req, '宣教体验馆', 'delete', `删除宣教体验馆:${museum.name}`);

    return success(res, null, '删除宣教体验馆成功');
  } catch (error) {
    console.error('Delete museum error:', error);
    return fail(res, '删除宣教体验馆失败', 500);
  }
});

export default router;
