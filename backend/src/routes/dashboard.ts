import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

router.use(authMiddleware);

// 用户总数
router.get('/user-count', async (req: AuthRequest, res) => {
  try {
    const count = await prisma.user.count({
      where: { status: { not: 'deleted' } },
    });
    return success(res, count);
  } catch (error) {
    console.error('获取用户总数失败:', error);
    return fail(res, '获取用户总数失败');
  }
});

// 人防工程数
router.get('/project-count', async (req: AuthRequest, res) => {
  try {
    const count = await prisma.civilAirDefenseProject.count({
      where: { status: { not: 'deleted' } },
    });
    return success(res, count);
  } catch (error) {
    console.error('获取人防工程数失败:', error);
    return fail(res, '获取人防工程数失败');
  }
});

// 预约数
router.get('/reservation-count', async (req: AuthRequest, res) => {
  try {
    const count = await prisma.parkingReservation.count();
    return success(res, count);
  } catch (error) {
    console.error('获取预约数失败:', error);
    return success(res, 0);
  }
});

// 待审核数
router.get('/pending-audit-count', async (req: AuthRequest, res) => {
  try {
    const count = await prisma.auditTask.count({
      where: { status: 'pending' },
    });
    return success(res, count);
  } catch (error) {
    console.error('获取待审核数失败:', error);
    return success(res, 0);
  }
});

