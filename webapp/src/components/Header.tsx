import React from 'react';
import { imgIconSearch, imgIconPlus } from '../constants/icons';

interface HeaderProps {
  showChat: boolean;
  onNewAutomation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showChat,
  onNewAutomation
}) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      height: '57px',
      display: 'flex',
      alignItems: 'center',
      padding: '12px 24px',
      justifyContent: 'space-between'
    }}>
      {/* Search Input */}
      <div style={{
        position: 'relative',
        width: '448px',
        height: '32px'
      }}>
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '8px',
          width: '16px',
          height: '16px'
        }}>
          <img src={imgIconSearch} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <input
          type="text"
          placeholder="Search automations..."
          disabled
          style={{
            width: '100%',
            height: '32px',
            backgroundColor: '#f3f3f5',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            paddingLeft: '36px',
            paddingRight: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#717182',
            outline: 'none'
          }}
        />
      </div>

      {/* New Automation Button */}
      <button
        onClick={onNewAutomation}
        style={{
          backgroundColor: '#101828',
          borderRadius: '8px',
          height: '32px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '9.55px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)'
        }}
      >
        <img src={imgIconPlus} alt="" style={{ width: '16px', height: '16px' }} />
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '14px',
          color: '#ffffff',
          letterSpacing: '-0.1504px'
        }}>
          New Automation
        </span>
      </button>
    </div>
  );
};

