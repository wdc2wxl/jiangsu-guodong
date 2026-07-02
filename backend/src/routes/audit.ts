import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// ==================== 审核流程 ====================

// GET /process - 审核流程列表
router.get('/process', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { dataType, status } = req.query;
    const where: any = {};
    if (dataType) where.dataType = String(dataType);
    if (status) where.status = String(status);

    const [list, total] = await Promise.all([
      prisma.auditProcess.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditProcess.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query audit processes error:', error);
    return fail(res, '查询审核流程列表失败', 500);
  }
});

// POST /process - 新增审核流程
router.post('/process', async (req: AuthRequest, res: Response) => {
  try {
    const { name, dataType, nodes } = req.body;

    if (!name || !dataType || !nodes) {
      return fail(res, '流程名称、数据类型、审核节点不能为空', 400);
    }

    const process = await prisma.auditProcess.create({
      data: {
        ...req.body,
        levels: req.body.levels || 1,
        flowRule: req.body.flowRule || 'sequential',
        status: req.body.status || 'inactive',
        version: 1,
      },
    });

    await logOperation(req, '审核流程', 'create', `新增审核流程:${process.name}`, JSON.stringify(process));

    return success(res, process, '新增审核流程成功');
  } catch (error) {
    console.error('Create audit process error:', error);
    return fail(res, '新增审核流程失败', 500);
  }
});

// PUT /process/:id - 编辑审核流程
router.put('/process/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const process = await prisma.auditProcess.findFirst({ where: { id } });

    if (!process) {
      return fail(res, '审核流程不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    const updated = await prisma.auditProcess.update({
      where: { id },
      data: updateData,
    });

    await logOperation(req, '审核流程', 'update', `编辑审核流程:${updated.name}`, JSON.stringify({ before: process, after: updated }));

    return success(res, updated, '编辑审核流程成功');
  } catch (error) {
    console.error('Update audit process error:', error);
    return fail(res, '编辑审核流程失败', 500);
  }
});

// DELETE /process/:id - 删除审核流程
router.delete('/process/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const process = await prisma.auditProcess.findFirst({ where: { id } });

    if (!process) {
      return fail(res, '审核流程不存在', 404);
    }

    // 检查是否有进行中的任务
    const pendingTasks = await prisma.auditTask.count({
      where: { processId: id, status: 'pending' },
    });
    if (pendingTasks > 0) {
      return fail(res, `存在${pendingTasks}个待审核任务，无法删除`, 400);
    }

    await prisma.auditProcess.delete({ where: { id } });

    await logOperation(req, '审核流程', 'delete', `删除审核流程:${process.name}`);

    return success(res, null, '删除审核流程成功');
  } catch (error) {
    console.error('Delete audit process error:', error);
    return fail(res, '删除审核流程失败', 500);
  }
});

// PUT /process/:id/enable - 启用流程
router.put('/process/:id/enable', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const process = await prisma.auditProcess.findFirst({ where: { id } });

    if (!process) {
      return fail(res, '审核流程不存在', 404);
    }

    // 同一 dataType 下仅允许一个启用流程
    await prisma.auditProcess.updateMany({
      where: { dataType: process.dataType, status: 'active' },
      data: { status: 'inactive' },
    });

    const updated = await prisma.auditProcess.update({
      where: { id },
      data: { status: 'active' },
    });

    await logOperation(req, '审核流程', 'enable', `启用审核流程:${process.name}`);

    return success(res, updated, '审核流程已启用');
  } catch (error) {
    console.error('Enable audit process error:', error);
    return fail(res, '启用审核流程失败', 500);
  }
});

// PUT /process/:id/disable - 停用流程
router.put('/process/:id/disable', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const process = await prisma.auditProcess.findFirst({ where: { id } });

    if (!process) {
      return fail(res, '审核流程不存在', 404);
    }

    const updated = await prisma.auditProcess.update({
      where: { id },
      data: { status: 'inactive' },
    });

    await logOperation(req, '审核流程', 'disable', `停用审核流程:${process.name}`);

    return success(res, updated, '审核流程已停用');
  } catch (error) {
    console.error('Disable audit process error:', error);
    return fail(res, '停用审核流程失败', 500);
  }
});

// ==================== 审核任务 ====================

