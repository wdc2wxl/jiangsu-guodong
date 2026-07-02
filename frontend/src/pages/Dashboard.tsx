import { useState, useEffect } from 'react';
import { Row, Col, Spin, Tag, Empty } from 'antd';
import {
  AuditOutlined,
  CarOutlined,
  ScheduleOutlined,
  NotificationOutlined,
  AlertOutlined,
  BookOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  RightOutlined,
  UserOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '@/services/api';

interface OverviewData {
  stats: {
    userCount: number;
    projectCount: number;
    coolingCount: number;
    servicePointCount: number;
    parkingSpaceCount: number;
    museumCount: number;
    reservationCount: number;
    rentalCount: number;
    pendingAuditCount: number;
    announcementCount: number;
    audioCount: number;
    knowledgeCount: number;
    todayReservationCount: number;
    monthReservationCount: number;
    totalSpaces: number;
    bookableSpaces: number;
    rentableSpaces: number;
    dailyActive: number;
    monthlyActive: number;
    totalAccess: number;
  };
  trends: {
    reservation: { date: string; count: number }[];
    rental: { date: string; count: number }[];
    access: { date: string; count: number }[];
  };
  regionDistribution: { region: string; count: number; area: number }[];
  reservationStatus: { reserved: number; used: number; cancelled: number; expired: number };
  rentalStatus: { pending: number; active: number; rejected: number; expired: number };
  recentAnnouncements: { id: number; title: string; type: string; publishTime: string }[];
  recentLogs: { id: number; module: string; action: string; target: string; result: string; operator: string; createdAt: string }[];
  recentReservations: { id: number; reservationNo: string; userName: string; userPhone: string; plateNumber: string; status: string; parkingLocation: string; reserveDate: string }[];
  todoItems: { pendingAudits: number; pendingRentals: number };
}

const reservationStatusMap: Record<string, { label: string; color: string }> = {
  reserved: { label: '待处理', color: '#f59e0b' },
  used: { label: '已通过', color: '#10b981' },
  cancelled: { label: '已撤销', color: '#9ca3af' },
  expired: { label: '已过期', color: '#d1d5db' },
};

/* ===== 统一样式常量 ===== */
const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  border: '1px solid #f0f0f0',
  padding: 20,
  height: '100%',
};
const SECTION_GAP = 16;
const TITLE_FS = 15;
const TITLE_MB = 16;
const titleStyle: React.CSSProperties = { fontSize: TITLE_FS, fontWeight: 600, color: '#1f2329' };
const tagCommon: React.CSSProperties = { borderRadius: 10, fontSize: 11, margin: 0 };

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/dashboard/overview');
      setData(res);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kpiData = [
    { label: '人防工程', value: data?.stats.projectCount || 0, unit: '个', trend: 12, up: true },
    { label: '车位预约', value: data?.stats.reservationCount || 0, unit: '次', trend: 23, up: true },
    { label: '车位租赁', value: data?.stats.rentalCount || 0, unit: '宗', trend: 8, up: true },
    { label: '累计访问', value: data?.stats.totalAccess || 0, unit: '次', trend: 15, up: true },
    { label: '发布公告', value: data?.stats.announcementCount || 0, unit: '条', trend: 5, up: false },
  ];

  const resourceCards = [
    { title: '纳凉点', value: data?.stats.coolingCount || 0, icon: <EnvironmentOutlined />, color: '#06b6d4', path: '/cooling' },
    { title: '便民服务点', value: data?.stats.servicePointCount || 0, icon: <HomeOutlined />, color: '#3b82f6', path: '/services' },
    { title: '人防车位', value: data?.stats.parkingSpaceCount || 0, icon: <CarOutlined />, color: '#8b5cf6', path: '/parking-spaces' },
    { title: '宣教体验馆', value: data?.stats.museumCount || 0, icon: <BookOutlined />, color: '#ec4899', path: '/museums' },
    { title: '警报器', value: data?.stats.audioCount || 0, icon: <AlertOutlined />, color: '#f97316', path: '/alarms' },
    { title: '防护知识', value: data?.stats.knowledgeCount || 0, icon: <BookOutlined />, color: '#22c55e', path: '/alarms' },
    { title: '系统用户', value: data?.stats.userCount || 0, icon: <UserOutlined />, color: '#005FFE', path: '/system/users' },
    { title: '待审核', value: data?.stats.pendingAuditCount || 0, icon: <AuditOutlined />, color: '#ef4444', path: '/audit/tasks' },
  ];

  const shortcuts = [
    { title: '人防工程', icon: <HomeOutlined />, color: '#005FFE', path: '/projects' },
    { title: '纳凉点', icon: <EnvironmentOutlined />, color: '#06b6d4', path: '/cooling' },
    { title: '车位预约', icon: <ScheduleOutlined />, color: '#8b5cf6', path: '/booking/reservations' },
    { title: '车位租赁', icon: <CarOutlined />, color: '#f59e0b', path: '/booking/rentals' },
    { title: '审核任务', icon: <AuditOutlined />, color: '#ef4444', path: '/audit/tasks' },
    { title: '警报管理', icon: <AlertOutlined />, color: '#f97316', path: '/alarms' },
    { title: '用户管理', icon: <UserOutlined />, color: '#10b981', path: '/system/users' },
    { title: '公告管理', icon: <NotificationOutlined />, color: '#7c3aed', path: '/system/announcements' },
  ];

  const maxAccess = Math.max(...(data?.trends.access.map((t) => t.count) || [1]), 1);
  const maxReservation = Math.max(...(data?.trends.reservation.map((t) => t.count) || [1]), 1);

  const BarChart = ({ chartData, maxVal, color }: { chartData: { date: string; count: number }[]; maxVal: number; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, padding: '0 4px' }}>
      {chartData.map((item, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
          <div style={{ fontSize: 11, color, fontWeight: 600 }}>{item.count}</div>
          <div style={{
            width: '40%', minWidth: 12,
            height: Math.max((item.count / maxVal) * 80, 3),
            background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
            borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease',
          }} />
          <div style={{ fontSize: 10, color: '#9ca3af' }}>{item.date.slice(5)}</div>
        </div>
      ))}
    </div>
  );

  return (
    <Spin spinning={loading}>
      {/* ===== Hero Banner ===== */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: SECTION_GAP, minHeight: 120 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/dashboard-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center right' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,30,70,0.92) 0%, rgba(20,50,120,0.8) 40%, rgba(30,80,180,0.4) 70%, rgba(50,120,220,0.2) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: 1 }}>
              江苏国动便民服务管理平台
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              {dayjs().format('YYYY年MM月DD日')} · 全省人防工程便民服务一体化管理
            </div>
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            {[
              { label: '今日活跃', value: data?.stats.dailyActive || 0 },
              { label: '今日预约', value: data?.stats.todayReservationCount || 0 },
              { label: '月活用户', value: data?.stats.monthlyActive || 0 },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{item.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 三列业务概览 ===== */}
      <Row gutter={[SECTION_GAP, SECTION_GAP]}>
        {/* 待办事项 */}
        <Col xs={24} md={8}>
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: TITLE_MB }}>
              <span style={{ ...titleStyle, cursor: 'pointer' }} onClick={() => navigate('/audit/tasks')}>
                待办事项 <RightOutlined style={{ fontSize: 11, color: '#9ca3af' }} />
              </span>
              <Tag color="orange" style={tagCommon}>{(data?.todoItems.pendingAudits || 0) + (data?.todoItems.pendingRentals || 0)} 待处理</Tag>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: TITLE_MB }}>
              {[
                { label: '待审核', value: data?.todoItems.pendingAudits || 0, bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#005FFE' },
                { label: '待处理租赁', value: data?.todoItems.pendingRentals || 0, bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, background: item.bg, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '待审核任务', count: data?.todoItems.pendingAudits || 0, icon: <AuditOutlined />, color: '#ef4444', path: '/audit/tasks' },
                { label: '待处理租赁', count: data?.todoItems.pendingRentals || 0, icon: <CarOutlined />, color: '#f59e0b', path: '/booking/rentals' },
                { label: '车位预约', count: data?.stats.reservationCount || 0, icon: <ScheduleOutlined />, color: '#005FFE', path: '/booking/reservations' },
                { label: '发布公告', count: data?.stats.announcementCount || 0, icon: <NotificationOutlined />, color: '#10b981', path: '/system/announcements' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #f3f4f6' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = item.color + '33'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f3f4f6'; }}
                  onClick={() => navigate(item.path)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: item.color, fontSize: 15 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: '#374151' }}>{item.label}</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.count}</span>
                    <RightOutlined style={{ fontSize: 10, color: '#d1d5db' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* 资源数据 */}
        <Col xs={24} md={8}>
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: TITLE_MB }}>
              <span style={{ ...titleStyle, cursor: 'pointer' }} onClick={() => navigate('/projects')}>
                资源数据 <RightOutlined style={{ fontSize: 11, color: '#9ca3af' }} />
              </span>
              <Tag color="blue" style={tagCommon}>{resourceCards.length} 类</Tag>
            </div>
            <Row gutter={[8, 8]}>
              {resourceCards.map((card, index) => (
                <Col span={12} key={index}>
                  <div
                    style={{ background: `${card.color}08`, border: `1px solid ${card.color}15`, borderRadius: 8, padding: 10, cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = card.color; e.currentTarget.style.boxShadow = `0 2px 8px ${card.color}1a`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${card.color}15`; e.currentTarget.style.boxShadow = 'none'; }}
                    onClick={() => navigate(card.path)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: card.color, flexShrink: 0 }}>
                        {card.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{card.title}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>{card.value}</div>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Col>

        {/* 最新预约 */}
        <Col xs={24} md={8}>
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: TITLE_MB }}>
              <span style={{ ...titleStyle, cursor: 'pointer' }} onClick={() => navigate('/booking/reservations')}>
                最新预约 <RightOutlined style={{ fontSize: 11, color: '#9ca3af' }} />
              </span>
              <Tag color="green" style={tagCommon}>{data?.stats.reservationCount || 0} 条</Tag>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data?.recentReservations?.slice(0, 6).map((r, i) => {
                const cfg = reservationStatusMap[r.status] || { label: r.status, color: '#9ca3af' };
                return (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}
                    onClick={() => navigate('/booking/reservations')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.userName} · {r.plateNumber}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        {r.parkingLocation} · {r.reserveDate ? dayjs(r.reserveDate).format('MM-DD HH:mm') : '-'}
                      </div>
                    </div>
                    <Tag color={cfg.color} style={{ fontSize: 11, margin: 0, borderRadius: 4, flexShrink: 0 }}>{cfg.label}</Tag>
                  </div>
                );
              }) || <Empty description="暂无数据" />}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== 快捷入口 ===== */}
      <div style={{ ...CARD, marginTop: SECTION_GAP }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: TITLE_MB }}>
          <span style={titleStyle}>
            <AppstoreOutlined style={{ color: '#005FFE', marginRight: 6 }} />快捷入口
          </span>
        </div>
        <Row gutter={[12, 12]}>
          {shortcuts.map((item, index) => (
            <Col xs={6} sm={4} md={3} key={index}>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '10px 8px', borderRadius: 8, transition: 'all 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${item.color}08`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => navigate(item.path)}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: item.color }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 12, color: '#4b5563' }}>{item.title}</span>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ===== KPI指标栏 ===== */}
      <div style={{ ...CARD, marginTop: SECTION_GAP }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {kpiData.map((kpi, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < kpiData.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1f2329' }}>
                {kpi.value.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 2 }}>{kpi.unit}</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, color: kpi.up ? '#10b981' : '#ef4444' }}>
                {kpi.up ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
                {kpi.trend}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 双图表区 ===== */}
      <Row gutter={[SECTION_GAP, SECTION_GAP]} style={{ marginTop: SECTION_GAP }}>
        <Col xs={24} md={12}>
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: TITLE_MB }}>
              <span style={titleStyle}>
                <RiseOutlined style={{ color: '#005FFE', marginRight: 6 }} />近7天访问趋势
              </span>
              <Tag color="blue" style={tagCommon}>访问量</Tag>
            </div>
            {data?.trends.access?.length ? (
              <BarChart chartData={data.trends.access} maxVal={maxAccess} color="#005FFE" />
            ) : <Empty description="暂无数据" />}
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: TITLE_MB }}>
              <span style={titleStyle}>
                <ScheduleOutlined style={{ color: '#4f46e5', marginRight: 6 }} />近7天预约趋势
              </span>
              <Tag color="purple" style={tagCommon}>预约数</Tag>
            </div>
            {data?.trends.reservation?.length ? (
              <BarChart chartData={data.trends.reservation} maxVal={maxReservation} color="#4f46e5" />
            ) : <Empty description="暂无数据" />}
          </div>
        </Col>
      </Row>
    </Spin>
  );
};

export default Dashboard;
