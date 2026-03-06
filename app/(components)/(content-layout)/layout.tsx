"use client"
import Backtotop from '@/shared/layouts-components/backtotop/backtotop'
import Footer from '@/shared/layouts-components/footer/footer'
import Header from '@/shared/layouts-components/header/header'
import Sidebar from '@/shared/layouts-components/sidebar/sidebar'
import Switcher from '@/shared/layouts-components/switcher/switcher'
import { ThemeChanger } from '@/shared/redux/actions'
import { Product } from '@/shared/redux/reducer'
import React, { Fragment, memo, ReactNode } from 'react'
import { connect } from 'react-redux'

interface layoutProps {
  children: ReactNode
}

const layout: React.FC<layoutProps> = ({ children }) => {
  return (
    <Fragment>
      <Switcher />
      <div className='page'>
        <Header />
        <Sidebar />
        <div className='main-content app-content'>
          <div className='container-fluid'>
            {children}
          </div>
        </div>
        <Footer />
      </div>
      <Backtotop />
    </Fragment>
  )
}


const mapStateToProps = (state: Product) => ({
  local_varaiable: state.reducer
});
export default memo(connect(mapStateToProps, { ThemeChanger })(layout));