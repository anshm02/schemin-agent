import React from 'react';
import { AutomationCard } from '../types';
import { imgIconFile } from '../constants/icons';
import { toTitleCase } from '../utils/textUtils';

interface DetailSidebarProps {
  card: AutomationCard;
  detailWidth: number;
  detailEditingSource: { index: number; value: string } | null;
  detailEditingCollect: { index: number; value: string } | null;
  detailAddingSource: boolean;
  detailAddingCollect: boolean;
  detailNewSourceValue: string;
  detailNewCollectValue: string;
  hoveredSourceIndex: number | null;
  hoveredCollectIndex: number | null;
  pendingItems: any[];
  savedItems: any[];
  pickerApiLoaded: boolean;
  accessToken: string | null;
  onClose: () => void;
  onStartResize: () => void;
  onSetDetailEditingSource: (value: { index: number; value: string } | null) => void;
  onSetDetailEditingCollect: (value: { index: number; value: string } | null) => void;
  onSetDetailAddingSource: (value: boolean) => void;
  onSetDetailAddingCollect: (value: boolean) => void;
  onSetDetailNewSourceValue: (value: string) => void;
  onSetDetailNewCollectValue: (value: string) => void;
  onSetHoveredSourceIndex: (value: number | null) => void;
  onSetHoveredCollectIndex: (value: number | null) => void;
  onUpdateDetailSource: (cardId: string, index: number, newValue: string) => void;
  onDeleteDetailSource: (cardId: string, index: number) => void;
  onAddDetailSource: (cardId: string, value: string) => void;
  onUpdateDetailCollect: (cardId: string, index: number, newValue: string) => void;
  onDeleteDetailCollect: (cardId: string, index: number) => void;
  onAddDetailCollect: (cardId: string, value: string) => void;
  onItemClick: (type: 'pending' | 'saved', item: any) => void;
  onSendAll: () => void;
  onApproveItem: (itemId: string) => void;
  onRejectItem: (itemId: string) => void;
  onUpdateStoreTo: (cardId: string, fileId: string, fileName: string) => void;
  onBeforePickerOpen: () => void;
}

