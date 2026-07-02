import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// 解析时间范围
function getTimeRange(req: AuthRequest) {
  const { startTime, endTime } = req.query;
  const range: any = {};
  if (startTime) range.gte = new Date(String(startTime));
  if (endTime) range.lte = new Date(String(endTime));
  return Object.keys(range).length > 0 ? range : undefined;
}

// GET /user-access - 用户访问统计(日活/月活/新增/累计, 支持时间范围)
router.get('/user-access', async (req: AuthRequest, res: Response) => {
  try {
    const accessTime = getTimeRange(req);
    const where: any = {};
    if (accessTime) where.accessTime = accessTime;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 日活：今日有访问记录的去重用户数
    const dailyActive = await prisma.userAccessLog.findMany({
      where: { accessTime: { gte: todayStart } },
      distinct: ['userId'],
    });

    // 月活：本月有访问记录的去重用户数
    const monthlyActive = await prisma.userAccessLog.findMany({
      where: { accessTime: { gte: monthStart } },
      distinct: ['userId'],
    });

    // 区间内新增访问量
    const newAccessCount = accessTime
      ? await prisma.userAccessLog.count({ where })
      : await prisma.userAccessLog.count();

    // 累计访问量
    const totalAccessCount = await prisma.userAccessLog.count();

    // 区间内明细
    const rangeList = accessTime
      ? await prisma.userAccessLog.count({ where })
      : totalAccessCount;

    const result = {
      dailyActive: dailyActive.length,
      monthlyActive: monthlyActive.length,
      newCount: newAccessCount,
      totalCount: totalAccessCount,
      rangeCount: rangeList,
      timeRange: accessTime || 'all',
    };

    return success(res, result, '查询用户访问统计成功');
  } catch (error) {
    console.error('User access stats error:', error);
    return fail(res, '查询用户访问统计失败', 500);
  }
});

