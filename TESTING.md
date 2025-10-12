# Testing Guide

Instructions for testing the Schemin Automation System.

## Prerequisites

Ensure all services are running:
- Backend server on port 3000
- Web dashboard on port 5173
- Chrome extension loaded
- Authenticated with Google

## Basic Test Flow

### 1. Create Google Sheet

1. Open [Google Drive](https://drive.google.com)
2. Create new Google Sheet
3. Name it: `test_automation`
4. Add column headers: `Date | Title | URL | Notes`

### 2. Create Automation

1. Open web dashboard: `http://localhost:5173`
2. In the bottom input field, type:
   ```
   Track GitHub repositories, extract page title and link, save to test_automation
   ```
3. Press Enter or click the blue button
4. Verify automation card appears with:
   - Title: "Track GitHub Repositories"
   - Sources: "github.com"
   - Extract: "page title, link"
   - Store To: "test_automation"

### 3. Test Chrome Extension

1. Navigate to: `https://github.com/microsoft/vscode`
2. Extension badge should show blue dot
3. Click extension icon
4. Should see your automation card
5. Click "Grant Permissions" (first time only)
6. Click "Log to test_automation" button
7. Should see success message

### 4. Verify Results

1. Open your `test_automation` Google Sheet
2. Should see new row with:
   - Current date
   - Page title
   - GitHub URL

## Advanced Testing

### Test Multiple Automations

Create automations for different sites:

```
Track LinkedIn jobs, extract title and company, save to jobs_sheet
```

```
Save Medium articles, extract title and author, save to articles_sheet
```

Visit each site and verify extension shows correct automation.

### Test Tab Organization

1. Create new tab in dashboard (click + icon)
2. Rename tab (double-click tab name)
3. Create automation in new tab
4. Verify automations are organized by tab

### Test Card Management

1. Drag cards to reposition
2. Resize cards by dragging edges
3. Double-click card to edit
4. Update fields and save

### Test Data Extraction

Test on different website types:

**Job Sites:**
- LinkedIn: Job title, company, location, salary
- Indeed: Similar fields
- Glassdoor: Company reviews and salaries

**Article Sites:**
- Medium: Title, author, date, claps
- TechCrunch: Headline, author, category
- Hacker News: Title, points, comments

**Repository Sites:**
- GitHub: Repo name, stars, forks, description
- GitLab: Similar fields

## Troubleshooting

### Automation Not Appearing in Extension

**Check:**
```bash
# Backend running?
curl http://localhost:3000/api/automations

# Should return JSON with your automations
```

**Fix:**
1. Refresh web dashboard
2. Reload Chrome extension
3. Check browser console for errors

### Data Not Extracting

**Check:**
- Page has finished loading
- Extract fields match page content
- Website doesn't block scraping

**Test extraction manually:**
```javascript
// Open browser console on page
document.querySelector('h1').textContent
```

### Can't Log to Sheet

**Check:**
- Sheet exists in Google Drive
- Sheet name matches exactly (case-sensitive)
- Authenticated with Google
- Backend server is running

**Verify authentication:**
```bash
curl http://localhost:3000/api/status
# Should show: {"authenticated":true}
```

### Permission Errors

**Fix:**
1. Go to `chrome://extensions/`
2. Find Schemin extension
3. Check permissions granted
4. Try revoking and re-granting

## Test Scenarios

### Scenario 1: Job Hunting

1. Create sheet: `job_applications`
2. Headers: `Date | Job Title | Company | Location | Salary | URL`
3. Create automation:
   ```
   Track jobs from LinkedIn and Indeed,
   extract job title, company, location, salary,
   save to job_applications
   ```
4. Visit job postings and log data
5. Build a database of opportunities

### Scenario 2: Research Collection

1. Create sheet: `research_papers`
2. Headers: `Date | Title | Authors | Abstract | PDF Link`
3. Create automation:
   ```
   Monitor arxiv.org for papers,
   extract title, authors, abstract, PDF link,
   save to research_papers
   ```
4. Browse papers and capture relevant ones

### Scenario 3: Article Reading List

1. Create sheet: `reading_list`
2. Headers: `Date | Title | Author | Publication | URL`
3. Create automation:
   ```
   Track articles from Medium and TechCrunch,
   extract title, author, publication date,
   save to reading_list
   ```
4. Save articles for later reading

## Performance Testing

### Load Test
- Create 10+ automation cards
- Visit site matching multiple automations
- Verify extension loads quickly
- Check no lag or stuttering

### Sync Test
- Create automation in dashboard
- Immediately visit matching site
- Verify automation appears in extension within seconds

## Success Criteria

System is working correctly if:
- Automations create from natural language
- Extension detects matching pages
- Data extracts accurately
- Logs to Google Sheets successfully
- No automatic tracking occurs
- User controls all logging
- Permissions requested dynamically

## Getting Help

If issues persist:
1. Check backend logs: `tail -f backend.log`
2. Check webapp logs: `tail -f webapp.log`
3. Check browser console (F12)
4. Check extension console (right-click icon → Inspect popup)

