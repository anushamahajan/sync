export type ItemType = 'text' | 'image' | 'file' | 'link' | 'drive_link' | 'video_link'

export interface Item {
  id: string
  user_id: string
  type: ItemType
  content?: string
  file_url?: string
  file_name?: string
  file_size_bytes?: number
  drive_file_id?: string
  drive_file_title?: string
  link_url?: string
  link_title?: string
  ai_description?: string
  ai_suggested_folder?: string
  folder_id?: string
  source_device?: string
  is_starred: boolean
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  created_at: string
  item_count?: number
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  action?: { label: string; onClick: () => void }
}
