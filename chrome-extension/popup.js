const SUPABASE_URL = 'https://agtlsmwswiexxyickqnz.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_RpTJ71-Kf40iu_fRn5RL4g_7gRwxxOt'
const APP_ORIGINS = ['http://localhost:3000', 'https://sync-app.vercel.app']
const MAX_FILE_BYTES = 50 * 1024 * 1024  // 50 MB

// ── DOM refs ──────────────────────────────────────────────────────────────────
const screenConnect = document.getElementById('screen-connect')
const screenCapture = document.getElementById('screen-capture')
const screenSuccess = document.getElementById('screen-success')
const statusBadge   = document.getElementById('status-badge')
const btnConnect    = document.getElementById('btn-connect')
const btnSave       = document.getElementById('btn-save')
const btnDisconnect = document.getElementById('btn-disconnect')
const selectFolder  = document.getElementById('select-folder')
const errorBar      = document.getElementById('error-bar')
const successDetail = document.getElementById('success-detail')

const fieldsMap = {
  text:  document.getElementById('fields-text'),
  link:  document.getElementById('fields-link'),
  image: document.getElementById('fields-image'),
  file:  document.getElementById('fields-file'),
  drive: document.getElementById('fields-drive'),
}

let session    = null   // { access_token, user_id }
let activeType = 'text'
let selectedImageFile = null
let selectedFile      = null

// ── Session helpers ───────────────────────────────────────────────────────────
const loadSession  = () => new Promise(r => chrome.storage.local.get(['sync_session'], d => r(d.sync_session || null)))
const storeSession = s  => new Promise(r => chrome.storage.local.set({ sync_session: s }, r))
const clearSession = () => new Promise(r => chrome.storage.local.remove(['sync_session'], r))

async function fetchSessionFromApp() {
  for (const origin of APP_ORIGINS) {
    try {
      const res = await fetch(`${origin}/api/token`, { credentials: 'include' })
      if (!res.ok) continue
      const data = await res.json()
      if (data.access_token && data.user_id) return data
    } catch {}
  }
  return null
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
function authHeaders(extra = {}) {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session.access_token}`,
    ...extra,
  }
}

async function fetchFolders() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/folders?user_id=eq.${session.user_id}&order=name.asc`,
    { headers: authHeaders() }
  )
  return res.ok ? res.json() : []
}

async function insertItem(body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ user_id: session.user_id, ...body }),
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
}

