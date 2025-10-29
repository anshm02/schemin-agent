import React from 'react';

interface TabMenuProps {
  menuTabId: string;
  menuPosition: { x: number; y: number };
  tabs: any[];
  onClose: () => void;
  onRename: (tabId: string) => void;
  onDelete: (tabId: string) => void;
}

export const TabMenu: React.FC<TabMenuProps> = ({
  menuTabId,
  menuPosition,
  tabs,
  onClose,
  onRename,
  onDelete
}) => {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
      />
      <div style={{
        position: 'fixed',
        left: `${menuPosition.x + 8}px`,
        top: `${menuPosition.y}px`,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '4px',
        minWidth: '140px',
        zIndex: 1000
      }}>
        <div
          onClick={() => onRename(menuTabId)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '4px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Rename
        </div>
        {tabs.length > 1 && (
          <div
            onClick={() => onDelete(menuTabId)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Delete
          </div>
        )}
      </div>
    </>
  );
};

