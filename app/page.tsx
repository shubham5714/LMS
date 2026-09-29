"use client"

import nextConfig from "@/next.config"
import PublicHeader from "@/shared/layouts-components/header/public-header"
import Seo from "@/shared/layouts-components/seo/seo"
import Image from "next/image"
import Link from "next/link"
import React, { Fragment, useEffect, useRef, useState } from "react"

const ROLES = [
  "SOC Analyst",
  "Detection Engineer",
  "Incident Responder",
  "DFIR Analyst",
] as const
const TYPE_MS = 70
const DELETE_MS = 40
const HOLD_MS = 1600
const GAP_MS = 280

const FLOATING_TOOLS = [
  { name: "Splunk", src: "/assets/images/brand-logos/splunk-logo.png", className: "public-landing-hero__float--1" },
  { name: "QRadar", src: "/assets/images/brand-logos/qradar-logo.png", className: "public-landing-hero__float--2" },
  { name: "Microsoft Sentinel", src: "/assets/images/brand-logos/azure-sentinel.png", className: "public-landing-hero__float--3" },
  { name: "Securonix", src: "/assets/images/brand-logos/securonix-logo.png", className: "public-landing-hero__float--4" },
  { name: "DRX", src: "/assets/images/brand-logos/drx-logo.png", className: "public-landing-hero__float--5" },
  { name: "Firebase", src: "/assets/images/brand-logos/firbase.png", className: "public-landing-hero__float--6" },
] as const

const CaretIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M6 3l5 5-5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const LandingPage = () => {
  const { basePath = "" } = nextConfig
  const assetBase = process.env.NODE_ENV === "production" ? basePath : ""
  const [typedRole, setTypedRole] = useState("")
  const roleIndexRef = useRef(0)
  const charIndexRef = useRef(0)
  const deletingRef = useRef(false)

  useEffect(() => {
    let timeoutId = 0

    const tick = () => {
      const full = ROLES[roleIndexRef.current]
      const deleting = deletingRef.current
      const charIndex = charIndexRef.current

      if (!deleting) {
        if (charIndex < full.length) {
          const next = charIndex + 1
          charIndexRef.current = next
          setTypedRole(full.slice(0, next))
          timeoutId = window.setTimeout(tick, TYPE_MS)
          return
        }

        timeoutId = window.setTimeout(() => {
          deletingRef.current = true
          tick()
        }, HOLD_MS)
        return
      }

      if (charIndex > 0) {
        const next = charIndex - 1
        charIndexRef.current = next
        setTypedRole(full.slice(0, next))
        timeoutId = window.setTimeout(tick, DELETE_MS)
        return
      }

      deletingRef.current = false
      roleIndexRef.current = (roleIndexRef.current + 1) % ROLES.length
      timeoutId = window.setTimeout(tick, GAP_MS)
    }

    timeoutId = window.setTimeout(tick, TYPE_MS)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <Fragment>
      <Seo title="Home" />
      <PublicHeader />

      <main className="public-landing-main">
        {/* Mirrors reference: relative overflow-hidden bg-background pt-32 pb-24 */}
        <section className="public-landing-hero" aria-labelledby="landing-hero-heading">
          {FLOATING_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className={`public-landing-hero__float ${tool.className}`}
              aria-hidden
            >
              <Image
                src={`${assetBase}${tool.src}`}
                alt=""
                width={64}
                height={64}
                className="public-landing-hero__float-img"
                draggable={false}
              />
            </div>
          ))}

          <div className="public-landing-hero__container">
            <div className="public-landing-hero__copy">
              <div className="public-landing-hero__live">
                <span className="public-landing-hero__live-pill">
                  <span className="public-landing-hero__live-dot">
                    <span className="public-landing-hero__live-ping" />
                    <span className="public-landing-hero__live-core" />
                  </span>
                  Live
                </span>
                <span>2,400+ analysts learning on the platform</span>
              </div>

              <div className="public-landing-hero__headline-block">
                <h1 id="landing-hero-heading" className="public-landing-hero__title">
                  Everything you need to become{" "}
                  <br className="public-landing-hero__title-break" />
                  <span className="public-landing-hero__job-ready">
                    a job-ready{" "}
                    <span className="public-landing-hero__role">
                      <span aria-hidden="true">{typedRole}</span>
                      <span className="public-landing-hero__cursor" aria-hidden="true" />
                      <span className="visually-hidden">
                        SOC Analyst, Detection Engineer, Incident Responder, or DFIR Analyst
                      </span>
                    </span>
                  </span>
                </h1>

                <p className="public-landing-hero__subtitle">
                  Learn the fundamentals, build real investigations, practice SIEM workflows, and run
                  hands-on labs — one platform, start to hired.
                </p>
              </div>

              <div className="public-landing-hero__cta-block">
                <div className="public-landing-hero__actions">
                  <Link
                    scroll={false}
                    href="/courses"
                    className="public-landing-hero__cta public-landing-hero__cta--primary"
                  >
                    Browse Courses
                    <CaretIcon />
                  </Link>
                  <Link
                    scroll={false}
                    href="/learning-paths"
                    className="public-landing-hero__cta public-landing-hero__cta--secondary"
                  >
                    Explore Learning Paths
                    <CaretIcon />
                  </Link>
                </div>
                <p className="public-landing-hero__trust">
                  Start free. No card. Go deep when you&apos;re ready.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mirrors reference: overlapping browser frame (-mt) */}
        <section className="public-landing-preview" aria-label="Platform preview">
          <div className="public-landing-preview__frame">
            <div className="public-landing-preview__chrome">
              <div className="public-landing-preview__dots">
                <span />
                <span />
                <span />
              </div>
              <div className="public-landing-preview__chrome-icons public-landing-preview__chrome-icons--left" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="9" y1="4" x2="9" y2="20" />
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div className="public-landing-preview__url-wrap">
                <div className="public-landing-preview__url">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>cyberdocs.ai</span>
                </div>
              </div>
              <div className="public-landing-preview__chrome-icons public-landing-preview__chrome-icons--right" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>

            <div className="public-landing-preview__media">
              <div className="public-landing-preview__stage">
                <div className="public-landing-preview__stage-sidebar">
                  <p className="public-landing-preview__kicker">Today · SOC Analyst Track</p>
                  <h2 className="public-landing-preview__heading">Start with the foundations</h2>
                  <div className="public-landing-preview__progress">
                    <div className="public-landing-preview__progress-bar" />
                  </div>
                  <p className="public-landing-preview__progress-label">38% complete</p>
                  <p className="public-landing-preview__note">
                    Your path follows the prerequisite order, so every lesson builds on the one before it.
                  </p>
                </div>
                <ol className="public-landing-preview__list">
                  <li className="is-active">
                    <span>1</span>
                    <div>
                      <strong>SOC Fundamentals</strong>
                      <em>Continue where you left off</em>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <strong>SIEM Fundamentals</strong>
                      <em>Build your detection foundation</em>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <strong>Incident Triage</strong>
                      <em>Practice real alert workflows</em>
                    </div>
                  </li>
                </ol>
              </div>

              <button type="button" className="public-landing-preview__play" aria-label="Play preview">
                <span>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </Fragment>
  )
}

export default LandingPage
