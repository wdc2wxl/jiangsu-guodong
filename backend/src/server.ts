import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 江苏国动便民后台管理端API服务已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/api/health\n`);
});
