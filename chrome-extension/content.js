// Smart data extraction based on automation fields

function extractDataFromPage(extractFields) {
  const fields = extractFields.toLowerCase().split(',').map(f => f.trim());
  const data = {};
  
  // Extract title
  if (fields.some(f => f.includes('title'))) {
    data.title = extractTitle();
  }
  
  // Extract link/URL
  if (fields.some(f => f.includes('link') || f.includes('url'))) {
    data.link = window.location.href;
  }
  
  // Extract company (for job sites)
  if (fields.some(f => f.includes('company'))) {
    data.company = extractCompany();
  }
  
  // Extract job title/position
  if (fields.some(f => f.includes('job') || f.includes('position'))) {
    data.jobTitle = extractJobTitle();
  }
  
  // Extract location
  if (fields.some(f => f.includes('location'))) {
    data.location = extractLocation();
  }
  
  // Extract salary
  if (fields.some(f => f.includes('salary') || f.includes('pay') || f.includes('compensation'))) {
    data.salary = extractSalary();
  }
  
  // Extract author
  if (fields.some(f => f.includes('author') || f.includes('writer'))) {
    data.author = extractAuthor();
  }
  
  // Extract date
  if (fields.some(f => f.includes('date') || f.includes('published') || f.includes('posted'))) {
    data.date = extractDate();
  }
  
  // Extract description/content
  if (fields.some(f => f.includes('description') || f.includes('content') || f.includes('summary'))) {
    data.description = extractDescription();
  }
  
  // Add metadata
  data.extractedAt = new Date().toISOString();
  data.pageUrl = window.location.href;
  data.pageTitle = document.title;
  
  return data;
}

function extractTitle() {
  // Try various title selectors
  const selectors = [
    'h1',
    '[data-test="job-title"]',
    '.job-title',
    '.post-title',
    '.article-title',
    'article h1',
    '[role="heading"]',
    '.title'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return document.title;
}

function extractCompany() {
  const selectors = [
    '[data-test="employer-name"]',
    '.company',
    '.companyName',
    '.employer',
    '[class*="company"]',
    '[data-company]',
    'a[href*="/company/"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Try meta tags
  const metaCompany = document.querySelector('meta[property="og:site_name"]');
  if (metaCompany) {
    return metaCompany.content;
  }
  
  return '';
}

function extractJobTitle() {
  const selectors = [
    '[data-test="job-title"]',
    '.job-title',
    '.jobTitle',
    'h1[class*="job"]',
    '[class*="position"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return extractTitle();
}

function extractLocation() {
  const selectors = [
    '[data-test="job-location"]',
    '.location',
    '[class*="location"]',
    '[data-location]',
    'span:has-text("location")',
    '.job-location'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Look for location patterns in text
  const bodyText = document.body.textContent;
  const locationPatterns = [
    /(?:Remote|Hybrid|On-site)/i,
    /(?:[A-Z][a-z]+,\s*[A-Z]{2})/,
    /(?:[A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})/
  ];
  
  for (const pattern of locationPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return '';
}

function extractSalary() {
  const salaryPatterns = [
    /\$[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*(?:per|\/)\s*(?:year|yr|hour|hr|annum))?/gi,
    /[\d,]+k?\s*-\s*[\d,]+k?(?:\s*(?:per|\/)\s*(?:year|yr))?/gi,
    /(?:salary|compensation|pay):\s*\$?[\d,]+/gi
  ];
  
  const bodyText = document.body.textContent;
  
  for (const pattern of salaryPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return '';
}

function extractAuthor() {
  const selectors = [
    '[rel="author"]',
    '.author',
    '[class*="author"]',
    '[data-author]',
    'meta[name="author"]',
    'meta[property="article:author"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'META') {
        return element.content;
      }
      if (element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
  }
  
  return '';
}

function extractDate() {
  const selectors = [
    'time',
    '[datetime]',
    '.date',
    '.published',
    '[class*="date"]',
    '[class*="time"]',
    'meta[property="article:published_time"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.hasAttribute('datetime')) {
        return element.getAttribute('datetime');
      }
      if (element.tagName === 'META') {
        return element.content;
      }
      if (element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
  }
  
  return '';
}

function extractDescription() {
  const selectors = [
    '[data-test="job-description"]',
    '.description',
    '.job-description',
    'article p',
    '.content p',
    'meta[name="description"]',
    'meta[property="og:description"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'META') {
        return element.content;
      }
      if (element.textContent.trim().length > 50) {
        return element.textContent.trim().substring(0, 500) + '...';
      }
    }
  }
  
  // Fallback to first substantial paragraph
  const paragraphs = Array.from(document.querySelectorAll('p'));
  for (const p of paragraphs) {
    if (p.textContent.trim().length > 100) {
      return p.textContent.trim().substring(0, 500) + '...';
    }
  }
  
  return '';
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_DATA') {
    try {
      const extractedData = extractDataFromPage(request.extractFields);
      sendResponse(extractedData);
    } catch (error) {
      console.error('Error extracting data:', error);
      sendResponse({ error: error.message });
    }
  }
  return true;
});

// Notify background when page is loaded
if (document.readyState === 'complete') {
  notifyPageReady();
} else {
  window.addEventListener('load', notifyPageReady);
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
