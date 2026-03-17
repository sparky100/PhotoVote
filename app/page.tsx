'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Photo } from '../lib/types'
import styles from './page.module.css'

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const replaceTargetId = useRef<string | null>(null)

  const voteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/vote`
    : '/vote'

  useEffect(() => { fetchPhotos() }, [])

  async function fetchPhotos() {
    setLoading(true)
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('sort_order', { ascending: true })
    setPhotos(data || [])
    setLoading(false)
  }

  async function uploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const base = photos.length
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, file)
      if (upErr) { console.error(upErr); continue }
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
      await supabase.from('photos').insert({
        name: file.name.replace(/\.[^.]+$/, ''),
        url: urlData.publicUrl,
        votes: 0,
        sort_order: base + i,
      })
    }
    setUploading(false)
    fetchPhotos()
    if (fileRef.current) fileRef.current.value = ''
  }

  async function replacePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const id = replaceTargetId.current
    if (!file || !id) return
    const photo = photos.find(p => p.id === id)!
    const oldPath = photo.url.split('/photos/')[1]
    await supabase.storage.from('photos').remove([oldPath])
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await supabase.storage.from('photos').upload(path, file)
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    await supabase.from('photos').update({ url: urlData.publicUrl }).eq('id', id)
    if (replaceRef.current) replaceRef.current.value = ''
    replaceTargetId.current = null
    fetchPhotos()
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm(`Delete "${photo.name}"? This will also remove its votes.`)) return
    const path = photo.url.split('/photos/')[1]
    await supabase.storage.from('photos').remove([path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setPhotos(p => p.filter(x => x.id !== photo.id))
  }

  function startRename(photo: Photo) {
    setEditingId(photo.id)
    setEditingName(photo.name)
  }

  async function saveRename(id: string) {
    const name = editingName.trim()
    if (!name) { setEditingId(null); return }
    await supabase.from('photos').update({ name }).eq('id', id)
    setPhotos(p => p.map(x => x.id === id ? { ...x, name } : x))
    setEditingId(null)
  }

  function onDragStart(id: string) { setDragId(id) }
  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (id !== dragId) setDragOverId(id)
  }
  async function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const reordered = [...photos]
    const fromIdx = reordered.findIndex(p => p.id === dragId)
    const toIdx = reordered.findIndex(p => p.id === targetId)
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const updated = reordered.map((p, i) => ({ ...p, sort_order: i }))
    setPhotos(updated)
    setDragId(null)
    setDragOverId(null)
    for (const p of updated) {
      await supabase.from('photos').update({ sort_order: p.sort_order }).eq('id', p.id)
    }
  }

  async function resetVotes() {
    if (!confirm('Reset all votes to zero?')) return
    await supabase.rpc('reset_all_votes')
    fetchPhotos()
  }

  async function startNewPoll() {
    if (!confirm('Start a new poll? This will delete all current photos and votes. This cannot be undone.')) return
    // Delete files from storage
    const paths = photos.map(p => {
      const parts = p.url.split('/object/public/photos/')
      return parts[1] || ''
    }).filter(Boolean)
    if (paths.length) await supabase.storage.from('photos').remove(paths)
    // Delete all DB rows via RPC to bypass RLS
    await supabase.rpc('delete_all_photos')
    setPhotos([])
  }

  function copyLink() {
    navigator.clipboard.writeText(voteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Photo Vote <span className={styles.badge}>Admin</span></h1>
          <div className={styles.headerActions}>
            <a href="/results" className={styles.linkBtn}>Results</a>
            <a href="/vote" className={styles.linkBtn}>Preview vote page</a>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Photos</h2>
            {photos.length > 1 && <p className={styles.sectionHint}>Drag to reorder</p>}
          </div>

          <div className={styles.dropZone} onClick={() => fileRef.current?.click()}>
            <span className={styles.plusIcon}>+</span>
            <p className={styles.dropText}>{uploading ? 'Uploading…' : 'Click to upload photos'}</p>
            <p className={styles.dropSub}>JPG, PNG, WEBP — add as many as you like</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={uploadPhotos} />
          <input ref={replaceRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={replacePhoto} />

          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : photos.length === 0 ? (
            <p className={styles.empty}>No photos yet — upload some above.</p>
          ) : (
            <div className={styles.thumbGrid}>
              {photos.map(p => (
                <div
                  key={p.id}
                  className={`${styles.thumbWrap} ${dragOverId === p.id ? styles.dragOver : ''} ${dragId === p.id ? styles.dragging : ''}`}
                  draggable
                  onDragStart={() => onDragStart(p.id)}
                  onDragOver={e => onDragOver(e, p.id)}
                  onDrop={() => onDrop(p.id)}
                  onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                >
                  <img src={p.url} alt={p.name} className={styles.thumb} />

                  <div className={styles.thumbActions}>
                    <button className={styles.actionBtn} title="Rename" onClick={() => startRename(p)}>✎</button>
                    <button
                      className={styles.actionBtn}
                      title="Replace image"
                      onClick={() => { replaceTargetId.current = p.id; replaceRef.current?.click() }}
                    >⇅</button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Delete"
                      onClick={() => deletePhoto(p)}
                    >×</button>
                  </div>

                  <div className={styles.thumbBottom}>
                    {editingId === p.id ? (
                      <input
                        className={styles.renameInput}
                        value={editingName}
                        autoFocus
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={() => saveRename(p.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveRename(p.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className={styles.thumbName} title={p.name}>{p.name}</span>
                    )}
                  </div>

                  <div className={styles.dragHandle}>⠿</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {photos.length >= 2 && (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Share with voters</h2>
            <p className={styles.shareDesc}>Send this link to anyone you want to vote:</p>
            <div className={styles.shareRow}>
              <input className={styles.shareInput} readOnly value={voteUrl} />
              <button className={styles.btn} onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </section>
        )}

        {photos.length > 0 && (
          <div className={styles.dangerRow}>
            {photos.some(p => p.votes > 0) && (
              <button className={styles.dangerBtn} onClick={resetVotes}>Reset votes</button>
            )}
            <button className={`${styles.dangerBtn} ${styles.dangerBtnStrong}`} onClick={startNewPoll}>
              New poll — clear everything
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
