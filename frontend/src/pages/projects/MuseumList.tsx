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
  TimePicker,
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

interface Museum {
  id: number;
  name: string;
  address: string;
  openTime: string;
  closeTime: string;
  capacity: number;
  reservationRule: string;
  status: string;
  remark?: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  published: { label: '开放中', color: 'green' },
  draft: { label: '草稿', color: 'default' },
  pending: { label: '待审核', color: 'blue' },
  deleted: { label: '已删除', color: 'red' },
};

const MuseumList = () => {
  const [data, setData] = useState<Museum[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Museum | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/museums', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取宣教体验馆列表失败:', error);
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

  const handleEdit = (record: Museum) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      openTime: record.openTime ? dayjs(record.openTime, 'HH:mm') : undefined,
      closeTime: record.closeTime ? dayjs(record.closeTime, 'HH:mm') : undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/museums/${id}`);
      message.success('删除成功');
      fetchData(page, pageSize, searchParams);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        openTime: values.openTime ? dayjs(values.openTime).format('HH:mm') : undefined,
        closeTime: values.closeTime ? dayjs(values.closeTime).format('HH:mm') : undefined,
      };
      setSubmitting(true);
      if (editingRecord) {
        await api.put(`/museums/${editingRecord.id}`, submitData);
        message.success('编辑成功');
      } else {
        await api.post('/museums', submitData);
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
      const res: any = await api.get('/museums/export', { params: searchParams });
      const list = res || [];
      if (list.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }
      const headers = ['名称', '地址', '开放时间', '关闭时间', '容纳能力', '预约规则', '状态'];
      const csvContent = [
        headers.join(','),
        ...list.map((item: any) =>
          [item.name, item.address, item.openTime, item.closeTime, item.capacity, item.reservationRule, statusMap[item.status]?.label || item.status].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `宣教体验馆_${new Date().toLocaleDateString()}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<Museum> = [
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 180 },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true, width: 200 },
    {
      title: '开放时间',
      key: 'openHours',
      width: 160,
      render: (_, record) => `${record.openTime || '-'} ~ ${record.closeTime || '-'}`,
    },
    { title: '容纳能力', dataIndex: 'capacity', key: 'capacity', width: 100 },
    { title: '预约规则', dataIndex: 'reservationRule', key: 'reservationRule', ellipsis: true, width: 180 },
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
    <PageContainer title="宣教体验馆">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <Form.Item name="name" label="名称">
          <Input placeholder="请输入名称" allowClear />
        </Form.Item>
        <Form.Item name="address" label="地址">
          <Input placeholder="请输入地址" allowClear />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择"
            allowClear
            options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
          />
        </Form.Item>
      </SearchForm>

      <Toolbar onAdd={handleAdd} addText="新增体验馆" onImport={handleImport} onExport={handleExport} />

      <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1000 }}
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
        title={editingRecord ? '编辑宣教体验馆' : '新增宣教体验馆'}
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
          <Form.Item name="openTime" label="开放时间" rules={[{ required: true, message: '请选择开放时间' }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="closeTime" label="关闭时间" rules={[{ required: true, message: '请选择关闭时间' }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="capacity" label="容纳能力" rules={[{ required: true, message: '请输入容纳能力' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入容纳能力" />
          </Form.Item>
          <Form.Item name="reservationRule" label="预约规则" rules={[{ required: true, message: '请输入预约规则' }]}>
            <Input placeholder="如: 提前3天预约" />
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

export default MuseumList;
