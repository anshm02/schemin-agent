import { useState, useEffect, useRef } from 'react';
import { Tab, AutomationCard } from './types';
import { handleConversation, ChatMessage } from './utils/gptParser';

const imgIconLightning = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M8.5 1L3 9H8L7.5 15L13 7H8L8.5 1Z' stroke='%23101828' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";
const imgIconGrid = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Crect x='2' y='2' width='5' height='5' stroke='%23101828' stroke-width='1.5' fill='none'/%3E%3Crect x='9' y='2' width='5' height='5' stroke='%23101828' stroke-width='1.5' fill='none'/%3E%3Crect x='2' y='9' width='5' height='5' stroke='%23101828' stroke-width='1.5' fill='none'/%3E%3Crect x='9' y='9' width='5' height='5' stroke='%23101828' stroke-width='1.5' fill='none'/%3E%3C/svg%3E";
const imgIconBriefcase = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M13 5H3C2.44772 5 2 5.44772 2 6V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V6C14 5.44772 13.5523 5 13 5Z' stroke='%234a5565' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3Cpath d='M10 5V4C10 3.44772 9.55228 3 9 3H7C6.44772 3 6 3.44772 6 4V5' stroke='%234a5565' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const imgIconStar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M8 2L9.5 6.5H14L10.5 9.5L12 14L8 11L4 14L5.5 9.5L2 6.5H6.5L8 2Z' stroke='%234a5565' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";
const imgIconSettings = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Ccircle cx='8' cy='8' r='2' stroke='%234a5565' stroke-width='1.5' fill='none'/%3E%3Cpath d='M13 8C13 8 12.5 6 11 6M11 6C10 6 9.5 7 8 7M11 6V4M3 8C3 8 3.5 6 5 6M5 6C6 6 6.5 7 8 7M5 6V4M8 7V2M13 8C13 8 12.5 10 11 10M11 10C10 10 9.5 9 8 9M11 10V12M3 8C3 8 3.5 10 5 10M5 10C6 10 6.5 9 8 9M5 10V12M8 9V14' stroke='%234a5565' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const imgIconSearch = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z' stroke='%23717182' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M14 14L10.5 10.5' stroke='%23717182' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const imgIconPlus = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M8 3.5V12.5M3.5 8H12.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const imgIconLink = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M9.5 2.5L10.5 3.5M4 8L2.5 9.5C1.67157 10.3284 1.67157 11.6716 2.5 12.5C3.32843 13.3284 4.67157 13.3284 5.5 12.5L7 11M8 4L9.5 2.5C10.3284 1.67157 11.6716 1.67157 12.5 2.5C13.3284 3.32843 13.3284 4.67157 12.5 5.5L11 7' stroke='%236a7282' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const imgIconCollect = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 3.5H10M2 8.5H10M5 1V11M7 1V11' stroke='%236a7282' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const imgIconFile = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M8 1H3C2.44772 1 2 1.44772 2 2V12C2 12.5523 2.44772 13 3 13H11C11.5523 13 12 12.5523 12 12V5M8 1L12 5M8 1V5H12' stroke='%23101828' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const imgIconClock = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Ccircle cx='7' cy='7' r='6' stroke='%236a7282' stroke-width='1.5'/%3E%3Cpath d='M7 3.5V7L9 9' stroke='%236a7282' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E";
const imgIconChevron = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M4 3L8 6L4 9' stroke='%236a7282' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('schemin_tabs');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'All Automations', automations: [] }];
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    return localStorage.getItem('schemin_active_tab') || '1';
  });
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingCardData, setEditingCardData] = useState<Partial<AutomationCard>>({});
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [menuTabId, setMenuTabId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [editingCardTitle, setEditingCardTitle] = useState<{ cardId: string; value: string } | null>(null);
  const [editingSource, setEditingSource] = useState<{ cardId: string; index: number; value: string } | null>(null);
  const [editingCollect, setEditingCollect] = useState<{ cardId: string; index: number; value: string } | null>(null);
  const [addingSource, setAddingSource] = useState<{ cardId: string; value: string } | null>(null);
  const [addingCollect, setAddingCollect] = useState<{ cardId: string; value: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const activeTab = tabs.find(t => t.id === activeTabId);

  const toTitleCase = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  useEffect(() => {
    const loadPickerApi = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = () => {
        window.gapi.load('picker', () => {
          setPickerApiLoaded(true);
        });
      };
      document.body.appendChild(script1);
    };

    const getAccessToken = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/google-token', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
      } catch (error) {
        console.error('Failed to get access token:', error);
      }
    };

    loadPickerApi();
    getAccessToken();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(200, Math.min(500, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isResizingChat) {
        const newWidth = Math.max(300, Math.min(600, window.innerWidth - e.clientX));
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingChat(false);
    };

    if (isResizingSidebar || isResizingChat) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingSidebar, isResizingChat]);

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: `Tab ${tabs.length + 1}`,
      automations: []
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const deleteTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const filteredTabs = tabs.filter(t => t.id !== tabId);
    setTabs(filteredTabs);
    if (activeTabId === tabId) {
      setActiveTabId(filteredTabs[0].id);
    }
    setMenuTabId(null);
  };

  const renameTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
    setEditingTabId(tabId);
      setEditingTabName(tab.name);
      setMenuTabId(null);
    }
  };

  const handleTabRename = () => {
    if (!editingTabId || !editingTabName.trim()) {
      setEditingTabId(null);
      return;
    }
    
    setTabs(tabs.map(tab =>
      tab.id === editingTabId
        ? { ...tab, name: editingTabName }
        : tab
    ));
    
    setEditingTabId(null);
    setEditingTabName('');
  };

  const handleTabDoubleClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setEditingTabId(tabId);
      setEditingTabName(tab.name);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isProcessing) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsProcessing(true);
    try {
      const result = await handleConversation(userMessage, chatMessages);
      
      if (result.needsMoreInfo && result.assistantResponse) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse! }]);
      } else if (result.automation) {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Created automation: ${result.automation!.title}` 
        }]);
        
        const newAutomation: AutomationCard = {
          id: Date.now().toString(),
          title: result.automation.title,
          sources: result.automation.sources,
          extract: result.automation.extract,
          storeTo: result.automation.storeTo,
          position: { x: 0, y: 0 },
          size: { width: 310, height: 363 },
          isActive: true,
          lastRun: 'Never'
        };

        setTabs(tabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, automations: [...tab.automations, newAutomation] }
            : tab
        ));
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
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
        storeTo: card.storeTo,
        googleFileId: card.googleFileId,
        googleFileName: card.googleFileName
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

  const openFilePicker = (mode: 'select' | 'create') => {
    if (!pickerApiLoaded || !accessToken) {
      alert('Google Picker is not ready yet. Please try again.');
      return;
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          setEditingCardData({
            ...editingCardData,
            googleFileId: file.id,
            googleFileName: file.name,
            storeTo: file.name
          });
        } else if (data.action === window.google.picker.Action.CANCEL) {
          console.log('Picker canceled');
        }
      })
      .build();

    picker.setVisible(true);
    setTimeout(() => {
    const pickerDialog = document.querySelector('.picker-dialog');
    if (pickerDialog) {
      (pickerDialog as HTMLElement).style.zIndex = '2001';
      }
    }, 100);
  };
  
  const createNewFile = async () => {
    const fileName = prompt('Enter a name for the new file:');
    if (!fileName) return;

    try {
      const response = await fetch('http://localhost:3000/api/create-drive-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          name: fileName,
          mimeType: 'text/plain'
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingCardData({
          ...editingCardData,
          googleFileId: data.fileId,
          googleFileName: fileName,
          storeTo: fileName
        });
      } else {
        alert('Failed to create file: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create file:', error);
      alert('Failed to create file');
    }
  };

  const toggleAutomation = (cardId: string) => {
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(card =>
              card.id === cardId
                ? { ...card, isActive: !card.isActive }
                : card
            )
          }
        : tab
    ));
  };

  const updateCardTitle = (cardId: string, newTitle: string) => {
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(card =>
              card.id === cardId
                ? { ...card, title: newTitle }
                : card
            )
          }
        : tab
    ));
  };

  const updateSource = (cardId: string, index: number, newValue: string) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card) return;
    
    const sources = card.sources.split(',').map(s => s.trim());
    sources[index] = newValue;
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(c =>
              c.id === cardId
                ? { ...c, sources: sources.join(', ') }
                : c
            )
          }
        : tab
    ));
  };

  const updateCollect = (cardId: string, index: number, newValue: string) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card) return;
    
    const fields = card.extract.split(',').map(s => s.trim());
    fields[index] = newValue;
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(c =>
              c.id === cardId
                ? { ...c, extract: fields.join(', ') }
                : c
            )
          }
        : tab
    ));
  };

  const addSource = (cardId: string, value: string) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card || !value.trim()) return;
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(c =>
              c.id === cardId
                ? { ...c, sources: c.sources ? `${c.sources}, ${value.trim()}` : value.trim() }
                : c
            )
          }
        : tab
    ));
  };

  const addCollectField = (cardId: string, value: string) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card || !value.trim()) return;
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(c =>
              c.id === cardId
                ? { ...c, extract: c.extract ? `${c.extract}, ${value.trim()}` : value.trim() }
                : c
            )
          }
        : tab
    ));
  };

  const activeCount = activeTab?.automations.filter(a => a.isActive !== false).length || 0;
  const totalCount = activeTab?.automations.length || 0;

  const getDisplayTitle = () => {
    if (!activeTab) return 'All Automations';
    if (activeTab.id === '1') return 'All Automations';
    return activeTab.name;
  };

  const renderSourcesOrCollections = (
    cardId: string,
    items: string[],
    type: 'source' | 'collect',
    maxWidth: number
  ) => {
    const itemWidths: number[] = [];
    let totalWidth = 0;
    const maxAllowedWidth = maxWidth * 0.75;
    
    items.forEach((item, idx) => {
      const estimatedWidth = item.length * 7 + 18;
      itemWidths.push(estimatedWidth);
      if (totalWidth + estimatedWidth <= maxAllowedWidth) {
        totalWidth += estimatedWidth + 6;
      }
    });

    const visibleCount = itemWidths.findIndex((w, idx) => {
      const widthUpTo = itemWidths.slice(0, idx + 1).reduce((sum, width) => sum + width + 6, 0);
      return widthUpTo > maxAllowedWidth;
    });

    const itemsToShow = visibleCount === -1 ? items.length : Math.max(1, visibleCount);
    const hiddenCount = items.length - itemsToShow;

    return { itemsToShow, hiddenCount };
  };

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#ffffff'
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: `${sidebarWidth}px`,
        backgroundColor: '#fbfbfa',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
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
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
            >
              {editingTabId === tab.id ? (
                <input
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
              onClick={() => setActiveTabId(tab.id)}
                  onDoubleClick={() => handleTabDoubleClick(tab.id)}
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
                          setMenuPosition({ x: rect.right, y: rect.top });
                          setMenuTabId(tab.id);
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
          onClick={addNewTab}
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
            <img src={imgIconSettings} alt="" style={{ width: '16px', height: '16px' }} />
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
          onMouseDown={() => setIsResizingSidebar(true)}
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

      {/* Tab Menu Popup */}
      {menuTabId && menuPosition && (
        <>
          <div
            onClick={() => setMenuTabId(null)}
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
              onClick={() => renameTab(menuTabId)}
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
                onClick={() => deleteTab(menuTabId)}
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
      )}

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
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
            onClick={() => setShowChat(!showChat)}
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

        {/* Main Content */}
        <div style={{
          flex: 1,
                backgroundColor: '#ffffff',
          overflow: 'auto',
          padding: '32px'
        }}>
          {/* Title Section */}
          <div style={{
                display: 'flex',
                flexDirection: 'column',
            gap: '4px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '24px',
              lineHeight: '32px',
              color: '#101828',
              letterSpacing: '0.0703px',
              margin: 0
            }}>
              {getDisplayTitle()}
            </h2>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#6a7282',
              letterSpacing: '-0.1504px',
              margin: 0
            }}>
              {activeCount} active · {totalCount} total
            </p>
          </div>

          {/* Automation Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '16px'
          }}>
            {activeTab?.automations.map(card => {
              const sources = card.sources.split(',').map(s => s.trim());
              const collections = card.extract.split(',').map(s => s.trim());
              const { itemsToShow: sourcesToShow, hiddenCount: hiddenSources } = renderSourcesOrCollections(card.id, sources, 'source', 333);
              const { itemsToShow: collectionsToShow, hiddenCount: hiddenCollections } = renderSourcesOrCollections(card.id, collections, 'collect', 333);

              return (
                <div
                  key={card.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '21px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    cursor: 'default'
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
                            onChange={(e) => setEditingCardTitle({ cardId: card.id, value: e.target.value })}
                            onBlur={() => {
                              if (editingCardTitle.value.trim()) {
                                updateCardTitle(card.id, editingCardTitle.value.trim());
                              }
                              setEditingCardTitle(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingCardTitle.value.trim()) {
                                  updateCardTitle(card.id, editingCardTitle.value.trim());
                                }
                                setEditingCardTitle(null);
                              } else if (e.key === 'Escape') {
                                setEditingCardTitle(null);
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
                              setEditingCardTitle({ cardId: card.id, value: card.title });
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
                        toggleAutomation(card.id);
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
                      <img src={imgIconLink} alt="" style={{ width: '12px', height: '12px' }} />
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
                          <input
                            key={idx}
                            type="text"
                            value={editingSource.value}
                            onChange={(e) => setEditingSource({ ...editingSource, value: e.target.value })}
                            onBlur={() => {
                              if (editingSource.value.trim()) {
                                updateSource(card.id, idx, editingSource.value.trim());
                              }
                              setEditingSource(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingSource.value.trim()) {
                                  updateSource(card.id, idx, editingSource.value.trim());
                                }
                                setEditingSource(null);
                              } else if (e.key === 'Escape') {
                                setEditingSource(null);
                              }
                            }}
                            autoFocus
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
                              minWidth: '60px'
                            }}
                          />
                        ) : (
                          <div
                            key={idx}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingSource({ cardId: card.id, index: idx, value: source });
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
                            {source}
                          </div>
                        )
                      ))}
                      {hiddenSources > 0 && (
                        <>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                            fontSize: '12px',
                            color: '#6a7282'
                          }}>
                            ...
                </span>
                          <div style={{
                            backgroundColor: '#eceef2',
                            borderRadius: '8px',
                            padding: '3px 9px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '16px',
                            color: '#030213'
                          }}>
                            +{hiddenSources}
                          </div>
                        </>
                      )}
                      {addingSource?.cardId === card.id ? (
                        <input
                          type="text"
                          value={addingSource.value}
                          onChange={(e) => setAddingSource({ cardId: card.id, value: e.target.value })}
                          onBlur={() => {
                            if (addingSource.value.trim()) {
                              addSource(card.id, addingSource.value);
                            }
                            setAddingSource(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (addingSource.value.trim()) {
                                addSource(card.id, addingSource.value);
                              }
                              setAddingSource(null);
                            } else if (e.key === 'Escape') {
                              setAddingSource(null);
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
                            minWidth: '100px'
                          }}
                        />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddingSource({ cardId: card.id, value: '' });
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
                      <img src={imgIconCollect} alt="" style={{ width: '12px', height: '12px' }} />
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
                          <input
                            key={idx}
                            type="text"
                            value={editingCollect.value}
                            onChange={(e) => setEditingCollect({ ...editingCollect, value: e.target.value })}
                            onBlur={() => {
                              if (editingCollect.value.trim()) {
                                updateCollect(card.id, idx, editingCollect.value.trim());
                              }
                              setEditingCollect(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingCollect.value.trim()) {
                                  updateCollect(card.id, idx, editingCollect.value.trim());
                                }
                                setEditingCollect(null);
                              } else if (e.key === 'Escape') {
                                setEditingCollect(null);
                              }
                            }}
                            autoFocus
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
                              minWidth: '60px'
                            }}
                          />
                        ) : (
                          <div
                            key={idx}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingCollect({ cardId: card.id, index: idx, value: field });
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
                            {toTitleCase(field)}
                          </div>
                        )
                      ))}
                      {hiddenCollections > 0 && (
                        <>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                            fontSize: '12px',
                            color: '#6a7282'
                          }}>
                            ...
                </span>
                          <div style={{
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            padding: '3px 9px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '16px',
                            color: '#030213'
                          }}>
                            +{hiddenCollections}
                          </div>
                        </>
                      )}
                      {addingCollect?.cardId === card.id ? (
                        <input
                          type="text"
                          value={addingCollect.value}
                          onChange={(e) => setAddingCollect({ cardId: card.id, value: e.target.value })}
                          onBlur={() => {
                            if (addingCollect.value.trim()) {
                              addCollectField(card.id, addingCollect.value);
                            }
                            setAddingCollect(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (addingCollect.value.trim()) {
                                addCollectField(card.id, addingCollect.value);
                              }
                              setAddingCollect(null);
                            } else if (e.key === 'Escape') {
                              setAddingCollect(null);
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
                            minWidth: '100px'
                          }}
                        />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddingCollect({ cardId: card.id, value: '' });
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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
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
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleCardDoubleClick(card.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'not-allowed',
                        opacity: 0.5
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
            })}
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
      <div style={{
          width: `${chatWidth}px`,
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
          height: '100%',
          position: 'relative'
        }}>
          {/* Resize Handle */}
          <div
            onMouseDown={() => setIsResizingChat(true)}
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

        {/* Chat Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827'
          }}>
            Create Automation
          </h3>
              <button
                onClick={() => setShowChat(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
          <p style={{
            margin: '4px 0 0 0',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Describe what you want to automate
          </p>
        </div>

        {/* Messages Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {chatMessages.length === 0 && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Tell me what you'd like to automate. I'll help you set it up!
            </div>
          )}
          
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? '#5B5FED' : '#f3f4f6',
                color: msg.role === 'user' ? '#ffffff' : '#111827',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#f3f4f6',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Thinking...
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end'
          }}>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit();
                }
              }}
              placeholder="Type your message..."
              disabled={isProcessing}
              rows={3}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#111827',
                resize: 'none'
              }}
            />
            <button
              onClick={handleChatSubmit}
              disabled={isProcessing || !chatInput.trim()}
              style={{
                padding: '12px 16px',
                backgroundColor: isProcessing || !chatInput.trim() ? '#d1d5db' : '#5B5FED',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isProcessing || !chatInput.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                height: '73px',
                minWidth: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      )}

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
                    color: '#111827',
                    marginBottom: '8px'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openFilePicker('select')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#ffffff',
                      color: '#5B5FED',
                      border: '2px solid #5B5FED',
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Select from Drive
                  </button>
                  <button
                    onClick={createNewFile}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#ffffff',
                      color: '#5B5FED',
                      border: '2px solid #5B5FED',
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Create New File
                  </button>
                </div>

                {editingCardData.googleFileId && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#15803d',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    ✓ File selected: {editingCardData.googleFileName || editingCardData.googleFileId}
                  </div>
                )}
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
