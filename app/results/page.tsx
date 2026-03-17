'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Photo } from '../../lib/types'
import styles from './results.module.css'

export default function ResultsPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPhotos()

    // Real-time subscription — updates whenever a vote is cast
    const channel = supabase
      .channel('photos-votes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'photos' }, () => {
        fetchPhotos()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('votes', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  const totalVotes = photos.reduce((s, p) => s + p.votes, 0)
  const maxVotes = photos[0]?.votes || 1

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1 className={styles.title}>Results</h1>
            <p className={styles.sub}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} — updates live</p>
          </div>
          <a href="/vote" className={styles.linkBtn}>Vote page</a>
        </div>
      </header>

      <main className={styles.main}>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : photos.length === 0 ? (
          <p className={styles.muted}>No photos yet.</p>
        ) : (
          <div className={styles.list}>
            {photos.map((photo, i) => {
              const pct = totalVotes > 0 ? Math.round(photo.votes / totalVotes * 100) : 0
              const barWidth = Math.round(photo.votes / maxVotes * 100)
              const isLeader = i === 0 && photo.votes > 0
              return (
                <div key={photo.id} className={`${styles.row} ${isLeader ? styles.leader : ''}`}>
                  <span className={styles.rank}>#{i + 1}</span>
                  <img src={photo.url} alt={photo.name} className={styles.thumb} />
                  <div className={styles.info}>
                    <div className={styles.nameRow}>
                      <span className={styles.name}>{photo.name}</span>
                      {isLeader && <span className={styles.leadBadge}>Leading</span>}
                    </div>
                    <div className={styles.barBg}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className={styles.pct}>{pct}% of votes</p>
                  </div>
                  <span className={styles.count}>{photo.votes}</span>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
