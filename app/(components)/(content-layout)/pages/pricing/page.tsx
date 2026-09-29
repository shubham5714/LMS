"use client"

import React, { Fragment, useState } from "react"
import { Card, Col, Row } from "react-bootstrap"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Pageheader from "@/shared/layouts-components/pageheader/pageheader"
import Seo from "@/shared/layouts-components/seo/seo"
import { RazorpayCheckoutButton } from "@/shared/components/payments/RazorpayCheckoutButton"
import { SUBSCRIPTION_PLAN_LIST } from "@/shared/data/pricing/subscription-plans"
import { LANDING_PRICING_FEATURES } from "@/shared/data/landing/public-landing-data"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import { hasPaidMembership } from "@/shared/courses/soc-fundamentals-config"
import Link from "next/link"

const Pricing: React.FC = () => {
  const [isMonthly, setIsMonthly] = useState(true)
  const { membership, membershipRecord, isLoading } = useMembershipContext()
  const alreadyPremium = !isLoading && hasPaidMembership(membership)

  const visiblePlans = SUBSCRIPTION_PLAN_LIST.filter((plan) =>
    isMonthly ? plan.id === "monthly" : plan.id === "yearly"
  )

  return (
    <Fragment>
      <Seo title="Pages-Pricing" />
      <Pageheader title="Pages" currentpage="Pricing" activepage="Pricing" />
      <ToastContainer position="top-right" autoClose={4000} newestOnTop />

      <Row className="justify-content-center">
        <Col xl={9}>
          <div className="p-3 pt-0 text-center">
            <h3>Get Premium</h3>
            <h5 className="d-block">One plan. Full access to courses, labs, and paths.</h5>
            <p className="text-muted mb-4">
              Pay securely with Razorpay. Your subscription starts immediately after payment
              and expires at the end of the billing period.
            </p>
          </div>

          {alreadyPremium && (
            <div className="alert alert-success text-center mb-4" role="status">
              You already have Premium
              {membershipRecord?.expires_at
                ? ` until ${new Date(membershipRecord.expires_at).toLocaleDateString()}`
                : ""}
              .{" "}
              <Link href="/dashboard" scroll={false}>
                Go to dashboard
              </Link>
            </div>
          )}

          <div className="d-flex justify-content-center mb-4">
            <div className="switcher-box">
              <span className="pricing-time-span">Monthly</span>
              <div className="switcher-pricing text-center">
                <input
                  type="checkbox"
                  checked={!isMonthly}
                  onChange={() => setIsMonthly((v) => !v)}
                  className="pricing-toggle"
                  aria-label="Toggle yearly pricing"
                />
              </div>
              <span className="pricing-time-span">Annually</span>
            </div>
          </div>

          <Row className="d-flex align-items-stretch justify-content-center mb-5">
            {visiblePlans.map((plan) => (
              <Col lg={8} xl={6} md={10} sm={12} key={plan.id} className="mb-4">
                <Card
                  className={`custom-card pricing-card h-100 ${
                    plan.popular ? "hover border border-primary border-2" : ""
                  }`}
                >
                  {plan.popular ? (
                    <div className="pricing-table-item-icon">
                      <i className="fe fe-zap me-2" /> Most popular
                    </div>
                  ) : null}
                  <Card.Body className="border-bottom border-block-end-dashed p-4">
                    <h6 className="fw-medium mb-1">{plan.name}</h6>
                    <h2 className="fw-semibold d-block mb-3">
                      {plan.priceLabel}
                      <span className="fs-12 fw-medium ms-1 op-8">
                        {plan.cadenceLabel}
                      </span>
                    </h2>
                    <span className="d-block fs-12 text-muted mb-2">{plan.note}</span>
                    <span className="d-block fs-11 text-muted">{plan.description}</span>
                  </Card.Body>
                  <Card.Body className="p-4">
                    <ul className="list-unstyled pricing-body mb-0">
                      {LANDING_PRICING_FEATURES.map((feature) => (
                        <li key={feature}>
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-xs svg-success">
                              <i className="ti ti-circle-check text-primary fs-18" />
                            </span>
                            <span className="ms-2 my-auto flex-fill">{feature}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                  <Card.Footer className="border-top border-block-start-dashed p-4">
                    <RazorpayCheckoutButton
                      plan={plan}
                      label={
                        alreadyPremium
                          ? `Extend ${plan.name}`
                          : `Pay ${plan.priceLabel} · Start ${plan.id}`
                      }
                    />
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Fragment>
  )
}

export default Pricing