async function uploadToStorage(file, onProgress) {
  const ext  = file.name.split('.').pop() || 'bin'
  const rand = Math.random().toString(36).slice(2, 8)
  const path = `${session.user_id}/${Date.now()}-${rand}.${ext}`

  // XMLHttpRequest so we can track upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/vault/${path}`)
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY)
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'false')

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(path)
      else reject(new Error(`Upload failed: ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(file)
  })
}

// ── Drive URL parser ──────────────────────────────────────────────────────────
function parseDriveId(url) {
  const byPath  = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/)
  const byQuery = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/)
  return (byPath || byQuery)?.[1] || null
}

// ── File size formatter ───────────────────────────────────────────────────────
function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

// File type icon
function fileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  const map = { pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗', ppt: '📙', pptx: '📙',
    zip: '🗜', rar: '🗜', mp4: '🎬', mp3: '🎵', csv: '📊' }
  return map[ext] || '📄'
}

// ── UI state ──────────────────────────────────────────────────────────────────
function showConnect() {
  screenConnect.style.display = ''
  screenCapture.style.display = 'none'
  screenSuccess.style.display = 'none'
  statusBadge.textContent = 'not connected'
  statusBadge.className   = 'badge disconnected'
}
function showCapture() {
  screenConnect.style.display = 'none'
  screenCapture.style.display = ''
  screenSuccess.style.display = 'none'
  statusBadge.textContent = 'connected'
  statusBadge.className   = 'badge connected'
}
function showSuccess(detail) {
  screenConnect.style.display = 'none'
  screenCapture.style.display = 'none'
  screenSuccess.style.display = ''
  successDetail.textContent = detail
  setTimeout(() => window.close(), 1800)
}
function showError(msg) {
  errorBar.textContent = msg
  errorBar.classList.add('visible')
  setTimeout(() => errorBar.classList.remove('visible'), 4000)
}
function setSaving(saving) {
  btnSave.disabled    = saving
  btnSave.textContent = saving ? 'Saving…' : 'Save to Vault'
}

function setType(type) {
  activeType = type
  document.querySelectorAll('.type-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.type === type)
  )
  Object.entries(fieldsMap).forEach(([k, el]) => {
    el.style.display = k === type ? '' : 'none'
  })
  errorBar.classList.remove('visible')
}

// ── Auto-fill ─────────────────────────────────────────────────────────────────
async function autoFill() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab || !tab.url?.startsWith('http')) return

    if (activeType === 'text') {
      try {
        const [res] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection()?.toString()?.trim() || '',
        })
        const sel = res?.result
        if (sel) {
          document.getElementById('input-text').value = sel
          document.getElementById('auto-text-badge').style.display = 'inline'
        }
      } catch {}
    }

    if (activeType === 'link') {
      document.getElementById('input-url').value   = tab.url   || ''
      document.getElementById('input-title').value = tab.title || ''
      document.getElementById('auto-link-badge').style.display = 'inline'
    }

    if (activeType === 'drive') {
      const url = tab.url || ''
      if (url.includes('google.com')) {
        document.getElementById('input-drive-url').value   = url
        document.getElementById('input-drive-title').value = tab.title || ''
      }
    }
  } catch {}
}

// ── File picker setup ─────────────────────────────────────────────────────────
function setupFilePicker({ dzId, inputId, previewId, nameId, sizeId, clearId, imgId, isImage }) {
  const dz      = document.getElementById(dzId)
  const input   = document.getElementById(inputId)
  const preview = document.getElementById(previewId)
  const nameEl  = document.getElementById(nameId)
  const sizeEl  = document.getElementById(sizeId)
  const clearBtn= document.getElementById(clearId)
  const imgEl   = imgId ? document.getElementById(imgId) : null

  function selectFile(file) {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) { showError(`File too large (max 50 MB). This file is ${fmtSize(file.size)}.`); return }

    if (isImage) {
      selectedImageFile = file
      const url = URL.createObjectURL(file)
      imgEl.src = url
    } else {
      selectedFile = file
      const iconEl = document.getElementById('fp-file-icon')
      if (iconEl) iconEl.textContent = fileIcon(file.name)
    }
    nameEl.textContent = file.name
    sizeEl.textContent = fmtSize(file.size)
    dz.style.display      = 'none'
    preview.classList.add('visible')
  }

  dz.addEventListener('click', () => input.click())
  input.addEventListener('change', () => selectFile(input.files?.[0]))

  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over') })
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'))
  dz.addEventListener('drop', e => {
    e.preventDefault()
    dz.classList.remove('drag-over')
    selectFile(e.dataTransfer.files?.[0])
  })

  clearBtn.addEventListener('click', () => {
    if (isImage) selectedImageFile = null
    else selectedFile = null
    input.value = ''
    dz.style.display = ''
    preview.classList.remove('visible')
    if (imgEl) imgEl.src = ''
  })
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function save() {
  errorBar.classList.remove('visible')
  const folderId = selectFolder.value || null

  if (activeType === 'text') {
    const content = document.getElementById('input-text').value.trim()
    if (!content) { showError('Enter some text to save.'); return }
    setSaving(true)
    try { await insertItem({ type: 'text', content, folder_id: folderId }); showSuccess('Text saved to vault') }
    catch { showError('Save failed — try reconnecting.'); setSaving(false) }
    return
  }

  if (activeType === 'link') {
    const link_url = document.getElementById('input-url').value.trim()
    if (!link_url) { showError('Enter a URL to save.'); return }
    const link_title = document.getElementById('input-title').value.trim() || null
    setSaving(true)
    try { await insertItem({ type: 'link', link_url, link_title, folder_id: folderId }); showSuccess('Link saved to vault') }
    catch { showError('Save failed — try reconnecting.'); setSaving(false) }
    return
  }

  if (activeType === 'image') {
    if (!selectedImageFile) { showError('Choose an image first.'); return }
    setSaving(true)
    const progWrap = document.getElementById('prog-image')
    const progBar  = document.getElementById('progbar-image')
    progWrap.classList.add('visible')
    try {
      const file_url = await uploadToStorage(selectedImageFile, pct => { progBar.style.width = pct + '%' })
      await insertItem({ type: 'image', file_url, file_name: selectedImageFile.name, file_size_bytes: selectedImageFile.size, folder_id: folderId })
      showSuccess(`Image "${selectedImageFile.name}" saved`)
    } catch (e) {
      progWrap.classList.remove('visible')
      showError(e.message || 'Upload failed.'); setSaving(false)
    }
    return
  }

  if (activeType === 'file') {
    if (!selectedFile) { showError('Choose a file first.'); return }
    setSaving(true)
    const progWrap = document.getElementById('prog-file')
    const progBar  = document.getElementById('progbar-file')
    progWrap.classList.add('visible')
    try {
      const file_url = await uploadToStorage(selectedFile, pct => { progBar.style.width = pct + '%' })
      await insertItem({ type: 'file', file_url, file_name: selectedFile.name, file_size_bytes: selectedFile.size, folder_id: folderId })
      showSuccess(`File "${selectedFile.name}" saved`)
    } catch (e) {
      progWrap.classList.remove('visible')
      showError(e.message || 'Upload failed.'); setSaving(false)
    }
    return
  }

  if (activeType === 'drive') {
    const rawUrl = document.getElementById('input-drive-url').value.trim()
    if (!rawUrl) { showError('Paste a Google Drive URL.'); return }
    const drive_file_id = parseDriveId(rawUrl)
    if (!drive_file_id) { showError('Could not find a Drive file ID in that URL.'); return }
    const drive_file_title = document.getElementById('input-drive-title').value.trim() || null
    setSaving(true)
    try {
      await insertItem({ type: 'drive_link', drive_file_id, drive_file_title, folder_id: folderId })
      showSuccess('Drive link saved to vault')
    } catch { showError('Save failed — try reconnecting.'); setSaving(false) }
  }
}

// ── Load folders ──────────────────────────────────────────────────────────────
async function loadFolders() {
  try {
    const folders = await fetchFolders()
    selectFolder.innerHTML = '<option value="">No folder</option>'
    folders.forEach(f => {
      const opt = document.createElement('option')
      opt.value = f.id; opt.textContent = f.name
      selectFolder.appendChild(opt)
    })
  } catch {}
}

// ── Event listeners ───────────────────────────────────────────────────────────
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => { setType(btn.dataset.type); autoFill() })
})

btnConnect.addEventListener('click', async () => {
  btnConnect.disabled    = true
  btnConnect.textContent = 'Connecting…'
  const s = await fetchSessionFromApp()
  if (s) {
    session = s
    await storeSession(s)
    showCapture()
    await Promise.all([loadFolders(), autoFill()])
  } else {
    btnConnect.disabled    = false
    btnConnect.textContent = 'Connect'
    const p = screenConnect.querySelector('p')
    p.textContent = 'Make sure you\'re logged into Sync at localhost:3000, then try again.'
    p.style.color = '#fca5a5'
  }
})

btnSave.addEventListener('click', save)

btnDisconnect.addEventListener('click', async () => {
  await clearSession(); session = null; showConnect()
  screenConnect.querySelector('p').style.color = ''
  screenConnect.querySelector('p').textContent = 'Open Sync in any browser tab, then click below to link your account.'
})

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') save()
})

// ── File pickers init ─────────────────────────────────────────────────────────
setupFilePicker({
  dzId: 'dz-image', inputId: 'file-input-image',
  previewId: 'fp-image', nameId: 'fp-image-name', sizeId: 'fp-image-size',
  clearId: 'fp-image-clear', imgId: 'fp-image-img', isImage: true,
})
setupFilePicker({
  dzId: 'dz-file', inputId: 'file-input-file',
  previewId: 'fp-file', nameId: 'fp-file-name', sizeId: 'fp-file-size',
  clearId: 'fp-file-clear', imgId: null, isImage: false,
})

// ── Init ──────────────────────────────────────────────────────────────────────
;(async () => {
  session = await loadSession()
  if (session) {
    showCapture()
    await Promise.all([loadFolders(), autoFill()])
  } else {
    showConnect()
  }
})()
