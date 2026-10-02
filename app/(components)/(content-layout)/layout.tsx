"use client"
import Backtotop from '@/shared/layouts-components/backtotop/backtotop'
import Footer from '@/shared/layouts-components/footer/footer'
import Header from '@/shared/layouts-components/header/header'
import Sidebar from '@/shared/layouts-components/sidebar/sidebar'
import CourseSidebar from '@/shared/layouts-components/sidebar/course-sidebar'
import Switcher from '@/shared/layouts-components/switcher/switcher'
import { CourseSidebarPreferenceProvider, useCourseSidebarPreference } from '@/shared/contextapi/CourseSidebarPreferenceContext'
import { isCourseRoutePathname } from '@/shared/courses/course-routes'
import React, { Fragment, memo, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface layoutProps {
  children: ReactNode
}

const LayoutContent: React.FC<layoutProps> = ({ children }) => {
  const pathname = usePathname()
  const { preferMainAppNav, setPreferMainAppNav } = useCourseSidebarPreference()!

  const isCourseRoute = isCourseRoutePathname(pathname)
  const showCourseSidebar = isCourseRoute && !preferMainAppNav

  return (
    <Fragment>
      <Switcher />
      <div className='page'>
        <Header />
        {showCourseSidebar ? (
          <CourseSidebar onBackToMainNav={() => setPreferMainAppNav(true)} />
        ) : (
          <Sidebar />
        )}
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