// GET /tasks - 待审核任务列表(支持dataType, status筛选)
router.get('/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { dataType, status } = req.query;
    const where: any = {};
    if (dataType) where.dataType = String(dataType);
    if (status) where.status = String(status);

    const [list, total] = await Promise.all([
      prisma.auditTask.findMany({
        where,
        skip,
        take,
        include: {
          process: true,
          submitter: { select: { id: true, username: true, realName: true } },
          records: true,
        },
        orderBy: { submitTime: 'desc' },
      }),
      prisma.auditTask.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query audit tasks error:', error);
    return fail(res, '查询审核任务列表失败', 500);
  }
});

// GET /tasks/:id - 审核任务详情
router.get('/tasks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const task = await prisma.auditTask.findFirst({
      where: { id },
      include: {
        process: true,
        submitter: { select: { id: true, username: true, realName: true } },
        records: {
          include: {
            auditor: { select: { id: true, username: true, realName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      return fail(res, '审核任务不存在', 404);
    }

    return success(res, task, '查询成功');
  } catch (error) {
    console.error('Get audit task detail error:', error);
    return fail(res, '查询审核任务详情失败', 500);
  }
});

// POST /tasks/:id/audit - 执行审核(action: pass/return/reject, opinion)
router.post('/tasks/:id/audit', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { action, opinion } = req.body;

    if (!action || !['pass', 'return', 'reject'].includes(action)) {
      return fail(res, '审核动作不合法(应为 pass/return/reject)', 400);
    }

    const task = await prisma.auditTask.findFirst({
      where: { id, status: 'pending' },
      include: { process: true },
    });

    if (!task) {
      return fail(res, '审核任务不存在或已处理', 404);
    }

    // 创建审核记录
    const record = await prisma.auditRecord.create({
      data: {
        taskId: id,
        auditorId: req.userId as number,
        node: task.currentNode,
        action,
        opinion: opinion || null,
      },
    });

    let newStatus = task.status;
    let newCurrentNode = task.currentNode;

    if (action === 'pass') {
      // 通过：判断是否还有下一节点
      if (task.currentNode < task.process.levels) {
        newCurrentNode = task.currentNode + 1;
        newStatus = 'pending';
      } else {
        newStatus = 'approved';
      }
    } else if (action === 'return') {
      // 退回：回到上一节点或保持当前节点
      newCurrentNode = task.currentNode > 1 ? task.currentNode - 1 : 1;
      newStatus = 'returned';
    } else if (action === 'reject') {
      // 驳回：直接结束
      newStatus = 'rejected';
    }

    const updated = await prisma.auditTask.update({
      where: { id },
      data: {
        currentNode: newCurrentNode,
        status: newStatus,
        completeTime: newStatus !== 'pending' ? new Date() : null,
      },
      include: { process: true },
    });

    await logOperation(
      req,
      '审核任务',
      `audit_${action}`,
      `审核任务#${id}(${action})`,
      JSON.stringify({ action, opinion, newStatus })
    );

    return success(res, { task: updated, record }, '审核操作成功');
  } catch (error) {
    console.error('Audit task error:', error);
    return fail(res, '执行审核失败', 500);
  }
});

// ==================== 审核记录 ====================

// GET /records - 审核记录列表(支持dataType, auditor, result筛选)
router.get('/records', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { dataType, auditorId, action } = req.query;
    const where: any = {};
    if (dataType) where.task = { dataType: String(dataType) };
    if (auditorId) where.auditorId = Number(auditorId);
    if (action) where.action = String(action);

    const [list, total] = await Promise.all([
      prisma.auditRecord.findMany({
        where,
        skip,
        take,
        include: {
          task: true,
          auditor: { select: { id: true, username: true, realName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditRecord.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query audit records error:', error);
    return fail(res, '查询审核记录列表失败', 500);
  }
});

// GET /records/:id - 审核记录详情
router.get('/records/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const record = await prisma.auditRecord.findFirst({
      where: { id },
      include: {
        task: true,
        auditor: { select: { id: true, username: true, realName: true } },
      },
    });

    if (!record) {
      return fail(res, '审核记录不存在', 404);
    }

    return success(res, record, '查询成功');
  } catch (error) {
    console.error('Get audit record detail error:', error);
    return fail(res, '查询审核记录详情失败', 500);
  }
});

export default router;
