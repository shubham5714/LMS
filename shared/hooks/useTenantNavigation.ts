"use client"
import { useMemo } from 'react'
import { Menuitemtype, MENUITEMS } from '@/shared/layouts-components/sidebar/nav'

/** Full sidebar tree from `nav.tsx` for every authenticated user (no tenant / role filtering). */
export const useTenantNavigation = () => {
  const menuItems = useMemo(() => MENUITEMS as Menuitemtype[], [])
  return { menuItems, isLoading: false }
}
