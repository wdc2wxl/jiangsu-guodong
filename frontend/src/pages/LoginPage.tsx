import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import api from '@/services/api';
import useAuthStore from '@/stores/auth';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form] = Form.useForm();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成验证码
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
    drawCaptcha(result);
  };

  // 绘制验证码到canvas
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // 背景
    ctx.fillStyle = '#f0f4ff';
    ctx.fillRect(0, 0, w, h);
    // 干扰线
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 255)}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }
    // 文字
    const colors = ['#2563eb', '#1d4ed8', '#3b82f6', '#4f46e5'];
    for (let i = 0; i < text.length; i++) {
      ctx.font = `bold ${20 + Math.random() * 6}px sans-serif`;
      ctx.fillStyle = colors[i % colors.length];
      const x = 8 + i * 22;
      const y = 26 + Math.random() * 8;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    // 干扰点
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 150)}, 255, 0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  useEffect(() => {
    generateCaptcha();
    // 读取记住的用户名
    const saved = localStorage.getItem('rememberedUser');
    if (saved) {
      form.setFieldValue('username', saved);
      setRememberMe(true);
    } else {
      // 自动填充默认账号密码
      form.setFieldsValue({ username: 'admin', password: 'admin123' });
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (values: { username: string; password: string; captcha: string }) => {
    if (values.captcha.toUpperCase() !== captcha.toUpperCase()) {
      message.error('验证码错误');
      generateCaptcha();
      form.setFieldValue('captcha', '');
      return;
    }
    setLoading(true);
    try {
      const data: any = await api.post('/auth/login', { username: values.username, password: values.password });
      const token = data.token || data.accessToken;
      const userInfo = data.userInfo || data.user || { username: values.username };
      login(token, userInfo);
      if (rememberMe) {
        localStorage.setItem('rememberedUser', values.username);
      } else {
        localStorage.removeItem('rememberedUser');
      }
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      message.error(error?.message || '登录失败，请检查用户名和密码');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 主内容区：背景图平铺整个页面 */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundImage: 'url(/login-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* 左侧品牌展示区 */}
        <div
          style={{
            flex: '1.2',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '40px 48px',
          }}
        >
          {/* Logo区域 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 50%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" fill="white" opacity="0.95"/>
                <path d="M12 6L7 9v4c0 3 2 5.5 5 6.5 3-1 5-3.5 5-6.5V9l-5-3z" fill="#dc2626" opacity="0.8"/>
              </svg>
            </div>
            <div>
              <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>江苏国动便民</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 8px' }}>|</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>后台管理系统</span>
            </div>
          </div>

          {/* 中间标语 */}
          <div style={{ textAlign: 'left', marginTop: '-60px' }}>
            <div style={{ color: '#fff', fontSize: 40, fontWeight: 700, letterSpacing: 6, marginBottom: 20, lineHeight: 1.3, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              国防动员 便民利民
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, letterSpacing: 2, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              数据汇聚 <span style={{ margin: '0 8px', opacity: 0.5 }}>●</span>
              业务管理 <span style={{ margin: '0 8px', opacity: 0.5 }}>●</span>
              统计分析 <span style={{ margin: '0 8px', opacity: 0.5 }}>●</span>
              安全运维
            </div>
          </div>

          {/* 底部信息（在背景图上方） */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              江苏省国防动员办公室 · 技术支持：江苏国动信息科技有限公司
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>
              建议使用 1920×1080 分辨率浏览本系统
            </div>
          </div>
        </div>

        {/* 右侧登录表单区 - 白色卡片背景 */}
        <div
          style={{
            flex: '0.8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 420,
              background: '#fff',
              borderRadius: 8,
              padding: '28px 40px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            {/* 标题 */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 32, height: 1, background: '#d1d5db' }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>管理员登录</span>
                <div style={{ width: 32, height: 1, background: '#d1d5db' }} />
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>欢迎登录江苏国动便民后台管理系统</div>
            </div>

            <Form
              form={form}
              onFinish={handleLogin}
              autoComplete="off"
              size="large"
            >
              {/* 用户名 */}
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="请输入用户名"
                  style={{ height: 46, borderRadius: 6, borderColor: '#e5e7eb' }}
                />
              </Form.Item>

              {/* 密码 */}
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="请输入密码"
                  visibilityToggle={{
                    visible: passwordVisible,
                    onVisibleChange: setPasswordVisible,
                  }}
                  iconRender={(visible) => visible ? <EyeOutlined style={{ color: '#9ca3af' }} /> : <EyeInvisibleOutlined style={{ color: '#9ca3af' }} />}
                  style={{ height: 46, borderRadius: 6, borderColor: '#e5e7eb' }}
                />
              </Form.Item>

              {/* 验证码 */}
              <Form.Item
                name="captcha"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <Input
                    prefix={<SafetyOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="请输入验证码"
                    style={{ height: 46, borderRadius: 6, borderColor: '#e5e7eb', flex: 1 }}
                    value={form.getFieldValue('captcha')}
                    onChange={(e) => form.setFieldValue('captcha', e.target.value)}
                  />
                  <canvas
                    ref={canvasRef}
                    width={90}
                    height={46}
                    onClick={generateCaptcha}
                    style={{ borderRadius: 6, cursor: 'pointer', border: '1px solid #e5e7eb', flexShrink: 0 }}
                  />
                </div>
              </Form.Item>

              {/* 记住账号 / 忘记密码 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ fontSize: 13, color: '#6b7280' }}
                >
                  记住账号
                </Checkbox>
                <a style={{ fontSize: 13, color: '#2563eb' }}>忘记密码?</a>
              </div>

              {/* 登录按钮 */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{
                    height: 46,
                    borderRadius: 6,
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: 8,
                    background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                  }}
                >
                  登 录
                </Button>
              </Form.Item>
            </Form>

            {/* 推荐浏览器 - 在登录按钮下方，白色背景上 */}
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>推荐使用浏览器</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                <div title="Chrome" style={{ fontSize: 11, color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff" stroke="#e5e7eb"/><circle cx="12" cy="12" r="4" fill="#4285f4"/><path d="M12 2 A10 10 0 0 1 21 8 L15 8 A5 5 0 0 0 9.5 10 L6 4 A10 10 0 0 1 12 2Z" fill="#ea4335"/><path d="M21 8 A10 10 0 0 1 15 21.5 L11.5 15 A5 5 0 0 0 15 11 L21 11Z" fill="#fbbc05"/><path d="M3 8 A10 10 0 0 0 6 19 L9.5 13 A5 5 0 0 0 8 11 L3 11Z" fill="#34a853"/></svg>
                  Chrome
                </div>
                <div title="Firefox" style={{ fontSize: 11, color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#ff7139"/><circle cx="12" cy="12" r="5" fill="#fff"/><circle cx="12" cy="12" r="3" fill="#ff7139"/></svg>
                  Firefox
                </div>
                <div title="Edge" style={{ fontSize: 11, color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0078d4"/><path d="M8 16 Q6 12 9 8 Q12 5 15 8 Q17 10 16 14 Q14 17 11 16" fill="none" stroke="#fff" strokeWidth="2"/></svg>
                  Edge
                </div>
                <div title="360" style={{ fontSize: 11, color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#1faf5a"/><path d="M12 5 L7 10 L7 16 L12 19 L17 16 L17 10 Z" fill="#fff"/></svg>
                  360
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部白色栏 80px */}
      <div
        style={{
          height: 80,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 48px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
            江苏省国防动员办公室 · 技术支持：江苏国动信息科技有限公司
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
            建议使用 1920×1080 分辨率浏览本系统
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
