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
  Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';
import SearchForm from '@/components/SearchForm';
import Toolbar from '@/components/Toolbar';

interface Project {
  id: number;
  name: string;
  code: string;
  longitude: number;
  latitude: number;
  area: number;
  buildType: string;
  region: string;
  manageUnit: string;
  status: string;
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  published: { label: '已发布', color: 'green' },
  draft: { label: '草稿', color: 'default' },
  pending: { label: '待审核', color: 'blue' },
  deleted: { label: '已删除', color: 'red' },
};

const buildTypeOptions = [
  { label: '掘开式', value: '掘开式' },
  { label: '坑道式', value: '坑道式' },
  { label: '地道式', value: '地道式' },
  { label: '附建式', value: '附建式' },
];

const regionOptions = [
  { label: '南京市', value: '南京市' },
  { label: '苏州市', value: '苏州市' },
  { label: '无锡市', value: '无锡市' },
  { label: '常州市', value: '常州市' },
  { label: '徐州市', value: '徐州市' },
  { label: '南通市', value: '南通市' },
  { label: '扬州市', value: '扬州市' },
];

const ProjectList = () => {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Project | null>(null);
  const [detailRecord, setDetailRecord] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/projects', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      const list = res?.list || [];
      setData(list);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取人防工程列表失败:', error);
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

  // 审核操作（通过/驳回）
  const handleAudit = async (record: Project, action: 'pass' | 'reject') => {
    try {
      await api.post(`/projects/${record.id}/audit`, { action });
      message.success(action === 'pass' ? '审核通过' : '已驳回');
      fetchData(page, pageSize, searchParams);
    } catch (error) {
      console.error('审核失败:', error);
      message.error(action === 'pass' ? '审核通过失败' : '驳回失败');
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Project) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleView = (record: Project) => {
    setDetailRecord(record);
    setDetailModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/projects/${id}`);
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
        await api.put(`/projects/${editingRecord.id}`, values);
        message.success('编辑成功');
      } else {
        await api.post('/projects', values);
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
      const res: any = await api.get('/projects/export', { params: searchParams });
      const list = res || [];
      if (list.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }
      const headers = ['工程名称', '编号', '经度', '纬度', '面积', '建设类型', '区域', '管理单位', '状态'];
      const csvContent = [
        headers.join(','),
        ...list.map((item: any) =>
          [item.name, item.code, item.longitude, item.latitude, item.area, item.buildType, item.region, item.manageUnit, statusMap[item.status]?.label || item.status].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `人防工程_${new Date().toLocaleDateString()}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<Project> = [
    {
      title: '工程名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: 180,
    },
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '经度',
      dataIndex: 'longitude',
      key: 'longitude',
      width: 100,
    },
    {
      title: '纬度',
      dataIndex: 'latitude',
      key: 'latitude',
      width: 100,
    },
    {
      title: '面积(㎡)',
      dataIndex: 'area',
      key: 'area',
      width: 100,
    },
    {
      title: '建设类型',
      dataIndex: 'buildType',
      key: 'buildType',
      width: 100,
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      width: 100,
    },
    {
      title: '管理单位',
      dataIndex: 'manageUnit',
      key: 'manageUnit',
      ellipsis: true,
      width: 150,
    },
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
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() =>
                  Modal.confirm({
                    title: '确定审核通过?',
                    content: `工程名称：${record.name}`,
                    okText: '确定',
                    cancelText: '取消',
                    centered: true,
                    width: 480,
                    maskStyle: { background: 'rgba(0,0,0,0.5)' },
                    onOk: () => handleAudit(record, 'pass'),
                  })
                }
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() =>
                  Modal.confirm({
                    title: '确定驳回该工程?',
                    content: `工程名称：${record.name}`,
                    okText: '确定',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    centered: true,
                    width: 480,
                    maskStyle: { background: 'rgba(0,0,0,0.5)' },
                    onOk: () => handleAudit(record, 'reject'),
                  })
                }
              >
                驳回
              </Button>
            </>
          )}
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
                okButtonProps: { danger: true },
                centered: true,
                width: 480,
                maskStyle: { background: 'rgba(0,0,0,0.5)' },
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
    <PageContainer title="人防工程">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <Form.Item name="name" label="工程名称">
          <Input placeholder="请输入工程名称" allowClear />
        </Form.Item>
        <Form.Item name="code" label="工程编号">
          <Input placeholder="请输入工程编号" allowClear />
        </Form.Item>
        <Form.Item name="buildType" label="建设类型">
          <Select placeholder="请选择" allowClear options={buildTypeOptions} />
        </Form.Item>
        <Form.Item name="region" label="所在区域">
          <Select placeholder="请选择" allowClear options={regionOptions} />
        </Form.Item>
        <Form.Item name="manageUnit" label="管理单位">
          <Input placeholder="请输入管理单位" allowClear />
        </Form.Item>
      </SearchForm>

      <Toolbar onAdd={handleAdd} addText="新增工程" onImport={handleImport} onExport={handleExport} />

      <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </div>

      <Modal
        title={editingRecord ? '编辑人防工程' : '新增人防工程'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={680}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="工程名称"
            rules={[{ required: true, message: '请输入工程名称' }]}
          >
            <Input placeholder="请输入工程名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="编号"
            rules={[{ required: true, message: '请输入编号' }]}
          >
            <Input placeholder="请输入编号" />
          </Form.Item>
          <Form.Item name="longitude" label="经度" rules={[{ required: true, message: '请输入经度' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请输入经度" />
          </Form.Item>
          <Form.Item name="latitude" label="纬度" rules={[{ required: true, message: '请输入纬度' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请输入纬度" />
          </Form.Item>
          <Form.Item name="area" label="面积(㎡)" rules={[{ required: true, message: '请输入面积' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请输入面积" />
          </Form.Item>
          <Form.Item name="buildType" label="建设类型" rules={[{ required: true, message: '请选择建设类型' }]}>
            <Select placeholder="请选择" options={buildTypeOptions} />
          </Form.Item>
          <Form.Item name="region" label="区域" rules={[{ required: true, message: '请选择区域' }]}>
            <Select placeholder="请选择" options={regionOptions} />
          </Form.Item>
          <Form.Item name="manageUnit" label="管理单位" rules={[{ required: true, message: '请输入管理单位' }]}>
            <Input placeholder="请输入管理单位" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>工程详情</div>}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>]}
        width={560}
        centered
      >
        {detailRecord && (
          <Descriptions bordered column={2} size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="工程名称" span={1}>{detailRecord.name}</Descriptions.Item>
            <Descriptions.Item label="编号" span={1}>{detailRecord.code}</Descriptions.Item>
            <Descriptions.Item label="经度" span={1}>{detailRecord.longitude}</Descriptions.Item>
            <Descriptions.Item label="纬度" span={1}>{detailRecord.latitude}</Descriptions.Item>
            <Descriptions.Item label="面积" span={1}>{detailRecord.area} m²</Descriptions.Item>
            <Descriptions.Item label="建设类型" span={1}>{detailRecord.buildType}</Descriptions.Item>
            <Descriptions.Item label="区域" span={1}>{detailRecord.region}</Descriptions.Item>
            <Descriptions.Item label="管理单位" span={1}>{detailRecord.manageUnit}</Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              {(() => {
                const config = statusMap[detailRecord.status] || { label: detailRecord.status, color: 'default' };
                return <Tag color={config.color}>{config.label}</Tag>;
              })()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};

export default ProjectList;
