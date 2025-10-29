import { useState, useEffect, useRef } from 'react';
import { Tab, AutomationCard } from './types';
import { handleConversation, ChatMessage } from './utils/gptParser';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { ChatSidebar } from './components/ChatSidebar';
import { AutomationCard as AutomationCardComponent } from './components/AutomationCard';
import { DetailSidebar } from './components/DetailSidebar';
import { ItemDetailPopup } from './components/ItemDetailPopup';
import { TabMenu } from './components/TabMenu';

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
  const [detailWidth, setDetailWidth] = useState(480);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [isResizingDetail, setIsResizingDetail] = useState(false);
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
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [detailEditingSource, setDetailEditingSource] = useState<{ index: number; value: string } | null>(null);
  const [detailEditingCollect, setDetailEditingCollect] = useState<{ index: number; value: string } | null>(null);
  const [detailAddingSource, setDetailAddingSource] = useState(false);
  const [detailAddingCollect, setDetailAddingCollect] = useState(false);
  const [detailNewSourceValue, setDetailNewSourceValue] = useState('');
  const [detailNewCollectValue, setDetailNewCollectValue] = useState('');
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null);
  const [hoveredCollectIndex, setHoveredCollectIndex] = useState<number | null>(null);
  const [itemDetailPopup, setItemDetailPopup] = useState<{ type: 'pending' | 'saved'; item: any } | null>(null);
  const [pendingItems] = useState([
    { id: '1', url: 'https://example.com/article1', title: 'Article 1', date: '2 hours ago', content: 'This is a detailed summary of Article 1. It contains information about various topics and provides insights into the subject matter. The article was automatically extracted and processed for your convenience. You can review the content here and decide whether to save it to your collection or discard it.' },
    { id: '2', url: 'https://example.com/article2', title: 'Article 2', date: '5 hours ago', content: 'Article 2 presents an in-depth analysis of the topic at hand. This comprehensive piece covers multiple aspects and offers valuable perspectives. The content has been carefully extracted and is awaiting your review. Take your time to read through it and make an informed decision about saving this information.' },
    { id: '3', url: 'https://example.com/article3', title: 'Article 3', date: '1 day ago', content: 'The third article provides extensive coverage of the subject matter with detailed explanations and examples. This long-form content includes various sections that explore different angles of the topic. The material has been processed and is ready for your review. Consider whether this information would be valuable for your collection.' }
  ]);
  const [savedItems] = useState([
    { id: '1', url: 'https://example.com/saved1', title: 'Saved Article 1', date: '2 days ago', content: 'This saved article contains important information that you have previously approved. The content includes detailed analysis and insights that you found valuable. You can review this saved content at any time and use it as a reference for your work or research.' },
    { id: '2', url: 'https://example.com/saved2', title: 'Saved Article 2', date: '3 days ago', content: 'Another saved article with comprehensive information on the subject. This piece was selected and saved because of its relevance and quality. The content is preserved here for your future reference and can be accessed whenever needed.' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-automation-card]')) {
        setExpandedSources(new Set());
        setExpandedCollections(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      if (isResizingDetail) {
        const newWidth = Math.max(400, Math.min(window.innerWidth - 300, window.innerWidth - e.clientX));
        setDetailWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingChat(false);
      setIsResizingDetail(false);
    };

    if (isResizingSidebar || isResizingChat || isResizingDetail) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingSidebar, isResizingChat, isResizingDetail]);

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

  const deleteSource = (cardId: string, index: number) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card) return;
    
    const sources = card.sources.split(',').map(s => s.trim());
    sources.splice(index, 1);
    
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

  const deleteCollect = (cardId: string, index: number) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card) return;
    
    const fields = card.extract.split(',').map(s => s.trim());
    fields.splice(index, 1);
    
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

  const updateDetailSource = (cardId: string, index: number, newValue: string) => {
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

  const deleteDetailSource = (cardId: string, index: number) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card) return;
    
    const sources = card.sources.split(',').map(s => s.trim());
    sources.splice(index, 1);
    
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

  const addDetailSource = (cardId: string, value: string) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card || !value.trim()) return;
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(c =>
              c.id === cardId
                ? { ...c, sources: value.trim() + (c.sources ? `, ${c.sources}` : '') }
                : c
            )
          }
        : tab
    ));
  };

  const updateDetailCollect = (cardId: string, index: number, newValue: string) => {
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

  const deleteDetailCollect = (cardId: string, index: number) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card) return;
    
    const fields = card.extract.split(',').map(s => s.trim());
    fields.splice(index, 1);
    
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

  const addDetailCollect = (cardId: string, value: string) => {
    const card = activeTab?.automations.find(c => c.id === cardId);
    if (!card || !value.trim()) return;
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            automations: tab.automations.map(c =>
              c.id === cardId
                ? { ...c, extract: value.trim() + (c.extract ? `, ${c.extract}` : '') }
                : c
            )
          }
        : tab
    ));
  };

  const toggleExpanded = (cardId: string, type: 'source' | 'collect') => {
    if (type === 'source') {
      setExpandedSources(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cardId)) {
          newSet.delete(cardId);
        } else {
          newSet.add(cardId);
        }
        return newSet;
      });
    } else {
      setExpandedCollections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cardId)) {
          newSet.delete(cardId);
        } else {
          newSet.add(cardId);
        }
        return newSet;
      });
    }
  };

  const activeCount = activeTab?.automations.filter(a => a.isActive !== false).length || 0;
  const totalCount = activeTab?.automations.length || 0;

  const getDisplayTitle = () => {
    if (!activeTab) return 'All Automations';
    if (activeTab.id === '1') return 'All Automations';
    return activeTab.name;
  };

  const detailCard = activeTab?.automations.find(c => c.id === detailCardId);

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <LeftSidebar
        sidebarWidth={sidebarWidth}
        tabs={tabs}
        activeTabId={activeTabId}
        hoveredTabId={hoveredTabId}
        editingTabId={editingTabId}
        editingTabName={editingTabName}
        onTabClick={setActiveTabId}
        onTabDoubleClick={handleTabDoubleClick}
        onTabHover={setHoveredTabId}
        onMenuClick={(tabId, pos) => {
          setMenuTabId(tabId);
          setMenuPosition(pos);
        }}
        onAddTab={addNewTab}
        onEditingTabNameChange={setEditingTabName}
        onTabRename={handleTabRename}
        onTabRenameCancel={() => {
                  setEditingTabId(null);
                  setEditingTabName('');
        }}
        onStartResize={() => setIsResizingSidebar(true)}
      />

      {menuTabId && menuPosition && (
        <TabMenu
          menuTabId={menuTabId}
          menuPosition={menuPosition}
          tabs={tabs}
          onClose={() => setMenuTabId(null)}
          onRename={renameTab}
          onDelete={deleteTab}
        />
      )}

      <div style={{
        flex: 1,
                display: 'flex',
                flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Header
          showChat={showChat}
          onNewAutomation={() => setShowChat(!showChat)}
        />

              <div style={{
                  flex: 1,
          backgroundColor: '#ffffff',
          overflow: 'auto',
          padding: '32px'
                }}>
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

        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '16px'
        }}>
            {activeTab?.automations.map(card => (
              <AutomationCardComponent
                key={card.id}
                card={card}
                expandedSources={expandedSources}
                expandedCollections={expandedCollections}
                editingCardTitle={editingCardTitle}
                editingSource={editingSource}
                editingCollect={editingCollect}
                addingSource={addingSource}
                addingCollect={addingCollect}
                pickerApiLoaded={pickerApiLoaded}
                accessToken={accessToken}
                onDoubleClick={() => setDetailCardId(card.id)}
                onToggleAutomation={() => toggleAutomation(card.id)}
                onUpdateCardTitle={(newTitle) => updateCardTitle(card.id, newTitle)}
                onStartEditCardTitle={(value) => setEditingCardTitle({ cardId: card.id, value })}
                onCancelEditCardTitle={() => setEditingCardTitle(null)}
                onUpdateSource={(index, newValue) => updateSource(card.id, index, newValue)}
                onDeleteSource={(index) => deleteSource(card.id, index)}
                onStartEditSource={(index, value) => setEditingSource({ cardId: card.id, index, value })}
                onSetEditingSource={setEditingSource}
                onUpdateCollect={(index, newValue) => updateCollect(card.id, index, newValue)}
                onDeleteCollect={(index) => deleteCollect(card.id, index)}
                onStartEditCollect={(index, value) => setEditingCollect({ cardId: card.id, index, value })}
                onSetEditingCollect={setEditingCollect}
                onAddSource={(value) => addSource(card.id, value)}
                onStartAddingSource={() => setAddingSource({ cardId: card.id, value: '' })}
                onSetAddingSource={setAddingSource}
                onAddCollect={(value) => addCollectField(card.id, value)}
                onStartAddingCollect={() => setAddingCollect({ cardId: card.id, value: '' })}
                onSetAddingCollect={setAddingCollect}
                onToggleExpanded={(type) => toggleExpanded(card.id, type)}
                onOpenDetail={() => setDetailCardId(card.id)}
                onUpdateStoreTo={(fileId, fileName) => {
                  setTabs(tabs.map(tab => 
                    tab.id === activeTabId 
                      ? {
                          ...tab,
                          automations: tab.automations.map(c =>
                            c.id === card.id
                              ? { ...c, googleFileId: fileId, googleFileName: fileName, storeTo: fileName }
                              : c
                          )
                        }
                      : tab
                  ));
                }}
              />
            ))}
            </div>
              </div>
            </div>

      {detailCardId && detailCard && (
        <DetailSidebar
          card={detailCard}
          detailWidth={detailWidth}
          detailEditingSource={detailEditingSource}
          detailEditingCollect={detailEditingCollect}
          detailAddingSource={detailAddingSource}
          detailAddingCollect={detailAddingCollect}
          detailNewSourceValue={detailNewSourceValue}
          detailNewCollectValue={detailNewCollectValue}
          hoveredSourceIndex={hoveredSourceIndex}
          hoveredCollectIndex={hoveredCollectIndex}
          pendingItems={pendingItems}
          savedItems={savedItems}
          pickerApiLoaded={pickerApiLoaded}
          accessToken={accessToken}
          onClose={() => {
            setDetailCardId(null);
            setDetailEditingSource(null);
            setDetailEditingCollect(null);
            setDetailAddingSource(false);
            setDetailAddingCollect(false);
            setDetailNewSourceValue('');
            setDetailNewCollectValue('');
          }}
          onStartResize={() => setIsResizingDetail(true)}
          onSetDetailEditingSource={setDetailEditingSource}
          onSetDetailEditingCollect={setDetailEditingCollect}
          onSetDetailAddingSource={setDetailAddingSource}
          onSetDetailAddingCollect={setDetailAddingCollect}
          onSetDetailNewSourceValue={setDetailNewSourceValue}
          onSetDetailNewCollectValue={setDetailNewCollectValue}
          onSetHoveredSourceIndex={setHoveredSourceIndex}
          onSetHoveredCollectIndex={setHoveredCollectIndex}
          onUpdateDetailSource={updateDetailSource}
          onDeleteDetailSource={deleteDetailSource}
          onAddDetailSource={addDetailSource}
          onUpdateDetailCollect={updateDetailCollect}
          onDeleteDetailCollect={deleteDetailCollect}
          onAddDetailCollect={addDetailCollect}
          onItemClick={(type, item) => setItemDetailPopup({ type, item })}
          onSendAll={() => console.log('Send all pending items')}
          onApproveItem={(itemId) => console.log('Approve item:', itemId)}
          onRejectItem={(itemId) => console.log('Reject item:', itemId)}
          onUpdateStoreTo={(cardId, fileId, fileName) => {
            setTabs(tabs.map(tab => 
              tab.id === activeTabId 
                ? {
                    ...tab,
                    automations: tab.automations.map(c =>
                      c.id === cardId
                        ? { ...c, googleFileId: fileId, googleFileName: fileName, storeTo: fileName }
                        : c
                    )
                  }
                : tab
            ));
            setDetailCardId(cardId);
          }}
          onBeforePickerOpen={() => setDetailCardId(null)}
        />
      )}

      {itemDetailPopup && (
        <ItemDetailPopup
          item={itemDetailPopup.item}
          type={itemDetailPopup.type}
          onClose={() => setItemDetailPopup(null)}
          onApprove={(itemId) => {
            console.log('Approve item:', itemId);
            setItemDetailPopup(null);
          }}
          onReject={(itemId) => {
            console.log('Reject item:', itemId);
            setItemDetailPopup(null);
          }}
        />
      )}

      {showChat && (
        <ChatSidebar
          chatWidth={chatWidth}
          chatInput={chatInput}
          chatMessages={chatMessages}
          isProcessing={isProcessing}
          chatEndRef={chatEndRef}
          onChatInputChange={setChatInput}
          onChatSubmit={handleChatSubmit}
          onClose={() => setShowChat(false)}
          onStartResize={() => setIsResizingChat(true)}
        />
      )}

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
