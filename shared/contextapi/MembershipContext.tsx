"use client"
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { supabase } from '@/shared/lib/supabase'

export interface UserMembershipRow {
  id: number
  user_id: string
  username?: string
  membership: string
  created_at?: string
}

interface MembershipContextType {
  membership: string | null
  membershipRecord: UserMembershipRow | null
  isLoading: boolean
}

const STORAGE_KEY = 'userMembership'

const MembershipContext = createContext<MembershipContextType | undefined>(
  undefined
)

export const MembershipProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [membershipRecord, setMembershipRecord] =
    useState<UserMembershipRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMembership = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          setMembershipRecord(null)
          setIsLoading(false)
          return
        }

        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as UserMembershipRow
            if (parsed.user_id === user.id) {
              const u = parsed.username
              const hasUsername =
                typeof u === 'string' && u.trim().length > 0
              // Old caches lacked `username`; refetch so sidebar gets DB values.
              if (hasUsername) {
                setMembershipRecord(parsed)
                setIsLoading(false)
                return
              }
              sessionStorage.removeItem(STORAGE_KEY)
            }
          } catch {
            sessionStorage.removeItem(STORAGE_KEY)
          }
        }

        const { data: row, error: fetchError } = await supabase
          .from('user_memberships')
          .select('id, user_id, username, membership, created_at')
          .eq('user_id', user.id)
          .maybeSingle()

        if (fetchError) {
          console.error('Error fetching user_memberships:', fetchError)
          setMembershipRecord(null)
        } else if (row) {
          const r = row as UserMembershipRow
          setMembershipRecord(r)
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(r))
        } else {
          setMembershipRecord(null)
        }
      } catch (e) {
        console.error('Membership load error:', e)
        setMembershipRecord(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadMembership()

    const onMembershipUpdated = (e: Event) => {
      const ce = e as CustomEvent<UserMembershipRow | null>
      const d = ce.detail
      if (d) {
        setMembershipRecord(d)
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d))
      } else {
        setMembershipRecord(null)
        sessionStorage.removeItem(STORAGE_KEY)
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        if (event.newValue) {
          try {
            setMembershipRecord(JSON.parse(event.newValue))
          } catch {
            setMembershipRecord(null)
          }
        } else {
          setMembershipRecord(null)
        }
      }
    }

    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('membershipSync')
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'membershipUpdated') {
          const d = ev.data.data as UserMembershipRow | null
          if (d) {
            setMembershipRecord(d)
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d))
          } else {
            setMembershipRecord(null)
            sessionStorage.removeItem(STORAGE_KEY)
          }
        }
      }
    }

    window.addEventListener(
      'membershipUpdated',
      onMembershipUpdated as EventListener
    )
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener(
        'membershipUpdated',
        onMembershipUpdated as EventListener
      )
      window.removeEventListener('storage', onStorage)
      bc?.close()
    }
  }, [])

  const value: MembershipContextType = {
    membership: membershipRecord?.membership ?? null,
    membershipRecord,
    isLoading,
  }

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  )
}

export const useMembershipContext = (): MembershipContextType => {
  const ctx = useContext(MembershipContext)
  if (ctx === undefined) {
    throw new Error(
      'useMembershipContext must be used within a MembershipProvider'
    )
  }
  return ctx
}

/** Call after MFA / password auth succeeds to persist membership and sync context. */
export const useUpdateMembership = () => {
  return useCallback((row: UserMembershipRow) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(row))
      sessionStorage.removeItem('assignedTenants')
      sessionStorage.removeItem('selectedTenantIds')
      window.dispatchEvent(
        new CustomEvent<UserMembershipRow>('membershipUpdated', { detail: row })
      )
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('membershipSync')
        ch.postMessage({ type: 'membershipUpdated', data: row })
        ch.close()
      }
    } catch (e) {
      console.error('applyMembership failed:', e)
    }
  }, [])
}
