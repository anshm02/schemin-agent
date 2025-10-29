import React from 'react';
import SourceIcon from '../icons/source_icon.svg?react';
import CollectIcon from '../icons/collect_icon.svg?react';
import { imgIconFile, imgIconClock, imgIconChevron } from '../constants/icons';
import { AutomationCard as AutomationCardType } from '../types';
import { toTitleCase, getInputWidth, renderSourcesOrCollections } from '../utils/textUtils';

interface AutomationCardProps {
  card: AutomationCardType;
  expandedSources: Set<string>;
  expandedCollections: Set<string>;
  editingCardTitle: { cardId: string; value: string } | null;
  editingSource: { cardId: string; index: number; value: string } | null;
  editingCollect: { cardId: string; index: number; value: string } | null;
  addingSource: { cardId: string; value: string } | null;
  addingCollect: { cardId: string; value: string } | null;
  pickerApiLoaded: boolean;
  accessToken: string | null;
  onDoubleClick: () => void;
  onToggleAutomation: () => void;
  onUpdateCardTitle: (newTitle: string) => void;
  onStartEditCardTitle: (value: string) => void;
  onCancelEditCardTitle: () => void;
  onUpdateSource: (index: number, newValue: string) => void;
  onDeleteSource: (index: number) => void;
  onStartEditSource: (index: number, value: string) => void;
  onSetEditingSource: (value: { cardId: string; index: number; value: string } | null) => void;
  onUpdateCollect: (index: number, newValue: string) => void;
  onDeleteCollect: (index: number) => void;
  onStartEditCollect: (index: number, value: string) => void;
  onSetEditingCollect: (value: { cardId: string; index: number; value: string } | null) => void;
  onAddSource: (value: string) => void;
  onStartAddingSource: () => void;
  onSetAddingSource: (value: { cardId: string; value: string } | null) => void;
  onAddCollect: (value: string) => void;
  onStartAddingCollect: () => void;
  onSetAddingCollect: (value: { cardId: string; value: string } | null) => void;
  onToggleExpanded: (type: 'source' | 'collect') => void;
  onOpenDetail: () => void;
  onUpdateStoreTo: (fileId: string, fileName: string) => void;
}

