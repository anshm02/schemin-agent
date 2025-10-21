document.addEventListener('DOMContentLoaded', async () => {
  const contentDiv = document.getElementById('content');
  const openWebappLink = document.getElementById('openWebapp');
  
  openWebappLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:5173' });
  });
  
  document.getElementById('extractViewedContent').addEventListener('click', async () => {
    await handleExtractViewedContent();
  });
  
  document.getElementById('extractReadabilityContent').addEventListener('click', async () => {
    await handleExtractReadabilityContent();
  });
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showNoAutomation('Unable to access current tab');
      return;
    }
    
    const currentUrl = new URL(tab.url);
    const currentDomain = currentUrl.hostname;
    
    const serverUrl = 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/automations`, {
      credentials: 'include'
    });
    const result = await response.json();
    const automations = result.automations || [];
    
    // Find applicable automations for this domain
    const applicableAutomations = [];
    
    for (const tabData of automations) {
      for (const automation of tabData.automations) {
        const sources = automation.sources.toLowerCase();
        
        // Check if current domain matches any source
        if (isDomainMatch(currentDomain, sources)) {
          applicableAutomations.push({
            ...automation,
            tabName: tabData.name
          });
        }
      }
    }
    
    if (applicableAutomations.length === 0) {
      showNoAutomation('No automations configured for this website');
      return;
    }
    
    // Check permissions for applicable automations
    const permissionsNeeded = [];
    for (const automation of applicableAutomations) {
      const origins = extractOriginsFromSources(automation.sources);
      for (const origin of origins) {
        const hasPermission = await chrome.permissions.contains({ origins: [origin] });
        if (!hasPermission && !permissionsNeeded.includes(origin)) {
          permissionsNeeded.push(origin);
        }
      }
    }
    
    // Show automations
    displayAutomations(applicableAutomations, currentUrl.href, permissionsNeeded, serverUrl);
    
  } catch (error) {
    console.error('Error loading automations:', error);
    showError('Failed to load automations: ' + error.message);
  }
});

function isDomainMatch(currentDomain, sources) {
  const sourceDomains = sources
    .split(',')
    .map(s => s.trim())
    .map(s => s.replace(/^(https?:\/\/)?(www\.)?/, ''))
    .map(s => s.split('/')[0]);
  
  return sourceDomains.some(domain => {
    return currentDomain.includes(domain) || domain.includes(currentDomain);
  });
}

function extractOriginsFromSources(sources) {
  const domains = sources
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .map(s => s.replace(/^(https?:\/\/)?(www\.)?/, ''))
    .map(s => s.split('/')[0])
    .filter(s => s.length > 0);
  
  return domains.map(domain => `*://*.${domain}/*`);
}

function displayAutomations(automations, currentUrl, permissionsNeeded, serverUrl) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '';
  
  // Show permission request if needed
  if (permissionsNeeded.length > 0) {
    const permissionDiv = document.createElement('div');
    permissionDiv.className = 'permission-request';
    permissionDiv.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">⚠️ Permission Required</div>
      <div style="margin-bottom: 8px;">Grant access to track content from these sites.</div>
      <button id="grantPermissions">Grant Permissions</button>
    `;
    contentDiv.appendChild(permissionDiv);
    
    document.getElementById('grantPermissions').addEventListener('click', async () => {
      try {
        const granted = await chrome.permissions.request({
          origins: permissionsNeeded
        });
        
        if (granted) {
          location.reload();
        }
      } catch (error) {
        showError('Failed to grant permissions: ' + error.message);
      }
    });
  }
  
  // Display each automation
  automations.forEach(automation => {
    const card = document.createElement('div');
    card.className = 'automation-card';
    
    card.innerHTML = `
      <div class="title">${automation.title}</div>
      <div class="field">
        <span class="label">TAB:</span>
        <span class="value">${automation.tabName}</span>
      </div>
      <div class="field">
        <span class="label">SOURCES:</span>
        <span class="value">${automation.sources}</span>
      </div>
      <div class="field">
        <span class="label">EXTRACT:</span>
        <span class="value">${automation.extract}</span>
      </div>
      <div class="field">
        <span class="label">STORE TO:</span>
        <span class="value">${automation.googleFileName || automation.storeTo}${automation.googleFileId ? ' ✓' : ''}</span>
      </div>
      <button class="log-button" data-automation-id="${automation.id}">
        📊 Log to ${automation.googleFileName || automation.storeTo}
      </button>
      <div class="status" id="status-${automation.id}"></div>
    `;
    
    contentDiv.appendChild(card);
    
    // Add click handler
    const button = card.querySelector('.log-button');
    button.addEventListener('click', () => handleLogClick(automation, currentUrl, serverUrl));
  });
}

async function handleLogClick(automation, currentUrl, serverUrl) {
  const buttonId = `button[data-automation-id="${automation.id}"]`;
  const button = document.querySelector(buttonId);
  const statusDiv = document.getElementById(`status-${automation.id}`);
  
  button.disabled = true;
  button.textContent = '⏳ Extracting data...';
  
  try {
    throw new Error('Old extraction method deprecated. Use the new extraction buttons below.');
    
  } catch (error) {
    console.error('Error logging data:', error);
    showStatus(statusDiv, '❌ Error: ' + error.message, 'error');
    button.disabled = false;
    button.textContent = '📊 Log to ' + automation.storeTo;
  }
}


function showStatus(statusDiv, message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    setTimeout(() => {
      statusDiv.className = 'status';
  }, 5000);
}

function showNoAutomation(message) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="no-automation">
      <div class="icon">🤖</div>
      <div class="title">No Active Automations</div>
      <div class="subtitle">${message}</div>
      <div style="margin-top: 16px; font-size: 12px;">
        Create automations in the dashboard to get started
      </div>
    </div>
  `;
}

