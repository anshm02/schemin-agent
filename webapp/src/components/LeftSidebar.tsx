import React from 'react';
import SettingsIcon from '../icons/settings_icon.svg?react';
import { imgIconLightning, imgIconGrid, imgIconBriefcase, imgIconStar } from '../constants/icons';
import { Tab } from '../types';

interface LeftSidebarProps {
  sidebarWidth: number;
  tabs: Tab[];
  activeTabId: string;
  hoveredTabId: string | null;
  editingTabId: string | null;
  editingTabName: string;
  onTabClick: (tabId: string) => void;
  onTabDoubleClick: (tabId: string) => void;
  onTabHover: (tabId: string | null) => void;
  onMenuClick: (tabId: string, position: { x: number; y: number }) => void;
  onAddTab: () => void;
  onEditingTabNameChange: (name: string) => void;
  onTabRename: () => void;
  onTabRenameCancel: () => void;
  onStartResize: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  sidebarWidth,
  tabs,
  activeTabId,
  hoveredTabId,
  editingTabId,
  editingTabName,
  onTabClick,
  onTabDoubleClick,
  onTabHover,
  onMenuClick,
  onAddTab,
  onEditingTabNameChange,
  onTabRename,
  onTabRenameCancel,
  onStartResize
}) => {
  return (
    <div style={{
      width: `${sidebarWidth}px`,
      backgroundColor: '#fbfbfa',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Sidebar Header */}
      <div style={{
        height: '57px',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src={imgIconLightning} alt="" style={{ width: '16px', height: '16px' }} />
        </div>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#101828',
          letterSpacing: '-0.1504px'
        }}>
          Automations
        </span>
      </div>

      {/* Navigation */}
      <div style={{
        padding: '8px',
        paddingTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        flex: 1,
        overflowY: 'auto'
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => onTabHover(tab.id)}
            onMouseLeave={() => onTabHover(null)}
          >
            {editingTabId === tab.id ? (
              <input
                type="text"
                value={editingTabName}
                onChange={(e) => onEditingTabNameChange(e.target.value)}
                onBlur={onTabRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onTabRename();
                  } else if (e.key === 'Escape') {
                    onTabRenameCancel();
                  }
                }}
                autoFocus
                style={{
                  width: '100%',
                  height: '32px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #000000',
                  padding: '0 8px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  color: '#101828',
                  outline: 'none'
                }}
              />
            ) : (
              <div
                onClick={() => onTabClick(tab.id)}
                onDoubleClick={() => onTabDoubleClick(tab.id)}
                style={{
                  height: '32px',
                  backgroundColor: activeTabId === tab.id ? '#f3f4f6' : 'transparent',
                  borderRadius: '8px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  overflow: 'hidden'
                }}>
                  <img 
                    src={activeTabId === tab.id ? imgIconGrid : (tab.name === 'Work' ? imgIconBriefcase : imgIconStar)} 
                    alt="" 
                    style={{ width: '16px', height: '16px', flexShrink: 0 }} 
                  />
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: activeTabId === tab.id ? '#101828' : '#4a5565',
                    letterSpacing: '-0.1504px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {tab.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {hoveredTabId !== tab.id && (
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '16px',
                      color: '#99a1af'
                    }}>
                      {tab.automations.length}
                    </span>
                  )}
                  {hoveredTabId === tab.id && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        onMenuClick(tab.id, { x: rect.right, y: rect.top });
                      }}
                      style={{
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{
                        width: '3px',
                        height: '3px',
                        backgroundColor: '#6b7280',
                        borderRadius: '50%',
                        marginRight: '2px'
                      }} />
                      <div style={{
                        width: '3px',
                        height: '3px',
                        backgroundColor: '#6b7280',
                        borderRadius: '50%',
                        marginRight: '2px'
                      }} />
                      <div style={{
                        width: '3px',
                        height: '3px',
                        backgroundColor: '#6b7280',
                        borderRadius: '50%'
                      }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add New Tab Button */}
        <div
          onClick={onAddTab}
          style={{
            height: '32px',
            borderRadius: '8px',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginTop: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '20px',
            color: '#9ca3af',
            letterSpacing: '-0.1504px'
          }}>
            New Tab
          </span>
        </div>
      </div>

      {/* Settings at Bottom */}
      <div style={{
        borderTop: '1px solid #e5e7eb',
        padding: '9px 8px'
      }}>
        <div style={{
          height: '32px',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
          <SettingsIcon style={{ width: '12px', height: '12px' }} />
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '20px',
            color: '#4a5565',
            letterSpacing: '-0.1504px'
          }}>
            Settings
          </span>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={onStartResize}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
};

