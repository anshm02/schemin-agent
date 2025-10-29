// Schemin floating button and automation dropdown
let scheminButton = null;
let scheminDropdown = null;
let currentAutomations = [];

console.log('[Schemin] 🎯 schemin-button.js loaded successfully');
console.log('[Schemin] Readability available:', typeof Readability !== 'undefined');

// SVG icons from Figma
const SCHEMIN_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="8" height="8" rx="1" fill="#5B5FED"/>
  <rect x="13" y="3" width="8" height="8" rx="1" fill="#9CA3FF"/>
  <rect x="3" y="13" width="8" height="8" rx="1" fill="#9CA3FF"/>
  <rect x="13" y="13" width="8" height="8" rx="1" fill="#5B5FED"/>
</svg>
`;

const SEND_ARROW_SVG = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14.5 1.5L6.5 9.5M14.5 1.5L9.5 14.5L6.5 9.5M14.5 1.5L1.5 6.5L6.5 9.5" stroke="#364153" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const CHEVRON_SVG = `
<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 4.5L6 7.5L9 4.5" stroke="#6A7282" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// Initialize schemin button
async function initScheminButton() {
  console.log('[Schemin] 🚀 Script loaded, initializing button...');
  console.log('[Schemin] Document ready state:', document.readyState);
  console.log('[Schemin] Current URL:', window.location.href);
  
  // Check if button already exists
  if (document.getElementById('schemin-floating-button')) {
    console.log('[Schemin] Button already exists, skipping');
    return;
  }

  try {
    const currentUrl = window.location.href;
    const currentDomain = new URL(currentUrl).hostname;
    console.log('[Schemin] Current domain:', currentDomain);
    
    // Fetch automations from server
    const serverUrl = 'http://localhost:3000';
    console.log('[Schemin] Fetching automations from:', serverUrl + '/api/automations');
    
    const response = await fetch(`${serverUrl}/api/automations`, {
      credentials: 'include'
    });
    
    console.log('[Schemin] Response status:', response.status);
    console.log('[Schemin] Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[Schemin] Response data:', result);
    console.log('[Schemin] Automations array length:', result.automations?.length || 0);
    
    const automations = result.automations || [];
    
    if (automations.length === 0) {
      console.log('[Schemin] ⚠️ No automations found in response');
      return;
    }
    
    // Find applicable automations for this domain
    const applicableAutomations = [];
    
    for (const tabData of automations) {
      console.log('[Schemin] Checking tab:', tabData.name);
      for (const automation of tabData.automations) {
        const sources = automation.sources.toLowerCase();
        console.log('[Schemin]   - Automation:', automation.title);
        console.log('[Schemin]   - Sources:', sources);
        
        if (isDomainMatch(currentDomain, sources)) {
          console.log('[Schemin]   ✅ MATCH FOUND!');
          applicableAutomations.push({
            ...automation,
            tabName: tabData.name
          });
        } else {
          console.log('[Schemin]   ❌ No match');
        }
      }
    }
    
    console.log('[Schemin] Total applicable automations:', applicableAutomations.length);
    
    if (applicableAutomations.length === 0) {
      console.log('[Schemin] No applicable automations for this domain');
      return;
    }
    
    currentAutomations = applicableAutomations;
    
    // Create the floating button
    console.log('[Schemin] Creating floating button...');
    createFloatingButton();
    createDropdown();
    console.log('[Schemin] ✅ Button created successfully!');
    
  } catch (error) {
    console.error('[Schemin] ❌ Error initializing button:', error);
    console.error('[Schemin] Error details:', error.message);
    console.error('[Schemin] Error stack:', error.stack);
  }
}

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

function createFloatingButton() {
  scheminButton = document.createElement('div');
  scheminButton.id = 'schemin-floating-button';
  scheminButton.innerHTML = SCHEMIN_ICON_SVG;
  
  // Add styles
  const buttonStyles = `
    position: fixed;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    cursor: pointer;
    z-index: 999998;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  `;
  
  scheminButton.style.cssText = buttonStyles;
  
  scheminButton.addEventListener('mouseenter', () => {
    scheminButton.style.boxShadow = '0 4px 12px rgba(91, 95, 237, 0.2)';
    scheminButton.style.transform = 'scale(1.05)';
  });
  
  scheminButton.addEventListener('mouseleave', () => {
    scheminButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    scheminButton.style.transform = 'scale(1)';
  });
  
  scheminButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
  
  document.body.appendChild(scheminButton);
}

