"use client"
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link';
import Switcher from '../switcher/switcher';
import { data$, getState, setState } from '../services/switcherServices';
import { Dropdown } from 'react-bootstrap';
import SpkDropdown from '@/shared/@spk-reusable-components/reusable-uiElements/spk-dropdown';
import SimpleBar from 'simplebar-react';
import { Notifications } from '@/shared/data/headerdata';
import Image from 'next/image';
import nextConfig from "@/next.config"
import { ThemeChanger } from '@/shared/redux/actions';
import { supabase } from '@/shared/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';
import { useMembershipContext } from '@/shared/contextapi/MembershipContext';
import {
    SOC_FUNDAMENTALS_DISPLAY_NAME,
    SOC_FUNDAMENTALS_ROUTE_PREFIX,
    getSocFundamentalsTopicForPathname,
} from '@/shared/courses/soc-fundamentals-config';

interface HeaderProps { }

const Header: React.FC<HeaderProps> = () => {

    const { basePath } = nextConfig
    const router = useRouter();
    const pathname = usePathname();

    const { membership, isLoading: membershipLoading } = useMembershipContext();
    const showGetPremium =
        !membershipLoading && membership?.toUpperCase() === 'FREE';

    const socFundamentalsHeader = useMemo(() => {
        if (!pathname.startsWith(SOC_FUNDAMENTALS_ROUTE_PREFIX)) return null
        const topic = getSocFundamentalsTopicForPathname(pathname)
        return {
            courseTitle: SOC_FUNDAMENTALS_DISPLAY_NAME,
            topicTitle: topic?.title ?? null,
        }
    }, [pathname]);

    //Menu-Close
    let [variable, setVariable] = useState(getState());

    useEffect(() => {
        const subscription = data$.subscribe((e) => {
            // No need to manually update component state, the UI will re-render automatically
            setVariable(e);
        });

        return () => subscription.unsubscribe(); // Clean up the subscription
    }, []);

    // Logout function
    const handleLogout = async () => {
        try {
            // Clear session storage
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('userMembership');
            localStorage.removeItem('mfaVerified');
            sessionStorage.removeItem('mfaTicket');
            window.dispatchEvent(new CustomEvent('membershipUpdated', { detail: null }));
            
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error('Error signing out:', error);
            }
            
            // Route to login page
            router.push('/');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    function menuClose() {
        const theme = variable;

        if (window.innerWidth <= 992) {
            const newState = {
                toggled: "close"
            }
            setState(newState);
        }

        if (window.innerWidth >= 992) {
            const local_varaiable = theme;
            const newToggledValue = local_varaiable.toggled ? local_varaiable.toggled : '';

            setState({ toggled: newToggledValue });
        }
    }

    const overlayRef = useRef<HTMLDivElement | null>(null);

    const toggleSidebar = () => {
        const theme = variable;
        const sidemenuType = theme.dataNavLayout;

        if (window.innerWidth >= 992) {
            if (sidemenuType === "vertical") {
                const verticalStyle = theme.dataVerticalStyle;
                const navStyle = theme.dataNavStyle;
                // Handle vertical styles
                switch (verticalStyle) {
                    case "closed":
                        // Toggle between open/close state for "closed" vertical style
                        setState({
                            dataNavStyle: "",
                            toggled: theme.toggled === "close-menu-close" ? "" : "close-menu-close"
                        });
                        break;
                    case "overlay":
                        // Handle icon-overlay state with window width check
                        setState({
                            dataNavStyle: "",
                            toggled: theme.toggled === "icon-overlay-close" ? "" : "icon-overlay-close",
                            iconOverlay: ""
                        });

                        if (theme.toggled !== "icon-overlay-close" && window.innerWidth >= 992) {
                            setState({
                                toggled: "icon-overlay-close",
                                iconOverlay: "",
                            });
                        }
                        break;
                    case "icontext":
                        // Handle icon-text state
                        setState({
                            dataNavStyle: "",
                            toggled: theme.toggled === "icon-text-close" ? "" : "icon-text-close"
                        });
                        break;
                    case "doublemenu":
                        ThemeChanger({ ...theme, "dataNavStyle": "" });
                        ThemeChanger({ ...theme, "dataNavStyle": "" });
                        if (theme.toggled === "double-menu-open") {
                            ThemeChanger({ ...theme, "toggled": "double-menu-close" });
                        } else {
                            let sidemenu = document.querySelector(".side-menu__item.active");
                            if (sidemenu) {
                                ThemeChanger({ ...theme, "toggled": "double-menu-open" });
                                if (sidemenu.nextElementSibling) {
                                    sidemenu.nextElementSibling.classList.add("double-menu-active");
                                }
                                else {

                                    ThemeChanger({ ...theme, "toggled": "double-menu-close" });
                                }
                            }
                        }
                        break;
                    case "detached":
                        // Handle detached menu state
                        setState({
                            toggled: theme.toggled === "detached-close" ? "" : "detached-close",
                            iconOverlay: ""
                        });
                        break;
                    default:
                        setState({ toggled: "" });
                        break;
                }

                // Handle navStyle changes
                switch (navStyle) {
                    case "menu-click":
                        setState({
                            toggled: theme.toggled === "menu-click-closed" ? "" : "menu-click-closed"
                        });
                        break;
                    case "menu-hover":
                        setState({
                            toggled: theme.toggled === "menu-hover-closed" ? "" : "menu-hover-closed"
                        });
                        break;
                    case "icon-click":
                        setState({
                            toggled: theme.toggled === "icon-click-closed" ? "" : "icon-click-closed"
                        });
                        break;
                    case "icon-hover":
                        setState({
                            toggled: theme.toggled === "icon-hover-closed" ? "" : "icon-hover-closed"
                        });
                        break;
                }
            }
        } else {
            // For mobile view (screen width < 992px)
            if (theme.toggled === "close") {
                setState({ toggled: "open" });
                setTimeout(() => {
                    if (theme.toggled === "open") {
                        const overlay = overlayRef.current
                        if (overlay) {
                            overlay.classList.add("active");
                            overlay.addEventListener("click", () => {
                                const overlay = overlayRef.current
                                if (overlay) {
                                    overlay.classList.remove("active");
                                    menuClose();
                                }
                            });
                        }
                    }

                    window.addEventListener("resize", () => {
                        if (window.innerWidth >= 992) {
                            const overlay = overlayRef.current
                            if (overlay) {
                                overlay.classList.remove("active");
                            }
                        }
                    });
                }, 100);
            } else {
                setState({ toggled: "close" });
            }
        }
    };

    //Dark-Theme
    const toggleTheme = () => {
        const currentTheme = getState();
        const newState = {
            dataThemeMode: currentTheme.dataThemeMode === 'dark' ? 'light' : 'dark',
            dataHeaderStyles: currentTheme.dataThemeMode === 'dark' ? 'light' : 'dark',
            dataMenuStyles: currentTheme.dataThemeMode === 'dark' ? 'light' : 'dark',
        }
        setState(newState)
        if (newState.dataThemeMode != 'dark') {
            const newState = {
                bodyBg: '',
                lightRgb: '',
                bodyBg2: '',
                inputBorder: '',
                formControlBg: '',
                gray: '',
            }
            setState(newState)
            localStorage.setItem("zenolightTheme", "light");
            localStorage.removeItem("zenodarkTheme");
            localStorage.removeItem("zenomenu");
            localStorage.removeItem("zenoheader");
            localStorage.removeItem("bodyBg");
            localStorage.removeItem("bodyBg2");
            localStorage.removeItem("bgImg");
            localStorage.removeItem("lightRgb");
            localStorage.removeItem("formControlBg");
        }
        else {
            localStorage.setItem("zenodarkTheme", "dark");
            localStorage.removeItem("zenolightTheme");
            localStorage.removeItem("zenomenu");
            localStorage.removeItem("zenoheader");
            localStorage.removeItem("bodyBg");
            localStorage.removeItem("bodyBg2");
            localStorage.removeItem("inputBorder");
            localStorage.removeItem("lightRgb");
            localStorage.removeItem("formControlBg");
            localStorage.removeItem("gray");
        }
    }

    //full screen
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const fullscreenChangeHandler = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", fullscreenChangeHandler);

        return () => {
            document.removeEventListener("fullscreenchange", fullscreenChangeHandler);
        };
    }, []);


    //  switcher offcanvas
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // Cart removed
    ////Notifications

    const [notifications, setNotifications] = useState(Notifications); // assuming 'data' is an array of notifications
    const [unreadCount, setUnreadCount] = useState(5); // initial unread count

    const hasNotifications = notifications.length > 0;

    const handleRemove1 = (id: number, event: React.MouseEvent<HTMLAnchorElement>) => {
        event.stopPropagation();
        // Filter out the notification by id
        const updatedNotifications = notifications.filter((notification) => notification.id !== id);
        setNotifications(updatedNotifications);
        setUnreadCount(unreadCount - 1); // decrease unread count
    };
    return (
        <Fragment>
            {/*<!-- app-header -->*/}
            <header className="app-header sticky" id="header">

                {/*<!-- Start::main-header-container -->*/}
                <div className="main-header-container container-fluid">
                    {variable.toggled === "open" && (

                        <div ref={overlayRef} id="responsive-overlay"></div>
                    )}
                    {/*<!-- Start::header-content-left -->*/}
                    <div className="header-content-left">
                        {/*<!-- Start::header-element -->*/}
                        <div className="header-element">
                            <div className="horizontal-logo">
                                <Link scroll={false} href="/dashboard/" className="header-logo">
                                    <Image fill src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/desktop-logo.png`} alt="logo" className='desktop-logo' />
                                    <Image fill src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/toggle-dark.png`} alt="logo" className="toggle-dark" />
                                    <Image fill src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/desktop-dark.png`} alt="logo" className="desktop-dark" />
                                    <Image width={29} height={32} src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/toggle-logo.png`} alt="logo" className="toggle-logo" />
                                    <Image fill src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/toggle-white.png`} alt="logo" className="toggle-white" />
                                    <Image fill src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/desktop-white.png`} alt="logo" className="desktop-white" />
                                </Link>
                            </div>
                        </div>
                        {/*<!-- End::header-element -->*/}

                        {/*<!-- Start::header-element -->*/}
                        <div className="header-element mx-lg-0 mx-2">
                            <Link onClick={toggleSidebar} scroll={false} aria-label="Hide Sidebar" className="sidemenu-toggle header-link animated-arrow hor-toggle horizontal-navtoggle" data-bs-toggle="sidebar" href="#!"><span></span></Link>
                        </div>
                        {/*<!-- End::header-element -->*/}

                        {socFundamentalsHeader && (
                            <div className="header-element d-none d-sm-flex align-items-center min-w-0 ms-1 ms-lg-2 ps-2 ps-lg-3 border-start border-primary border-opacity-25">
                                <nav
                                    className="header-course-breadcrumb mb-0 text-truncate"
                                    style={{ maxWidth: 'min(46vw, 24rem)' }}
                                    aria-label="Current course"
                                >
                                    <Link
                                        scroll={false}
                                        href={SOC_FUNDAMENTALS_ROUTE_PREFIX}
                                        className="header-course-breadcrumb__link d-inline-flex align-items-center gap-2"
                                    >
                                        <i className="ri-book-open-line header-course-breadcrumb__icon" aria-hidden />
                                        <span>{socFundamentalsHeader.courseTitle}</span>
                                    </Link>
                                    {socFundamentalsHeader.topicTitle ? (
                                        <>
                                            <span className="header-course-breadcrumb__sep" aria-hidden>/</span>
                                            <span className="header-course-breadcrumb__topic">{socFundamentalsHeader.topicTitle}</span>
                                        </>
                                    ) : null}
                                </nav>
                            </div>
                        )}

                    </div>
                    {/*<!-- End::header-content-left -->*/}

                    {/*<!-- Start::header-content-right -->*/}
                    <ul className="header-content-right">

                        {/* mobile search removed */}

                        {/* language switcher removed */}

                        {/*<!-- Start::header-element -->*/}
                        <li className="header-element header-theme-mode">
                            {/*<!-- Start::header-link|layout-setting -->*/}
                            <Link scroll={false} href="#!" className="header-link layout-setting" onClick={() => toggleTheme()}>
                                <span className="light-layout">
                                    {/*<!-- Start::header-link-icon -->*/}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 header-link-icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                    </svg>
                                    {/*<!-- End::header-link-icon -->*/}
                                </span>
                                <span className="dark-layout">
                                    {/*<!-- Start::header-link-icon -->*/}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 header-link-icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                    </svg>
                                    {/*<!-- End::header-link-icon -->*/}
                                </span>
                            </Link>
                            {/*<!-- End::header-link|layout-setting -->*/}
                        </li>
                        {/*<!-- End::header-element -->*/}

                        {showGetPremium && (
                            <li className="header-element d-flex align-items-center ms-sm-1">
                                <Link
                                    scroll={false}
                                    href="/pages/pricing/"
                                    className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"
                                >
                                    Get Premium
                                </Link>
                            </li>
                        )}

                        {/* cart dropdown removed */}

                        {/*<!-- Start::header-element -->*/}
                        <SpkDropdown Togglevariant='' toggleas="a" Customtoggleclass='header-link dropdown-toggle no-caret' Customclass="header-element notifications-dropdown d-xl-block d-none" Navigate='#!' Id='messageDropdown' Svg={true} SvgClass='w-6 h-6 header-link-icon' Badgetag={true} Badgecolor='secondary' Badgeclass='header-icon-pulse rounded pulse pulse-secondary custom-header-icon-pulse' Menuclass='main-header-dropdown dropdown-menu-end'
                            Svgicon='M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5' >
                            <div className="p-3">
                                <div className="d-flex align-items-center justify-content-between">
                                    <p className="mb-0 fs-15 fw-medium">Notifications</p>
                                    <span className="badge bg-secondary text-fixed-white" id="notifiation-data">{unreadCount} Unread</span>
                                </div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <SimpleBar className="list-unstyled mb-0" id="header-notification-scroll">
                                {hasNotifications ? (
                                    notifications.map((notification) => (
                                        <Dropdown.Item as="li" className={notification.borderClass} key={notification.id}>
                                            <div className="d-flex align-items-start">
                                                <div className="pe-2 lh-1">
                                                    <span className={`avatar avatar-md avatar-rounded custom-width ${notification.color}`}>
                                                        {notification.image ? (
                                                            <Image fill src={`${process.env.NODE_ENV === 'production' ? basePath : ''}${notification.image}`} alt="user" />
                                                        ) : (
                                                            <i className={`${notification.icon} lh-1 fs-16`}></i>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex-grow-1 d-flex align-items-start justify-content-between">
                                                    <div>
                                                        <p className="mb-0 fw-medium">
                                                            <Link scroll={false} href="/pages/chat/">{notification.title}</Link>
                                                        </p>
                                                        <div className="text-muted fw-normal fs-12 header-notification-text text-truncate">
                                                            {notification.user ? (
                                                                <>
                                                                    <span className="text-primary">{notification.user}</span> {notification.message}
                                                                </>
                                                            ) : notification.task ? (
                                                                <>
                                                                    <span className="text-secondary">"{notification.task}"</span> {notification.message}
                                                                </>
                                                            ) : (
                                                                notification.message
                                                            )}
                                                        </div>
                                                        <div className="fw-normal fs-10 text-muted op-8">{notification.time}</div>
                                                    </div>
                                                    <div>
                                                        <Link scroll={false} href="#!" onClick={(event) => handleRemove1(notification.id, event)} className="min-w-fit-content dropdown-item-close1">
                                                            <i className="ri-close-line"></i>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                    ))
                                ) : (
                                    <div className="p-5 empty-item1">
                                        <div className="text-center">
                                            <span className="avatar avatar-xl avatar-rounded bg-secondary-transparent">
                                                <i className="ri-notification-off-line fs-2"></i>
                                            </span>
                                            <h6 className="fw-medium mt-3">No New Notifications</h6>
                                        </div>
                                    </div>
                                )}
                            </SimpleBar>

                            {hasNotifications && (
                                <div className="p-3 empty-header-item1 border-top">
                                    <div className="d-grid">
                                        <Link scroll={false} href="#!" className="btn btn-primary btn-wave">View All</Link>
                                    </div>
                                </div>
                            )}
                        </SpkDropdown>

                        {/*<!-- End::header-element -->*/}

                        {/*<!-- Start::header-element -->*/}
                        <li className="header-element header-fullscreen">
                            {/*<!-- Start::header-link -->*/}
                            <Link scroll={false} href="#!" className="header-link" onClick={toggleFullscreen}>
                                {isFullscreen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 full-screen-close header-link-icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 full-screen-open header-link-icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                    </svg>
                                )}
                            </Link>
                            {/*<!-- End::header-link -->*/}
                        </li>
                        {/*<!-- End::header-element -->*/}


                        {/*<!-- Start::header-element -->*/}
                        <li className="header-element">
                            {/*<!-- Start::header-link|switcher-icon -->*/}
                            <Link scroll={false} href="#!" className="header-link switcher-icon" data-bs-toggle="offcanvas" data-bs-target="#switcher-canvas" onClick={handleShow}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 header-link-icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            </Link>
                            <Switcher
                                show={show}
                                handleClose={handleClose}
                            />
                            {/*<!-- End::header-link|switcher-icon -->*/}
                        </li>
                        {/*<!-- End::header-element -->*/}

                    </ul>
                    {/*<!-- End::header-content-right -->*/}

                </div>
                {/*<!-- End::main-header-container -->*/}

            </header>
            {/*<!-- /app-header -->*/}
        </Fragment>
    )
}

export default Header