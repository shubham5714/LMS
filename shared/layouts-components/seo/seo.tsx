"use client"
import React, { useEffect } from 'react';

interface Seoprops {
  title: string
}

const Seo: React.FC<Seoprops> = ({ title }) => {

  useEffect(() => {
    document.title = `Cyber Docs - ${title}`
  }, [])

  return (
    <>
    </>
  )
}

export default Seo
