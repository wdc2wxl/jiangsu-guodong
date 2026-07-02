import { ReactNode } from 'react';
import { Form, Button, Row, Col, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

interface SearchFormProps {
  form?: any;
  onSearch?: (values: any) => void;
  onReset?: () => void;
  children: ReactNode;
  loading?: boolean;
  colSpan?: number;
}

const SearchForm = ({
  form,
  onSearch,
  onReset,
  children,
  loading = false,
  colSpan = 6,
}: SearchFormProps) => {
  const [formInstance] = Form.useForm(form);
  const internalForm = form || formInstance;

  const handleSearch = () => {
    internalForm
      .validateFields()
      .then((values: any) => {
        onSearch?.(values);
      })
      .catch(() => {});
  };

  const handleReset = () => {
    internalForm.resetFields();
    onReset?.();
  };

  // 计算按钮列的span，使其与前面对齐
  const childCount = Array.isArray(children) ? children.length : 1;
  const remainingSpan = 24 - (childCount * colSpan) % 24;
  const buttonSpan = remainingSpan >= colSpan ? remainingSpan : 24;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 4,
        padding: '16px 16px 0 16px',
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <Form form={internalForm} layout="horizontal" style={{ width: '100%' }} className="compact-form">
        <Row gutter={[16, 8]}>
          {Array.isArray(children) ? (
            children.map((child, index) => (
              <Col span={colSpan} key={index}>
                {child}
              </Col>
            ))
          ) : (
            <Col span={colSpan}>{children}</Col>
          )}
          <Col span={buttonSpan} style={{ textAlign: 'right', paddingBottom: 8 }}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
              >
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
      <style>{`
        .compact-form .ant-form-item { margin-bottom: 8px; }
      `}</style>
    </div>
  );
};

export default SearchForm;