function showError(message) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="no-automation">
      <div class="icon">⚠️</div>
      <div class="title">Error</div>
      <div class="subtitle">${message}</div>
    </div>
  `;
}

async function handleExtractViewedContent() {
  const button = document.getElementById('extractViewedContent');
  const originalText = button.textContent;
  
  try {
    button.disabled = true;
    button.textContent = '⏳ Starting Observer...';
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['Readability.js']
    }).catch(() => {});
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).catch(() => {});
    
    await chrome.tabs.sendMessage(tab.id, {
      type: 'START_INTERSECTION_OBSERVER'
    });
    
    button.textContent = '⏳ Tracking... (scroll the page)';
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    button.textContent = '⏳ Extracting viewed content...';
    
    const extractedContent = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_VIEWED_CONTENT'
    });
    
    if (!extractedContent || !extractedContent.viewedElements) {
      throw new Error('No viewed content found');
    }
    
    button.textContent = '⏳ Processing with Phi-3...';
    
    const currentUrl = new URL(tab.url);
    const currentDomain = currentUrl.hostname;
    
    const serverUrl = 'http://localhost:3000';
    const automationsResponse = await fetch(`${serverUrl}/api/automations`, {
      credentials: 'include'
    });
    const result = await automationsResponse.json();
    const automations = result.automations || [];
    
    let applicableAutomations = [];
    for (const tabData of automations) {
      for (const automation of tabData.automations) {
        const sources = automation.sources.toLowerCase();
        if (isDomainMatch(currentDomain, sources)) {
          applicableAutomations.push(automation);
        }
      }
    }
    
    if (applicableAutomations.length === 0) {
      button.textContent = '⚠️ No automation for this site';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
      return;
    }
    
    const automation = applicableAutomations[0];
    
    const processResponse = await fetch(`${serverUrl}/api/process-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        content: extractedContent,
        extractionType: 'viewed',
        automation: automation
      })
    });
    
    const processResult = await processResponse.json();
    
    if (!processResult.relevant) {
      button.textContent = '❌ Content not relevant';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
      return;
    }
    
    console.log('=== EXTRACTION & STORAGE RESULT ===');
    console.log('Automation:', automation.title);
    console.log('Relevant:', processResult.relevant);
    console.log('Extracted Fields:', processResult.extractedFields);
    console.log('URL:', processResult.url);
    console.log('Stored:', processResult.stored);
    if (processResult.stored) {
      console.log('Storage Type:', processResult.storageType);
      console.log('Storage Location:', processResult.storageLocation);
    } else if (processResult.message) {
      console.log('Note:', processResult.message);
    }
    console.log('====================================');
    
    if (processResult.stored) {
      button.textContent = `✓ Saved to ${automation.googleFileName || processResult.storageLocation || automation.storeTo}`;
    } else {
      button.textContent = '✓ Extracted (not stored)';
    }
    
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error extracting viewed content:', error);
    button.textContent = '❌ Error: ' + error.message;
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 3000);
  }
}

async function handleExtractReadabilityContent() {
  const button = document.getElementById('extractReadabilityContent');
  const originalText = button.textContent;
  
  try {
    button.disabled = true;
    button.textContent = '⏳ Extracting with Readability...';
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['Readability.js']
    }).catch(() => {});
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).catch(() => {});
    
    const extractedContent = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_READABILITY_CONTENT'
    });
    
    if (!extractedContent) {
      throw new Error('Failed to extract content with Readability');
    }
    
    button.textContent = '⏳ Processing with Phi-3...';
    
    const currentUrl = new URL(tab.url);
    const currentDomain = currentUrl.hostname;
    
    const serverUrl = 'http://localhost:3000';
    const automationsResponse = await fetch(`${serverUrl}/api/automations`, {
      credentials: 'include'
    });
    const result = await automationsResponse.json();
    const automations = result.automations || [];
    
    let applicableAutomations = [];
    for (const tabData of automations) {
      for (const automation of tabData.automations) {
        const sources = automation.sources.toLowerCase();
        if (isDomainMatch(currentDomain, sources)) {
          applicableAutomations.push(automation);
        }
      }
    }
    
    if (applicableAutomations.length === 0) {
      button.textContent = '⚠️ No automation for this site';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
      return;
    }
    
    const automation = applicableAutomations[0];
    
    const processResponse = await fetch(`${serverUrl}/api/process-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        content: extractedContent,
        extractionType: 'readability',
        automation: automation
      })
    });
    
    const processResult = await processResponse.json();
    
    if (!processResult.relevant) {
      button.textContent = '❌ Content not relevant';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
      return;
    }
    
    console.log('=== EXTRACTION & STORAGE RESULT ===');
    console.log('Automation:', automation.title);
    console.log('Relevant:', processResult.relevant);
    console.log('Extracted Fields:', processResult.extractedFields);
    console.log('URL:', processResult.url);
    console.log('Stored:', processResult.stored);
    if (processResult.stored) {
      console.log('Storage Type:', processResult.storageType);
      console.log('Storage Location:', processResult.storageLocation);
    } else if (processResult.message) {
      console.log('Note:', processResult.message);
    }
    console.log('====================================');
    
    if (processResult.stored) {
      button.textContent = `✓ Saved to ${automation.googleFileName || processResult.storageLocation || automation.storeTo}`;
    } else {
      button.textContent = '✓ Extracted (not stored)';
    }
    
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error extracting readability content:', error);
    button.textContent = '❌ Error: ' + error.message;
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 3000);
  }
}
