// Background service worker for Schemin automation

let pageStates = new Map();

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

async function checkApplicableAutomations(tabId, url) {
  try {
    const data = await chrome.storage.local.get(['schemin_automations']);
    const automations = data.schemin_automations || [];
    
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
