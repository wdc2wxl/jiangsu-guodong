import { useState, useEffect } from 'react';
import { Card, Spin, Table, Row, Col, DatePicker, Space, Button, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';

const { RangePicker } = DatePicker;

interface ResourceQueryData {
  chartData: { type: string; count: number }[];
  hotKeywords: { keyword: string; count: number }[];
}

const ResourceQuery = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResourceQueryData>({
    chartData: [],
    hotKeywords: [],
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
      const res: any = await api.get('/stats/resource-query', { params });
      setData({
        chartData: res?.chartData || [],
        hotKeywords: res?.hotKeywords || [],
      });
    } catch (error) {
      console.error('获取资源查询统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const maxCount = Math.max(...data.chartData.map((d) => d.count), 1);

  const columns: ColumnsType<{ keyword: string; count: number }> = [
    { title: '排名', key: 'rank', width: 80, render: (_, __, index) => index + 1 },
    { title: '关键词', dataIndex: 'keyword', key: 'keyword' },
    { title: '搜索次数', dataIndex: 'count', key: 'count', width: 120 },
  ];

  return (
    <PageContainer title="资源查询统计">
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
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="各资源类型查询量">
              {data.chartData.length > 0 ? (
                <div style={{ padding: '20px 10px' }}>
                  {data.chartData.map((item, index) => (
                    <div key={index} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>{item.type}</span>
                        <span style={{ color: '#1890ff' }}>{item.count}次</span>
                      </div>
                      <Progress
                        percent={Math.round((item.count / maxCount) * 100)}
                        size="small"
                        strokeColor="#1890ff"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="热门关键词">
              <Table
                rowKey="keyword"
                columns={columns}
                dataSource={data.hotKeywords}
                pagination={false}
                size="middle"
                scroll={{ y: 300 }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  );
};

export default ResourceQuery;
