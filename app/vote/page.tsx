'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Photo } from '../../lib/types'
import styles from './vote.module.css'

const VOTED_KEY = 'photo_vote_cast'

export default function VotePage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setHasVoted(!!localStorage.getItem(VOTED_KEY))
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: true })
    setPhotos(data || [])
    setLoading(false)
  }

  async function castVote() {
    if (!selected || hasVoted || submitting) return
    setSubmitting(true)
    const photo = photos.find(p => p.id === selected)!
    await supabase
      .from('photos')
      .update({ votes: photo.votes + 1 })
      .eq('id', selected)
    localStorage.setItem(VOTED_KEY, selected)
    setHasVoted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className={styles.center}><p className={styles.muted}>Loading…</p></div>
  )

  if (photos.length === 0) return (
    <div className={styles.center}><p className={styles.muted}>No photos available yet.</p></div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pick your favourite Freddie photo</h1>
        {!hasVoted && <p className={styles.sub}>Select a photo then submit your vote</p>}
      </header>

      {hasVoted && (
        <div className={styles.votedBanner}>
          Your vote has been counted! <a href="/results" className={styles.resultsLink}>See results →</a>
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.grid}>
          {photos.map(photo => (
            <button
              key={photo.id}
              className={`${styles.card} ${selected === photo.id ? styles.selected : ''} ${hasVoted ? styles.disabled : ''}`}
              onClick={() => !hasVoted && setSelected(photo.id)}
              disabled={hasVoted}
            >
              <div className={styles.imgWrap}>
                <img src={photo.url} alt={photo.name} className={styles.img} />
                {selected === photo.id && (
                  <div className={styles.checkmark}>✓</div>
                )}
              </div>
              <p className={styles.photoName}>{photo.name}</p>
            </button>
          ))}
        </div>

        {!hasVoted && (
          <div className={styles.submitBar}>
            <button
              className={`${styles.submitBtn} ${!selected ? styles.submitDisabled : ''}`}
              onClick={castVote}
              disabled={!selected || submitting}
            >
              {submitting ? 'Submitting…' : selected ? 'Submit vote' : 'Select a photo first'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
