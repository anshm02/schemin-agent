// Intersection Observer tracking for viewed content
let viewedElements = new Set();
let observer = null;

function initIntersectionObserver() {
  if (observer) {
    observer.disconnect();
  }
  
  viewedElements = new Set();
  
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        viewedElements.add(entry.target);
      }
    });
  }, {
    threshold: [0.5]
  });
  
  const selectorsToObserve = [
    'article',
    'main',
    'section',
    '[role="article"]',
    '[role="main"]',
    '.job-card',
    '.post',
    '.content',
    'p',
    'h1',
    'h2',
    'h3',
    'div[class*="card"]',
    'li[class*="item"]'
  ];
  
  selectorsToObserve.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      observer.observe(element);
    });
  });
}

function extractViewedContent() {
  const viewedContent = {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    viewedElements: []
  };
  
  viewedElements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const id = element.id || '';
    const text = element.textContent.trim();
    const html = element.outerHTML;
    
    if (text.length > 0) {
      viewedContent.viewedElements.push({
        tagName,
        className,
        id,
        text: text.substring(0, 1000),
        html: html.substring(0, 2000)
      });
    }
  });
  
  return viewedContent;
}

function extractFullContentWithReadability() {
  const documentClone = document.cloneNode(true);
  const article = new Readability(documentClone).parse();
  
  if (article) {
    return {
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
  }
  
  return null;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_INTERSECTION_OBSERVER') {
    try {
      initIntersectionObserver();
      sendResponse({ success: true, message: 'Intersection Observer started' });
    } catch (error) {
      console.error('Error starting observer:', error);
      sendResponse({ error: error.message });
    }
  } else if (request.type === 'EXTRACT_VIEWED_CONTENT') {
    try {
      const viewedContent = extractViewedContent();
      sendResponse(viewedContent);
    } catch (error) {
      console.error('Error extracting viewed content:', error);
      sendResponse({ error: error.message });
    }
  } else if (request.type === 'EXTRACT_READABILITY_CONTENT') {
    try {
      const readabilityContent = extractFullContentWithReadability();
      sendResponse(readabilityContent);
    } catch (error) {
      console.error('Error extracting readability content:', error);
      sendResponse({ error: error.message });
    }
  }
  return true;
});

// Notify background when page is loaded
if (document.readyState === 'complete') {
  notifyPageReady();
  initIntersectionObserver();
} else {
  window.addEventListener('load', () => {
    notifyPageReady();
    initIntersectionObserver();
  });
}

function notifyPageReady() {
  chrome.runtime.sendMessage({
    type: 'PAGE_READY',
    url: window.location.href,
    title: document.title
  }).catch(() => {
    // Ignore errors if background script isn't ready
  });
}
