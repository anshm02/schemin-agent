document.addEventListener('DOMContentLoaded', async () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const targetFileInput = document.getElementById('targetFile');
  const autoSummarizeToggle = document.getElementById('autoSummarize');
  const saveButton = document.getElementById('saveSettings');
  const summarizeButton = document.getElementById('summarizeNow');
  const statusDiv = document.getElementById('status');
  const articleInfoDiv = document.getElementById('articleInfo');
  const isArticleSpan = document.getElementById('isArticle');
  const scrollPercentageSpan = document.getElementById('scrollPercentage');
  
  const settings = await chrome.storage.local.get(['serverUrl', 'targetFile', 'autoSummarize']);
  
  if (settings.serverUrl) {
    serverUrlInput.value = settings.serverUrl;
  }
  
  if (settings.targetFile) {
    targetFileInput.value = settings.targetFile;
  }
  
  autoSummarizeToggle.checked = settings.autoSummarize !== false;
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_ARTICLE_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Could not get article data:', chrome.runtime.lastError.message);
        return;
      }
      
      if (response) {
        articleInfoDiv.style.display = 'block';
        isArticleSpan.textContent = response.isArticle ? '✅ Article detected' : '❌ Not an article';
        scrollPercentageSpan.textContent = Math.round(response.scrollPercentage);
        
        summarizeButton.disabled = !response.isArticle || response.readContent.length < 100;
      }
    });
  }
  
  saveButton.addEventListener('click', async () => {
    const serverUrl = serverUrlInput.value.trim();
    const targetFile = targetFileInput.value.trim();
    const autoSummarize = autoSummarizeToggle.checked;
    
    if (!targetFile) {
      showStatus('Please enter a target file name', 'error');
      return;
    }
    
    await chrome.storage.local.set({
      serverUrl: serverUrl || 'http://localhost:3000',
      targetFile,
      autoSummarize
    });
    
    showStatus('Settings saved successfully!', 'success');
  });
  
  summarizeButton.addEventListener('click', async () => {
    const settings = await chrome.storage.local.get(['targetFile', 'serverUrl']);
    
    if (!settings.targetFile) {
      showStatus('Please save settings first', 'error');
      return;
    }
    
    summarizeButton.disabled = true;
    summarizeButton.textContent = 'Summarizing...';
    
    chrome.runtime.sendMessage({ type: 'MANUAL_SUMMARIZE' }, (response) => {
      summarizeButton.disabled = false;
      summarizeButton.textContent = 'Summarize Current Article';
      
      if (response && response.success) {
        showStatus('Article summarized successfully!', 'success');
      } else {
        showStatus(response?.error || 'Failed to summarize article', 'error');
      }
    });
  });
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }
});

