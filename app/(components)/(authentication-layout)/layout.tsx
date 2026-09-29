"use client"

import React, { Fragment, ReactNode, useEffect, useRef } from 'react'
import Switcher from '@/shared/layouts-components/switcher/switcher'
import { usePathname } from 'next/navigation';

interface layoutProps {
  children: ReactNode
}

const layout: React.FC<layoutProps> = ({ children }) => {

  const pathName = usePathname()
  const bodyRef = useRef<any>(null);

  useEffect(() => {
    bodyRef.current = document.body

    if (pathName.includes('-basic')) {
      bodyRef.current.classList.add('authentication-background', 'authenticationcover-background', 'position-relative');
    } else {
      bodyRef.current.classList.remove('authentication-background', 'authenticationcover-background', 'position-relative');
    }

    if (pathName.includes('-cover') || pathName === '/signin' || pathName.startsWith('/signin/')) {
      bodyRef.current.classList.add("bg-white")
    } else {
      bodyRef.current.classList.remove("bg-white")
    }

    if (pathName.includes('/coming-soon') || pathName.includes('/under-maintenance')) {
      bodyRef.current.classList.add('coming-soon-main', 'position-relative')
    } else {
      bodyRef.current.classList.remove('coming-soon-main', 'position-relative')
    }

    return () => {
      bodyRef.current.classList.remove('authentication-background', 'authenticationcover-background', 'position-relative');
      bodyRef.current.classList.remove("bg-white");
      bodyRef.current.classList.remove('coming-soon-main', 'position-relative');
    };

  }, [pathName]);


  return (
    <Fragment>
      <Switcher />
      {children}
    </Fragment>

  )
}

export default layout