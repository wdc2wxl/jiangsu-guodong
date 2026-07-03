import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
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

interface Parking {
  id: number;
  location: string;
  project?: { name: string };
  totalSpaces: number;
  bookableSpaces: number;
  rentableSpaces: number;
  priceStandard: string;
  region: string;
  status: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  published: { label: '可用', color: 'green' },
  draft: { label: '草稿', color: 'default' },
  pending: { label: '待审核', color: 'blue' },
  deleted: { label: '已删除', color: 'red' },
};

const regionOptions = [
  { label: '南京市', value: '南京市' },
  { label: '苏州市', value: '苏州市' },
  { label: '无锡市', value: '无锡市' },
  { label: '常州市', value: '常州市' },
  { label: '徐州市', value: '徐州市' },
  { label: '南通市', value: '南通市' },
];

const ParkingList = () => {
  const [data, setData] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Parking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/parking-spaces', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取人防车位列表失败:', error);
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

  const handleEdit = (record: Parking) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/parking-spaces/${id}`);
      message.success('删除成功');
      fetchData(page, pageSize, searchParams);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingRecord) {
        await api.put(`/parking-spaces/${editingRecord.id}`, values);
        message.success('编辑成功');
      } else {
        await api.post('/parking-spaces', values);
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
      const res: any = await api.get('/parking-spaces/export', { params: searchParams });
      const list = res || [];
      if (list.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }
      const headers = ['位置', '所属工程', '总车位', '可预约', '可租赁', '收费标准', '区域', '状态'];
      const csvContent = [
        headers.join(','),
        ...list.map((item: any) =>
          [item.location, item.project?.name || '-', item.totalSpaces, item.bookableSpaces, item.rentableSpaces, item.priceStandard, item.region, statusMap[item.status]?.label || item.status].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `人防车位_${new Date().toLocaleDateString()}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<Parking> = [
    { title: '位置', dataIndex: 'location', key: 'location', ellipsis: true, width: 180 },
    { title: '所属工程', key: 'projectName', ellipsis: true, width: 150, render: (_, record) => record.project?.name || '-' },
    { title: '总车位', dataIndex: 'totalSpaces', key: 'totalSpaces', width: 90 },
    { title: '可预约', dataIndex: 'bookableSpaces', key: 'bookableSpaces', width: 90 },
    { title: '可租赁', dataIndex: 'rentableSpaces', key: 'rentableSpaces', width: 90 },
    { title: '收费标准', dataIndex: 'priceStandard', key: 'priceStandard', width: 140 },
    { title: '区域', dataIndex: 'region', key: 'region', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const config = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="人防车位">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <Form.Item name="location" label="位置">
          <Input placeholder="请输入位置" allowClear />
        </Form.Item>
        <Form.Item name="projectName" label="所属工程">
          <Input placeholder="请输入所属工程" allowClear />
        </Form.Item>
        <Form.Item name="region" label="区域">
          <Select placeholder="请选择" allowClear options={regionOptions} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择"
            allowClear
            options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
          />
        </Form.Item>
      </SearchForm>

      <Toolbar onAdd={handleAdd} addText="新增车位" onImport={handleImport} onExport={handleExport} />

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
        title={editingRecord ? '编辑人防车位' : '新增人防车位'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="location" label="位置" rules={[{ required: true, message: '请输入位置' }]}>
            <Input placeholder="请输入位置" />
          </Form.Item>
          <Form.Item name="projectName" label="所属工程" rules={[{ required: true, message: '请输入所属工程' }]}>
            <Input placeholder="请输入所属工程" />
          </Form.Item>
          <Form.Item name="totalSpots" label="总车位" rules={[{ required: true, message: '请输入总车位' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入总车位" />
          </Form.Item>
          <Form.Item name="reservable" label="可预约" rules={[{ required: true, message: '请输入可预约数' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入可预约数" />
          </Form.Item>
          <Form.Item name="rentable" label="可租赁" rules={[{ required: true, message: '请输入可租赁数' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入可租赁数" />
          </Form.Item>
          <Form.Item name="feeStandard" label="收费标准" rules={[{ required: true, message: '请输入收费标准' }]}>
            <Input placeholder="如: 5元/小时" />
          </Form.Item>
          <Form.Item name="region" label="区域" rules={[{ required: true, message: '请选择区域' }]}>
            <Select placeholder="请选择" options={regionOptions} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择"
              options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ParkingList;
