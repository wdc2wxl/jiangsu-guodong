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
import dayjs from 'dayjs';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';
import SearchForm from '@/components/SearchForm';
import Toolbar from '@/components/Toolbar';

interface Announcement {
  id: number;
  title: string;
  type: string;
  scope: string;
  status: string;
  publishTime: string;
  content: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  published: { label: '已发布', color: 'green' },
  draft: { label: '草稿', color: 'default' },
  offline: { label: '已下架', color: 'red' },
  deleted: { label: '已删除', color: 'default' },
};

const typeOptions = [
  { label: '系统通知', value: 'system_notice' },
  { label: '服务公告', value: 'service_notice' },
  { label: '政策宣传', value: 'policy_publicity' },
];

const scopeOptions = [
  { label: '全部用户', value: 'all' },
  { label: '管理员', value: 'admin' },
  { label: '审核员', value: 'auditor' },
  { label: '操作员', value: 'operator' },
];

const AnnouncementList = () => {
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/system/announcements', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取公告列表失败:', error);
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

  const handleEdit = (record: Announcement) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/system/announcements/${id}`);
      message.success('删除成功');
      fetchData(page, pageSize, searchParams);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleTogglePublish = async (record: Announcement) => {
    const newStatus = record.status === 'published' ? 'offline' : 'published';
    try {
      if (newStatus === 'offline') {
        await api.put(`/system/announcements/${record.id}/offline`);
      } else {
        await api.put(`/system/announcements/${record.id}/publish`);
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
        await api.put(`/system/announcements/${editingRecord.id}`, values);
        message.success('编辑成功');
      } else {
        await api.post('/system/announcements', values);
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

  const columns: ColumnsType<Announcement> = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: 200 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (val: string) => {
        const opt = typeOptions.find((o) => o.value === val);
        return opt ? opt.label : val;
      },
    },
    {
      title: '范围',
      dataIndex: 'scope',
      key: 'scope',
      width: 120,
      render: (val: string) => {
        const opt = scopeOptions.find((o) => o.value === val);
        return opt ? opt.label : val;
      },
    },
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
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 170,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 'published'}
            onClick={() =>
              Modal.confirm({
                title: record.status === 'published' ? '确定下架?' : '确定发布?',
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
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: '确定删除?',
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
    <PageContainer title="公告管理">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <Form.Item name="title" label="标题">
          <Input placeholder="请输入标题" allowClear />
        </Form.Item>
        <Form.Item name="type" label="类型">
          <Select placeholder="请选择" allowClear options={typeOptions} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择"
            allowClear
            options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
          />
        </Form.Item>
      </SearchForm>

      <Toolbar onAdd={handleAdd} addText="新增公告" />

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
        title={editingRecord ? '编辑公告' : '新增公告'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={700}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入公告标题" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="请选择" options={typeOptions} />
          </Form.Item>
          <Form.Item name="scope" label="发布范围" rules={[{ required: true, message: '请选择发布范围' }]}>
            <Select placeholder="请选择" options={scopeOptions} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择"
              options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
            />
          </Form.Item>
          <Form.Item name="content" label="公告内容" rules={[{ required: true, message: '请输入公告内容' }]}>
            <Input.TextArea rows={8} placeholder="请输入公告内容（支持富文本格式）" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AnnouncementList;
