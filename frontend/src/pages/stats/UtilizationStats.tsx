import { useState, useEffect } from 'react';
import { Card, Spin, Table, Progress, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '@/services/api';
import PageContainer from '@/components/PageContainer';

interface UtilizationData {
  coolingUtilization: { name: string; capacity: number; used: number; rate: number }[];
  parkingUtilization: { name: string; total: number; used: number; rate: number }[];
}

const UtilizationStats = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UtilizationData>({
    coolingUtilization: [],
    parkingUtilization: [],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/stats/utilization');
      setData({
        coolingUtilization: res?.coolingUtilization || [],
        parkingUtilization: res?.parkingUtilization || [],
      });
    } catch (error) {
      console.error('获取资源利用率统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const coolingColumns: ColumnsType<{ name: string; capacity: number; used: number; rate: number }> = [
    { title: '纳凉点名称', dataIndex: 'name', key: 'name' },
    { title: '容纳能力', dataIndex: 'capacity', key: 'capacity', width: 100, render: (v: number) => `${v}人` },
    { title: '使用量', dataIndex: 'used', key: 'used', width: 100, render: (v: number) => `${v}人` },
    {
      title: '利用率',
      dataIndex: 'rate',
      key: 'rate',
      width: 150,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate * 100)}
          size="small"
          strokeColor={rate > 0.8 ? '#ff4d4f' : rate > 0.5 ? '#faad14' : '#52c41a'}
        />
      ),
    },
  ];

  const parkingColumns: ColumnsType<{ name: string; total: number; used: number; rate: number }> = [
    { title: '车位位置', dataIndex: 'name', key: 'name' },
    { title: '总车位', dataIndex: 'total', key: 'total', width: 100 },
    { title: '已使用', dataIndex: 'used', key: 'used', width: 100 },
    {
      title: '利用率',
      dataIndex: 'rate',
      key: 'rate',
      width: 150,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate * 100)}
          size="small"
          strokeColor={rate > 0.8 ? '#ff4d4f' : rate > 0.5 ? '#faad14' : '#52c41a'}
        />
      ),
    },
  ];

  return (
    <PageContainer title="资源利用率统计">
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="纳凉点利用率排名">
              <Table
                rowKey="name"
                columns={coolingColumns}
                dataSource={data.coolingUtilization}
                pagination={false}
                size="middle"
                scroll={{ y: 400 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="车位利用率统计">
              <Table
                rowKey="name"
                columns={parkingColumns}
                dataSource={data.parkingUtilization}
                pagination={false}
                size="middle"
                scroll={{ y: 400 }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  );
};

export default UtilizationStats;
