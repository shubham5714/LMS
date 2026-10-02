"use client"

import React, { createContext, useContext } from "react"

type CourseDocAccessValue = {
  hasPaidAccess: boolean
  canEdit: boolean
}

const CourseDocAccessContext = createContext<CourseDocAccessValue>({
  hasPaidAccess: false,
  canEdit: false,
})

export function CourseDocAccessProvider({
  hasPaidAccess,
  canEdit,
  children,
}: CourseDocAccessValue & { children: React.ReactNode }) {
  return (
    <CourseDocAccessContext.Provider value={{ hasPaidAccess, canEdit }}>
      {children}
    </CourseDocAccessContext.Provider>
  )
}

export function useCourseDocAccess() {
  return useContext(CourseDocAccessContext)
}
