import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Tag,
  Descriptions,
  Space,
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

interface Reservation {
  id: number;
  reservationNo: string;
  parkingLocation: string;
  userName: string;
  phone: string;
  plateNumber: string;
  startTime: string;
  endTime: string;
  status: string;
  remark?: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  reserved: { label: '已预约', color: 'blue' },
  used: { label: '已使用', color: 'green' },
  expired: { label: '已过期', color: 'orange' },
  cancelled: { label: '已取消', color: 'default' },
};

const { RangePicker } = DatePicker;

const ReservationList = () => {
  const [data, setData] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Reservation | null>(null);
  const [searchForm] = Form.useForm();

  const fetchData = async (pageNum = page, pageSizeNum = pageSize, params = searchParams) => {
    setLoading(true);
    try {
      const res: any = await api.get('/booking/reservations', {
        params: { page: pageNum, pageSize: pageSizeNum, ...params },
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('获取预约记录列表失败:', error);
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

  const handleView = (record: Reservation) => {
    setDetailRecord(record);
    setDetailModalOpen(true);
  };

  // 更新预约状态（确认/驳回）
  const handleUpdateStatus = async (record: Reservation, status: 'used' | 'cancelled') => {
    try {
      await api.put(`/booking/reservations/${record.id}/status`, { status });
      message.success(status === 'used' ? '确认成功' : '驳回成功');
      fetchData(page, pageSize, searchParams);
    } catch (error) {
      console.error('更新预约状态失败:', error);
      message.error(status === 'used' ? '确认失败' : '驳回失败');
    }
  };

  const handleConfirm = (record: Reservation) => {
    Modal.confirm({
      title: '确认该预约吗？',
      content: `预约编号：${record.reservationNo}　预约人：${record.userName}　车牌号：${record.plateNumber}`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 480,
      maskStyle: { background: 'rgba(0,0,0,0.5)' },
      onOk: () => handleUpdateStatus(record, 'used'),
    });
  };

  const handleReject = (record: Reservation) => {
    Modal.confirm({
      title: '确认驳回该预约吗？',
      content: `预约编号：${record.reservationNo}　预约人：${record.userName}　车牌号：${record.plateNumber}　驳回后该预约将被取消，此操作不可撤销。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      centered: true,
      width: 480,
      maskStyle: { background: 'rgba(0,0,0,0.5)' },
      onOk: () => handleUpdateStatus(record, 'cancelled'),
    });
  };

  const handleExport = async () => {
    try {
      const res: any = await api.get('/booking/reservations/export', { params: searchParams });
      const list = res || [];
      if (list.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }
      const headers = ['预约编号', '车位位置', '预约人', '联系电话', '车牌号', '开始时间', '结束时间', '状态'];
      const csvContent = [
        headers.join(','),
        ...list.map((item: any) =>
          [item.reservationNo, item.parkingLocation, item.userName, item.phone, item.plateNumber, item.startTime, item.endTime, statusMap[item.status]?.label || item.status].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `车位预约_${new Date().toLocaleDateString()}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<Reservation> = [
    { title: '预约编号', dataIndex: 'reservationNo', key: 'reservationNo', width: 140 },
    { title: '车位位置', dataIndex: 'parkingLocation', key: 'parkingLocation', ellipsis: true, width: 160 },
    { title: '预约人', dataIndex: 'userName', key: 'userName', width: 100 },
    { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber', width: 110 },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (time: string) => time || '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (time: string) => time || '-',
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
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          {record.status === 'reserved' && (
            <>
              <Button type="link" size="small" onClick={() => handleConfirm(record)}>
                确认
              </Button>
              <Button type="link" size="small" danger onClick={() => handleReject(record)}>
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="车位预约">
      <SearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} loading={loading} colSpan={6}>
        <Form.Item name="reservationNo" label="预约编号">
          <Input placeholder="请输入预约编号" allowClear />
        </Form.Item>
        <Form.Item name="userName" label="预约人">
          <Input placeholder="请输入预约人" allowClear />
        </Form.Item>
        <Form.Item name="plateNumber" label="车牌号">
          <Input placeholder="请输入车牌号" allowClear />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择"
            allowClear
            options={Object.entries(statusMap).map(([key, val]) => ({ label: val.label, value: key }))}
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
        title="预约详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>]}
        width={600}
        destroyOnClose
      >
        {detailRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="预约编号">{detailRecord.reservationNo}</Descriptions.Item>
            <Descriptions.Item label="车位位置">{detailRecord.parkingLocation}</Descriptions.Item>
            <Descriptions.Item label="预约人">{detailRecord.userName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{detailRecord.phone}</Descriptions.Item>
            <Descriptions.Item label="车牌号">{detailRecord.plateNumber}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {(() => {
                const config = statusMap[detailRecord.status] || { label: detailRecord.status, color: 'default' };
                return <Tag color={config.color}>{config.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {detailRecord.startTime ? dayjs(detailRecord.startTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {detailRecord.endTime ? dayjs(detailRecord.endTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {detailRecord.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};

export default ReservationList;
