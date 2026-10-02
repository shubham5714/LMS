"use client"

import nextConfig from "@/next.config"
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons"
import { useUserContext } from "@/shared/contextapi/UserContext"
import { MENUITEMS, type Menuitemtype } from "@/shared/layouts-components/sidebar/nav"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useMemo } from "react"
import { Container, Nav, NavDropdown, Navbar } from "react-bootstrap"

type PublicNavItem = {
  title: string
  path?: string
  children?: { title: string; path: string }[]
}

function toPublicNavItems(items: Menuitemtype[]): PublicNavItem[] {
  return items
    .filter((item) => item.title)
    .map((item) => {
      const children = item.children
        ?.filter((child): child is Menuitemtype & { path: string; title: string } =>
          Boolean(child.path && child.title)
        )
        .map((child) => ({ title: child.title, path: child.path }))

      if (children && children.length > 0) {
        return { title: item.title as string, children }
      }

      return { title: item.title as string, path: item.path }
    })
    .filter((item) => Boolean(item.path) || (item.children && item.children.length > 0))
}

const PublicHeader = () => {
  const { basePath = "" } = nextConfig
  const logoPath = process.env.NODE_ENV === "production" ? basePath : ""
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useUserContext()

  const navItems = useMemo(() => {
    const items = toPublicNavItems(MENUITEMS).filter(
      (item) => item.title !== "Dashboard" && item.path !== "/dashboard"
    )
    items.push({ title: "Pricing", path: "/pages/pricing" })
    return items
  }, [])

  const isActive = (path?: string) => {
    if (!path) return false
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const isParentActive = (item: PublicNavItem) =>
    item.children?.some((child) => isActive(child.path)) ?? false

  const actionHref = isAuthenticated ? "/dashboard" : "/signin"
  const actionLabel = isAuthenticated ? "Dashboard" : "Login"
  return (
    <Navbar
      expand="lg"
      className="navbar navbar-expand-lg navbar-dark public-landing-navbar"
    >
      <Container fluid>
        <Navbar.Brand as={Link} href="/" scroll={false}>
          <Image
            src={`${logoPath}/assets/images/brand-logos/logo-dark.png`}
            width={173}
            height={43}
            alt="logo"
            className="d-inline-block align-text-top"
            priority
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="public-landing-navbar" />
        <Navbar.Collapse id="public-landing-navbar">
          <Nav as="ul" className="navbar-nav public-landing-navbar__links mb-2 mb-lg-0">
            {navItems.map((item) => {
              if (item.children && item.children.length > 0) {
                return (
                  <NavDropdown
                    key={item.title}
                    title={item.title}
                    id={`nav-dropdown-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    menuVariant="dark"
                    className={isParentActive(item) ? "active" : undefined}
                  >
                    {item.children.map((child) => (
                      <NavDropdown.Item
                        key={child.path}
                        as={Link}
                        href={child.path}
                        scroll={false}
                        active={isActive(child.path)}
                      >
                        {child.title}
                      </NavDropdown.Item>
                    ))}
                  </NavDropdown>
                )
              }

              return (
                <Nav.Item key={item.path} as="li">
                  <Nav.Link
                    as={Link}
                    href={item.path!}
                    scroll={false}
                    className={isActive(item.path) ? "active" : undefined}
                    aria-current={isActive(item.path) ? "page" : undefined}
                  >
                    {item.title}
                  </Nav.Link>
                </Nav.Item>
              )
            })}
          </Nav>
          <div className="d-flex align-items-center public-landing-navbar__actions">
            {!isLoading && (
              <SpkButton Buttonvariant="primary" Buttontype="button" Navigate={actionHref}>
                {actionLabel}
              </SpkButton>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default PublicHeader
