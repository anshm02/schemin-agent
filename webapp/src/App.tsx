import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Tab, AutomationCard } from './types';
import { parseAutomationFromText } from './utils/gptParser';

const LOGO_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 C30 10 20 25 20 40 C20 55 30 65 40 80 C45 90 50 95 50 95 C50 95 55 90 60 80 C70 65 80 55 80 40 C80 25 70 10 50 10 Z' fill='%23000000'/%3E%3C/svg%3E`;

function App() {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('schemin_tabs');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Job Applications', automations: [] }];
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    return localStorage.getItem('schemin_active_tab') || '1';
  });
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingCardData, setEditingCardData] = useState<Partial<AutomationCard>>({});
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  
  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    localStorage.setItem('schemin_tabs', JSON.stringify(tabs));
    
    fetch('http://localhost:3000/api/automations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ automations: tabs })
    }).catch(() => {});
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('schemin_active_tab', activeTabId);
  }, [activeTabId]);

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: `Tab ${tabs.length + 1}`,
      automations: []
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleTabDoubleClick = (tabId: string, tabName: string) => {
    setEditingTabId(tabId);
    setEditingTabName(tabName);
  };

  const handleTabRename = () => {
    if (!editingTabId || !editingTabName.trim()) return;
    
    setTabs(tabs.map(tab =>
      tab.id === editingTabId
        ? { ...tab, name: editingTabName }
        : tab
    ));
    
    setEditingTabId(null);
    setEditingTabName('');
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const parsedAutomation = await parseAutomationFromText(chatInput);
      
      const newAutomation: AutomationCard = {
        id: Date.now().toString(),
        title: parsedAutomation.title,
        sources: parsedAutomation.sources,
        extract: parsedAutomation.extract,
        storeTo: parsedAutomation.storeTo,
        position: { 
          x: 74 + (activeTab!.automations.length * 50),
          y: 127 + (activeTab!.automations.length * 50)
        },
        size: { width: 310, height: 363 }
      };

      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, automations: [...tab.automations, newAutomation] }
          : tab
      ));
      
      setChatInput('');
    } catch (error) {
      console.error('Error parsing automation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardDoubleClick = (cardId: string) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (card) {
      setEditingCard(cardId);
      setEditingCardData({
        title: card.title,
        sources: card.sources,
        extract: card.extract,
        storeTo: card.storeTo
      });
    }
  };

  const handleCardUpdate = () => {
    if (!editingCard) return;
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(card =>
              card.id === editingCard
                ? { ...card, ...editingCardData }
                : card
            )
          }
        : tab
    ));
    
    setEditingCard(null);
    setEditingCardData({});
  };

  const updateCardPosition = (cardId: string, x: number, y: number) => {
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(card =>
              card.id === cardId
                ? { ...card, position: { x, y } }
                : card
            )
          }
        : tab
    ));
  };

  const updateCardSize = (cardId: string, width: number, height: number) => {
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(card =>
              card.id === cardId
                ? { ...card, size: { width, height } }
                : card
            )
          }
        : tab
    ));
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f9f9f9',
      backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '73px',
        backgroundColor: '#ffffff',
        boxShadow: '0px 4px 0px 0px rgba(41, 41, 41, 0.25)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px',
        gap: '15px',
        zIndex: 1000
      }}>
        {/* Logo */}
        <img 
          src={LOGO_SVG}
          alt="Logo"
          style={{
            width: '38px',
            height: '38px'
          }}
        />

        {/* Tabs */}
        {tabs.map(tab => (
          editingTabId === tab.id ? (
            <input
              key={tab.id}
              type="text"
              value={editingTabName}
              onChange={(e) => setEditingTabName(e.target.value)}
              onBlur={handleTabRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTabRename();
                } else if (e.key === 'Escape') {
                  setEditingTabId(null);
                  setEditingTabName('');
                }
              }}
              autoFocus
              style={{
                width: '156px',
                height: '48px',
                backgroundColor: '#ffffff',
                borderRadius: '11px',
                border: '2px solid #5B5FED',
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                color: '#111827',
                outline: 'none'
              }}
            />
          ) : (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              onDoubleClick={() => handleTabDoubleClick(tab.id, tab.name)}
              style={{
                width: '156px',
                height: '48px',
                backgroundColor: activeTabId === tab.id ? '#ffffff' : '#f3f4f6',
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                color: activeTabId === tab.id ? '#111827' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {tab.name}
            </div>
          )
        ))}

        {/* Add Tab Button */}
        <div
          onClick={addNewTab}
          style={{
            width: '20px',
            height: '22px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280'
          }}
        >
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
            <path d="M10 5V17M4 11H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Main Canvas */}
      <div style={{
        position: 'absolute',
        top: '73px',
        left: 0,
        right: 0,
        bottom: '100px',
        overflow: 'auto'
      }}>
        {activeTab?.automations.map(card => (
          <Rnd
            key={card.id}
            position={card.position}
            size={card.size}
            onDragStop={(_e, d) => updateCardPosition(card.id, d.x, d.y)}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              updateCardSize(card.id, parseInt(ref.style.width), parseInt(ref.style.height));
              updateCardPosition(card.id, position.x, position.y);
            }}
            minWidth={310}
            minHeight={200}
            bounds="parent"
          >
            <div
              onDoubleClick={() => handleCardDoubleClick(card.id)}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'move',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Title */}
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                color: '#5d667a',
                textAlign: 'center',
                paddingBottom: '12px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                {card.title}
              </div>

              {/* Sources */}
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  minWidth: '80px'
                }}>
                  SOURCES:
                </span>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#374151',
                  flex: 1,
                  wordBreak: 'break-word'
                }}>
                  {card.sources}
                </span>
              </div>

              {/* Extract */}
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  minWidth: '80px'
                }}>
                  EXTRACT:
                </span>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#374151',
                  flex: 1,
                  wordBreak: 'break-word'
                }}>
                  {card.extract}
                </span>
              </div>

              {/* Store To */}
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  minWidth: '80px'
                }}>
                  STORE TO:
                </span>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#374151',
                  flex: 1,
                  wordBreak: 'break-word'
                }}>
                  {card.storeTo}
                </span>
              </div>
            </div>
          </Rnd>
        ))}
      </div>

      {/* Bottom Chat Input */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '463px',
        height: '54px',
        backgroundColor: '#fffefe',
        border: '1px solid #292929',
        borderRadius: '200px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 1000
      }}>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleChatSubmit();
            }
          }}
          placeholder="Describe your next automation..."
          disabled={isProcessing}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            color: '#111827',
            textAlign: 'center'
          }}
        />
      </div>

      {/* FAB Button */}
      <div
        onClick={handleChatSubmit}
        style={{
          position: 'absolute',
          bottom: '33px',
          right: '97px',
          width: '62px',
          height: '57px',
          backgroundColor: '#5B5FED',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          opacity: isProcessing ? 0.6 : 1,
          transition: 'all 0.2s',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(91, 95, 237, 0.4)'
        }}
      >
        <svg width="40" height="35" viewBox="0 0 40 35" fill="none">
          <path d="M20 8V27M10.5 17.5H29.5" stroke="#f5f5f5" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Edit Modal */}
      {editingCard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '20px',
              color: '#111827',
              marginBottom: '24px'
            }}>
              Edit Automation
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Title
                </label>
                <input
                  type="text"
                  value={editingCardData.title || ''}
                  onChange={(e) => setEditingCardData({ ...editingCardData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Sources
                </label>
                <input
                  type="text"
                  value={editingCardData.sources || ''}
                  onChange={(e) => setEditingCardData({ ...editingCardData, sources: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Extract
                </label>
                <input
                  type="text"
                  value={editingCardData.extract || ''}
                  onChange={(e) => setEditingCardData({ ...editingCardData, extract: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Store To
                </label>
                <input
                  type="text"
                  value={editingCardData.storeTo || ''}
                  onChange={(e) => setEditingCardData({ ...editingCardData, storeTo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#111827'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={handleCardUpdate}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#5B5FED',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setEditingCardData({});
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#e5e7eb',
                    color: '#111827',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

