"use client"

import React, { Fragment, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import SimpleBar from "simplebar-react"
import nextConfig from "@/next.config"
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import { supabase } from "@/shared/lib/supabase"
import { setState } from "../services/switcherServices"
import {
  SECURONIX_COURSE_PROGRESS_UPDATED_EVENT,
  SECURONIX_SIEM_COURSE_ID,
  SECURONIX_SIEM_DISPLAY_NAME,
  SECURONIX_SIEM_ROUTE_PREFIX,
  SECURONIX_SIEM_TOPICS,
} from "@/shared/courses/securonix-siem-config"
import { fetchCompletedTopicIds } from "@/shared/lib/courseTopicProgress"

type SecuronixSiemSidebarProps = {
  onBackToMainNav: () => void
}

function TopicCircle({ completed }: { completed: boolean }) {
  const size = 18
  const strokeW = 1.35
  const blue = "#5b9bd5"
  const ringMuted = "rgba(148, 163, 184, 0.55)"

  return (
    <span className="side-menu__icon d-inline-flex align-items-center justify-content-center flex-shrink-0" aria-hidden>
      {!completed ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={ringMuted} strokeWidth={strokeW} />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={blue} strokeWidth={strokeW} />
          <path
            d="M8 12.2l2.35 2.3L16 8.85"
            stroke={blue}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </span>
  )
}

export default function SecuronixSiemSidebar({ onBackToMainNav }: SecuronixSiemSidebarProps) {
  const { basePath } = nextConfig
  const pathname = usePathname()
  const router = useRouter()
  const { membershipRecord, isLoading: membershipLoading } = useMembershipContext()
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set())

  const loadProgress = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setCompletedTopicIds(new Set())
      return
    }
    const ids = await fetchCompletedTopicIds(user.id, SECURONIX_SIEM_COURSE_ID)
    setCompletedTopicIds(new Set(ids))
  }, [])

  useEffect(() => {
    void loadProgress()
  }, [loadProgress])

  useEffect(() => {
    const onUpdated = () => {
      void loadProgress()
    }
    window.addEventListener(SECURONIX_COURSE_PROGRESS_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(SECURONIX_COURSE_PROGRESS_UPDATED_EVENT, onUpdated)
  }, [loadProgress])

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("userRole")
      sessionStorage.removeItem("userMembership")
      sessionStorage.removeItem("assignedTenants")
      sessionStorage.removeItem("selectedTenantIds")
      localStorage.removeItem("mfaVerified")
      sessionStorage.removeItem("mfaTicket")
      window.dispatchEvent(new CustomEvent("membershipUpdated", { detail: null }))
      const { error } = await supabase.auth.signOut()
      if (error) console.error("Error signing out:", error)
      router.push("/")
    } catch (e) {
      console.error("Error during logout:", e)
    }
  }

  function menuClose() {
    if (window.innerWidth <= 992) {
      setState({ toggled: "close" })
    }
    overlayRef.current?.classList.remove("active")
  }

  useEffect(() => {
    const mainContent = document.querySelector(".main-content")
    if (mainContent) mainContent.addEventListener("click", menuClose)
    return () => {
      if (mainContent) mainContent.removeEventListener("click", menuClose)
    }
  }, [])

  return (
    <Fragment>
      <div id="responsive-overlay" ref={overlayRef} onClick={() => menuClose()} />
      <aside className="app-sidebar sticky d-flex flex-column" id="sidebar">
        <div className="main-sidebar-header">
          <Link scroll={false} href={SECURONIX_SIEM_ROUTE_PREFIX} className="header-logo">
            <Image width={99} height={32} src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-logo.png`} alt="logo" className="desktop-logo" />
            <Image width={30} height={24} src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-dark.png`} alt="logo" className="toggle-dark" />
            <Image width={112} height={36} src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-dark.png`} alt="logo" className="desktop-dark" />
            <Image width={99} height={32} src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-white.png`} alt="logo" className="desktop-white" />
            <Image width={30} height={24} src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-logo.png`} alt="logo" className="toggle-logo" />
            <Image width={30} height={24} src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-white.png`} alt="logo" className="toggle-white" />
          </Link>
        </div>

        <SimpleBar className="main-sidebar d-flex flex-column flex-fill" id="sidebar-scroll">
          <nav className="main-menu-container nav nav-pills flex-column sub-open flex-fill">
            <ul className="main-menu">
              <li className="slide">
                <button
                  type="button"
                  className="side-menu__item w-100 text-start border-0 bg-transparent"
                  onClick={() => {
                    onBackToMainNav()
                    menuClose()
                  }}
                >
                  <span className="side-menu__icon d-flex align-items-center justify-content-center" style={{ width: "1.125rem", height: "1.125rem" }}>
                    <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                      ←
                    </span>
                  </span>
                  <span className="side-menu__label">Back to main menu</span>
                </button>
              </li>
              <li className="slide__category">
                <span className="category-name">{SECURONIX_SIEM_DISPLAY_NAME}</span>
              </li>
              {SECURONIX_SIEM_TOPICS.map((item) => {
                const active =
                  item.id === "overview"
                    ? pathname === item.path
                    : pathname === item.path || pathname.startsWith(`${item.path}/`)
                const completed = completedTopicIds.has(item.id)
                return (
                  <li key={item.path} className={`slide ${active ? "active" : ""}`}>
                    <Link
                      href={item.path}
                      scroll={false}
                      onClick={() => menuClose()}
                      className={`side-menu__item align-items-center ${active ? "active" : ""}`}
                    >
                      <TopicCircle completed={completed} />
                      <span className="side-menu__label" title={item.title}>
                        <span className="side-menu__label-text">{item.title}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </SimpleBar>

        <div className="sidebar-user-info border-top p-3">
          {membershipLoading ? (
            <div className="d-flex align-items-center justify-content-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="text-muted">Loading...</span>
            </div>
          ) : (
            <div className="d-flex flex-column">
              <div className="d-flex align-items-center mb-2">
                <div className="avatar avatar-md bg-primary-transparent avatar-rounded me-2">
                  <i className="ri-user-line fs-16" />
                </div>
                <div className="flex-fill min-w-0">
                  <div className="fw-medium text-dark fs-14 text-truncate" title={membershipRecord?.username ?? ""}>
                    {membershipRecord?.username ?? "—"}
                  </div>
                  <div className="text-muted fs-12 text-truncate" title={membershipRecord?.membership ?? ""}>
                    {membershipRecord?.membership ?? "—"}
                  </div>
                </div>
              </div>
              <SpkButton Buttonvariant="outline-danger" Size="sm" onClickfunc={handleLogout} Customclass="w-100">
                <i className="ri-logout-box-line me-1" />
                Logout
              </SpkButton>
            </div>
          )}
        </div>
      </aside>
    </Fragment>
  )
}
