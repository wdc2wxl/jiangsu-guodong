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
  Switch,
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

interface BookingRule {
  id: number;
  name: string;
  targetType: string;
  maxAdvanceDays: number;
  maxDuration: number;
  cancelDeadline: number;
  enabled: boolean;
  remark?: string;
}

const targetTypeOptions = [
  { label: '车位预约', value: 'parking' },
  { label: '纳凉点', value: 'cooling' },
  { label: '宣教体验馆', value: 'museum' },
];

const BookingRules = () => {
  const [data, setData] = useState<BookingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BookingRule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/booking/rules', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取预约规则列表失败:', error);
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

  const handleEdit = (record: BookingRule) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/booking/rules/${id}`);
      message.success('删除成功');
      fetchData(page, pageSize, searchParams);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleToggleEnabled = async (record: BookingRule) => {
    try {
      if (record.enabled) {
        await api.put(`/booking/rules/${record.id}/disable`);
      } else {
        await api.put(`/booking/rules/${record.id}/enable`);
      }
      message.success(record.enabled ? '已停用' : '已启用');
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
        await api.put(`/booking/rules/${editingRecord.id}`, values);
        message.success('编辑成功');
      } else {
        await api.post('/booking/rules', values);
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

  const columns: ColumnsType<BookingRule> = [
    { title: '规则名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 200 },
    {
      title: '适用对象',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 120,
      render: (val: string) => {
        const opt = targetTypeOptions.find((o) => o.value === val);
        return opt ? opt.label : val;
      },
    },
    { title: '最大提前天数', dataIndex: 'maxAdvanceDays', key: 'maxAdvanceDays', width: 120 },
    { title: '最长时长(小时)', dataIndex: 'maxDuration', key: 'maxDuration', width: 130 },
    { title: '取消截止(小时)', dataIndex: 'cancelDeadline', key: 'cancelDeadline', width: 130 },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>{enabled ? '启用' : '停用'}</Tag>
      ),
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
            danger={record.enabled}
            onClick={() =>
              Modal.confirm({
                title: record.enabled ? '确定停用?' : '确定启用?',
                okText: '确定',
                cancelText: '取消',
                maskStyle: { background: 'rgba(0,0,0,0.5)' },
                centered: true,
                width: 480,
                onOk: () => handleToggleEnabled(record),
              })
            }
          >
            {record.enabled ? '停用' : '启用'}
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
    <PageContainer title="预约规则">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <Form.Item name="name" label="规则名称">
          <Input placeholder="请输入规则名称" allowClear />
        </Form.Item>
        <Form.Item name="targetType" label="适用对象">
          <Select placeholder="请选择" allowClear options={targetTypeOptions} />
        </Form.Item>
      </SearchForm>

      <Toolbar onAdd={handleAdd} addText="新增规则" />

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
        title={editingRecord ? '编辑预约规则' : '新增预约规则'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false} initialValues={{ enabled: true }}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="targetType" label="适用对象" rules={[{ required: true, message: '请选择适用对象' }]}>
            <Select placeholder="请选择" options={targetTypeOptions} />
          </Form.Item>
          <Form.Item name="maxAdvanceDays" label="最大提前天数" rules={[{ required: true, message: '请输入最大提前天数' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="如: 7" />
          </Form.Item>
          <Form.Item name="maxDuration" label="最长时长(小时)" rules={[{ required: true, message: '请输入最长时长' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="如: 4" />
          </Form.Item>
          <Form.Item name="cancelDeadline" label="取消截止(小时前)" rules={[{ required: true, message: '请输入取消截止时间' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="如: 2" />
          </Form.Item>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BookingRules;
