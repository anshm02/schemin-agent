let activeTabId = null;
let articleTabs = new Map();

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const previousTabId = activeTabId;
  activeTabId = activeInfo.tabId;
  
  if (previousTabId && articleTabs.has(previousTabId)) {
    try {
      const [tab] = await chrome.tabs.query({ active: false, lastFocusedWindow: false });
      
      chrome.tabs.sendMessage(previousTabId, { type: 'TAB_DEACTIVATED' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.log('Tab not accessible:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.isArticle && response.readContent && response.readContent.length > 100) {
          const settings = await chrome.storage.local.get(['targetFile', 'serverUrl', 'autoSummarize']);
          
          if (settings.autoSummarize && settings.targetFile) {
            await sendSummaryRequest(response, settings);
          }
        }
      });
    } catch (error) {
      console.error('Error handling tab deactivation:', error);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ARTICLE_DETECTED') {
    if (sender.tab && sender.tab.id) {
      articleTabs.set(sender.tab.id, request.data);
    }
  } else if (request.type === 'MANUAL_SUMMARIZE') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_ARTICLE_DATA' }, async (response) => {
          if (response && response.isArticle) {
            const settings = await chrome.storage.local.get(['targetFile', 'serverUrl']);
            await sendSummaryRequest(response, settings);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Not an article page' });
          }
        });
      }
    });
    return true;
  }
});

async function sendSummaryRequest(articleData, settings) {
  const serverUrl = settings.serverUrl || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${serverUrl}/api/summarize-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: articleData.title,
        url: articleData.url,
        content: articleData.readContent,
        targetFile: settings.targetFile,
        scrollPercentage: articleData.scrollPercentage
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Summary saved successfully:', result);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Article Summarized',
      message: `Summary saved to ${settings.targetFile}`,
      priority: 2
    });
  } catch (error) {
    console.error('Failed to send summary request:', error);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Summary Failed',
      message: 'Could not save summary. Check server connection.',
      priority: 2
    });
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  articleTabs.delete(tabId);
});

