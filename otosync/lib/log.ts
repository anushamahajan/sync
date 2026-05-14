type Level = 'info' | 'warn' | 'error'

export function log(tag: string, level: Level, message: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString()
  const prefix = `[${ts}] [${tag}] ${level.toUpperCase()}`
  const out = data ? `${prefix} — ${message} ${JSON.stringify(data)}` : `${prefix} — ${message}`

  if (level === 'error') console.error(out)
  else if (level === 'warn') console.warn(out)
  else console.log(out)
}
