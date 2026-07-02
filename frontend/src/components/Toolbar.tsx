import { ReactNode } from 'react';
import { Button, Space } from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
} from '@ant-design/icons';

interface ToolbarProps {
  onAdd?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  addText?: string;
  children?: ReactNode;
}

const Toolbar = ({
  onAdd,
  onImport,
  onExport,
  addText = '新增',
  children,
}: ToolbarProps) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 4,
        padding: '10px 16px',
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Space>
        {onAdd && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            {addText}
          </Button>
        )}
        {onImport && (
          <Button
            style={{ background: '#5C74BD', borderColor: '#5C74BD', color: '#fff' }}
            icon={<ImportOutlined />}
            onClick={onImport}
          >
            导入
          </Button>
        )}
        {onExport && (
          <Button
            style={{ background: '#C83D02', borderColor: '#C83D02', color: '#fff' }}
            icon={<ExportOutlined />}
            onClick={onExport}
          >
            导出
          </Button>
        )}
        {children}
      </Space>
    </div>
  );
};

export default Toolbar;
