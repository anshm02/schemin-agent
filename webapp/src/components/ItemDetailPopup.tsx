import React from 'react';

interface ItemDetailPopupProps {
  item: {
    id: string;
    url: string;
    title: string;
    date: string;
    content: string;
  };
  type: 'pending' | 'saved';
  onClose: () => void;
  onApprove?: (itemId: string) => void;
  onReject?: (itemId: string) => void;
}

export const ItemDetailPopup: React.FC<ItemDetailPopupProps> = ({
  item,
  type,
  onClose,
  onApprove,
  onReject
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        zIndex: 2501,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Popup Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{
            flex: 1,
            marginRight: '16px'
          }}>
            <h3 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              color: '#101828',
              margin: '0 0 8px 0'
            }}>
              {item.title}
            </h3>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#6a7282',
              marginBottom: '4px'
            }}>
              {item.url}
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              {type === 'pending' ? 'Pending' : 'Saved'} · {item.date}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Popup Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#374151',
            whiteSpace: 'pre-wrap'
          }}>
            {item.content}
          </div>
        </div>

        {/* Popup Footer */}
        {type === 'pending' && onApprove && onReject && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                onReject(item.id);
                onClose();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                color: '#dc2626',
                border: '1px solid #dc2626',
                borderRadius: '6px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Reject
            </button>
            <button
              onClick={() => {
                onApprove(item.id);
                onClose();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </>
  );
};

