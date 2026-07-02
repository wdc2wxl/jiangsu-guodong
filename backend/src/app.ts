import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'running', time: new Date().toISOString() } });
});

// 路由注册
app.use('/api/auth', require('./routes/auth').default);
app.use('/api/dashboard', require('./routes/dashboard').default);
app.use('/api/projects', require('./routes/projects').default);
app.use('/api/cooling-spots', require('./routes/cooling').default);
app.use('/api/service-points', require('./routes/services').default);
app.use('/api/parking-spaces', require('./routes/parking').default);
app.use('/api/museums', require('./routes/museums').default);
app.use('/api/alarms', require('./routes/alarms').default);
app.use('/api/audit', require('./routes/audit').default);
app.use('/api/booking', require('./routes/booking').default);
app.use('/api/stats', require('./routes/stats').default);
app.use('/api/system', require('./routes/system').default);
app.use('/api/upload', require('./routes/upload').default);

// 托管前端静态文件（开发模式用src/public，生产模式用dist/public）
const isDev = process.env.NODE_ENV !== 'production';
const publicPath = isDev
  ? path.join(__dirname, '..', '..', 'frontend', 'dist')
  : path.join(__dirname, 'public');
app.use(express.static(publicPath));

// SPA fallback：所有非API路由返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    data: null,
  });
});

export default app;
