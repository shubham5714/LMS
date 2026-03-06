"use client"

import Link from 'next/link'
import React, { Fragment } from 'react'

interface FooterProps { }

const Footer: React.FC<FooterProps> = () => {

  let currentYear = new Date().getFullYear();

  return (
    <Fragment>
      <footer className="footer mt-auto py-2 bg-white text-center">
        <div className="container">
          <span className="text-muted"> Copyright © <span id="year"> {currentYear} </span> </span>
        </div>
      </footer>
    </Fragment>
  )
}

export default Footer;