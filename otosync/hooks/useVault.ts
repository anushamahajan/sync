'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Item } from '@/types'

const PAGE_SIZE = 20

export function useVault(folderId?: string) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const supabase = createClient()
  const realtimeInstanceId = useRef(crypto.randomUUID())

  const fetchItems = useCallback(async (pageNum: number, replace = false) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (folderId) query = query.eq('folder_id', folderId)

    const { data } = await query

    if (data) {
      setItems((prev) => replace ? data : [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
  }, [folderId])

  useEffect(() => {
    setLoading(true)
    setPage(0)
    setItems([])
    fetchItems(0, true)
  }, [folderId])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return
      const userId = data.user.id

      channel = supabase
        .channel(`items-${folderId ?? 'all'}-${userId}-${realtimeInstanceId.current}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'items',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          const newItem = payload.new as Item
          if (folderId && newItem.folder_id !== folderId) return
          setItems((prev) => [newItem, ...prev])
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          const updated = payload.new as Item
          setItems((prev) =>
            prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
          )
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'items',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          setItems((prev) => prev.filter((item) => item.id !== payload.old.id))
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [folderId])

  function loadMore() {
    const next = page + 1
    setPage(next)
    fetchItems(next)
  }

  function refresh() {
    setPage(0)
    fetchItems(0, true)
  }

  async function deleteItem(id: string) {
    await supabase.from('items').delete().eq('id', id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function toggleStar(id: string, current: boolean) {
    await supabase.from('items').update({ is_starred: !current }).eq('id', id)
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_starred: !current } : item))
    )
  }

  async function moveToFolder(id: string, folderId: string | null) {
    await supabase.from('items').update({ folder_id: folderId }).eq('id', id)
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, folder_id: folderId ?? undefined } : item))
    )
  }

  return { items, loading, hasMore, loadMore, deleteItem, toggleStar, moveToFolder, refresh }
}

export function useStarredItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: starred } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('is_starred', true)
        .order('created_at', { ascending: false })
      setItems(starred ?? [])
      setLoading(false)
    })
  }, [])

  return { items, loading }
}
