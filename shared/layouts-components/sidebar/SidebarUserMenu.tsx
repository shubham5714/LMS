"use client"

import React from "react"
import Link from "next/link"
import { Dropdown } from "react-bootstrap"
import { useUserContext } from "@/shared/contextapi/UserContext"

type Props = {
  username?: string | null
  membership?: string | null
  onLogout: () => void
}

export function SidebarUserMenu({ username, membership, onLogout }: Props) {
  const { isAuthenticated } = useUserContext()
  const signedIn = isAuthenticated || Boolean(username?.trim())

  if (!signedIn) {
    return (
      <div className="d-flex align-items-center sidebar-user-menu">
        <div className="avatar avatar-md bg-primary-transparent avatar-rounded me-2 flex-shrink-0">
          <i className="ri-user-line fs-16" aria-hidden />
        </div>
        <Link
          href="/signin"
          scroll={false}
          className="btn btn-sm btn-primary sidebar-user-menu__signin"
        >
          Sign In
        </Link>
      </div>
    )
  }

  const displayName = username?.trim() || "—"
  const displayMembership = membership?.trim() || "—"

  return (
    <div className="d-flex align-items-center sidebar-user-menu">
      <div className="avatar avatar-md bg-primary-transparent avatar-rounded me-2 flex-shrink-0">
        <i className="ri-user-line fs-16" aria-hidden />
      </div>
      <div className="flex-fill min-w-0">
        <div className="fw-medium text-dark fs-14 text-truncate" title={displayName}>
          {displayName}
        </div>
        <div className="text-muted fs-12 text-truncate" title={displayMembership}>
          {displayMembership}
        </div>
      </div>
      <Dropdown align="end" className="flex-shrink-0">
        <Dropdown.Toggle
          as="button"
          type="button"
          className="sidebar-user-menu__toggle"
          aria-label="User menu"
        >
          <i className="ri-more-2-fill" aria-hidden />
        </Dropdown.Toggle>
        <Dropdown.Menu className="sidebar-user-menu__dropdown">
          <Dropdown.Item
            as="button"
            type="button"
            className="d-flex align-items-center gap-2"
            onClick={onLogout}
          >
            <i className="ri-logout-box-line" aria-hidden />
            Logout
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  )
}
