import { ReactNode } from 'react';
import { Typography, Space } from 'antd';

const { Title } = Typography;

interface PageContainerProps {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
}

const PageContainer = ({ title, extra, children }: PageContainerProps) => {
  return (
    <div className="page-container">
      {title && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          {extra && <Space>{extra}</Space>}
        </div>
      )}
      {children}
    </div>
  );
};

export default PageContainer;
