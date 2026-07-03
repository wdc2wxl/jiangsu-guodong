import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Breadcrumb,
  theme,
  Modal,
  Form,
  Input,
  message,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  AuditOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  DownOutlined,
} from '@ant-design/icons';
import useAuthStore from '@/stores/auth';
import api from '@/services/api';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/data',
    icon: <DatabaseOutlined />,
    label: '数据管理',
    children: [
      { key: '/projects', label: '人防工程' },
      { key: '/cooling', label: '纳凉点' },
      { key: '/services', label: '便民服务点' },
      { key: '/parking', label: '人防车位' },
      { key: '/museums', label: '宣教体验馆' },
      { key: '/alarms', label: '警报音频' },
    ],
  },
  {
    key: '/audit',
    icon: <AuditOutlined />,
    label: '数据审核',
    children: [
      { key: '/audit/process', label: '审核流程' },
      { key: '/audit/tasks', label: '待审核数据' },
      { key: '/audit/records', label: '审核记录' },
    ],
  },
  {
    key: '/booking',
    icon: <ScheduleOutlined />,
    label: '预约租赁',
    children: [
      { key: '/booking/reservations', label: '车位预约' },
      { key: '/booking/rentals', label: '车位租赁' },
      { key: '/booking/rules', label: '预约规则' },
    ],
  },
  {
    key: '/stats',
    icon: <BarChartOutlined />,
    label: '统计分析',
    children: [
      { key: '/stats/user-access', label: '用户访问' },
      { key: '/stats/resource-query', label: '资源查询' },
      { key: '/stats/reservation', label: '预约统计' },
      { key: '/stats/rental', label: '租赁统计' },
      { key: '/stats/utilization', label: '资源利用率' },
      { key: '/stats/reports', label: '统计报表' },
    ],
  },
  {
    key: '/system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/system/users', label: '用户管理' },
      { key: '/system/params', label: '系统参数' },
      { key: '/system/logs', label: '操作日志' },
      { key: '/system/announcements', label: '公告管理' },
    ],
  },
];

// 路由路径到菜单标题的映射
const routeTitleMap: Record<string, string> = {
  dashboard: '仪表盘',
  projects: '人防工程',
  cooling: '纳凉点',
  services: '便民服务点',
  parking: '人防车位',
  museums: '宣教体验馆',
  alarms: '警报音频',
  audit: '数据审核',
  'audit/process': '审核流程',
  'audit/tasks': '待审核数据',
  'audit/records': '审核记录',
  booking: '预约租赁',
  'booking/reservations': '车位预约',
  'booking/rentals': '车位租赁',
  'booking/rules': '预约规则',
  stats: '统计分析',
  'stats/user-access': '用户访问',
  'stats/resource-query': '资源查询',
  'stats/reservation': '预约统计',
  'stats/rental': '租赁统计',
  'stats/utilization': '资源利用率',
  'stats/reports': '统计报表',
  system: '系统管理',
  'system/users': '用户管理',
  'system/params': '系统参数',
  'system/logs': '操作日志',
  'system/announcements': '公告管理',
};

// 一级菜单标题映射
const parentTitleMap: Record<string, string> = {
  dashboard: '仪表盘',
  projects: '数据管理',
  cooling: '数据管理',
  services: '数据管理',
  parking: '数据管理',
  museums: '数据管理',
  alarms: '数据管理',
  audit: '数据审核',
  booking: '预约租赁',
  stats: '统计分析',
  system: '系统管理',
};

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userInfo, logout } = useAuthStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 如果没有token,跳转到登录页
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const currentPath = location.pathname;
  const parentKey = pathSnippets[0] || 'dashboard';

  // 生成面包屑项
  const breadcrumbItems = [
    {
      title: parentTitleMap[parentKey] || '首页',
    },
  ];
  if (pathSnippets.length > 1) {
    const subPath = pathSnippets.slice(1).join('/');
    const fullSubPath = `${parentKey}/${subPath}`;
    breadcrumbItems.push({
      title: routeTitleMap[fullSubPath] || routeTitleMap[parentKey] || '',
    });
  } else if (parentKey !== 'dashboard') {
    breadcrumbItems.push({
      title: routeTitleMap[parentKey] || '',
    });
  }

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    return [currentPath];
  };

  // 获取展开的子菜单
  const getOpenKeys = () => {
    const parent = '/' + parentKey;
    if (parentKey !== 'dashboard') {
      return [parent];
    }
    return [];
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setChangingPassword(true);
      await api.put('/auth/password', values);
      message.success('密码修改成功');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message || '密码修改失败');
    } finally {
      setChangingPassword(false);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'changePassword',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalOpen(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        <div className="logo">
          {collapsed ? '国动' : '江苏国动便民后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 240,
          height: '100vh',
          overflowY: 'auto',
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <Space>
            <span
              style={{ cursor: 'pointer', fontSize: 18 }}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Breadcrumb items={breadcrumbItems} style={{ fontSize: 14 }} />
          </Space>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={userInfo?.avatar}
              />
              <span>{userInfo?.realName || userInfo?.username || '用户'}</span>
              <DownOutlined style={{ fontSize: 12 }} />
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 0,
            background: colorBgContainer,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        confirmLoading={changingPassword}
        destroyOnHidden
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminLayout;
