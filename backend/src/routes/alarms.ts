import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { success, fail, paginate, getPageParams } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// ==================== 警报音频 ====================

// GET /audio - 警报音频列表
router.get('/audio', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { signalType, status } = req.query;
    const where: any = { status: { not: 'deleted' } };
    if (signalType) where.signalType = String(signalType);
    if (status) where.status = String(status);

    const [list, total] = await Promise.all([
      prisma.alarmAudio.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.alarmAudio.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query alarm audio error:', error);
    return fail(res, '查询警报音频列表失败', 500);
  }
});

// POST /audio - 上传警报音频
router.post('/audio', async (req: AuthRequest, res: Response) => {
  try {
    const { signalType, fileName, filePath, fileSize, duration } = req.body;

    if (!signalType || !fileName || !filePath) {
      return fail(res, '信号类型、文件名、文件路径不能为空', 400);
    }

    const audio = await prisma.alarmAudio.create({
      data: {
        signalType,
        fileName,
        filePath,
        fileSize: fileSize || null,
        duration: duration || null,
        status: req.body.status || 'pending',
        createdBy: req.userId,
      },
    });

    await logOperation(req, '警报音频', 'create', `上传警报音频:${audio.fileName}`, JSON.stringify(audio));

    return success(res, audio, '上传警报音频成功');
  } catch (error) {
    console.error('Create alarm audio error:', error);
    return fail(res, '上传警报音频失败', 500);
  }
});

// PUT /audio/:id/revoke - 撤销音频
router.put('/audio/:id/revoke', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const audio = await prisma.alarmAudio.findFirst({
      where: { id, status: { not: 'deleted' } },
    });

    if (!audio) {
      return fail(res, '警报音频不存在', 404);
    }

    const updated = await prisma.alarmAudio.update({
      where: { id },
      data: { status: 'revoked' },
    });

    await logOperation(req, '警报音频', 'revoke', `撤销警报音频:${audio.fileName}`);

    return success(res, updated, '警报音频已撤销');
  } catch (error) {
    console.error('Revoke alarm audio error:', error);
    return fail(res, '撤销警报音频失败', 500);
  }
});

// ==================== 警报信号文字说明 ====================

// GET /signal-text - 警报信号文字说明列表
router.get('/signal-text', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { signalType, status } = req.query;
    const where: any = {};
    if (signalType) where.signalType = String(signalType);
    if (status) where.status = String(status);

    const [list, total] = await Promise.all([
      prisma.alarmSignalText.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.alarmSignalText.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query alarm signal text error:', error);
    return fail(res, '查询警报信号文字说明列表失败', 500);
  }
});

// POST /signal-text - 新增信号文字说明
router.post('/signal-text', async (req: AuthRequest, res: Response) => {
  try {
    const { signalType } = req.body;

    if (!signalType) {
      return fail(res, '信号类型不能为空', 400);
    }

    const text = await prisma.alarmSignalText.create({
      data: { ...req.body, status: req.body.status || 'published' },
    });

    await logOperation(req, '警报信号文字', 'create', `新增信号文字说明:${text.signalType}`, JSON.stringify(text));

    return success(res, text, '新增信号文字说明成功');
  } catch (error) {
    console.error('Create alarm signal text error:', error);
    return fail(res, '新增信号文字说明失败', 500);
  }
});

// PUT /signal-text/:id - 修改信号文字说明
router.put('/signal-text/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const text = await prisma.alarmSignalText.findFirst({ where: { id } });

    if (!text) {
      return fail(res, '信号文字说明不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    const updated = await prisma.alarmSignalText.update({
      where: { id },
      data: updateData,
    });

    await logOperation(req, '警报信号文字', 'update', `修改信号文字说明:${updated.signalType}`, JSON.stringify({ before: text, after: updated }));

    return success(res, updated, '修改信号文字说明成功');
  } catch (error) {
    console.error('Update alarm signal text error:', error);
    return fail(res, '修改信号文字说明失败', 500);
  }
});

// DELETE /signal-text/:id - 删除信号文字说明
router.delete('/signal-text/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const text = await prisma.alarmSignalText.findFirst({ where: { id } });

    if (!text) {
      return fail(res, '信号文字说明不存在', 404);
    }

    await prisma.alarmSignalText.delete({ where: { id } });

    await logOperation(req, '警报信号文字', 'delete', `删除信号文字说明:${text.signalType}`);

    return success(res, null, '删除信号文字说明成功');
  } catch (error) {
    console.error('Delete alarm signal text error:', error);
    return fail(res, '删除信号文字说明失败', 500);
  }
});

// ==================== 防护知识 ====================

// GET /knowledge - 防护知识列表
router.get('/knowledge', async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip, take } = getPageParams(req);
    const { signalType, title, status } = req.query;
    const where: any = {};
    if (signalType) where.signalType = String(signalType);
    if (title) where.title = { contains: String(title) };
    if (status) where.status = String(status);

    const [list, total] = await Promise.all([
      prisma.protectionKnowledge.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.protectionKnowledge.count({ where }),
    ]);

    return paginate(res, list, total, page, pageSize);
  } catch (error) {
    console.error('Query protection knowledge error:', error);
    return fail(res, '查询防护知识列表失败', 500);
  }
});

// POST /knowledge - 新增防护知识
router.post('/knowledge', async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return fail(res, '标题和内容不能为空', 400);
    }

    const knowledge = await prisma.protectionKnowledge.create({
      data: { ...req.body, status: req.body.status || 'published' },
    });

    await logOperation(req, '防护知识', 'create', `新增防护知识:${knowledge.title}`, JSON.stringify(knowledge));

    return success(res, knowledge, '新增防护知识成功');
  } catch (error) {
    console.error('Create protection knowledge error:', error);
    return fail(res, '新增防护知识失败', 500);
  }
});

// PUT /knowledge/:id - 修改防护知识
router.put('/knowledge/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const knowledge = await prisma.protectionKnowledge.findFirst({ where: { id } });

    if (!knowledge) {
      return fail(res, '防护知识不存在', 404);
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = req.body;

    const updated = await prisma.protectionKnowledge.update({
      where: { id },
      data: updateData,
    });

    await logOperation(req, '防护知识', 'update', `修改防护知识:${updated.title}`, JSON.stringify({ before: knowledge, after: updated }));

    return success(res, updated, '修改防护知识成功');
  } catch (error) {
    console.error('Update protection knowledge error:', error);
    return fail(res, '修改防护知识失败', 500);
  }
});

// DELETE /knowledge/:id - 删除防护知识
router.delete('/knowledge/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const knowledge = await prisma.protectionKnowledge.findFirst({ where: { id } });

    if (!knowledge) {
      return fail(res, '防护知识不存在', 404);
    }

    await prisma.protectionKnowledge.delete({ where: { id } });

    await logOperation(req, '防护知识', 'delete', `删除防护知识:${knowledge.title}`);

    return success(res, null, '删除防护知识成功');
  } catch (error) {
    console.error('Delete protection knowledge error:', error);
    return fail(res, '删除防护知识失败', 500);
  }
});

export default router;
