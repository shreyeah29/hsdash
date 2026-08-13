# JOIN US Google Form → HS Dash Careers

Public form:  
https://docs.google.com/forms/d/1PWp3k8Vg5L4YxRkDTW0IO_FWdzY0VVBt9Zf7iSrH2F8/viewform

When someone submits the form, push the row into HS Dash with a Google Apps Script trigger.

## 1. Open the response spreadsheet

1. Open the [JOIN US form](https://docs.google.com/forms/d/1PWp3k8Vg5L4YxRkDTW0IO_FWdzY0VVBt9Zf7iSrH2F8/viewform) in edit mode (Forms → ⋮ → Open in Forms).
2. **Responses** → green Sheets icon → open / create the linked spreadsheet.

## 2. Install the Apps Script

1. In the spreadsheet: **Extensions → Apps Script**
2. Replace `Code.gs` with:

```javascript
/** HS Dash careers ingest — fires on each new form response. */
var HS_DASH_API = 'https://hsdash.onrender.com/careers';
/** Optional: set the same value as CAREERS_INGEST_SECRET on Render. Leave blank if unused. */
var HS_DASH_SECRET = '';

function onFormSubmit(e) {
  var named = (e && e.namedValues) ? e.namedValues : {};
  function first(keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (named[k] && named[k][0]) return String(named[k][0]).trim();
    }
    return '';
  }

  var payload = {
    email: first(['Email Address', 'Email', 'Email *']),
    name: first(['NAME', '_NAME_', 'Name']),
    phoneNumber: first(['CONTACT NUMBER', '_CONTACT NUMBER_', 'Contact Number']),
    roleApplied: first(['ROLE', '_ROLE_', 'Role']),
    softwares: first(['softwares  am good at ', 'softwares am good at', 'Softwares']),
    experience: first(['EXPERIENCE', '_EXPERIENCE_', 'Experience']),
    portfolioUrl: first(['PORTFOLIO ', '_PORTFOLIO_', 'Portfolio']),
    instagramLink: first(['INSTAGRAM LINK', 'Instagram Link', 'INSTAGRAM LINK *']),
    externalId: Utilities.getUuid(),
    submittedAt: new Date().toISOString(),
  };

  if (!payload.phoneNumber || !payload.roleApplied) {
    console.warn('Skipping incomplete career row', payload);
    return;
  }

  var headers = { 'Content-Type': 'application/json' };
  if (HS_DASH_SECRET) headers['X-Careers-Secret'] = HS_DASH_SECRET;

  var res = UrlFetchApp.fetch(HS_DASH_API, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  console.log(res.getResponseCode(), res.getContentText());
}

/** One-time: push all existing Hiring / response rows (run manually). */
function backfillAllResponses() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  var headers = values[0].map(function (h) { return String(h).trim(); });
  for (var r = 1; r < values.length; r++) {
    var row = {};
    for (var c = 0; c < headers.length; c++) row[headers[c]] = values[r][c];
    var fakeEvent = { namedValues: {} };
    Object.keys(row).forEach(function (k) {
      fakeEvent.namedValues[k] = [row[k] == null ? '' : String(row[k])];
    });
    onFormSubmit(fakeEvent);
    Utilities.sleep(200);
  }
}
```

3. Save → **Triggers** (clock icon) → **Add trigger**
   - Function: `onFormSubmit`
   - Event source: **From spreadsheet**
   - Event type: **On form submit**
4. Authorize the script when prompted.

## 3. Optional secret

On Render, set env `CAREERS_INGEST_SECRET=some-long-random-string` and put the same value in `HS_DASH_SECRET` in the script. If unset, the API stays open with rate limiting.

## 4. Where to view

Admin → **Team** → **Careers** tab (`/admin/team`).
