import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// 生成业务编号
function generateNo(prefix: string) {
  const now = new Date();
  const ts =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}${ts}${rand}`;
}

// ==================== 车位预约 ====================

// GET /reservations - 车位预约列表(支持status, parkingId筛选)
router.get('/reservations', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { status, parkingId, userName, userPhone } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (parkingId) where.parkingId = Number(parkingId);
    if (userName) where.userName = { contains: String(userName) };
    if (userPhone) where.userPhone = { contains: String(userPhone) };

    const [list, total] = await Promise.all([
      prisma.parkingReservation.findMany({
        where,
        skip,
        take,
        include: {
          parking: true,
          project: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.parkingReservation.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query reservations error:', error);
    return fail(res, '查询车位预约列表失败', 500);
  }
});

// GET /reservations/:id - 预约详情
router.get('/reservations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const reservation = await prisma.parkingReservation.findFirst({
      where: { id },
      include: {
        parking: true,
        project: true,
        user: { select: { id: true, username: true, realName: true } },
      },
    });

    if (!reservation) {
      return fail(res, '车位预约不存在', 404);
    }

    return success(res, reservation, '查询成功');
  } catch (error) {
    console.error('Get reservation detail error:', error);
    return fail(res, '查询车位预约详情失败', 500);
  }
});

// PUT /reservations/:id/status - 更新预约状态(确认/驳回)
router.put('/reservations/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: 'used' | 'cancelled' };

    const reservation = await prisma.parkingReservation.findFirst({ where: { id } });
    if (!reservation) {
      return fail(res, '预约记录不存在', 404);
    }
    if (reservation.status !== 'reserved') {
      return fail(res, '当前状态不支持此操作', 400);
    }

    const updated = await prisma.parkingReservation.update({
      where: { id },
      data: { status },
    });

    await logOperation(req, '车位预约', 'update_status', `更新预约状态:${reservation.reservationNo} -> ${status === 'used' ? '已使用' : '已取消'}`);

    return success(res, updated, status === 'used' ? '确认成功' : '驳回成功');
  } catch (error) {
    console.error('Update reservation status error:', error);
    return fail(res, '更新预约状态失败', 500);
  }
});

// ==================== 车位租赁 ====================

// GET /rentals - 车位租赁列表
router.get('/rentals', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { status, parkingId, applicantName } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (parkingId) where.parkingId = Number(parkingId);
    if (applicantName) where.applicantName = { contains: String(applicantName) };

    const [list, total] = await Promise.all([
      prisma.parkingRental.findMany({
        where,
        skip,
        take,
        include: {
          parking: true,
          project: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.parkingRental.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query rentals error:', error);
    return fail(res, '查询车位租赁列表失败', 500);
  }
});

// GET /rentals/:id - 租赁详情
router.get('/rentals/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rental = await prisma.parkingRental.findFirst({
      where: { id },
      include: {
        parking: true,
        project: true,
        user: { select: { id: true, username: true, realName: true } },
      },
    });

    if (!rental) {
      return fail(res, '车位租赁不存在', 404);
    }

    return success(res, rental, '查询成功');
  } catch (error) {
    console.error('Get rental detail error:', error);
    return fail(res, '查询车位租赁详情失败', 500);
  }
});

// POST /rentals - 录入可租赁车位信息
router.post('/rentals', async (req: AuthRequest, res: Response) => {
  try {
    const { parkingId, applicantName, applicantPhone, leasePrice } = req.body;

    if (!parkingId || !applicantName || !applicantPhone || leasePrice === undefined) {
      return fail(res, '车位ID、申请人姓名、电话、租赁价格不能为空', 400);
    }

    // 校验车位是否存在
    const parking = await prisma.parkingSpace.findFirst({
      where: { id: Number(parkingId), status: { not: 'deleted' } },
    });
    if (!parking) {
      return fail(res, '人防车位不存在', 400);
    }

    const rental = await prisma.parkingRental.create({
      data: {
        ...req.body,
        parkingId: Number(parkingId),
        rentalNo: generateNo('R'),
        status: req.body.status || 'pending',
        userId: req.userId,
      },
      include: { parking: true },
    });

    await logOperation(req, '车位租赁', 'create', `录入租赁信息:${rental.rentalNo}`, JSON.stringify(rental));

    return success(res, rental, '录入租赁信息成功');
  } catch (error) {
    console.error('Create rental error:', error);
    return fail(res, '录入租赁信息失败', 500);
  }
});

// PUT /rentals/:id - 编辑租赁信息
router.put('/rentals/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rental = await prisma.parkingRental.findFirst({ where: { id } });

    if (!rental) {
      return fail(res, '车位租赁不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, rentalNo: _rn, ...updateData } = req.body;

    const updated = await prisma.parkingRental.update({
      where: { id },
      data: updateData,
      include: { parking: true },
    });

    await logOperation(req, '车位租赁', 'update', `编辑租赁信息:${rental.rentalNo}`, JSON.stringify({ before: rental, after: updated }));

    return success(res, updated, '编辑租赁信息成功');
  } catch (error) {
    console.error('Update rental error:', error);
    return fail(res, '编辑租赁信息失败', 500);
  }
});

// PUT /rentals/:id/list - 上架
router.put('/rentals/:id/list', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rental = await prisma.parkingRental.findFirst({ where: { id } });

    if (!rental) {
      return fail(res, '车位租赁不存在', 404);
    }

    const updated = await prisma.parkingRental.update({
      where: { id },
      data: { status: 'active' },
      include: { parking: true },
    });

    await logOperation(req, '车位租赁', 'list', `上架租赁信息:${rental.rentalNo}`);

    return success(res, updated, '租赁信息已上架');
  } catch (error) {
    console.error('List rental error:', error);
    return fail(res, '上架租赁信息失败', 500);
  }
});

// PUT /rentals/:id/delist - 下架
router.put('/rentals/:id/delist', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rental = await prisma.parkingRental.findFirst({ where: { id } });

    if (!rental) {
      return fail(res, '车位租赁不存在', 404);
    }

    const updated = await prisma.parkingRental.update({
      where: { id },
      data: { status: 'expired' },
      include: { parking: true },
    });

    await logOperation(req, '车位租赁', 'delist', `下架租赁信息:${rental.rentalNo}`);

    return success(res, updated, '租赁信息已下架');
  } catch (error) {
    console.error('Delist rental error:', error);
    return fail(res, '下架租赁信息失败', 500);
  }
});

// POST /rentals/:id/audit - 租赁审核(action: pass/reject)
router.post('/rentals/:id/audit', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { action, opinion } = req.body;

    if (!action || !['pass', 'reject'].includes(action)) {
      return fail(res, '审核动作不合法(应为 pass/reject)', 400);
    }

    const rental = await prisma.parkingRental.findFirst({ where: { id } });

    if (!rental) {
      return fail(res, '车位租赁不存在', 404);
    }

    const newStatus = action === 'pass' ? 'approved' : 'rejected';

    const updated = await prisma.parkingRental.update({
      where: { id },
      data: { status: newStatus },
      include: { parking: true },
    });

    await logOperation(
      req,
      '车位租赁',
      `audit_${action}`,
      `租赁审核:${rental.rentalNo}(${action})`,
      JSON.stringify({ action, opinion })
    );

    return success(res, updated, action === 'pass' ? '审核通过' : '审核驳回');
  } catch (error) {
    console.error('Audit rental error:', error);
    return fail(res, '租赁审核失败', 500);
  }
});

// PUT /rentals/:id/status - 更新审核状态
router.put('/rentals/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return fail(res, '审核状态不能为空', 400);
    }

    const rental = await prisma.parkingRental.findFirst({ where: { id } });

    if (!rental) {
      return fail(res, '车位租赁不存在', 404);
    }

    const updated = await prisma.parkingRental.update({
      where: { id },
      data: { status },
      include: { parking: true },
    });

    await logOperation(req, '车位租赁', 'update_status', `更新租赁状态:${rental.rentalNo} -> ${status}`);

    return success(res, updated, '审核状态更新成功');
  } catch (error) {
    console.error('Update rental status error:', error);
    return fail(res, '更新审核状态失败', 500);
  }
});

// ==================== 预约规则 ====================

// GET /rules - 预约规则列表
router.get('/rules', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { ruleType, status, targetType } = req.query;
    const where: any = {};
    if (ruleType) where.ruleType = String(ruleType);
    if (status) where.status = String(status);
    if (targetType) where.targetType = String(targetType);

    const [list, total] = await Promise.all([
      prisma.bookingRule.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bookingRule.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query booking rules error:', error);
    return fail(res, '查询预约规则列表失败', 500);
  }
});

// POST /rules - 新增规则
router.post('/rules', async (req: AuthRequest, res: Response) => {
  try {
    const { ruleType, name } = req.body;

    if (!ruleType || !name) {
      return fail(res, '规则类型和名称不能为空', 400);
    }

    const rule = await prisma.bookingRule.create({
      data: {
        ruleType,
        name,
        advanceDays: req.body.advanceDays ?? 7,
        slotDuration: req.body.slotDuration ?? 60,
        timeoutRelease: req.body.timeoutRelease ?? 30,
        cancelLimit: req.body.cancelLimit ?? 120,
        maxBooking: req.body.maxBooking ?? 1,
        targetType: req.body.targetType || null,
        targetId: req.body.targetId || null,
        status: req.body.status || 'inactive',
      },
    });

    await logOperation(req, '预约规则', 'create', `新增预约规则:${rule.name}`, JSON.stringify(rule));

    return success(res, rule, '新增预约规则成功');
  } catch (error) {
    console.error('Create booking rule error:', error);
    return fail(res, '新增预约规则失败', 500);
  }
});

// PUT /rules/:id - 编辑规则
router.put('/rules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rule = await prisma.bookingRule.findFirst({ where: { id } });

    if (!rule) {
      return fail(res, '预约规则不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    const updated = await prisma.bookingRule.update({
      where: { id },
      data: updateData,
    });

    await logOperation(req, '预约规则', 'update', `编辑预约规则:${updated.name}`, JSON.stringify({ before: rule, after: updated }));

    return success(res, updated, '编辑预约规则成功');
  } catch (error) {
    console.error('Update booking rule error:', error);
    return fail(res, '编辑预约规则失败', 500);
  }
});

// DELETE /rules/:id - 删除规则
router.delete('/rules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rule = await prisma.bookingRule.findFirst({ where: { id } });

    if (!rule) {
      return fail(res, '预约规则不存在', 404);
    }

    await prisma.bookingRule.delete({ where: { id } });

    await logOperation(req, '预约规则', 'delete', `删除预约规则:${rule.name}`);

    return success(res, null, '删除预约规则成功');
  } catch (error) {
    console.error('Delete booking rule error:', error);
    return fail(res, '删除预约规则失败', 500);
  }
});

// PUT /rules/:id/enable - 启用规则
router.put('/rules/:id/enable', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rule = await prisma.bookingRule.findFirst({ where: { id } });

    if (!rule) {
      return fail(res, '预约规则不存在', 404);
    }

    const updated = await prisma.bookingRule.update({
      where: { id },
      data: { status: 'active' },
    });

    await logOperation(req, '预约规则', 'enable', `启用预约规则:${rule.name}`);

    return success(res, updated, '预约规则已启用');
  } catch (error) {
    console.error('Enable booking rule error:', error);
    return fail(res, '启用预约规则失败', 500);
  }
});

// PUT /rules/:id/disable - 停用规则
router.put('/rules/:id/disable', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rule = await prisma.bookingRule.findFirst({ where: { id } });

    if (!rule) {
      return fail(res, '预约规则不存在', 404);
    }

    const updated = await prisma.bookingRule.update({
      where: { id },
      data: { status: 'inactive' },
    });

    await logOperation(req, '预约规则', 'disable', `停用预约规则:${rule.name}`);

    return success(res, updated, '预约规则已停用');
  } catch (error) {
    console.error('Disable booking rule error:', error);
    return fail(res, '停用预约规则失败', 500);
  }
});

export default router;
