import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  message,
  Card,
  Row,
  Col,
  Modal,
  Form,
  Select,
  DatePicker,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined,
  FileTextOutlined,
  BankOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  RiseOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
  ApartmentOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  FieldNumberOutlined,
  PicCenterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';

interface ReportTemplate {
  id: number;
  name: string;
  type: string;
  metrics: string;
  format: string;
  status: string;
}

interface ReportRecord {
  id: number;
  name: string;
  period: string;
  format: string;
  filePath?: string;
  createdAt: string;
}

const ReportList = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [form] = Form.useForm();

  const reportTypeOptions = [
    { label: '人防工程月度统计报表', value: 'project' },
    { label: '纳凉点运营统计报表', value: 'cooling' },
    { label: '车位预约使用统计报表', value: 'booking' },
    { label: '车位租赁收入统计报表', value: 'rental' },
    { label: '宣教体验馆参观统计', value: 'museum' },
    { label: '用户活跃度分析报表', value: 'user' },
    { label: '数据质量审核月报', value: 'audit' },
    { label: '便民服务点运营概览', value: 'service' },
  ];

  const formatMap: Record<string, string> = {
    pdf: 'PDF',
    excel: 'Excel',
  };

  // 各报表类型的模拟统计数据（带图标配置）
  const reportDemoData: Record<string, { icon: any; color: string; items: { label: string; value: string; icon: any; suffix?: string }[] }> = {
    project: {
      icon: <BankOutlined />, color: '#1890ff',
      items: [
        { label: '工程总数', value: '128', icon: <FieldNumberOutlined /> },
        { label: '涉及城市', value: '13', icon: <EnvironmentOutlined />, suffix: '个' },
        { label: '总防护面积', value: '86.5', icon: <PicCenterOutlined />, suffix: '万m²' },
        { label: '可容纳总人数', value: '35,200', icon: <TeamOutlined />, suffix: '人' },
      ],
    },
    cooling: {
      icon: <ThunderboltOutlined />, color: '#52c41a',
      items: [
        { label: '纳凉点总数', value: '14', icon: <FieldNumberOutlined /> },
        { label: '已开放', value: '12', icon: <CheckCircleOutlined /> },
        { label: '已关闭', value: '2', icon: <CloseCircleOutlined /> },
        { label: '总容纳人数', value: '2,800', icon: <TeamOutlined />, suffix: '人' },
      ],
    },
    booking: {
      icon: <CalendarOutlined />, color: '#722ed1',
      items: [
        { label: '预约总数', value: '84', icon: <FieldNumberOutlined /> },
        { label: '到场率', value: '72.5', icon: <PercentageOutlined />, suffix: '%' },
        { label: '取消率', value: '15.2', icon: <CloseCircleOutlined />, suffix: '%' },
        { label: '高峰时段', value: '17:00-19:00', icon: <ClockCircleOutlined /> },
      ],
    },
    rental: {
      icon: <ShoppingCartOutlined />, color: '#eb2f96',
      items: [
        { label: '租赁总数', value: '44', icon: <FieldNumberOutlined /> },
        { label: '在租中', value: '28', icon: <CheckCircleOutlined /> },
        { label: '月均收入', value: '18,600', icon: <RiseOutlined />, suffix: '元' },
        { label: '平均租期', value: '8.5', icon: <ClockCircleOutlined />, suffix: '个月' },
      ],
    },
    museum: {
      icon: <ApartmentOutlined />, color: '#13c2c2',
      items: [
        { label: '体验馆总数', value: '8', icon: <FieldNumberOutlined /> },
        { label: '已开放', value: '6', icon: <CheckCircleOutlined /> },
        { label: '总容纳人数', value: '520', icon: <TeamOutlined />, suffix: '人' },
        { label: '满意度评分', value: '4.8', icon: <StarOutlined />, suffix: '/5.0' },
      ],
    },
    user: {
      icon: <UserOutlined />, color: '#fa8c16',
      items: [
        { label: '日活跃用户', value: '856', icon: <TeamOutlined />, suffix: '人' },
        { label: '月活跃用户', value: '12,340', icon: <UserOutlined />, suffix: '人' },
        { label: '微信来源', value: '62.3', icon: <CheckCircleOutlined />, suffix: '%' },
        { label: '支付宝来源', value: '28.7', icon: <CheckCircleOutlined />, suffix: '%' },
      ],
    },
    audit: {
      icon: <AuditOutlined />, color: '#fa541c',
      items: [
        { label: '审核总数', value: '156', icon: <FieldNumberOutlined /> },
        { label: '通过率', value: '85.3', icon: <PercentageOutlined />, suffix: '%' },
        { label: '平均耗时', value: '2.5', icon: <ClockCircleOutlined />, suffix: '天' },
        { label: '待审核', value: '12', icon: <CloseCircleOutlined /> },
      ],
    },
    service: {
      icon: <EnvironmentOutlined />, color: '#2f54eb',
      items: [
        { label: '服务点总数', value: '15', icon: <FieldNumberOutlined /> },
        { label: '覆盖城市', value: '12', icon: <EnvironmentOutlined />, suffix: '个' },
        { label: '咨询类', value: '9', icon: <CheckCircleOutlined /> },
        { label: '物资发放类', value: '4', icon: <CheckCircleOutlined /> },
      ],
    },
  };

  const handleCardClick = (tpl: ReportTemplate) => {
    setSelectedTemplate(tpl);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedTemplate(null);
  };

  const fetchTemplates = async () => {
    try {
      const res: any = await api.get('/stats/report/templates', { params: { page: 1, pageSize: 50 } });
      setTemplates(res?.list || []);
    } catch (error) {
      console.error('获取报表模板失败:', error);
    }
  };

  const fetchRecords = async (pageNum = page, pageSizeNum = pageSize) => {
    setLoading(true);
    try {
      const res: any = await api.get('/stats/report/records', {
        params: { page: pageNum, pageSize: pageSizeNum },
      });
      setRecords(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取报表记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchRecords(1, 10);
  }, []);

  const handleTableChange = (pagination: any) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchRecords(pagination.current, pagination.pageSize);
  };

  const handleOpenGenerate = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setGenerating(true);
      const submitData = {
        ...values,
        period: values.period
          ? `${dayjs(values.period[0]).format('YYYY-MM-DD')} ~ ${dayjs(values.period[1]).format('YYYY-MM-DD')}`
          : undefined,
      };
      await api.post('/stats/report/generate', submitData);
      message.success('报表生成请求已提交');
      setModalOpen(false);
      fetchRecords(page, pageSize);
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('生成报表失败:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (record: ReportRecord) => {
    if (record.filePath) {
      window.open(record.filePath, '_blank');
    } else {
      try {
        const res: any = await api.get(`/stats/report/export/${record.id}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${record.name}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        message.error('下载失败');
      }
    }
  };

  const recordColumns: ColumnsType<ReportRecord> = [
    { title: '报表名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 200 },
    { title: '统计周期', dataIndex: 'period', key: 'period', ellipsis: true, width: 220 },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 80,
      render: (val: string) => <Tag color="blue">{formatMap[val] || val || '-'}</Tag>,
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          disabled={!record.filePath}
          onClick={() => handleDownload(record)}
        >
          导出
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="统计报表"
      extra={
        <Button type="primary" icon={<FileTextOutlined />} onClick={handleOpenGenerate}>
          生成报表
        </Button>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {templates.map((tpl) => {
          let metricsText = '';
          try {
            const metrics = JSON.parse(tpl.metrics);
            metricsText = Array.isArray(metrics) ? metrics.join('、') : tpl.metrics;
          } catch { metricsText = tpl.metrics; }
          return (
            <Col xs={24} sm={12} md={8} key={tpl.id}>
              <Card size="small" hoverable onClick={() => handleCardClick(tpl)} style={{ cursor: 'pointer' }}>
                <Card.Meta
                  title={tpl.name}
                  description={
                    <span>
                      <span style={{ color: '#666' }}>格式: {formatMap[tpl.format] || tpl.format}</span>
                      {metricsText && <span style={{ color: '#999', marginLeft: 8 }}>| {metricsText}</span>}
                    </span>
                  }
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={recordColumns}
          dataSource={records}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={handleTableChange}
        />
      </div>

      <Modal
        title="生成报表"
        open={modalOpen}
        onOk={handleGenerate}
        onCancel={() => setModalOpen(false)}
        width={500}
        confirmLoading={generating}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="报表名称" rules={[{ required: true, message: '请输入报表名称' }]}>
            <Select
              placeholder="请选择报表模板"
              options={templates.map((t) => ({ label: t.name, value: t.name }))}
            />
          </Form.Item>
          <Form.Item name="type" label="报表类型" rules={[{ required: true, message: '请选择报表类型' }]}>
            <Select placeholder="请选择" options={reportTypeOptions} />
          </Form.Item>
          <Form.Item name="period" label="统计周期" rules={[{ required: true, message: '请选择统计周期' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 报表详情弹窗 - 展示图标数据 */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={handleCloseDetailModal}
        width={560}
        footer={null}
        destroyOnClose
      >
        {selectedTemplate && (() => {
          const demo = reportDemoData[selectedTemplate.type] || reportDemoData['project'];
          return (
            <div style={{ padding: '8px 0' }}>
              {/* 头部 */}
              <div style={{
                textAlign: 'center',
                padding: '24px 0 20px',
                background: `linear-gradient(135deg, ${demo.color}15, ${demo.color}08)`,
                borderRadius: 8,
                marginBottom: 24,
              }}>
                <div style={{ fontSize: 48, color: demo.color, marginBottom: 12 }}>
                  {demo.icon}
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e' }}>
                  {selectedTemplate.name}
                </div>
                <div style={{ fontSize: 13, color: '#999', marginTop: 6 }}>
                  格式: {formatMap[selectedTemplate.format] || selectedTemplate.format}
                  {' | '}状态: {selectedTemplate.status === 'active' ? '启用' : '停用'}
                </div>
              </div>

              {/* 指标数据网格 */}
              <Divider style={{ margin: '0 0 20px', fontSize: 14, color: '#666' }}>核心指标</Divider>
              <Row gutter={[16, 16]}>
                {demo.items.map((item, idx) => (
                  <Col span={12} key={idx}>
                    <div style={{
                      background: '#f8f9fc',
                      borderRadius: 8,
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      border: '1px solid #f0f0f0',
                    }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: `${demo.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        color: demo.color,
                        flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e' }}>
                          {item.value}
                          {item.suffix && <span style={{ fontSize: 13, fontWeight: 400, color: '#666', marginLeft: 4 }}>{item.suffix}</span>}
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* 底部操作 */}
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    handleCloseDetailModal();
                    handleOpenGenerate();
                  }}
                  style={{ height: 40, paddingInline: 32, borderRadius: 6 }}
                >
                  生成此报表
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </PageContainer>
  );
};

export default ReportList;
