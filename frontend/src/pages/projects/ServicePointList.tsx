import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';
import SearchForm from '@/components/SearchForm';
import Toolbar from '@/components/Toolbar';

interface ServicePoint {
  id: number;
  name: string;
  address: string;
  serviceType: string;
  projectId?: number;
  projectName?: string;
  businessHours: string;
  status: string;
  remark?: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  published: { label: '已发布', color: 'green' },
  draft: { label: '草稿', color: 'default' },
  pending: { label: '待审核', color: 'blue' },
  offline: { label: '已下架', color: 'red' },
  deleted: { label: '已删除', color: 'default' },
};

const serviceTypeOptions = [
  { label: '便民服务', value: '便民服务' },
  { label: '应急避难', value: '应急避难' },
  { label: '物资储备', value: '物资储备' },
  { label: '医疗救护', value: '医疗救护' },
  { label: '其他', value: '其他' },
];

const ServicePointList = () => {
  const [data, setData] = useState<ServicePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServicePoint | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/service-points', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取便民服务点列表失败:', error);
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

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: ServicePoint) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/service-points/${id}`);
      message.success('删除成功');
      fetchData(page, pageSize, searchParams);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleTogglePublish = async (record: ServicePoint) => {
    const newStatus = record.status === 'published' ? 'offline' : 'published';
    try {
      if (newStatus === 'offline') {
        await api.put(`/service-points/${record.id}/offline`);
      } else {
        await api.put(`/service-points/${record.id}/publish`);
      }
      message.success(newStatus === 'published' ? '发布成功' : '下架成功');
      fetchData(page, pageSize, searchParams);
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingRecord) {
        await api.put(`/service-points/${editingRecord.id}`, values);
        message.success('编辑成功');
      } else {
        await api.post('/service-points', values);
        message.success('新增成功');
      }
      setModalOpen(false);
      fetchData(page, pageSize, searchParams);
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('保存失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  const handleExport = async () => {
    try {
      const res: any = await api.get('/service-points/export', { params: searchParams });
      const list = res || [];
      if (list.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }
      const headers = ['名称', '地址', '服务类型', '所属工程', '营业时间', '状态'];
      const csvContent = [
        headers.join(','),
        ...list.map((item: any) =>
          [item.name, item.address, item.serviceType, item.projectName, item.businessHours, statusMap[item.status]?.label || item.status].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `便民服务点_${new Date().toLocaleDateString()}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<ServicePoint> = [
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 180 },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true, width: 200 },
    { title: '服务类型', dataIndex: 'serviceType', key: 'serviceType', width: 120 },
    { title: '所属工程', dataIndex: 'projectName', key: 'projectName', ellipsis: true, width: 150 },
    { title: '营业时间', dataIndex: 'businessHours', key: 'businessHours', width: 160 },
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
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: '确定要删除这条记录吗?',
                okText: '确定',
                cancelText: '取消',
                maskStyle: { background: 'rgba(0,0,0,0.5)' },
                centered: true,
                width: 480,
                okButtonProps: { danger: true },
                onOk: () => handleDelete(record.id),
              })
            }
          >
            删除
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 'published'}
            onClick={() =>
              Modal.confirm({
                title: record.status === 'published' ? '确定要下架吗?' : '确定要发布吗?',
                okText: '确定',
                cancelText: '取消',
                maskStyle: { background: 'rgba(0,0,0,0.5)' },
                centered: true,
                width: 480,
                onOk: () => handleTogglePublish(record),
              })
            }
          >
            {record.status === 'published' ? '下架' : '发布'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="便民服务点">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <Form.Item name="name" label="名称">
          <Input placeholder="请输入名称" allowClear />
        </Form.Item>
        <Form.Item name="serviceType" label="服务类型">
          <Select placeholder="请选择" allowClear options={serviceTypeOptions} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择"
            allowClear
            options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
          />
        </Form.Item>
      </SearchForm>

      <Toolbar onAdd={handleAdd} addText="新增服务点" onImport={handleImport} onExport={handleExport} />

      <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1100 }}
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
        title={editingRecord ? '编辑便民服务点' : '新增便民服务点'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="serviceType" label="服务类型" rules={[{ required: true, message: '请选择服务类型' }]}>
            <Select placeholder="请选择" options={serviceTypeOptions} />
          </Form.Item>
          <Form.Item name="projectName" label="所属工程">
            <Input placeholder="请输入所属工程" />
          </Form.Item>
          <Form.Item name="businessHours" label="营业时间" rules={[{ required: true, message: '请输入营业时间' }]}>
            <Input placeholder="如: 08:00-18:00" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择"
              options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ServicePointList;
