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
import { Form, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';
import SearchForm from '@/components/SearchForm';
import Toolbar from '@/components/Toolbar';

const { RangePicker } = DatePicker;

interface Log {
  id: number;
  username: string;
  module: string;
  operation: string;
  target: string;
  operationTime: string;
  result: string;
  ip: string;
  detail?: string;
}

const resultMap: Record<string, { label: string; color: string }> = {
  success: { label: '成功', color: 'green' },
  fail: { label: '失败', color: 'red' },
};

const moduleOptions = [
  { label: '数据管理', value: 'data' },
  { label: '数据审核', value: 'audit' },
  { label: '预约租赁', value: 'booking' },
  { label: '统计分析', value: 'stats' },
  { label: '系统管理', value: 'system' },
];

const LogList = () => {
  const [data, setData] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Log | null>(null);
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/system/logs', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取操作日志列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10, {});
  }, []);

  const handleSearch = (values: any) => {
    const params = { ...values };
    if (values.timeRange) {
      params.startTime = values.timeRange[0]?.format('YYYY-MM-DD');
      params.endTime = values.timeRange[1]?.format('YYYY-MM-DD');
      delete params.timeRange;
    }
    setSearchParams(params);
    setPage(1);
    fetchData(1, pageSize, params);
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

  const handleView = async (record: Log) => {
    try {
      const detail: any = await api.get(`/system/logs/${record.id}`);
      setDetailRecord({ ...record, detail: detail?.detail || '' });
    } catch (error) {
      setDetailRecord(record);
    }
    setDetailModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const res: any = await api.get('/system/logs/export', { params: searchParams });
      const list = res || [];
      if (list.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }
      const headers = ['用户', '模块', '操作', '操作对象', '操作时间', '结果', 'IP地址'];
      const csvContent = [
        headers.join(','),
        ...list.map((item: any) =>
          [item.username, item.module, item.operation, item.target, item.operationTime, item.result, item.ip].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `操作日志_${new Date().toLocaleDateString()}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<Log> = [
    { title: '用户', dataIndex: 'username', key: 'username', width: 120 },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (val: string) => {
        const opt = moduleOptions.find((o) => o.value === val);
        return opt ? opt.label : val;
      },
    },
    { title: '操作', dataIndex: 'operation', key: 'operation', ellipsis: true, width: 160 },
    { title: '操作对象', dataIndex: 'target', key: 'target', ellipsis: true, width: 200 },
    {
      title: '操作时间',
      dataIndex: 'operationTime',
      key: 'operationTime',
      width: 170,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 90,
      render: (result: string) => {
        const config = resultMap[result] || { label: result, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
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
    <PageContainer title="操作日志">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading} colSpan={6}>
        <Form.Item name="username" label="用户">
          <Input placeholder="请输入用户名" allowClear />
        </Form.Item>
        <Form.Item name="module" label="模块">
          <Select placeholder="请选择" allowClear options={moduleOptions} />
        </Form.Item>
        <Form.Item name="result" label="结果">
          <Select
            placeholder="请选择"
            allowClear
            options={Object.entries(resultMap).map(([key, val]) => ({ label: val.label, value: key }))}
          />
        </Form.Item>
        <Form.Item name="timeRange" label="时间范围">
          <RangePicker style={{ width: '100%' }} />
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
        title="日志详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>]}
        width={600}
        destroyOnClose
      >
        {detailRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="用户">{detailRecord.username}</Descriptions.Item>
            <Descriptions.Item label="模块">
              {(() => {
                const opt = moduleOptions.find((o) => o.value === detailRecord.module);
                return opt ? opt.label : detailRecord.module;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="操作" span={2}>{detailRecord.operation}</Descriptions.Item>
            <Descriptions.Item label="操作对象" span={2}>{detailRecord.target}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{detailRecord.ip}</Descriptions.Item>
            <Descriptions.Item label="结果">
              {(() => {
                const config = resultMap[detailRecord.result] || { label: detailRecord.result, color: 'default' };
                return <Tag color={config.color}>{config.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>
              {detailRecord.operationTime
                ? dayjs(detailRecord.operationTime).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="详情" span={2}>
              {detailRecord.detail || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};

export default LogList;
