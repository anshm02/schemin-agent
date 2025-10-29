// Background service worker for Schemin automation

let pageStates = new Map();
let cachedAutomations = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

// Listen for page ready notifications
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PAGE_READY' && sender.tab) {
    pageStates.set(sender.tab.id, {
      url: request.url,
      title: request.title,
      tabId: sender.tab.id
    });
    
    // Check if there are applicable automations
    checkApplicableAutomations(sender.tab.id, request.url);
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  pageStates.delete(tabId);
});

// Fetch automations from server with caching
async function fetchAutomationsFromServer() {
  const now = Date.now();
  if (cachedAutomations.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedAutomations;
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/automations', {
      credentials: 'include'
    });
    const result = await response.json();
    cachedAutomations = result.automations || [];
    lastFetchTime = now;
    return cachedAutomations;
  } catch (error) {
    console.error('Error fetching automations:', error);
    return [];
  }
}

// Check if there are applicable automations for the current tab
async function checkApplicableAutomations(tabId, url) {
  try {
    // Fetch data from server (with caching)
    const automations = await fetchAutomationsFromServer();
    
    const currentDomain = new URL(url).hostname;
    let hasApplicable = false;
    
    for (const tabData of automations) {
      for (const automation of tabData.automations) {
        if (isDomainMatch(currentDomain, automation.sources)) {
          hasApplicable = true;
          break;
        }
      }
      if (hasApplicable) break;
    }
    
    // Update badge if automations are applicable
    if (hasApplicable) {
      chrome.action.setBadgeText({ text: '●', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#5B5FED', tabId: tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  } catch (error) {
    console.error('Error checking automations:', error);
  }
}

// Check if the current domain matches any of the sources
// security risk: false positive if the sources are not exact matches
function isDomainMatch(currentDomain, sources) {
  const sourceDomains = sources
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .map(s => s.replace(/^(https?:\/\/)?(www\.)?/, ''))
    .map(s => s.split('/')[0]);
  
  return sourceDomains.some(domain => {
    return currentDomain.includes(domain) || domain.includes(currentDomain);
  });
}

// Listen for tab activation to update badge
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await checkApplicableAutomations(tab.id, tab.url);
    }
  } catch (error) {
    console.error('Error on tab activation:', error);
  }
});

// Listen for tab updates to update badge
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await checkApplicableAutomations(tabId, tab.url);
  }
});