function createDropdown() {
  scheminDropdown = document.createElement('div');
  scheminDropdown.id = 'schemin-dropdown';
  
  const dropdownStyles = `
    position: fixed;
    top: 64px;
    right: 16px;
    width: 384px;
    max-height: 537px;
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    z-index: 999999;
    display: none;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  scheminDropdown.style.cssText = dropdownStyles;
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid #F3F4F6;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  header.innerHTML = `
    ${SCHEMIN_ICON_SVG}
    <h3 style="margin: 0; font-size: 18px; font-weight: 500; color: #101828; letter-spacing: -0.4395px; line-height: 27px;">Active Automations</h3>
  `;
  
  scheminDropdown.appendChild(header);
  
  // Automations container
  const automationsContainer = document.createElement('div');
  automationsContainer.id = 'schemin-automations-container';
  automationsContainer.style.cssText = `
    overflow-y: auto;
    max-height: 446px;
  `;
  
  // Render automations
  currentAutomations.forEach(automation => {
    const automationCard = createAutomationCard(automation);
    automationsContainer.appendChild(automationCard);
  });
  
  scheminDropdown.appendChild(automationsContainer);
  
  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = `
    padding: 11px 16px;
    border-top: 1px solid #F3F4F6;
    background: #F9FAFB;
  `;
  
  footer.innerHTML = `
    <p style="margin: 0; font-size: 12px; color: #6A7282; line-height: 16px;">
      ${currentAutomations.length} automation${currentAutomations.length !== 1 ? 's' : ''} active
    </p>
  `;
  
  scheminDropdown.appendChild(footer);
  
  document.body.appendChild(scheminDropdown);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (scheminDropdown && 
        scheminDropdown.style.display === 'flex' && 
        !scheminDropdown.contains(e.target) && 
        e.target !== scheminButton) {
      hideDropdown();
    }
  });
}

function createAutomationCard(automation) {
  const card = document.createElement('div');
  card.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid #F3F4F6;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  `;
  
  // Left side - automation details
  const details = document.createElement('div');
  details.style.cssText = `
    flex: 1;
    min-width: 0;
  `;
  
  // Title
  const title = document.createElement('h4');
  title.style.cssText = `
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 500;
    color: #101828;
    letter-spacing: -0.3125px;
    line-height: 24px;
  `;
  title.textContent = automation.title;
  details.appendChild(title);
  
  // Location section
  const locationSection = document.createElement('div');
  locationSection.style.cssText = `
    margin-bottom: 10px;
  `;
  
  const locationLabel = document.createElement('div');
  locationLabel.style.cssText = `
    font-size: 12px;
    color: #6A7282;
    line-height: 16px;
    margin-bottom: 4px;
  `;
  locationLabel.textContent = 'Location';
  locationSection.appendChild(locationLabel);
  
  const locationValue = document.createElement('div');
  locationValue.style.cssText = `
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  `;
  
  // Storage type (Google Sheets/Google Docs)
  const storageTypeContainer = document.createElement('div');
  storageTypeContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 6px;
  `;
  
  const storageType = document.createElement('span');
  storageType.style.cssText = `
    font-size: 14px;
    color: #364153;
    line-height: 20px;
    letter-spacing: -0.1504px;
  `;
  
  // Determine storage type
  const fileType = automation.storeTo.toLowerCase();
  if (fileType.includes('sheet')) {
    storageType.textContent = 'Google Sheets';
  } else if (fileType.includes('doc')) {
    storageType.textContent = 'Google Docs';
  } else {
    storageType.textContent = automation.storeTo;
  }
  
  storageTypeContainer.appendChild(storageType);
  storageTypeContainer.innerHTML += CHEVRON_SVG;
  
  locationValue.appendChild(storageTypeContainer);
  
  // File name
  const fileName = document.createElement('span');
  fileName.style.cssText = `
    font-size: 14px;
    color: #101828;
    line-height: 20px;
    letter-spacing: -0.1504px;
  `;
  fileName.textContent = automation.googleFileName || automation.storeTo;
  locationValue.appendChild(fileName);
  
  locationSection.appendChild(locationValue);
  details.appendChild(locationSection);
  
  // Logging section
  const loggingSection = document.createElement('div');
  loggingSection.style.cssText = `
    margin-bottom: 0;
  `;
  
  const loggingLabel = document.createElement('div');
  loggingLabel.style.cssText = `
    font-size: 12px;
    color: #6A7282;
    line-height: 16px;
    margin-bottom: 6px;
  `;
  loggingLabel.textContent = 'Logging';
  loggingSection.appendChild(loggingLabel);
  
  const loggingFields = document.createElement('div');
  loggingFields.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 75%;
  `;
  
  // Parse extract fields
  let fields = [];
  if (typeof automation.extract === 'string') {
    fields = automation.extract.split(',').map(f => f.trim()).filter(f => f);
  } else if (Array.isArray(automation.extract)) {
    fields = automation.extract;
  }
  
  // Show first 3 fields
  const visibleFields = fields.slice(0, 3);
  const remainingCount = fields.length - visibleFields.length;
  
  visibleFields.forEach(field => {
    const fieldTag = document.createElement('div');
    fieldTag.style.cssText = `
      background: #F3F4F6;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: #364153;
      line-height: 16px;
      white-space: nowrap;
    `;
    fieldTag.textContent = field;
    loggingFields.appendChild(fieldTag);
  });
  
  // Show +N button if there are more fields
  if (remainingCount > 0) {
    const moreButton = document.createElement('div');
    moreButton.style.cssText = `
      background: #F3F4F6;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: #6A7282;
      line-height: 16px;
      cursor: pointer;
    `;
    moreButton.textContent = `+${remainingCount}`;
    moreButton.title = fields.slice(3).join(', ');
    loggingFields.appendChild(moreButton);
  }
  
  loggingSection.appendChild(loggingFields);
  details.appendChild(loggingSection);
  
  content.appendChild(details);
  
  // Right side - send button
  const sendButton = document.createElement('button');
  sendButton.style.cssText = `
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    padding: 8px;
    flex-shrink: 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  sendButton.innerHTML = SEND_ARROW_SVG;
  
  sendButton.addEventListener('mouseenter', () => {
    sendButton.style.background = '#F3F4F6';
  });
  
  sendButton.addEventListener('mouseleave', () => {
    sendButton.style.background = 'transparent';
  });
  
  sendButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handleSendClick(automation, sendButton);
  });
  
  content.appendChild(sendButton);
  card.appendChild(content);
  
  return card;
}

async function handleSendClick(automation, buttonElement) {
  const originalHTML = buttonElement.innerHTML;
  
  try {
    // Show loading state
    buttonElement.style.cssText += 'pointer-events: none; opacity: 0.6;';
    buttonElement.innerHTML = `
      <div style="width: 16px; height: 16px; border: 2px solid #E5E7EB; border-top-color: #5B5FED; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    `;
    
    // Add spin animation if not already added
    if (!document.getElementById('schemin-spin-style')) {
      const style = document.createElement('style');
      style.id = 'schemin-spin-style';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Extract content with Readability
    const documentClone = document.cloneNode(true);
    const article = new Readability(documentClone).parse();
    
    if (!article) {
      throw new Error('Failed to extract content with Readability');
    }
    
    const extractedContent = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      title: article.title,
      byline: article.byline,
      excerpt: article.excerpt,
      siteName: article.siteName,
      textContent: article.textContent,
      htmlContent: article.content,
      length: article.length
    };
    
    // Send to server for processing
    const serverUrl = 'http://localhost:3000';
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
    
    if (processResult.error) {
      throw new Error(processResult.error);
    }
    
    // Show success
    buttonElement.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8L6.5 11.5L13 5" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    // Show notification
    showNotification('Content logged successfully!', 'success');
    
    setTimeout(() => {
      buttonElement.innerHTML = originalHTML;
      buttonElement.style.cssText = buttonElement.style.cssText.replace('pointer-events: none; opacity: 0.6;', '');
    }, 2000);
    
  } catch (error) {
    console.error('Error sending automation:', error);
    
    // Show error
    buttonElement.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M12 4L4 12M4 4L12 12" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    
    showNotification('Error: ' + error.message, 'error');
    
    setTimeout(() => {
      buttonElement.innerHTML = originalHTML;
      buttonElement.style.cssText = buttonElement.style.cssText.replace('pointer-events: none; opacity: 0.6;', '');
    }, 2000);
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 64px;
    right: 408px;
    background: ${type === 'success' ? '#10B981' : '#EF4444'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 1000000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
  
  // Add animations if not already added
  if (!document.getElementById('schemin-notification-style')) {
    const style = document.createElement('style');
    style.id = 'schemin-notification-style';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

function toggleDropdown() {
  if (!scheminDropdown) return;
  
  if (scheminDropdown.style.display === 'flex') {
    hideDropdown();
  } else {
    showDropdown();
  }
}

function showDropdown() {
  if (!scheminDropdown) return;
  scheminDropdown.style.display = 'flex';
}

function hideDropdown() {
  if (!scheminDropdown) return;
  scheminDropdown.style.display = 'none';
}

// Initialize when page is ready
console.log('[Schemin] Setting up initialization...');
console.log('[Schemin] Document ready state:', document.readyState);

if (document.readyState === 'complete') {
  console.log('[Schemin] Document already complete, initializing now');
  initScheminButton();
} else {
  console.log('[Schemin] Document not ready, waiting for load event');
  window.addEventListener('load', () => {
    console.log('[Schemin] Load event fired, initializing');
    initScheminButton();
  });
}

// Expose for external use
window.scheminButton = {
  refresh: initScheminButton,
  show: showDropdown,
  hide: hideDropdown
};

console.log('[Schemin] window.scheminButton exposed:', window.scheminButton);

