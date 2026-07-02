import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Card,
  Row,
  Col,
  Modal,
  Form,
  Select,
  DatePicker,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';

interface ReportTemplate {
  id: number;
  name: string;
  type: string;
  description: string;
}

interface ReportRecord {
  id: number;
  name: string;
  type: string;
  period: string;
  status: string;
  createdAt: string;
  fileUrl?: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  generating: { label: '生成中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  failed: { label: '生成失败', color: 'red' },
};

const ReportList = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const reportTypeOptions = [
    { label: '用户统计报表', value: 'user' },
    { label: '资源统计报表', value: 'resource' },
    { label: '预约统计报表', value: 'reservation' },
    { label: '租赁统计报表', value: 'rental' },
    { label: '利用率统计报表', value: 'utilization' },
    { label: '综合报表', value: 'comprehensive' },
  ];

  const fetchTemplates = async () => {
    try {
      const res: any = await api.get('/stats/report/templates');
      setTemplates(res?.list || res || []);
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
    if (record.fileUrl) {
      window.open(record.fileUrl, '_blank');
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
    {
      title: '报表类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (val: string) => {
        const opt = reportTypeOptions.find((o) => o.value === val);
        return opt ? opt.label : val;
      },
    },
    { title: '统计周期', dataIndex: 'period', key: 'period', ellipsis: true, width: 220 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
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
          disabled={record.status !== 'completed'}
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
        {templates.map((tpl) => (
          <Col xs={24} sm={12} md={8} key={tpl.id}>
            <Card size="small" hoverable>
              <Card.Meta
                title={tpl.name}
                description={tpl.description}
              />
            </Card>
          </Col>
        ))}
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
    </PageContainer>
  );
};

export default ReportList;
