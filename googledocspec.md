# GOOGLE_DRIVE_SPEC.md — Drive Integration

## Why Drive integration

When a user saves a Google Drive link in Sync, the app stores the file ID. When the folder AI chat runs, Sync fetches the latest content of that file live from Drive — no download, no manual paste. This means the AI always has the most current version of the document.

---

## OAuth scopes required

```
https://www.googleapis.com/auth/drive.readonly
```

Read-only is sufficient. We never write to Drive.

---

## OAuth flow

### Step 1 — Trigger from Settings

```javascript
function connectDrive() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + '/drive-callback',
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    access_type: 'offline',    // required for refresh token
    prompt: 'consent'          // required to always get refresh token
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}
```

### Step 2 — Handle callback at `/drive-callback`

```javascript
// In DriveCallback.jsx page
useEffect(() => {
  const code = new URLSearchParams(window.location.search).get('code')
  if (code) exchangeCodeForTokens(code)
}, [])

async function exchangeCodeForTokens(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: window.location.origin + '/drive-callback',
      grant_type: 'authorization_code'
    })
  })
  const tokens = await response.json()
  // tokens = { access_token, refresh_token, expires_in }

  await saveDriveTokens(tokens) // save to Supabase drive_tokens table
  navigate('/settings')         // redirect back
}
```

### Step 3 — Save tokens to Supabase

```javascript
async function saveDriveTokens(tokens) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  await supabase.from('drive_tokens').upsert({
    user_id: currentUserId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt
  })
}
```

---

## Token refresh

Before every Drive API call, check if token is expired:

```javascript
async function getValidAccessToken() {
  const { data } = await supabase
    .from('drive_tokens')
    .select('*')
    .eq('user_id', currentUserId)
    .single()

  if (!data) throw new Error('Drive not connected')

  const isExpired = new Date(data.expires_at) < new Date(Date.now() + 60000) // 1 min buffer

  if (isExpired) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: data.refresh_token,
        grant_type: 'refresh_token'
      })
    })
    const newTokens = await response.json()
    const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

    await supabase.from('drive_tokens').update({
      access_token: newTokens.access_token,
      expires_at: expiresAt
    }).eq('user_id', currentUserId)

    return newTokens.access_token
  }

  return data.access_token
}
```

---

## Reading a Drive file

### For Google Docs (export as plain text)

```javascript
async function fetchDriveFileContent(fileId) {
  const accessToken = await getValidAccessToken()

  // First get file metadata to check type
  const metaResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const meta = await metaResponse.json()

  let content = ''

  if (meta.mimeType === 'application/vnd.google-apps.document') {
    // Google Doc — export as plain text
    const exportResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    content = await exportResponse.text()
  }
  else if (meta.mimeType === 'application/pdf' || meta.mimeType.includes('text')) {
    // Binary file — download directly (text files only)
    const dlResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    content = await dlResponse.text()
  }
  else {
    content = `[File: ${meta.name} — type ${meta.mimeType} cannot be read as text]`
  }

  // Truncate if too large
  if (content.length > 4000) {
    content = content.slice(0, 4000) + '\n\n[truncated — showing first 4000 characters]'
  }

  return content
}
```

---

## Extracting file ID from Drive URL

```javascript
function extractDriveFileId(url) {
  // Handles formats:
  // https://docs.google.com/document/d/FILE_ID/edit
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID

  const patterns = [
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}
```

---

## Supported file types for AI context

| MIME type | How it's read |
|---|---|
| Google Doc | Export as text/plain |
| Google Sheet | Export as text/csv |
| Google Slides | Export as text/plain (limited) |
| PDF | Cannot read in browser — store link only, note to user |
| .txt, .md, .csv | Download directly as text |
| .docx, .xlsx | Cannot read in browser — store link only |

Show user a small badge on Drive items: "Readable" or "Link only" depending on type.