let articleData = {
  url: window.location.href,
  title: document.title,
  fullContent: '',
  readContent: '',
  scrollPercentage: 0,
  lastScrollPosition: 0,
  isArticle: false
};

function isArticlePage() {
  const articleSelectors = [
    'article',
    '[role="article"]',
    '.article',
    '.post',
    '.entry-content',
    '.post-content',
    '.article-content',
    'main article',
    '[itemtype*="Article"]'
  ];
  
  for (const selector of articleSelectors) {
    if (document.querySelector(selector)) {
      return true;
    }
  }
  
  const url = window.location.href;
  const articlePatterns = [
    /\/article\//i,
    /\/post\//i,
    /\/news\//i,
    /\/blog\//i,
    /\/story\//i,
    /\d{4}\/\d{2}\/\d{2}\//
  ];
  
  return articlePatterns.some(pattern => pattern.test(url));
}

function getArticleContent() {
  const articleSelectors = [
    'article',
    '[role="article"]',
    '.article',
    '.post',
    '.entry-content',
    '.post-content',
    '.article-content',
    'main article'
  ];
  
  for (const selector of articleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  
  const main = document.querySelector('main');
  if (main) return main;
  
  return document.body;
}

function extractTextContent(element) {
  const clone = element.cloneNode(true);
  
  const unwanted = clone.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share, .comments');
  unwanted.forEach(el => el.remove());
  
  return clone.innerText.trim();
}

function calculateScrollPercentage() {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  
  const scrollableHeight = documentHeight - windowHeight;
  const percentage = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 100;
  
  return Math.min(100, Math.max(0, percentage));
}

function getReadContent() {
  const articleElement = getArticleContent();
  if (!articleElement) return '';
  
  const fullText = extractTextContent(articleElement);
  const paragraphs = fullText.split('\n').filter(p => p.trim().length > 0);
  
  const scrollPercentage = calculateScrollPercentage();
  const readParagraphCount = Math.ceil(paragraphs.length * (scrollPercentage / 100));
  
  return paragraphs.slice(0, readParagraphCount).join('\n\n');
}

function updateArticleData() {
  if (!articleData.isArticle) return;
  
  const articleElement = getArticleContent();
  if (articleElement) {
    articleData.fullContent = extractTextContent(articleElement);
    articleData.scrollPercentage = calculateScrollPercentage();
    articleData.readContent = getReadContent();
    articleData.lastScrollPosition = window.scrollY;
  }
}

function initialize() {
  articleData.isArticle = isArticlePage();
  
  if (articleData.isArticle) {
    updateArticleData();
    
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateArticleData, 200);
    });
    
    chrome.runtime.sendMessage({
      type: 'ARTICLE_DETECTED',
      data: {
        url: articleData.url,
        title: articleData.title,
        isArticle: articleData.isArticle
      }
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_ARTICLE_DATA') {
    updateArticleData();
    sendResponse(articleData);
  } else if (request.type === 'TAB_DEACTIVATED') {
    updateArticleData();
    sendResponse(articleData);
  }
  return true;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