export const AutomationCard: React.FC<AutomationCardProps> = ({
  card,
  expandedSources,
  expandedCollections,
  editingCardTitle,
  editingSource,
  editingCollect,
  addingSource,
  addingCollect,
  pickerApiLoaded,
  accessToken,
  onDoubleClick,
  onToggleAutomation,
  onUpdateCardTitle,
  onStartEditCardTitle,
  onCancelEditCardTitle,
  onUpdateSource,
  onDeleteSource,
  onStartEditSource,
  onSetEditingSource,
  onUpdateCollect,
  onDeleteCollect,
  onStartEditCollect,
  onSetEditingCollect,
  onAddSource,
  onStartAddingSource,
  onSetAddingSource,
  onAddCollect,
  onStartAddingCollect,
  onSetAddingCollect,
  onToggleExpanded,
  onOpenDetail,
  onUpdateStoreTo
}) => {
  const sources = card.sources.split(',').map(s => s.trim());
  const collections = card.extract.split(',').map(s => s.trim());
  const { itemsToShow: sourcesToShow, hiddenCount: hiddenSources } = renderSourcesOrCollections(card.id, sources, 'source', 333, expandedSources, expandedCollections);
  const { itemsToShow: collectionsToShow, hiddenCount: hiddenCollections } = renderSourcesOrCollections(card.id, collections, 'collect', 333, expandedSources, expandedCollections);

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
          onUpdateStoreTo(file.id, file.name);
        }
      })
      .build();

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
    <div
      data-automation-card
      onDoubleClick={onDoubleClick}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '21px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        cursor: 'pointer'
      }}
    >
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {editingCardTitle?.cardId === card.id ? (
              <input
                type="text"
                value={editingCardTitle.value}
                onChange={(e) => onStartEditCardTitle(e.target.value)}
                onBlur={() => {
                  if (editingCardTitle.value.trim()) {
                    onUpdateCardTitle(editingCardTitle.value.trim());
                  }
                  onCancelEditCardTitle();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editingCardTitle.value.trim()) {
                      onUpdateCardTitle(editingCardTitle.value.trim());
                    }
                    onCancelEditCardTitle();
                  } else if (e.key === 'Escape') {
                    onCancelEditCardTitle();
                  }
                }}
                autoFocus
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '27px',
                  color: '#101828',
                  letterSpacing: '-0.4395px',
                  margin: 0,
                  border: '1px solid #000000',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  outline: 'none'
                }}
              />
            ) : (
              <h3 
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartEditCardTitle(card.title);
                }}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '27px',
                  color: '#101828',
                  letterSpacing: '-0.4395px',
                  margin: 0,
                  cursor: 'pointer'
                }}
              >
                {card.title}
              </h3>
            )}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: card.isActive !== false ? '#00c950' : '#d1d5dc'
            }} />
          </div>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px',
            color: '#6a7282',
            margin: 0
          }}>
            {card.isActive === false ? 'Paused' : `Last Run: ${card.lastRun || 'Never'}`}
          </p>
        </div>

        {/* Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAutomation();
          }}
          style={{
            width: '32px',
            height: '18.398px',
            backgroundColor: card.isActive !== false ? '#4F39F6' : '#e5e7eb',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            padding: 0,
            transition: 'background-color 0.2s'
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute',
            top: '1px',
            left: card.isActive !== false ? '15px' : '1px',
            transition: 'left 0.2s',
            boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)'
          }} />
        </button>
      </div>

      {/* Sources Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <SourceIcon style={{ width: '12px', height: '12px' }} />
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px',
            color: '#6a7282'
          }}>
            Sources
          </span>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center'
        }}>
          {sources.slice(0, sourcesToShow).map((source, idx) => (
            editingSource?.cardId === card.id && editingSource.index === idx ? (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  value={editingSource.value}
                  onChange={(e) => onSetEditingSource({ ...editingSource, value: e.target.value })}
                  onBlur={(e) => {
                    if (!e.relatedTarget || !(e.relatedTarget as HTMLElement).classList.contains('delete-btn')) {
                      if (editingSource.value.trim()) {
                        onUpdateSource(idx, editingSource.value.trim());
                      }
                      onSetEditingSource(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingSource.value.trim()) {
                        onUpdateSource(idx, editingSource.value.trim());
                      }
                      onSetEditingSource(null);
                    } else if (e.key === 'Escape') {
                      onSetEditingSource(null);
                    }
                  }}
                  autoFocus
                  style={{
                    backgroundColor: '#eceef2',
                    borderRadius: '8px',
                    padding: '3px 28px 3px 9px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: '#030213',
                    border: '1px solid #000000',
                    outline: 'none',
                    width: `${getInputWidth(editingSource.value)}px`
                  }}
                />
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSource(idx);
                    onSetEditingSource(null);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
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
              </div>
            ) : (
              <div
                key={idx}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartEditSource(idx, source);
                }}
                style={{
                  backgroundColor: '#eceef2',
                  borderRadius: '8px',
                  padding: '3px 9px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#030213',
                  cursor: 'pointer',
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {source}
              </div>
            )
          ))}
          {hiddenSources > 0 && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (expandedSources.has(card.id)) {
                  onOpenDetail();
                } else {
                  onToggleExpanded('source');
                }
              }}
              style={{
                backgroundColor: '#eceef2',
                borderRadius: '8px',
                padding: '3px 9px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
                color: '#030213',
                cursor: 'pointer'
              }}
            >
              {expandedSources.has(card.id) ? `...+${hiddenSources}` : `+${hiddenSources}`}
            </div>
          )}
          {addingSource?.cardId === card.id ? (
            <input
              type="text"
              value={addingSource.value}
              onChange={(e) => onSetAddingSource({ cardId: card.id, value: e.target.value })}
              onBlur={() => {
                if (addingSource.value.trim()) {
                  onAddSource(addingSource.value);
                }
                onSetAddingSource(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (addingSource.value.trim()) {
                    onAddSource(addingSource.value);
                  }
                  onSetAddingSource(null);
                } else if (e.key === 'Escape') {
                  onSetAddingSource(null);
                }
              }}
              autoFocus
              placeholder="New source"
              style={{
                backgroundColor: '#eceef2',
                borderRadius: '8px',
                padding: '3px 9px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
                color: '#030213',
                border: '1px solid #000000',
                outline: 'none',
                width: `${getInputWidth(addingSource.value || 'New source')}px`
              }}
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartAddingSource();
              }}
              style={{
                width: '22px',
                height: '22px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V10M2 6H10" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Collecting Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CollectIcon style={{ width: '12px', height: '12px' }} />
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px',
            color: '#6a7282'
          }}>
            Collecting
          </span>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center'
        }}>
          {collections.slice(0, collectionsToShow).map((field, idx) => (
            editingCollect?.cardId === card.id && editingCollect.index === idx ? (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  value={editingCollect.value}
                  onChange={(e) => onSetEditingCollect({ ...editingCollect, value: e.target.value })}
                  onBlur={(e) => {
                    if (!e.relatedTarget || !(e.relatedTarget as HTMLElement).classList.contains('delete-btn')) {
                      if (editingCollect.value.trim()) {
                        onUpdateCollect(idx, editingCollect.value.trim());
                      }
                      onSetEditingCollect(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingCollect.value.trim()) {
                        onUpdateCollect(idx, editingCollect.value.trim());
                      }
                      onSetEditingCollect(null);
                    } else if (e.key === 'Escape') {
                      onSetEditingCollect(null);
                    }
                  }}
                  autoFocus
                  style={{
                    border: '1px solid #000000',
                    borderRadius: '8px',
                    padding: '3px 28px 3px 9px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: '#030213',
                    outline: 'none',
                    width: `${getInputWidth(editingCollect.value)}px`
                  }}
                />
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollect(idx);
                    onSetEditingCollect(null);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
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
              </div>
            ) : (
              <div
                key={idx}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartEditCollect(idx, field);
                }}
                style={{
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  padding: '3px 9px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#030213',
                  cursor: 'pointer',
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {toTitleCase(field)}
              </div>
            )
          ))}
          {hiddenCollections > 0 && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (expandedCollections.has(card.id)) {
                  onOpenDetail();
                } else {
                  onToggleExpanded('collect');
                }
              }}
              style={{
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                padding: '3px 9px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
                color: '#030213',
                cursor: 'pointer'
              }}
            >
              {expandedCollections.has(card.id) ? `...+${hiddenCollections}` : `+${hiddenCollections}`}
            </div>
          )}
          {addingCollect?.cardId === card.id ? (
            <input
              type="text"
              value={addingCollect.value}
              onChange={(e) => onSetAddingCollect({ cardId: card.id, value: e.target.value })}
              onBlur={() => {
                if (addingCollect.value.trim()) {
                  onAddCollect(addingCollect.value);
                }
                onSetAddingCollect(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (addingCollect.value.trim()) {
                    onAddCollect(addingCollect.value);
                  }
                  onSetAddingCollect(null);
                } else if (e.key === 'Escape') {
                  onSetAddingCollect(null);
                }
              }}
              autoFocus
              placeholder="New field"
              style={{
                border: '1px solid #000000',
                borderRadius: '8px',
                padding: '3px 9px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
                color: '#030213',
                outline: 'none',
                width: `${getInputWidth(addingCollect.value || 'New field')}px`
              }}
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartAddingCollect();
              }}
              style={{
                width: '22px',
                height: '22px',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V10M2 6H10" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #f3f4f6',
        paddingTop: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <img src={imgIconFile} alt="" style={{ width: '14px', height: '14px' }} />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#101828',
              letterSpacing: '-0.1504px'
            }}>
              15
            </span>
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '16px',
              color: '#6a7282'
            }}>
              Saved Items
            </span>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <img src={imgIconClock} alt="" style={{ width: '14px', height: '14px' }} />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '16px',
              color: '#6a7282',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '120px'
            }}>
              {card.googleFileName || card.storeTo}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px',
            color: '#6a7282'
          }}>
            Details
          </span>
          <img src={imgIconChevron} alt="" style={{ width: '12px', height: '12px' }} />
        </button>
      </div>
    </div>
  );
};

