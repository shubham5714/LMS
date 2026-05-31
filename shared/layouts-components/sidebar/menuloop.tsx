"use client"

import Link from 'next/link';
import React, { Fragment, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { data$, getState } from '../services/switcherServices';
import SpkTooltips from '@/shared/@spk-reusable-components/reusable-uiElements/spk-tooltips';
import { Menuitemtype } from './nav';
import { handleSocFundamentalsMenuLinkClick, useCourseSidebarPreference } from '@/shared/contextapi/CourseSidebarPreferenceContext';

const Menuloop = ({ MenuItems, level, handleToMenu, HoverToggleInnerMenuFn }: any) => {
  const pathname = usePathname();
  const courseSidebarPreference = useCourseSidebarPreference();

  const handleClick = (event: MouseEvent) => {
    event.preventDefault(); // Prevents the default anchor behavior navigation;
  };

  let [variable, setVariable] = useState(getState());
  useEffect(() => {
    const subscription = data$.subscribe((e) => {
      // No need to manually update component state, the UI will re-render automatically
      setVariable(e);
    });

    return () => subscription.unsubscribe(); // Clean up the subscription
  }, []);

  const local_varaiable = variable;
  return (
    <Fragment>
      <Link href="#!" scroll={false} className={`side-menu__item ${MenuItems?.selected ? "active" : ""}`}
        onClick={(event) => { event.preventDefault(); handleToMenu(event, MenuItems, undefined, true); }} onMouseEnter={(event) => HoverToggleInnerMenuFn(event, MenuItems)} >
        <i className="ri-arrow-right-s-line side-menu__angle"></i>
        <span className={`${local_varaiable?.dataVerticalStyle == 'doublemenu' ? '' : 'd-none'}`}>
          <SpkTooltips placement="right" title={MenuItems.title}>
            <div>{MenuItems.icon}</div>
          </SpkTooltips>
        </span>
        {local_varaiable?.dataVerticalStyle != "doublemenu" ? MenuItems.icon : ""}
        <span className={`${level == 1 ? "side-menu__label" : ""}`}> {MenuItems.title} {MenuItems.badgetxt ? (<span className={MenuItems.class}> {MenuItems.badgetxt} </span>
        ) : (
          ""
        )}
        </span>
      </Link>
      <ul className={`slide-menu child${level}  
      ${MenuItems.active && level == 1 && local_varaiable?.dataVerticalStyle === "doublemenu" ? 'double-menu-active' : ''} 
      ${MenuItems?.dirchange ? "force-left" : ""} `} style={MenuItems?.active ? { display: "block" } : { display: "none" }}
      >
        {level <= 1 ? <li className="slide side-menu__label1">
          <Link href="#!" scroll={false}>{MenuItems.title}  </Link>
        </li> : ""}
        {MenuItems?.children.map((firstlevel: Menuitemtype, index: number) =>
          <li className={`${firstlevel?.menutitle ? 'slide__category' : ''} ${firstlevel?.type == 'empty' ? 'slide' : ''} ${firstlevel?.type == 'link' ? 'slide' : ''} ${firstlevel?.type == 'sub' ? 'slide has-sub' : ''} ${firstlevel.active ? 'open' : ''} ${firstlevel.selected ? 'active' : ''}`}
            key={index}
          >
            {firstlevel?.type === "link" ?
              <Link href={firstlevel.path} className={`side-menu__item ${firstlevel?.selected ? 'active' : ''}`}
                onClick={(e) =>
                  handleSocFundamentalsMenuLinkClick(e, pathname, firstlevel.path, courseSidebarPreference?.preferCourseSidebarNav)
                }
              >{firstlevel.icon}
                <span className=""> {firstlevel.title} {firstlevel.badgetxt ? (<span className={firstlevel.class}> {firstlevel.badgetxt}</span>
                ) : (
                  ""
                )}
                </span>
              </Link>
              : ""}
            {firstlevel?.type === "empty" ?
              <Link href="#!" className={`side-menu__item`} onClick={handleClick}>
                {firstlevel.title}
                {firstlevel.icon}
              </Link>
              : ""}
            {firstlevel?.type === "sub" ?
              <Menuloop MenuItems={firstlevel} handleToMenu={handleToMenu} level={level + 1} HoverToggleInnerMenuFn={HoverToggleInnerMenuFn} /> : ''}
          </li>
        )}

      </ul>
    </Fragment>
  );
};

export default Menuloop;
