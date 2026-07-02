import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, DatePicker, Space, Button, Table, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';

const { RangePicker } = DatePicker;

interface ReservationStatsData {
  total: number;
  confirmed: number;
  cancelled: number;
  arrived: number;
  arrivalRate: number;
  trend: { date: string; count: number }[];
}

const ReservationStats = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReservationStatsData>({
    total: 0,
    confirmed: 0,
    cancelled: 0,
    arrived: 0,
    arrivalRate: 0,
    trend: [],
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };
      const res: any = await api.get('/stats/reservation', { params });
      setData({
        total: res?.total || 0,
        confirmed: res?.confirmed || 0,
        cancelled: res?.cancelled || 0,
        arrived: res?.arrived || 0,
        arrivalRate: res?.arrivalRate || 0,
        trend: res?.trend || [],
      });
    } catch (error) {
      console.error('获取预约统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const maxCount = Math.max(...data.trend.map((t) => t.count), 1);

  const columns: ColumnsType<{ date: string; count: number }> = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '预约量', dataIndex: 'count', key: 'count', width: 100, render: (v: number) => `${v}次` },
    {
      title: '占比',
      key: 'bar',
      render: (_, record) => (
        <Progress percent={Math.round((record.count / maxCount) * 100)} size="small" />
      ),
    },
  ];

  const cards = [
    { title: '预约总量', value: data.total, suffix: '次' },
    { title: '确认量', value: data.confirmed, suffix: '次' },
    { title: '取消量', value: data.cancelled, suffix: '次' },
    { title: '到场率', value: data.arrivalRate, suffix: '%' },
  ];

  return (
    <PageContainer title="车位预约统计">
      <div style={{ marginBottom: 16 }}>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
          />
          <Button type="primary" onClick={fetchData} loading={loading}>
            查询
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {cards.map((card, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card>
                <Statistic title={card.title} value={card.value} suffix={card.suffix} />
              </Card>
            </Col>
          ))}
        </Row>

        <Card title="预约趋势">
          {data.trend.length > 0 ? (
            <Table
              rowKey="date"
              columns={columns}
              dataSource={data.trend}
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
          )}
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default ReservationStats;
