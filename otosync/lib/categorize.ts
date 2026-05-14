import type { Item } from '@/types'

export function triggerCategorization(itemId: string, item: Item, folderNames: string[]) {
  fetch('/api/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, item, folderNames }),
  }).catch(() => {})
}
