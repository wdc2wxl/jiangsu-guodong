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
  Descriptions,
  Divider,
  Radio,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';
import SearchForm from '@/components/SearchForm';

interface AuditTask {
  id: number;
  dataType: string;
  dataSummary: string;
  dataId?: number;
  submitterId: number;
  submitter?: { id: number; username: string; realName: string };
  submitTime: string;
  status: string;
  currentNode: number;
  process?: { id: number; name: string; levels: number };
  records?: any[];
  detail?: any;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'blue' },
  approved: { label: '已通过', color: 'green' },
  returned: { label: '已退回', color: 'orange' },
  rejected: { label: '已驳回', color: 'red' },
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

const AuditTasks = () => {
  const [data, setData] = useState<AuditTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [auditForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/audit/tasks', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取待审核任务列表失败:', error);
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

  const handleView = async (record: AuditTask) => {
    try {
      const detail: any = await api.get(`/audit/tasks/${record.id}`);
      setDetailRecord(detail);
    } catch (error) {
      setDetailRecord(record);
    }
    setDetailModalOpen(true);
    auditForm.resetFields();
  };

  const handleAudit = async () => {
    try {
      const values = await auditForm.validateFields();
      setSubmitting(true);
      // 后端接收 action(pass/return/reject) 和 opinion
      const actionMap: Record<string, string> = {
        approved: 'pass',
        returned: 'return',
        rejected: 'reject',
      };
      await api.post(`/audit/tasks/${detailRecord?.id}/audit`, {
        action: actionMap[values.result] || values.result,
        opinion: values.comment,
      });
      message.success('审核操作成功');
      setDetailModalOpen(false);
      fetchData(page, pageSize, searchParams);
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('审核操作失败:', error);
      message.error('审核操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<AuditTask> = [
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (val: string) => dataTypeLabel(val),
    },
    { title: '摘要', dataIndex: 'dataSummary', key: 'dataSummary', ellipsis: true },
    {
      title: '提交人',
      key: 'submitter',
      width: 120,
      render: (_, record) => record.submitter?.realName || record.submitter?.username || '-',
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 170,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
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
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          disabled={record.status !== 'pending'}
        >
          {record.status === 'pending' ? '审核' : '查看'}
        </Button>
      ),
    },
  ];

  // 审核记录的 action 映射
  const actionLabelMap: Record<string, { label: string; color: string }> = {
    pass: { label: '通过', color: 'green' },
    return: { label: '退回', color: 'orange' },
    reject: { label: '驳回', color: 'red' },
  };

  return (
    <PageContainer title="待审核数据">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <Form.Item name="dataType" label="数据类型">
          <Select placeholder="请选择" allowClear options={dataTypeOptions} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择"
            allowClear
            options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
          />
        </Form.Item>
      </SearchForm>

      <div style={{ background: '#fff', borderRadius: 4, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 800 }}
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
        title="审核详情"
        open={detailModalOpen}
        onOk={detailRecord?.status === 'pending' ? handleAudit : undefined}
        onCancel={() => setDetailModalOpen(false)}
        width={700}
        confirmLoading={submitting}
        okText="提交审核"
        cancelText="关闭"
        destroyOnClose
      >
        {detailRecord && (
          <>
            <Descriptions title="数据信息" bordered column={2} size="small">
              <Descriptions.Item label="数据类型">
                {dataTypeLabel(detailRecord.dataType)}
              </Descriptions.Item>
              <Descriptions.Item label="数据ID">{detailRecord.dataId || '-'}</Descriptions.Item>
              <Descriptions.Item label="摘要" span={2}>{detailRecord.dataSummary || '-'}</Descriptions.Item>
              <Descriptions.Item label="提交人">
                {detailRecord.submitter?.realName || detailRecord.submitter?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {detailRecord.submitTime ? dayjs(detailRecord.submitTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审核流程">
                {detailRecord.process?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="当前节点">
                第 {detailRecord.currentNode || 1} / {detailRecord.process?.levels || 1} 节点
              </Descriptions.Item>
              <Descriptions.Item label="当前状态" span={2}>
                {(() => {
                  const config = statusMap[detailRecord.status] || { label: detailRecord.status, color: 'default' };
                  return <Tag color={config.color}>{config.label}</Tag>;
                })()}
              </Descriptions.Item>
            </Descriptions>

            {/* 历史审核记录 */}
            {detailRecord.records && detailRecord.records.length > 0 && (
              <>
                <Divider>审核记录</Divider>
                {detailRecord.records.map((rec: any, i: number) => {
                  const cfg = actionLabelMap[rec.action] || { label: rec.action, color: 'default' };
                  return (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <Tag color={cfg.color}>{cfg.label}</Tag>
                          <span style={{ marginLeft: 8, fontWeight: 500 }}>
                            {rec.auditor?.realName || rec.auditor?.username || '-'}
                          </span>
                        </span>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {rec.createdAt ? dayjs(rec.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </span>
                      </div>
                      {rec.opinion && <div style={{ color: '#666', marginTop: 4, fontSize: 13 }}>{rec.opinion}</div>}
                    </div>
                  );
                })}
              </>
            )}

            {/* 审核操作表单 - 仅 pending 状态显示 */}
            {detailRecord.status === 'pending' && (
              <>
                <Divider>审核操作</Divider>
                <Form form={auditForm} layout="vertical">
                  <Form.Item name="result" label="审核结果" rules={[{ required: true, message: '请选择审核结果' }]}>
                    <Radio.Group>
                      <Radio value="approved">通过</Radio>
                      <Radio value="returned">退回</Radio>
                      <Radio value="rejected">驳回</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    name="comment"
                    label="审核意见"
                    rules={[{ required: true, message: '请输入审核意见' }]}
                  >
                    <Input.TextArea rows={3} placeholder="请输入审核意见" />
                  </Form.Item>
                </Form>
              </>
            )}
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AuditTasks;