export const DetailSidebar: React.FC<DetailSidebarProps> = ({
  card,
  detailWidth,
  detailEditingSource,
  detailEditingCollect,
  detailAddingSource,
  detailAddingCollect,
  detailNewSourceValue,
  detailNewCollectValue,
  hoveredSourceIndex,
  hoveredCollectIndex,
  pendingItems,
  savedItems,
  pickerApiLoaded,
  accessToken,
  onClose,
  onStartResize,
  onSetDetailEditingSource,
  onSetDetailEditingCollect,
  onSetDetailAddingSource,
  onSetDetailAddingCollect,
  onSetDetailNewSourceValue,
  onSetDetailNewCollectValue,
  onSetHoveredSourceIndex,
  onSetHoveredCollectIndex,
  onUpdateDetailSource,
  onDeleteDetailSource,
  onAddDetailSource,
  onUpdateDetailCollect,
  onDeleteDetailCollect,
  onAddDetailCollect,
  onItemClick,
  onSendAll,
  onApproveItem,
  onRejectItem,
  onUpdateStoreTo,
  onBeforePickerOpen
}) => {
  const openFilePicker = () => {
    if (!pickerApiLoaded || !accessToken) {
      alert('Google Picker is not ready yet. Please try again.');
      return;
    }

    const picker = new (window as any).google.picker.PickerBuilder()
      .addView((window as any).google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
      .setCallback((data: any) => {
        if (data.action === (window as any).google.picker.Action.PICKED) {
          const file = data.docs[0];
          onUpdateStoreTo(card.id, file.id, file.name);
        }
      })
      .build();

    onBeforePickerOpen();

    picker.setVisible(true);
    setTimeout(() => {
      const pickerDialog = document.querySelector('.picker-dialog');
      if (pickerDialog) {
        (pickerDialog as HTMLElement).style.zIndex = '10000';
      }
      const pickerDialogBg = document.querySelector('.picker-dialog-bg');
      if (pickerDialogBg) {
        (pickerDialogBg as HTMLElement).style.zIndex = '9999';
      }
    }, 100);
  };
  return (
    <>
      <div style={{
        position: 'fixed',
        right: 0,
        top: '57px',
        bottom: 0,
        width: `${detailWidth}px`,
        backgroundColor: '#ffffff',
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s ease-out'
      }}>
        {/* Resize Handle */}
        <div
          onMouseDown={onStartResize}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            zIndex: 10
          }}
        />
        
        {/* Header */}
        <div style={{
          padding: '32px 32px 0 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '24px',
              lineHeight: '1.2',
              color: '#101828',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              {card.title}
            </h2>
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: card.isActive !== false ? '#00c950' : '#d1d5dc'
            }} />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '13px',
              color: '#6a7282'
            }}>
              {card.isActive !== false ? 'Active' : 'Paused'} · Last Run: {card.lastRun || 'Never'}
            </span>
          </div>
          <div style={{
            width: '75%',
            height: '1px',
            backgroundColor: '#e5e7eb'
          }} />
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
          }}>
            {/* Sources */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#101828',
                  margin: 0
                }}>
                  Sources
                </h3>
                <button
                  onClick={() => {
                    onSetDetailAddingSource(true);
                    onSetDetailNewSourceValue('');
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                maxHeight: '240px',
                overflowY: 'auto',
                padding: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {detailAddingSource && (
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #000000'
                    }}>
                      <input
                        type="text"
                        value={detailNewSourceValue}
                        onChange={(e) => onSetDetailNewSourceValue(e.target.value)}
                        onBlur={() => {
                          if (detailNewSourceValue.trim()) {
                            onAddDetailSource(card.id, detailNewSourceValue);
                          }
                          onSetDetailAddingSource(false);
                          onSetDetailNewSourceValue('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (detailNewSourceValue.trim()) {
                              onAddDetailSource(card.id, detailNewSourceValue);
                            }
                            onSetDetailAddingSource(false);
                            onSetDetailNewSourceValue('');
                          } else if (e.key === 'Escape') {
                            onSetDetailAddingSource(false);
                            onSetDetailNewSourceValue('');
                          }
                        }}
                        autoFocus
                        placeholder="Enter source URL"
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#111827',
                          backgroundColor: 'transparent'
                        }}
                      />
                    </div>
                  )}
                  {card.sources.split(',').map((source, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        cursor: detailEditingSource?.index === idx ? 'default' : 'pointer',
                        border: detailEditingSource?.index === idx ? '1px solid #000000' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (detailEditingSource?.index !== idx) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                        onSetHoveredSourceIndex(idx);
                      }}
                      onMouseLeave={(e) => {
                        if (detailEditingSource?.index !== idx) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                        onSetHoveredSourceIndex(null);
                      }}
                      onClick={() => {
                        if (detailEditingSource?.index !== idx) {
                          onSetDetailEditingSource({ index: idx, value: source.trim() });
                        }
                      }}
                    >
                      {detailEditingSource?.index === idx ? (
                        <input
                          type="text"
                          value={detailEditingSource.value}
                          onChange={(e) => onSetDetailEditingSource({ index: idx, value: e.target.value })}
                          onBlur={() => {
                            if (detailEditingSource.value.trim()) {
                              onUpdateDetailSource(card.id, idx, detailEditingSource.value.trim());
                            }
                            onSetDetailEditingSource(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (detailEditingSource.value.trim()) {
                                onUpdateDetailSource(card.id, idx, detailEditingSource.value.trim());
                              }
                              onSetDetailEditingSource(null);
                            } else if (e.key === 'Escape') {
                              onSetDetailEditingSource(null);
                            }
                          }}
                          autoFocus
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#111827',
                            backgroundColor: 'transparent',
                            paddingRight: '32px'
                          }}
                        />
                      ) : (
                        <span style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#111827',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingRight: '32px'
                        }}>
                          {source.trim()}
                        </span>
                      )}
                      {hoveredSourceIndex === idx && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDetailSource(card.id, idx);
                            onSetDetailEditingSource(null);
                          }}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            width: '16px',
                            height: '16px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M9 3L3 9M3 3L9 9" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Collecting */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#101828',
                  margin: 0
                }}>
                  Collecting
                </h3>
                <button
                  onClick={() => {
                    onSetDetailAddingCollect(true);
                    onSetDetailNewCollectValue('');
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                maxHeight: '240px',
                overflowY: 'auto',
                padding: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {detailAddingCollect && (
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #000000'
                    }}>
                      <input
                        type="text"
                        value={detailNewCollectValue}
                        onChange={(e) => onSetDetailNewCollectValue(e.target.value)}
                        onBlur={() => {
                          if (detailNewCollectValue.trim()) {
                            onAddDetailCollect(card.id, detailNewCollectValue);
                          }
                          onSetDetailAddingCollect(false);
                          onSetDetailNewCollectValue('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (detailNewCollectValue.trim()) {
                              onAddDetailCollect(card.id, detailNewCollectValue);
                            }
                            onSetDetailAddingCollect(false);
                            onSetDetailNewCollectValue('');
                          } else if (e.key === 'Escape') {
                            onSetDetailAddingCollect(false);
                            onSetDetailNewCollectValue('');
                          }
                        }}
                        autoFocus
                        placeholder="Enter field name"
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#111827',
                          backgroundColor: 'transparent'
                        }}
                      />
                    </div>
                  )}
                  {card.extract.split(',').map((field, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        cursor: detailEditingCollect?.index === idx ? 'default' : 'pointer',
                        border: detailEditingCollect?.index === idx ? '1px solid #000000' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (detailEditingCollect?.index !== idx) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                        onSetHoveredCollectIndex(idx);
                      }}
                      onMouseLeave={(e) => {
                        if (detailEditingCollect?.index !== idx) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                        onSetHoveredCollectIndex(null);
                      }}
                      onClick={() => {
                        if (detailEditingCollect?.index !== idx) {
                          onSetDetailEditingCollect({ index: idx, value: field.trim() });
                        }
                      }}
                    >
                      {detailEditingCollect?.index === idx ? (
                        <input
                          type="text"
                          value={detailEditingCollect.value}
                          onChange={(e) => onSetDetailEditingCollect({ index: idx, value: e.target.value })}
                          onBlur={() => {
                            if (detailEditingCollect.value.trim()) {
                              onUpdateDetailCollect(card.id, idx, detailEditingCollect.value.trim());
                            }
                            onSetDetailEditingCollect(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (detailEditingCollect.value.trim()) {
                                onUpdateDetailCollect(card.id, idx, detailEditingCollect.value.trim());
                              }
                              onSetDetailEditingCollect(null);
                            } else if (e.key === 'Escape') {
                              onSetDetailEditingCollect(null);
                            }
                          }}
                          autoFocus
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#111827',
                            backgroundColor: 'transparent',
                            paddingRight: '32px'
                          }}
                        />
                      ) : (
                        <span style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#111827',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingRight: '32px'
                        }}>
                          {toTitleCase(field.trim())}
                        </span>
                      )}
                      {hoveredCollectIndex === idx && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDetailCollect(card.id, idx);
                            onSetDetailEditingCollect(null);
                          }}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            width: '16px',
                            height: '16px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M9 3L3 9M3 3L9 9" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Store To */}
            <div>
              <h3 style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                color: '#101828',
                margin: '0 0 12px 0'
              }}>
                Store To
              </h3>
              <div 
                onClick={openFilePicker}
                style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '32px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
              >
                <img src={imgIconFile} alt="" style={{ width: '16px', height: '16px' }} />
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#111827'
                }}>
                  {card.googleFileName || card.storeTo}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '1px',
                backgroundColor: '#e5e7eb',
                margin: '0 0 32px 0'
              }} />
            </div>

            {/* Pending Items */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#101828',
                  margin: 0
                }}>
                  Pending Items
                </h3>
                <button
                  onClick={onSendAll}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#4f39f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Send All
                </button>
              </div>
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                maxHeight: '240px',
                overflowY: 'auto',
                padding: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px'
                      }}
                    >
                      <div 
                        onClick={() => onItemClick('pending', item)}
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}>
                        <div style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '4px'
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px',
                          color: '#6a7282',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.url}
                        </div>
                        <div style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px',
                          color: '#9ca3af',
                          marginTop: '2px'
                        }}>
                          {item.date}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexShrink: 0
                      }}>
                        <button
                          onClick={() => onApproveItem(item.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: '#dcfce7',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13 4L6 11L3 8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => onRejectItem(item.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: '#fee2e2',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Saved Items */}
            <div>
              <h3 style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                color: '#101828',
                margin: '0 0 12px 0'
              }}>
                Saved Items
              </h3>
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                maxHeight: '240px',
                overflowY: 'auto',
                padding: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onItemClick('saved', item)}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#111827',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '4px'
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: '#6a7282',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.url}
                      </div>
                      <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: '#9ca3af',
                        marginTop: '2px'
                      }}>
                        {item.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

