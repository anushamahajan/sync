'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Folder } from '@/types'

const FOLDER_COLORS = ['#0891b2', '#7c3aed', '#16a34a', '#dc2626', '#d97706', '#db2777']

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  /** Unique topic per hook instance so Realtime never reuses an already-subscribed channel. */
  const realtimeInstanceId = useRef(crypto.randomUUID())

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return
      const userId = data.user.id

      const { data: folderData } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      setFolders(folderData ?? [])
      setLoading(false)

      channel = supabase
        .channel(`folders-${userId}-${realtimeInstanceId.current}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          setFolders((prev) => [...prev, payload.new as Folder])
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          setFolders((prev) =>
            prev.map((f) => (f.id === payload.new.id ? { ...f, ...(payload.new as Folder) } : f))
          )
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          setFolders((prev) => prev.filter((f) => f.id !== payload.old.id))
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function createFolder(name: string, description: string, color: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('folders')
      .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null, color })
      .select()
      .single()

    if (error) throw error
    return data as Folder
  }

  async function renameFolder(id: string, name: string) {
    await supabase.from('folders').update({ name: name.trim() }).eq('id', id)
  }

  async function deleteFolder(id: string) {
    await supabase.from('items').update({ folder_id: null }).eq('folder_id', id)
    await supabase.from('folders').delete().eq('id', id)
  }

  return { folders, loading, createFolder, renameFolder, deleteFolder, FOLDER_COLORS }
}
