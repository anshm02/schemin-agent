document.addEventListener('DOMContentLoaded', async () => {
  const contentDiv = document.getElementById('content');
  const openWebappLink = document.getElementById('openWebapp');
  
  openWebappLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:5173' });
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
        <span class="value">${automation.storeTo}</span>
      </div>
      <button class="log-button" data-automation-id="${automation.id}">
        📊 Log to ${automation.storeTo}
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
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Extract data from page based on automation.extract
    const extractedData = await extractDataFromPage(tab.id, automation);
    
    if (!extractedData) {
      throw new Error('No data could be extracted from this page');
    }
    
    button.textContent = '⏳ Logging to sheet...';
    
    // Send to server to log to Google Sheets
    const response = await fetch(`${serverUrl}/api/log-automation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        automation: automation,
        url: currentUrl,
        data: extractedData,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const result = await response.json();
    
    showStatus(statusDiv, '✅ Successfully logged to ' + automation.storeTo, 'success');
    button.textContent = '✓ Logged Successfully';
    
    setTimeout(() => {
      button.disabled = false;
      button.textContent = '📊 Log to ' + automation.storeTo;
    }, 3000);
    
  } catch (error) {
    console.error('Error logging data:', error);
    showStatus(statusDiv, '❌ Error: ' + error.message, 'error');
    button.disabled = false;
    button.textContent = '📊 Log to ' + automation.storeTo;
  }
}

async function extractDataFromPage(tabId, automation) {
  try {
    // Inject content script if needed
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {}); // Ignore if already injected
    
    // Send message to extract data
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'EXTRACT_DATA',
      extractFields: automation.extract
    });
    
    return response;
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
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
