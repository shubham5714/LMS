"use client"
import Backtotop from '@/shared/layouts-components/backtotop/backtotop'
import Footer from '@/shared/layouts-components/footer/footer'
import Header from '@/shared/layouts-components/header/header'
import Sidebar from '@/shared/layouts-components/sidebar/sidebar'
import SocFundamentalsSidebar from '@/shared/layouts-components/sidebar/soc-fundamentals-sidebar'
import Switcher from '@/shared/layouts-components/switcher/switcher'
import { CourseSidebarPreferenceProvider, SOC_FUNDAMENTALS_ROUTE_PREFIX, useCourseSidebarPreference } from '@/shared/contextapi/CourseSidebarPreferenceContext'
import React, { Fragment, memo, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface layoutProps {
  children: ReactNode
}

const LayoutContent: React.FC<layoutProps> = ({ children }) => {
  const pathname = usePathname()
  const { preferMainAppNav, setPreferMainAppNav } = useCourseSidebarPreference()!

  const isSocFundamentalsRoute = pathname.startsWith(SOC_FUNDAMENTALS_ROUTE_PREFIX)
  const showCourseSidebar = isSocFundamentalsRoute && !preferMainAppNav

  return (
    <Fragment>
      <Switcher />
      <div className='page'>
        <Header />
        {showCourseSidebar ? (
          <SocFundamentalsSidebar onBackToMainNav={() => setPreferMainAppNav(true)} />
        ) : (
          <Sidebar />
        )}
        <div className={`main-content app-content${isSocFundamentalsRoute ? ' soc-fundamentals-main' : ''}`}>
          <div className={`container-fluid${isSocFundamentalsRoute ? ' soc-fundamentals-container' : ''}`}>
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