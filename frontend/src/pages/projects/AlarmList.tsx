import { useState, useEffect } from 'react';
import {
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';
import SearchForm from '@/components/SearchForm';
import Toolbar from '@/components/Toolbar';

interface AlarmAudio {
  id: number;
  name: string;
  type: string;
  fileName: string;
  fileSize: string;
  duration: string;
  status: string;
}

interface SignalText {
  id: number;
  title: string;
  signalType: string;
  content: string;
  status: string;
}

interface Knowledge {
  id: number;
  title: string;
  category: string;
  content: string;
  status: string;
}

const audioStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'orange' },
  published: { label: '已发布', color: 'green' },
  revoked: { label: '已撤销', color: 'red' },
  active: { label: '启用', color: 'green' },
  inactive: { label: '停用', color: 'default' },
};

const alarmTypeOptions = [
  { label: '预先警报', value: '预先警报' },
  { label: '空袭警报', value: '空袭警报' },
  { label: '解除警报', value: '解除警报' },
  { label: '灾情警报', value: '灾情警报' },
];

const knowledgeCategoryOptions = [
  { label: '防护知识', value: '防护知识' },
  { label: '应急常识', value: '应急常识' },
  { label: '自救互救', value: '自救互救' },
];

const AlarmList = () => {
  const [activeTab, setActiveTab] = useState('audio');

  // 警报音频状态
  const [audioData, setAudioData] = useState<AlarmAudio[]>([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioTotal, setAudioTotal] = useState(0);
  const [audioPage, setAudioPage] = useState(1);
  const [audioPageSize, setAudioPageSize] = useState(10);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [editingAudio, setEditingAudio] = useState<AlarmAudio | null>(null);
  const [audioSubmitting, setAudioSubmitting] = useState(false);
  const [audioForm] = Form.useForm();

  // 信号文字状态
  const [signalData, setSignalData] = useState<SignalText[]>([]);
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalTotal, setSignalTotal] = useState(0);
  const [signalPage, setSignalPage] = useState(1);
  const [signalPageSize, setSignalPageSize] = useState(10);
  const [signalModalOpen, setSignalModalOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState<SignalText | null>(null);
  const [signalSubmitting, setSignalSubmitting] = useState(false);
  const [signalForm] = Form.useForm();

  // 防护知识状态
  const [knowledgeData, setKnowledgeData] = useState<Knowledge[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeTotal, setKnowledgeTotal] = useState(0);
  const [knowledgePage, setKnowledgePage] = useState(1);
  const [knowledgePageSize, setKnowledgePageSize] = useState(10);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);
  const [knowledgeSubmitting, setKnowledgeSubmitting] = useState(false);
  const [knowledgeForm] = Form.useForm();

  // 获取警报音频
  const fetchAudioData = async (pageNum = audioPage, pageSizeNum = audioPageSize) => {
    setAudioLoading(true);
    try {
      const res: any = await api.get('/alarms/audio', { params: { page: pageNum, pageSize: pageSizeNum } });
      setAudioData(res?.list || []);
      setAudioTotal(res?.total || 0);
    } catch (error) {
      console.error('获取警报音频列表失败:', error);
    } finally {
      setAudioLoading(false);
    }
  };

  // 获取信号文字
  const fetchSignalData = async (pageNum = signalPage, pageSizeNum = signalPageSize) => {
    setSignalLoading(true);
    try {
      const res: any = await api.get('/alarms/signal-text', { params: { page: pageNum, pageSize: pageSizeNum } });
      setSignalData(res?.list || []);
      setSignalTotal(res?.total || 0);
    } catch (error) {
      console.error('获取信号文字列表失败:', error);
    } finally {
      setSignalLoading(false);
    }
  };

  // 获取防护知识
  const fetchKnowledgeData = async (pageNum = knowledgePage, pageSizeNum = knowledgePageSize) => {
    setKnowledgeLoading(true);
    try {
      const res: any = await api.get('/alarms/knowledge', { params: { page: pageNum, pageSize: pageSizeNum } });
      setKnowledgeData(res?.list || []);
      setKnowledgeTotal(res?.total || 0);
    } catch (error) {
      console.error('获取防护知识列表失败:', error);
    } finally {
      setKnowledgeLoading(false);
    }
  };

  useEffect(() => {
    fetchAudioData(1, 10);
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'audio' && audioData.length === 0) fetchAudioData(1, 10);
    if (key === 'signal' && signalData.length === 0) fetchSignalData(1, 10);
    if (key === 'knowledge' && knowledgeData.length === 0) fetchKnowledgeData(1, 10);
  };

  // 警报音频操作
  const handleAudioTableChange = (pagination: any) => {
    setAudioPage(pagination.current);
    setAudioPageSize(pagination.pageSize);
    fetchAudioData(pagination.current, pagination.pageSize);
  };

  const handleAddAudio = () => {
    setEditingAudio(null);
    audioForm.resetFields();
    setAudioModalOpen(true);
  };

  const handleEditAudio = (record: AlarmAudio) => {
    setEditingAudio(record);
    audioForm.setFieldsValue(record);
    setAudioModalOpen(true);
  };

  const handleDeleteAudio = async (id: number) => {
    try {
      await api.delete(`/alarms/audio/${id}`);
      message.success('删除成功');
      fetchAudioData(audioPage, audioPageSize);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleAudioSubmit = async () => {
    try {
      const values = await audioForm.validateFields();
      setAudioSubmitting(true);
      if (editingAudio) {
        await api.put(`/alarms/audio/${editingAudio.id}`, values);
        message.success('编辑成功');
      } else {
        await api.post('/alarms/audio', values);
        message.success('新增成功');
      }
      setAudioModalOpen(false);
      fetchAudioData(audioPage, audioPageSize);
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('保存失败:', error);
    } finally {
      setAudioSubmitting(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/alarms/audio/upload',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        fetchAudioData(audioPage, audioPageSize);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  // 信号文字操作
  const handleSignalTableChange = (pagination: any) => {
    setSignalPage(pagination.current);
    setSignalPageSize(pagination.pageSize);
    fetchSignalData(pagination.current, pagination.pageSize);
  };

  const handleAddSignal = () => {
    setEditingSignal(null);
    signalForm.resetFields();
    setSignalModalOpen(true);
  };

  const handleEditSignal = (record: SignalText) => {
    setEditingSignal(record);
    signalForm.setFieldsValue(record);
    setSignalModalOpen(true);
  };

  const handleDeleteSignal = async (id: number) => {
    try {
      await api.delete(`/alarms/signal-text/${id}`);
      message.success('删除成功');
      fetchSignalData(signalPage, signalPageSize);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleSignalSubmit = async () => {
    try {
      const values = await signalForm.validateFields();
      setSignalSubmitting(true);
      if (editingSignal) {
        await api.put(`/alarms/signal-text/${editingSignal.id}`, values);
        message.success('编辑成功');
      } else {
        await api.post('/alarms/signal-text', values);
        message.success('新增成功');
      }
      setSignalModalOpen(false);
      fetchSignalData(signalPage, signalPageSize);
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('保存失败:', error);
    } finally {
      setSignalSubmitting(false);
    }
  };

  // 防护知识操作
  const handleKnowledgeTableChange = (pagination: any) => {
    setKnowledgePage(pagination.current);
    setKnowledgePageSize(pagination.pageSize);
    fetchKnowledgeData(pagination.current, pagination.pageSize);
  };

  const handleAddKnowledge = () => {
    setEditingKnowledge(null);
    knowledgeForm.resetFields();
    setKnowledgeModalOpen(true);
  };

  const handleEditKnowledge = (record: Knowledge) => {
    setEditingKnowledge(record);
    knowledgeForm.setFieldsValue(record);
    setKnowledgeModalOpen(true);
  };

  const handleDeleteKnowledge = async (id: number) => {
    try {
      await api.delete(`/alarms/knowledge/${id}`);
      message.success('删除成功');
      fetchKnowledgeData(knowledgePage, knowledgePageSize);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleKnowledgeSubmit = async () => {
    try {
      const values = await knowledgeForm.validateFields();
      setKnowledgeSubmitting(true);
      if (editingKnowledge) {
        await api.put(`/alarms/knowledge/${editingKnowledge.id}`, values);
        message.success('编辑成功');
      } else {
        await api.post('/alarms/knowledge', values);
        message.success('新增成功');
      }
      setKnowledgeModalOpen(false);
      fetchKnowledgeData(knowledgePage, knowledgePageSize);
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('保存失败:', error);
    } finally {
      setKnowledgeSubmitting(false);
    }
  };

  const audioColumns: ColumnsType<AlarmAudio> = [
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 180 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '文件名', dataIndex: 'fileName', key: 'fileName', ellipsis: true, width: 200 },
    { title: '文件大小', dataIndex: 'fileSize', key: 'fileSize', width: 100 },
    { title: '时长', dataIndex: 'duration', key: 'duration', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const config = audioStatusMap[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditAudio(record)}>
            编辑
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
                onOk: () => handleDeleteAudio(record.id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const signalColumns: ColumnsType<SignalText> = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: 200 },
    { title: '信号类型', dataIndex: 'signalType', key: 'signalType', width: 120 },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const config = audioStatusMap[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditSignal(record)}>
            编辑
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
                onOk: () => handleDeleteSignal(record.id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const knowledgeColumns: ColumnsType<Knowledge> = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: 200 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const config = audioStatusMap[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditKnowledge(record)}>
            编辑
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
                onOk: () => handleDeleteKnowledge(record.id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'audio',
      label: '警报音频',
      children: (
        <>
          <Toolbar onAdd={handleAddAudio} addText="新增">
            <Upload {...uploadProps} showUploadList={false}>
              <Button icon={<UploadOutlined />}>上传音频</Button>
            </Upload>
          </Toolbar>
          <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Table
              rowKey="id"
              columns={audioColumns}
              dataSource={audioData}
              loading={audioLoading}
              scroll={{ x: 900 }}
              pagination={{
                current: audioPage,
                pageSize: audioPageSize,
                total: audioTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
              }}
              onChange={handleAudioTableChange}
            />
          </div>
        </>
      ),
    },
    {
      key: 'signal',
      label: '信号文字说明',
      children: (
        <>
          <Toolbar onAdd={handleAddSignal} addText="新增" />
          <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Table
              rowKey="id"
              columns={signalColumns}
              dataSource={signalData}
              loading={signalLoading}
              scroll={{ x: 800 }}
              pagination={{
                current: signalPage,
                pageSize: signalPageSize,
                total: signalTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
              }}
              onChange={handleSignalTableChange}
            />
          </div>
        </>
      ),
    },
    {
      key: 'knowledge',
      label: '防护知识',
      children: (
        <>
          <Toolbar onAdd={handleAddKnowledge} addText="新增" />
          <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Table
              rowKey="id"
              columns={knowledgeColumns}
              dataSource={knowledgeData}
              loading={knowledgeLoading}
              scroll={{ x: 800 }}
              pagination={{
                current: knowledgePage,
                pageSize: knowledgePageSize,
                total: knowledgeTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
              }}
              onChange={handleKnowledgeTableChange}
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <PageContainer title="警报音频">
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />

      {/* 警报音频弹窗 */}
      <Modal
        title={editingAudio ? '编辑警报音频' : '新增警报音频'}
        open={audioModalOpen}
        onOk={handleAudioSubmit}
        onCancel={() => setAudioModalOpen(false)}
        width={600}
        confirmLoading={audioSubmitting}
        destroyOnClose
      >
        <Form form={audioForm} layout="vertical" preserve={false}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="请选择" options={alarmTypeOptions} />
          </Form.Item>
          <Form.Item name="fileName" label="文件名">
            <Input placeholder="请输入文件名" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择"
              options={Object.entries(audioStatusMap).map(([key, val]) => ({ label: val.label, value: key }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 信号文字弹窗 */}
      <Modal
        title={editingSignal ? '编辑信号文字' : '新增信号文字'}
        open={signalModalOpen}
        onOk={handleSignalSubmit}
        onCancel={() => setSignalModalOpen(false)}
        width={600}
        confirmLoading={signalSubmitting}
        destroyOnClose
      >
        <Form form={signalForm} layout="vertical" preserve={false}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="signalType" label="信号类型" rules={[{ required: true, message: '请选择信号类型' }]}>
            <Select placeholder="请选择" options={alarmTypeOptions} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入内容" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择"
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 防护知识弹窗 */}
      <Modal
        title={editingKnowledge ? '编辑防护知识' : '新增防护知识'}
        open={knowledgeModalOpen}
        onOk={handleKnowledgeSubmit}
        onCancel={() => setKnowledgeModalOpen(false)}
        width={600}
        confirmLoading={knowledgeSubmitting}
        destroyOnClose
      >
        <Form form={knowledgeForm} layout="vertical" preserve={false}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择" options={knowledgeCategoryOptions} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={6} placeholder="请输入内容" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择"
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AlarmList;
