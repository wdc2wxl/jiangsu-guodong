import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Tag,
  message,
  Row,
  Col,
  Avatar,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';
import SearchForm from '@/components/SearchForm';
import Toolbar from '@/components/Toolbar';
import { Form, Input, Select } from 'antd';

interface AuditRecord {
  id: number;
  taskId: number;
  auditorId: number;
  auditor?: { id: number; username: string; realName: string };
  action: string;
  opinion?: string;
  node: number;
  createdAt: string;
  task?: {
    id: number;
    dataType: string;
    dataSummary: string;
    status: string;
  };
}

const actionMap: Record<string, { label: string; color: string }> = {
  pass: { label: '通过', color: 'green' },
  return: { label: '退回', color: 'orange' },
  reject: { label: '驳回', color: 'red' },
};

const dataTypeOptions = [
  { label: '人防工程', value: 'project' },
  { label: '纳凉点', value: 'cooling' },
  { label: '便民服务点', value: 'service' },
  { label: '人防车位', value: 'parking' },
  { label: '宣教体验馆', value: 'museum' },
];

const dataTypeLabel = (val: string) => {
  const opt = dataTypeOptions.find((o) => o.value === val);
  return opt ? opt.label : val;
};

const AuditRecords = () => {
  const [data, setData] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/audit/records', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取审核记录列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10, {});
  }, []);

  const handleSearch = (values: any) => {
    setSearchParams(values);
    setPage(1);
    fetchData(1, pageSize, values);
  };

  const handleReset = () => {
    setSearchParams({});
    setPage(1);
    fetchData(1, 10, {});
  };

  const handleTableChange = (pagination: any) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchData(pagination.current, pagination.pageSize, searchParams);
  };

  const handleView = async (record: AuditRecord) => {
    try {
      const detail: any = await api.get(`/audit/records/${record.id}`);
      setDetailRecord(detail);
    } catch (error) {
      setDetailRecord(record);
    }
    setDetailModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const res: any = await api.get('/audit/records', { params: { ...searchParams, pageSize: 9999 } });
      const list = res?.list || [];
      if (list.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }
      const headers = ['记录ID', '数据类型', '数据摘要', '审核人', '审核时间', '审核结果', '审核意见'];
      const csvContent = [
        headers.join(','),
        ...list.map((item: any) =>
          [
            item.id,
            dataTypeLabel(item.task?.dataType || ''),
            item.task?.dataSummary || '',
            item.auditor?.realName || item.auditor?.username || '-',
            item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-',
            actionMap[item.action]?.label || item.action,
            item.opinion || '',
          ].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `审核记录_${new Date().toLocaleDateString()}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<AuditRecord> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: '数据类型',
      key: 'dataType',
      width: 120,
      render: (_, record) => dataTypeLabel(record.task?.dataType || ''),
    },
    {
      title: '数据摘要',
      key: 'summary',
      ellipsis: true,
      render: (_, record) => record.task?.dataSummary || '-',
    },
    {
      title: '审核人',
      key: 'auditor',
      width: 120,
      render: (_, record) => record.auditor?.realName || record.auditor?.username || '-',
    },
    {
      title: '审核时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '审核结果',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const config = actionMap[action] || { label: action, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action_btn',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <PageContainer title="审核记录">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <Form.Item name="dataType" label="数据类型">
          <Select placeholder="请选择" allowClear options={dataTypeOptions} />
        </Form.Item>
        <Form.Item name="action" label="审核结果">
          <Select
            placeholder="请选择"
            allowClear
            options={Object.entries(actionMap).map(([key, val]) => ({ label: val.label, value: key }))}
          />
        </Form.Item>
      </SearchForm>

      <Toolbar onExport={handleExport} />

      <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 900 }}
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
        title={
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            审核记录详情
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={580}
        destroyOnClose
        maskStyle={{ background: 'rgba(0,0,0,0.5)' }}
        centered
      >
        {detailRecord && (
          <div style={{ padding: '8px 0' }}>
            {/* ========== 审核结果概览 ========== */}
            <div
              style={{
                background: '#f6f8fc',
                borderRadius: 10,
                padding: '20px 24px',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1a1a2e',
                  marginBottom: 16,
                  paddingLeft: 10,
                  borderLeft: '3px solid #1890ff',
                }}
              >
                审核结果
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <Avatar
                  size={48}
                  icon={<UserOutlined />}
                  style={{
                    background:
                      actionMap[detailRecord.action]?.color === 'green'
                        ? '#f6ffed'
                        : actionMap[detailRecord.action]?.color === 'red'
                          ? '#fff2f0'
                          : '#fff7e6',
                    color:
                      actionMap[detailRecord.action]?.color === 'green'
                        ? '#52c41a'
                        : actionMap[detailRecord.action]?.color === 'red'
                          ? '#ff4d4f'
                          : '#fa8c16',
                    fontSize: 22,
                  }}
                />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                    {detailRecord.auditor?.realName || detailRecord.auditor?.username || '-'}
                  </div>
                  <div style={{ fontSize: 13, color: '#999' }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {detailRecord.createdAt
                      ? dayjs(detailRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')
                      : '-'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {(() => {
                    const config = actionMap[detailRecord.action] || {
                      label: detailRecord.action,
                      color: 'default',
                    };
                    const iconMap: Record<string, any> = {
                      green: <CheckCircleOutlined />,
                      orange: <RollbackOutlined />,
                      red: <CloseCircleOutlined />,
                    };
                    return (
                      <Tag
                        color={config.color}
                        style={{
                          fontSize: 14,
                          padding: '4px 14px',
                          borderRadius: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {iconMap[config.color]}
                        {config.label}
                      </Tag>
                    );
                  })()}
                </div>
              </div>

              {detailRecord.opinion && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    padding: '14px 18px',
                    fontSize: 14,
                    color: '#555',
                    fontStyle: 'italic',
                    border: '1px solid #e8ecf4',
                  }}
                >
                  "{detailRecord.opinion}"
                </div>
              )}
            </div>

            {/* ========== 关联任务信息 ========== */}
            <div
              style={{
                background: '#f6f8fc',
                borderRadius: 10,
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1a1a2e',
                  marginBottom: 16,
                  paddingLeft: 10,
                  borderLeft: '3px solid #1890ff',
                }}
              >
                关联任务信息
              </div>
              <Row gutter={[24, 14]}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>记录ID</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                    {detailRecord.id}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>审核节点</div>
                  <div style={{ fontSize: 14, color: '#333' }}>
                    第 {detailRecord.node || 1} 节点
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>数据类型</div>
                  <div style={{ fontSize: 14, color: '#333' }}>
                    {dataTypeLabel(detailRecord.task?.dataType || '')}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>任务状态</div>
                  <div style={{ fontSize: 14, color: '#333' }}>
                    {(() => {
                      const statusMap: Record<string, { label: string; color: string }> = {
                        pending: { label: '待审核', color: 'blue' },
                        approved: { label: '已通过', color: 'green' },
                        returned: { label: '已退回', color: 'orange' },
                        rejected: { label: '已驳回', color: 'red' },
                      };
                      const cfg = statusMap[detailRecord.task?.status] || {
                        label: detailRecord.task?.status || '-',
                        color: 'default',
                      };
                      return <Tag color={cfg.color}>{cfg.label}</Tag>;
                    })()}
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>数据摘要</div>
                  <div style={{ fontSize: 14, color: '#333' }}>
                    {detailRecord.task?.dataSummary || '-'}
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AuditRecords;
