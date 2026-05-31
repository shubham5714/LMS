"use client"
import Backtotop from '@/shared/layouts-components/backtotop/backtotop'
import Footer from '@/shared/layouts-components/footer/footer'
import Header from '@/shared/layouts-components/header/header'
import Sidebar from '@/shared/layouts-components/sidebar/sidebar'
import SocFundamentalsSidebar from '@/shared/layouts-components/sidebar/soc-fundamentals-sidebar'
import SecuronixSiemSidebar from '@/shared/layouts-components/sidebar/securonix-siem-sidebar'
import Switcher from '@/shared/layouts-components/switcher/switcher'
import { CourseSidebarPreferenceProvider, useCourseSidebarPreference } from '@/shared/contextapi/CourseSidebarPreferenceContext'
import { isCourseRoutePathname } from '@/shared/courses/course-routes'
import { SECURONIX_SIEM_ROUTE_PREFIX } from '@/shared/courses/securonix-siem-config'
import { SOC_FUNDAMENTALS_ROUTE_PREFIX } from '@/shared/courses/soc-fundamentals-config'
import React, { Fragment, memo, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface layoutProps {
  children: ReactNode
}

const LayoutContent: React.FC<layoutProps> = ({ children }) => {
  const pathname = usePathname()
  const { preferMainAppNav, setPreferMainAppNav } = useCourseSidebarPreference()!

  const isSocFundamentalsRoute = pathname.startsWith(SOC_FUNDAMENTALS_ROUTE_PREFIX)
  const isSecuronixSiemRoute = pathname.startsWith(SECURONIX_SIEM_ROUTE_PREFIX)
  const isCourseRoute = isCourseRoutePathname(pathname)
  const showCourseSidebar = isCourseRoute && !preferMainAppNav

  const courseSidebar = isSocFundamentalsRoute ? (
    <SocFundamentalsSidebar onBackToMainNav={() => setPreferMainAppNav(true)} />
  ) : isSecuronixSiemRoute ? (
    <SecuronixSiemSidebar onBackToMainNav={() => setPreferMainAppNav(true)} />
  ) : null

  return (
    <Fragment>
      <Switcher />
      <div className='page'>
        <Header />
        {showCourseSidebar && courseSidebar ? courseSidebar : <Sidebar />}
        <div className={`main-content app-content${isCourseRoute ? ' soc-fundamentals-main' : ''}`}>
          <div className={`container-fluid${isCourseRoute ? ' soc-fundamentals-container' : ''}`}>
            {children}
          </div>
        </div>
        <Footer />
      </div>
      <Backtotop />
    </Fragment>
  )
}

const layout: React.FC<layoutProps> = ({ children }) => (
  <CourseSidebarPreferenceProvider>
    <LayoutContent>{children}</LayoutContent>
  </CourseSidebarPreferenceProvider>
)

export default memo(layout)