// GET /resource-query - 资源查询统计(各类型查询量, 热门关键词)
router.get('/resource-query', async (req: AuthRequest, res: Response) => {
  try {
    const queryTime = getTimeRange(req);
    const where: any = {};
    if (queryTime) where.queryTime = queryTime;

    // 各类型查询量
    const projectCount = await prisma.resourceQueryLog.count({
      where: { ...where, resourceType: 'project' },
    });
    const coolingCount = await prisma.resourceQueryLog.count({
      where: { ...where, resourceType: 'cooling' },
    });
    const serviceCount = await prisma.resourceQueryLog.count({
      where: { ...where, resourceType: 'service' },
    });
    const parkingCount = await prisma.resourceQueryLog.count({
      where: { ...where, resourceType: 'parking' },
    });
    const museumCount = await prisma.resourceQueryLog.count({
      where: { ...where, resourceType: 'museum' },
    });

    // 热门关键词统计（取前20）
    const keywordsRaw = await prisma.resourceQueryLog.findMany({
      where: { ...where, keyword: { not: null } },
      select: { keyword: true },
    });
    const keywordMap = new Map<string, number>();
    keywordsRaw.forEach((item) => {
      if (item.keyword) {
        keywordMap.set(item.keyword, (keywordMap.get(item.keyword) || 0) + 1);
      }
    });
    const hotKeywords = Array.from(keywordMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const result = {
      typeCount: {
        project: projectCount,
        cooling: coolingCount,
        service: serviceCount,
        parking: parkingCount,
        museum: museumCount,
      },
      hotKeywords,
      total: projectCount + coolingCount + serviceCount + parkingCount + museumCount,
    };

    return success(res, result, '查询资源查询统计成功');
  } catch (error) {
    console.error('Resource query stats error:', error);
    return fail(res, '查询资源查询统计失败', 500);
  }
});

// GET /reservation - 车位预约统计(预约量/确认量/取消量/到场率)
router.get('/reservation', async (req: AuthRequest, res: Response) => {
  try {
    const createdAt = getTimeRange(req);
    const where: any = {};
    if (createdAt) where.createdAt = createdAt;

    const total = await prisma.parkingReservation.count({ where });
    const used = await prisma.parkingReservation.count({
      where: { ...where, status: 'used' },
    });
    const cancelled = await prisma.parkingReservation.count({
      where: { ...where, status: 'cancelled' },
    });
    const expired = await prisma.parkingReservation.count({
      where: { ...where, status: 'expired' },
    });
    const reserved = await prisma.parkingReservation.count({
      where: { ...where, status: 'reserved' },
    });

    // 到场率 = 到场数 / (到场数 + 取消数 + 过期数)
    const validSum = used + cancelled + expired;
    const arrivalRate = validSum > 0 ? Number(((used / validSum) * 100).toFixed(2)) : 0;

    const result = {
      total,
      reserved,
      used,
      cancelled,
      expired,
      arrivalRate, // 百分比
    };

    return success(res, result, '查询车位预约统计成功');
  } catch (error) {
    console.error('Reservation stats error:', error);
    return fail(res, '查询车位预约统计失败', 500);
  }
});

// GET /rental - 车位租赁统计(申请量/签约量/续租量/退租量)
router.get('/rental', async (req: AuthRequest, res: Response) => {
  try {
    const createdAt = getTimeRange(req);
    const where: any = {};
    if (createdAt) where.createdAt = createdAt;

    const total = await prisma.parkingRental.count({ where });
    const approved = await prisma.parkingRental.count({
      where: { ...where, status: 'approved' },
    });
    const active = await prisma.parkingRental.count({
      where: { ...where, status: 'active' },
    });
    const rejected = await prisma.parkingRental.count({
      where: { ...where, status: 'rejected' },
    });
    const terminated = await prisma.parkingRental.count({
      where: { ...where, status: 'terminated' },
    });
    const expired = await prisma.parkingRental.count({
      where: { ...where, status: 'expired' },
    });

    const result = {
      total,
      applied: total,
      signed: approved + active,
      terminated,
      expired,
      rejected,
    };

    return success(res, result, '查询车位租赁统计成功');
  } catch (error) {
    console.error('Rental stats error:', error);
    return fail(res, '查询车位租赁统计失败', 500);
  }
});

// GET /utilization - 资源利用率统计(纳凉点/车位利用率)
router.get('/utilization', async (req: AuthRequest, res: Response) => {
  try {
    // 纳凉点利用率：活跃纳凉点占比
    const coolingTotal = await prisma.coolingSpot.count({
      where: { status: { not: 'deleted' } },
    });
    const coolingActive = await prisma.coolingSpot.count({
      where: { status: 'active' },
    });
    const coolingClosed = await prisma.coolingSpot.count({
      where: { status: 'closed' },
    });
    const coolingUtilization = coolingTotal > 0 ? Number(((coolingActive / coolingTotal) * 100).toFixed(2)) : 0;

    // 车位利用率：已发布车位及可预约/可租赁占比
    const parkingTotal = await prisma.parkingSpace.count({
      where: { status: { not: 'deleted' } },
    });
    const parkingPublished = await prisma.parkingSpace.count({
      where: { status: 'published' },
    });
    const parkingUtilization = parkingTotal > 0 ? Number(((parkingPublished / parkingTotal) * 100).toFixed(2)) : 0;

    // 车位总容量统计
    const totalSpacesAgg = await prisma.parkingSpace.aggregate({
      where: { status: 'published' },
      _sum: { totalSpaces: true, bookableSpaces: true, rentableSpaces: true },
    });

    // 近30天预约及租赁使用情况
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReservations = await prisma.parkingReservation.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const recentRentals = await prisma.parkingRental.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const result = {
      cooling: {
        total: coolingTotal,
        active: coolingActive,
        closed: coolingClosed,
        utilization: coolingUtilization,
      },
      parking: {
        total: parkingTotal,
        published: parkingPublished,
        utilization: parkingUtilization,
        totalSpaces: totalSpacesAgg._sum.totalSpaces || 0,
        bookableSpaces: totalSpacesAgg._sum.bookableSpaces || 0,
        rentableSpaces: totalSpacesAgg._sum.rentableSpaces || 0,
        recentReservations,
        recentRentals,
      },
    };

    return success(res, result, '查询资源利用率统计成功');
  } catch (error) {
    console.error('Utilization stats error:', error);
    return fail(res, '查询资源利用率统计失败', 500);
  }
});

// ==================== 报表 ====================

// GET /report/templates - 报表模板列表
router.get('/report/templates', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { type, status } = req.query;
    const where: any = {};
    if (type) where.type = String(type);
    if (status) where.status = String(status);

    const [list, total] = await Promise.all([
      prisma.reportTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reportTemplate.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query report templates error:', error);
    return fail(res, '查询报表模板列表失败', 500);
  }
});

// POST /report/generate - 生成报表
router.post('/report/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, name, period, format } = req.body;

    if (!name || !period) {
      return fail(res, '报表名称和统计周期不能为空', 400);
    }

    // 校验模板是否存在
    if (templateId) {
      const template = await prisma.reportTemplate.findFirst({
        where: { id: Number(templateId) },
      });
      if (!template) {
        return fail(res, '报表模板不存在', 404);
      }
    }

    // 生成报表记录（实际文件生成可对接报表服务）
    const record = await prisma.reportRecord.create({
      data: {
        templateId: templateId ? Number(templateId) : null,
        name,
        period,
        format: format || 'pdf',
        filePath: null,
        createdBy: req.userId,
      },
    });

    await logOperation(req, '报表', 'generate', `生成报表:${record.name}`, JSON.stringify(record));

    return success(res, record, '报表生成成功');
  } catch (error) {
    console.error('Generate report error:', error);
    return fail(res, '生成报表失败', 500);
  }
});

// GET /report/records - 报表记录列表
router.get('/report/records', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { templateId, format } = req.query;
    const where: any = {};
    if (templateId) where.templateId = Number(templateId);
    if (format) where.format = String(format);

    const [list, total] = await Promise.all([
      prisma.reportRecord.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reportRecord.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query report records error:', error);
    return fail(res, '查询报表记录列表失败', 500);
  }
});

// GET /report/export/:id - 导出报表
router.get('/report/export/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const record = await prisma.reportRecord.findFirst({ where: { id } });

    if (!record) {
      return fail(res, '报表记录不存在', 404);
    }

    await logOperation(req, '报表', 'export', `导出报表:${record.name}`);

    return success(res, record, '导出报表成功');
  } catch (error) {
    console.error('Export report error:', error);
    return fail(res, '导出报表失败', 500);
  }
});

export default router;
