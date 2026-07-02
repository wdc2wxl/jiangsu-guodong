import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Tag,
  Descriptions,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined } from '@ant-design/icons';
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
        title="审核记录详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>]}
        width={650}
        destroyOnClose
      >
        {detailRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="记录ID">{detailRecord.id}</Descriptions.Item>
            <Descriptions.Item label="审核节点">第 {detailRecord.node || 1} 节点</Descriptions.Item>
            <Descriptions.Item label="数据类型">
              {dataTypeLabel(detailRecord.task?.dataType || '')}
            </Descriptions.Item>
            <Descriptions.Item label="数据摘要">
              {detailRecord.task?.dataSummary || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核人">
              {detailRecord.auditor?.realName || detailRecord.auditor?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核时间">
              {detailRecord.createdAt ? dayjs(detailRecord.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核结果">
              {(() => {
                const config = actionMap[detailRecord.action] || { label: detailRecord.action, color: 'default' };
                return <Tag color={config.color}>{config.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="任务状态">
              {(() => {
                const statusMap: Record<string, { label: string; color: string }> = {
                  pending: { label: '待审核', color: 'blue' },
                  approved: { label: '已通过', color: 'green' },
                  returned: { label: '已退回', color: 'orange' },
                  rejected: { label: '已驳回', color: 'red' },
                };
                const cfg = statusMap[detailRecord.task?.status] || { label: detailRecord.task?.status || '-', color: 'default' };
                return <Tag color={cfg.color}>{cfg.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="审核意见" span={2}>
              {detailRecord.opinion || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AuditRecords;
