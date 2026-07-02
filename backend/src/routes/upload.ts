import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { success, fail } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 允许的文件扩展名
const allowedExtensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.mp3', '.wav', '.mp4', '.avi', '.mov',
  '.zip', '.rar', '.7z', '.txt', '.csv',
];

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 按日期分目录存储
    const now = new Date();
    const dateDir = path.join(
      uploadDir,
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    );
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    cb(null, dateDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原扩展名
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
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${ts}${rand}${ext}`);
  },
});

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`));
  }
};

// multer 实例：限制单文件 100MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// POST / - 文件上传(使用multer, 保存到uploads目录, 返回文件路径)
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return fail(res, '请选择要上传的文件', 400);
    }

    // 构造可访问的相对路径
    const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');

    const fileInfo = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: relativePath,
      url: `/uploads/${relativePath.replace(/^uploads\//, '')}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
    };

    await logOperation(req, '文件上传', 'upload', `上传文件:${fileInfo.originalName}`, JSON.stringify(fileInfo));

    return success(res, fileInfo, '文件上传成功');
  } catch (error) {
    console.error('Upload file error:', error);
    return fail(res, '文件上传失败', 500);
  }
});

// 错误处理中间件（处理 multer 错误）
router.use((err: any, req: AuthRequest, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, '文件大小超过限制(100MB)', 400);
    }
    return fail(res, `文件上传错误: ${err.message}`, 400);
  }
  if (err) {
    return fail(res, err.message || '文件上传失败', 400);
  }
  next();
});

export default router;