// ============ 首页聚合接口 ============
// GET /overview - 返回首页所有展示数据
router.get('/overview', async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. 核心统计卡片
    const [
      userCount, projectCount, coolingCount, servicePointCount,
      parkingSpaceCount, museumCount, reservationCount, rentalCount,
      pendingAuditCount, announcementCount, audioCount, knowledgeCount,
      todayReservationCount, monthReservationCount,
    ] = await Promise.all([
      prisma.user.count({ where: { status: { not: 'deleted' } } }),
      prisma.civilAirDefenseProject.count({ where: { status: { not: 'deleted' } } }),
      prisma.coolingSpot.count({ where: { status: { not: 'deleted' } } }),
      prisma.convenienceServicePoint.count({ where: { status: { not: 'deleted' } } }),
      prisma.parkingSpace.count({ where: { status: { not: 'deleted' } } }),
      prisma.educationMuseum.count({ where: { status: { not: 'deleted' } } }),
      prisma.parkingReservation.count(),
      prisma.parkingRental.count(),
      prisma.auditTask.count({ where: { status: 'pending' } }),
      prisma.announcement.count({ where: { status: 'published' } }),
      prisma.alarmAudio.count({ where: { status: 'published' } }),
      prisma.protectionKnowledge.count({ where: { status: 'published' } }),
      prisma.parkingReservation.count({ where: { reserveDate: { gte: todayStart } } }),
      prisma.parkingReservation.count({ where: { reserveDate: { gte: monthStart } } }),
    ]);

    // 2. 近7天预约趋势
    const reservationTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.parkingReservation.count({
        where: { reserveDate: { gte: dayStart, lt: dayEnd } },
      });
      reservationTrend.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    // 3. 近7天租赁申请趋势
    const rentalTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.parkingRental.count({
        where: { submitTime: { gte: dayStart, lt: dayEnd } },
      });
      rentalTrend.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    // 4. 近7天访问量趋势
    const accessTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.userAccessLog.count({
        where: { accessTime: { gte: dayStart, lt: dayEnd } },
      });
      accessTrend.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    // 5. 人防工程区域分布
    const projects = await prisma.civilAirDefenseProject.findMany({
      where: { status: { not: 'deleted' } },
      select: { region: true, area: true },
    });
    const regionMap = new Map<string, { count: number; area: number }>();
    projects.forEach((p) => {
      const region = p.region || '未分类';
      const existing = regionMap.get(region) || { count: 0, area: 0 };
      existing.count += 1;
      existing.area += p.area || 0;
      regionMap.set(region, existing);
    });
    const regionDistribution = Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      count: data.count,
      area: Math.round(data.area),
    }));

    // 6. 预约状态分布
    const [reservedCount, usedCount, cancelledCount, expiredCount] = await Promise.all([
      prisma.parkingReservation.count({ where: { status: 'reserved' } }),
      prisma.parkingReservation.count({ where: { status: 'used' } }),
      prisma.parkingReservation.count({ where: { status: 'cancelled' } }),
      prisma.parkingReservation.count({ where: { status: 'expired' } }),
    ]);

    // 7. 租赁状态分布
    const [pendingRental, activeRental, rejectedRental, expiredRental] = await Promise.all([
      prisma.parkingRental.count({ where: { status: 'pending' } }),
      prisma.parkingRental.count({ where: { status: 'active' } }),
      prisma.parkingRental.count({ where: { status: 'rejected' } }),
      prisma.parkingRental.count({ where: { status: 'expired' } }),
    ]);

    // 8. 车位容量统计
    const spacesAgg = await prisma.parkingSpace.aggregate({
      where: { status: 'published' },
      _sum: { totalSpaces: true, bookableSpaces: true, rentableSpaces: true },
    });

    // 9. 最新操作日志（最近10条）
    const recentLogs = await prisma.operationLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { realName: true, username: true } } },
    });

    // 10. 最新预约记录（最近5条）
    const recentReservations = await prisma.parkingReservation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { parking: { select: { location: true } } },
    });

    // 11. 最新公告
    const recentAnnouncements = await prisma.announcement.findMany({
      take: 5,
      where: { status: 'published' },
      orderBy: { publishTime: 'desc' },
    });

    // 12. 今日待办事项
    const todayPendingAudits = await prisma.auditTask.count({
      where: { status: 'pending' },
    });
    const todayPendingRentals = await prisma.parkingRental.count({
      where: { status: 'pending' },
    });

    // 13. 用户访问统计
    const dailyActiveRaw = await prisma.userAccessLog.findMany({
      where: { accessTime: { gte: todayStart } },
      distinct: ['userId'],
    });
    const monthlyActiveRaw = await prisma.userAccessLog.findMany({
      where: { accessTime: { gte: monthStart } },
      distinct: ['userId'],
    });
    const totalAccessCount = await prisma.userAccessLog.count();

    return success(res, {
      // 核心统计
      stats: {
        userCount,
        projectCount,
        coolingCount,
        servicePointCount,
        parkingSpaceCount,
        museumCount,
        reservationCount,
        rentalCount,
        pendingAuditCount,
        announcementCount,
        audioCount,
        knowledgeCount,
        todayReservationCount,
        monthReservationCount,
        totalSpaces: spacesAgg._sum.totalSpaces || 0,
        bookableSpaces: spacesAgg._sum.bookableSpaces || 0,
        rentableSpaces: spacesAgg._sum.rentableSpaces || 0,
        dailyActive: dailyActiveRaw.length,
        monthlyActive: monthlyActiveRaw.length,
        totalAccess: totalAccessCount,
      },
      // 趋势图表
      trends: {
        reservation: reservationTrend,
        rental: rentalTrend,
        access: accessTrend,
      },
      // 区域分布
      regionDistribution,
      // 预约状态分布
      reservationStatus: {
        reserved: reservedCount,
        used: usedCount,
        cancelled: cancelledCount,
        expired: expiredCount,
      },
      // 租赁状态分布
      rentalStatus: {
        pending: pendingRental,
        active: activeRental,
        rejected: rejectedRental,
        expired: expiredRental,
      },
      // 最新动态
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        module: log.module,
        action: log.action,
        target: log.target,
        result: log.result,
        operator: log.user?.realName || log.user?.username || '未知',
        createdAt: log.createdAt,
      })),
      recentReservations: recentReservations.map((r) => ({
        id: r.id,
        reservationNo: r.reservationNo,
        userName: r.userName,
        userPhone: r.userPhone,
        plateNumber: r.plateNumber,
        status: r.status,
        parkingLocation: r.parking?.location || '',
        reserveDate: r.reserveDate,
      })),
      recentAnnouncements: recentAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        publishTime: a.publishTime,
      })),
      // 待办事项
      todoItems: {
        pendingAudits: todayPendingAudits,
        pendingRentals: todayPendingRentals,
      },
    }, '获取首页数据成功');
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return fail(res, '获取首页数据失败', 500);
  }
});

export default router;
