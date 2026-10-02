"use client"

import nextConfig from "@/next.config"
import {
  LANDING_CAREER_TRACKS,
  LANDING_COURSE_CARDS,
  LANDING_FAQ_CATEGORIES,
  LANDING_FAQS,
  LANDING_FEATURES,
  LANDING_HOW_STEPS,
  LANDING_PATH_TABS,
  LANDING_PLANS,
  LANDING_PRICING_FEATURES,
  LANDING_SKILL_TRACKS,
  LANDING_TESTIMONIALS,
  LANDING_TOOLS,
  type LandingCatalogTab,
} from "@/shared/data/landing/public-landing-data"
import Image from "next/image"
import Link from "next/link"
import React, { useMemo, useState } from "react"

const CaretIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function catalogCards(tab: LandingCatalogTab) {
  if (tab === "courses") return LANDING_COURSE_CARDS
  if (tab === "skills") return LANDING_SKILL_TRACKS
  return LANDING_CAREER_TRACKS
}

export default function PublicLandingSections() {
  const { basePath = "" } = nextConfig
  const assetBase = process.env.NODE_ENV === "production" ? basePath : ""

  const [catalogTab, setCatalogTab] = useState<LandingCatalogTab>("tracks")
  const [howStep, setHowStep] = useState(0)
  const [featureIndex, setFeatureIndex] = useState(0)
  const [faqCategory, setFaqCategory] = useState(LANDING_FAQ_CATEGORIES[0].id)
  const [openFaq, setOpenFaq] = useState(0)

  const cards = useMemo(() => catalogCards(catalogTab), [catalogTab])
  const faqs = LANDING_FAQS[faqCategory] ?? []
  const activeHow = LANDING_HOW_STEPS[howStep]
  const activeFeature = LANDING_FEATURES[featureIndex]
  const marqueeTools = [...LANDING_TOOLS, ...LANDING_TOOLS]

  return (
    <>
      <section className="public-landing-paths" aria-labelledby="landing-paths-heading">
        <div className="public-landing-section__inner">
          <div className="public-landing-paths__header">
            <div>
              <p className="public-landing-section__eyebrow">Choose your path</p>
              <h2 id="landing-paths-heading" className="public-landing-section__title">
                Pick the role. Follow the path.
              </h2>
              <p className="public-landing-section__subtitle">
                Follow a complete career track, or focus on one skill at a time. Every path starts with the
                foundations and builds toward job-ready skills.
              </p>
            </div>

            <div className="public-landing-paths__tabs" role="tablist" aria-label="Learning catalog">
              {LANDING_PATH_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={catalogTab === tab.id}
                  className={catalogTab === tab.id ? "is-active" : undefined}
                  onClick={() => setCatalogTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="public-landing-paths__panel" role="tabpanel">
            <div className="public-landing-paths__grid">
              {cards.map((card) => (
                <Link key={card.title} href={card.href} scroll={false} className="public-landing-paths__card">
                  <div className="public-landing-paths__card-top">
                    <span className="public-landing-paths__card-icon" aria-hidden>
                      <i className={card.icon} />
                    </span>
                    <span className="public-landing-paths__card-level">{card.level}</span>
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <span className="public-landing-paths__card-meta">{card.meta}</span>
                </Link>
              ))}
            </div>
            <div className="public-landing-paths__more">
              <Link href="/tracks" scroll={false}>
                Explore all tracks <CaretIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="public-landing-tools" aria-labelledby="landing-tools-heading">
        <div className="public-landing-section__inner public-landing-tools__inner">
          <p className="public-landing-section__eyebrow">Tech stacks</p>
          <h2 id="landing-tools-heading" className="public-landing-section__title public-landing-section__title--center">
            Master the tools companies actually use
          </h2>
          <p className="public-landing-section__subtitle public-landing-section__subtitle--center">
            Learn the high-demand SOC stack — from SIEM platforms to detection and response workflows.
          </p>

          <div className="public-landing-tools__marquee" aria-hidden>
            <div className="public-landing-tools__track">
              {marqueeTools.map((tool, index) => (
                <div key={`${tool.name}-${index}`} className="public-landing-tools__item">
                  <Image
                    src={`${assetBase}${tool.src}`}
                    alt=""
                    width={64}
                    height={40}
                    className="public-landing-tools__logo"
                  />
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="public-landing-how" aria-labelledby="landing-how-heading">
        <div className="public-landing-section__inner">
          <div className="public-landing-how__intro">
            <p className="public-landing-section__eyebrow">How Cyber Docs works</p>
            <h2 id="landing-how-heading" className="public-landing-section__title">
              From “Where do I start?” to interview-ready.
            </h2>
            <p className="public-landing-section__subtitle">
              Choose your goal, follow the right learning order, validate each skill, and prove you can apply it.
            </p>
          </div>

          <div className="public-landing-how__layout">
            <nav className="public-landing-how__nav" aria-label="How Cyber Docs works">
              {LANDING_HOW_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  aria-current={howStep === index ? "step" : undefined}
                  className={howStep === index ? "is-active" : undefined}
                  onClick={() => setHowStep(index)}
                >
                  <span className="public-landing-how__num">{step.id}</span>
                  <span className="public-landing-how__nav-copy">
                    <strong>{step.title}</strong>
                    <em>{step.summary}</em>
                  </span>
                </button>
              ))}
            </nav>

            <div className="public-landing-how__detail">
              <p className="public-landing-how__step-label">
                Step {activeHow.id} / {LANDING_HOW_STEPS.length}
              </p>
              <h3>{activeHow.title}</h3>
              <p>{activeHow.detail}</p>
              <Link href="/tracks" scroll={false} className="public-landing-how__cta">
                Build my free plan <CaretIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="public-landing-features" aria-labelledby="landing-features-heading">
        <div className="public-landing-section__inner">
          <div className="public-landing-features__intro">
            <p className="public-landing-section__eyebrow">One subscription</p>
            <h2 id="landing-features-heading" className="public-landing-section__title">
              Become the obvious hire
            </h2>
            <p className="public-landing-section__subtitle">
              Courses, labs, paths, and community — the version of you that walks into the SOC interview ready.
            </p>
            <Link href="/pages/pricing" scroll={false} className="public-landing-hero__cta public-landing-hero__cta--primary">
              Upgrade now <CaretIcon />
            </Link>
          </div>

          <div className="public-landing-features__grid">
            <ul className="public-landing-features__list">
              {LANDING_FEATURES.map((feature, index) => (
                <li key={feature.title}>
                  <button
                    type="button"
                    className={featureIndex === index ? "is-active" : undefined}
                    onClick={() => setFeatureIndex(index)}
                  >
                    <i className={feature.icon} aria-hidden />
                    {feature.title}
                  </button>
                </li>
              ))}
            </ul>
            <article className="public-landing-features__panel">
              <span className="public-landing-features__panel-icon" aria-hidden>
                <i className={activeFeature.icon} />
              </span>
              <h3>{activeFeature.title}</h3>
              <p>{activeFeature.description}</p>
              <span className="public-landing-features__panel-index">
                {String(featureIndex + 1).padStart(2, "0")} / {String(LANDING_FEATURES.length).padStart(2, "0")}
              </span>
            </article>
          </div>
        </div>
      </section>

      <section className="public-landing-testimonials" aria-labelledby="landing-testimonials-heading">
        <div className="public-landing-section__inner">
          <p className="public-landing-section__eyebrow">Testimonials</p>
          <h2 id="landing-testimonials-heading" className="public-landing-section__title public-landing-section__title--center">
            Loved by analysts worldwide
          </h2>
          <p className="public-landing-section__subtitle public-landing-section__subtitle--center">
            Real stories from analysts using Cyber Docs to land SOC roles and level up their stack.
          </p>

          <div className="public-landing-testimonials__grid">
            {LANDING_TESTIMONIALS.map((item) => (
              <blockquote key={item.name} className="public-landing-testimonials__card">
                <p>“{item.quote}”</p>
                <footer>
                  <strong>{item.name}</strong>
                  <span>
                    {item.role} · {item.company}
                  </span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="public-landing-pricing" aria-labelledby="landing-pricing-heading">
        <div className="public-landing-section__inner">
          <p className="public-landing-section__eyebrow">Get hired</p>
          <h2 id="landing-pricing-heading" className="public-landing-section__title public-landing-section__title--center">
            One plan. Everything you need to get hired.
          </h2>
          <p className="public-landing-section__subtitle public-landing-section__subtitle--center">
            Every course, path, lab, and resource — included. Cancel anytime.
          </p>
          <p className="public-landing-pricing__perks">
            <span>5-day money-back guarantee</span>
            <span aria-hidden>·</span>
            <span>Instant access</span>
            <span aria-hidden>·</span>
            <span>Cancel anytime</span>
          </p>

          <div className="public-landing-pricing__grid">
            {LANDING_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`public-landing-pricing__card${plan.popular ? " is-popular" : ""}`}
              >
                {plan.popular ? <span className="public-landing-pricing__badge">Most popular</span> : null}
                <p className="public-landing-pricing__name">{plan.name}</p>
                <div className="public-landing-pricing__price">
                  <strong>{plan.price}</strong>
                  <span>{plan.cadence}</span>
                </div>
                <p className="public-landing-pricing__note">{plan.note}</p>
                <p className="public-landing-pricing__desc">{plan.description}</p>
                <ul className="public-landing-pricing__features">
                  {LANDING_PRICING_FEATURES.map((feature) => (
                    <li key={feature}>
                      <CheckIcon />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  scroll={false}
                  className={`public-landing-hero__cta ${
                    plan.popular
                      ? "public-landing-hero__cta--primary"
                      : "public-landing-hero__cta--secondary"
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-landing-vision" aria-labelledby="landing-vision-heading">
        <div className="public-landing-section__inner public-landing-vision__grid">
          <div>
            <p className="public-landing-section__eyebrow">Founders memo</p>
            <h2 id="landing-vision-heading" className="public-landing-section__title">
              Making security operations easier for everyone
            </h2>
            <div className="public-landing-vision__copy">
              <p>
                When we started building Cyber Docs, our vision was simple: make SOC learning accessible, practical, and
                career-defining.
              </p>
              <p>
                In a world flooded with tool dumps and theory-heavy content, we saw a gap — real-world, hands-on
                learning combined with strong community support. Security operations is not just about dashboards; it
                is about clear thinking under pressure and decisions that protect people and businesses.
              </p>
              <p>Let&apos;s build the next generation of analysts, together.</p>
            </div>
            <p className="public-landing-vision__sign">
              <strong>Cyber Docs Team</strong>
              <span>Security operations education</span>
            </p>
          </div>
          <div className="public-landing-vision__panel" aria-hidden>
            <Image
              src={`${assetBase}/assets/images/brand-logos/logo-dark.png`}
              alt=""
              width={180}
              height={48}
              className="public-landing-vision__logo"
            />
            <p>One platform for SOC careers — learn, practice, prove.</p>
          </div>
        </div>
      </section>

      <section className="public-landing-faq" aria-labelledby="landing-faq-heading">
        <div className="public-landing-section__inner public-landing-faq__layout">
          <div>
            <p className="public-landing-section__eyebrow">FAQs</p>
            <h2 id="landing-faq-heading" className="public-landing-section__title">
              All you need to know
            </h2>
            <div className="public-landing-faq__cats">
              {LANDING_FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={faqCategory === cat.id ? "is-active" : undefined}
                  onClick={() => {
                    setFaqCategory(cat.id)
                    setOpenFaq(0)
                  }}
                >
                  {cat.label}
                  <span>{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="public-landing-faq__list">
            {faqs.map((item, index) => {
              const open = openFaq === index
              return (
                <div key={item.q} className={`public-landing-faq__item${open ? " is-open" : ""}`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? -1 : index)}
                  >
                    <span>{item.q}</span>
                    <i className={open ? "ri-subtract-line" : "ri-add-line"} aria-hidden />
                  </button>
                  {open ? <p>{item.a}</p> : null}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="public-landing-footer">
        <div className="public-landing-section__inner public-landing-footer__grid">
          <div>
            <Image
              src={`${assetBase}/assets/images/brand-logos/logo-dark.png`}
              alt="Cyber Docs"
              width={150}
              height={40}
              className="public-landing-footer__logo"
            />
            <p>Practical security operations training — from fundamentals to job-ready analyst skills.</p>
          </div>
          <div>
            <h3>Learn</h3>
            <Link href="/courses" scroll={false}>
              Courses
            </Link>
            <Link href="/tracks" scroll={false}>
              Tracks
            </Link>
            <Link href="/resources" scroll={false}>
              Resources
            </Link>
          </div>
          <div>
            <h3>Company</h3>
            <Link href="/pages/pricing" scroll={false}>
              Pricing
            </Link>
            <Link href="/community" scroll={false}>
              Community
            </Link>
            <Link href="/signin" scroll={false}>
              Login
            </Link>
          </div>
        </div>
        <p className="public-landing-footer__legal">© {new Date().getFullYear()} Cyber Docs. All rights reserved.</p>
      </footer>
    </>
  )
}