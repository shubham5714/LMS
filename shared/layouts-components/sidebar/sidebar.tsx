"use client"

import React, { Fragment, useEffect, useRef, useState } from 'react'
import { MENUITEMS, Menuitemtype } from './nav'
import Link from 'next/link';
import Menuloop from './menuloop';
import SimpleBar from 'simplebar-react';
import { data$, getState, setState } from '../services/switcherServices';
import { usePathname } from 'next/navigation';
import nextConfig from "@/next.config"
import Image from 'next/image';
import SpkTooltips from '@/shared/@spk-reusable-components/reusable-uiElements/spk-tooltips';
import SpkButton from '@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons';
import { useUserContext } from '@/shared/contextapi/UserContext';
import { useMembershipContext } from '@/shared/contextapi/MembershipContext';
import { useTenantNavigation } from '@/shared/hooks/useTenantNavigation';
import { supabase } from '@/shared/lib/supabase';
import { useRouter } from 'next/navigation';

const Sidebar = () => {

	const { basePath } = nextConfig
	const { membershipRecord, isLoading: membershipLoading } = useMembershipContext();
	const router = useRouter();

	// Logout function
	const handleLogout = async () => {
		try {
			// Clear session storage
			sessionStorage.removeItem('userRole');
			sessionStorage.removeItem('userMembership');
			sessionStorage.removeItem('assignedTenants');
			sessionStorage.removeItem('selectedTenantIds');
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

	let [variable, setVariable] = useState(getState());
	const local_varaiable = variable;

	useEffect(() => {
		const subscription = data$.subscribe((e) => {
			setVariable(e);
		});
		return () => subscription.unsubscribe();
	}, []);


	const [menuitems, setMenuitems] = useState<Menuitemtype[]>([]);

	// Full menu from nav.tsx (no per-tenant filtering)
	const { menuItems, isLoading } = useTenantNavigation();

	// Update menu items when tenant navigation changes
	useEffect(() => {
		if (!isLoading) {
			setMenuitems(menuItems);
		}
	}, [menuItems, isLoading]);

	function closeMenuFn() {
		const closeMenudata = (items: Menuitemtype[]) => {
			items?.forEach((item: Menuitemtype) => {
				item.active = false;
				if (item.children) {
					closeMenudata(item.children);
				}
			});
		}
		closeMenudata(menuitems);
		setMenuitems((arr) => [...arr]);
	}

	const sidebarRef = useRef(null);
	const [isSticky, setIsSticky] = useState(false);

	const handleScroll = () => {
		if (window.scrollY > 30) {
			setIsSticky(true);
		} else {
			setIsSticky(false);
		}
	};

	const slidesArrow = (selector: string): HTMLElement | null => document.querySelector(selector);

	const SelectorAll = (selector: string) => document.querySelectorAll(selector);

	useEffect(() => {
		const resizeEventListeners = [
			{ event: 'resize', handler: menuResizeFn },
			{ event: 'resize', handler: checkHoriMenu }
		];
		resizeEventListeners.forEach(({ event, handler }) => {
			window.addEventListener(event, handler);
		});
		const mainContent = slidesArrow(".main-content");
		if (window.innerWidth <= 992) {
			if (mainContent) {
				const newState = {
					toggled: "close"
				}
				setState(newState)
			} else if (document.documentElement.getAttribute('data-nav-layout') == 'horizontal') {
				closeMenuFn();
			}
		}
		if (mainContent) {
			mainContent.addEventListener('click', menuClose);
		}
		window.addEventListener("scroll", handleScroll);
		return () => {
			resizeEventListeners.forEach(({ event, handler }) => {
				window.removeEventListener(event, handler);
			});
			if (mainContent) {
				mainContent.removeEventListener('click', menuClose);
			}
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const pathname = usePathname()

	function Onhover() {
		const theme = getState();
		if ((theme.toggled == 'icon-overlay-close' || theme.toggled == 'detached-close') && theme.iconOverlay != 'open') {
			const newState = {
				"iconOverlay": "open"
			}
			setState(newState)
			console.log(newState)
		}

	}
	function Outhover() {
		const theme = getState();
		if ((theme.toggled == "icon-overlay-close" || theme.toggled == "detached-close") && theme.iconOverlay == "open") {
			const newState = {
				"iconOverlay": ""
			}
			setState(newState)
		}
	}

	const overlayRef = useRef<HTMLDivElement | null>(null);

	function menuClose() {

		const theme = getState();;

		if (window.innerWidth <= 992) {
			const newState = {
				toggled: "close"
			}
			setState(newState)
		}
		if (overlayRef.current) {
			overlayRef.current.classList.remove("active");
		}
		if (theme.dataNavLayout === "horizontal" || theme.dataNavStyle === "menu-click" || theme.dataNavStyle === "icon-click") {
			closeMenuFn();
		}
	}


	const WindowPreSize = typeof window !== 'undefined' ? [window.innerWidth] : [];
	function menuResizeFn() {

		if (typeof window === 'undefined') {
			// Handle the case where window is not available (server-side rendering)
			return;
		}

		WindowPreSize.push(window.innerWidth);
		if (WindowPreSize.length > 2) { WindowPreSize.shift() }

		const theme = getState();;
		const currentWidth = WindowPreSize[WindowPreSize.length - 1];
		const prevWidth = WindowPreSize[WindowPreSize.length - 2];


		if (WindowPreSize.length > 1) {
			if (currentWidth < 992 && prevWidth >= 992) {
				// less than 992;
				const newState = {
					toggled: "close"
				}
				setState(newState)
			}

			if (currentWidth >= 992 && prevWidth < 992) {
				// greater than 992
				const newState = {
					toggled: theme.dataVerticalStyle === "doublemenu" ? "double-menu-open" : ""
				}
				setState(newState)



			}
		}
	}
	const menuNavRef = useRef<HTMLUListElement | null>(null);
	const mainContainerRef = useRef<HTMLUListElement | null>(null);

	function checkHoriMenu() {
		const menuNav = menuNavRef.current;
		const mainContainer1 = mainContainerRef.current;

		if (menuNav && mainContainer1) {
			const computedStyle = window.getComputedStyle(menuNav);
			const marginLeftValue = Math.ceil(
				Number(computedStyle.marginLeft.split("px")[0])
			);
			const marginRightValue = Math.ceil(
				Number(computedStyle.marginRight.split("px")[0])
			);
			const check = menuNav.scrollWidth - mainContainer1.offsetWidth;

			if (menuNav.scrollWidth > mainContainer1.offsetWidth) {
			} else {
				menuNav.style.marginLeft = "0px";
				menuNav.style.marginRight = "0px";
				menuNav.style.marginInlineStart = "0px";
			}

			const isRtl = document.documentElement.getAttribute("dir") === "rtl";

			if (!isRtl) {
				if (menuNav.scrollWidth > mainContainer1.offsetWidth) {
					if (Math.abs(check) < Math.abs(marginLeftValue)) {
						menuNav.style.marginLeft = -check + "px";
					}
				}
			} else {
				if (menuNav.scrollWidth > mainContainer1.offsetWidth) {
					if (Math.abs(check) < Math.abs(marginRightValue)) {
						menuNav.style.marginRight = -check + "px";
					}
				}
			}
		}
	}

	function switcherArrowFn(): void {

		// Used to remove is-expanded class and remove class on clicking arrow buttons
		function slideClick(): void {
			const slide = SelectorAll(".slide");
			const slideMenu = SelectorAll(".slide-menu");

			slide.forEach((element) => {
				if (element.classList.contains("is-expanded")) {
					element.classList.remove("is-expanded");
				}
			});

			slideMenu.forEach((element) => {
				if (element.classList.contains("open")) {
					element.classList.remove("open");
					element.style.display = "none";
				}
			});
		}

		slideClick();
	}

	function slideRight(): void {
		const menuNav = slidesArrow(".main-menu");
		const mainContainer1 = slidesArrow(".main-sidebar");
		const slideRightButton = slidesArrow("#slide-right");
		const slideLeftButton = slidesArrow("#slide-left");
		const element = slidesArrow(".main-menu > .slide.open");
		const element1 = slidesArrow(".main-menu > .slide.open > ul");
		if (menuNav && mainContainer1) {
			const marginLeftValue = Math.ceil(
				Number(window.getComputedStyle(menuNav).marginInlineStart.split("px")[0])
			);
			const marginRightValue = Math.ceil(
				Number(window.getComputedStyle(menuNav).marginInlineEnd.split("px")[0])
			);
			const check = menuNav.scrollWidth - mainContainer1.offsetWidth;
			let mainContainer1Width = mainContainer1.offsetWidth;

			if (menuNav.scrollWidth > mainContainer1.offsetWidth) {
				if (!(local_varaiable.dataVerticalStyle.dir === "rtl")) {
					if (Math.abs(check) > Math.abs(marginLeftValue)) {
						menuNav.style.marginInlineEnd = "0";

						if (!(Math.abs(check) > Math.abs(marginLeftValue) + mainContainer1Width)) {
							mainContainer1Width = Math.abs(check) - Math.abs(marginLeftValue);

							if (slideRightButton) {
								slideRightButton.classList.add("hidden");
							}
						}

						menuNav.style.marginInlineStart =
							(Number(menuNav.style.marginInlineStart.split("px")[0]) -
								Math.abs(mainContainer1Width)) +
							"px";

						if (slideRightButton) {
							slideRightButton.classList.remove("hidden");
						}
					}
				} else {
					if (Math.abs(check) > Math.abs(marginRightValue)) {
						menuNav.style.marginInlineEnd = "0";

						if (!(Math.abs(check) > Math.abs(marginRightValue) + mainContainer1Width)) {
							mainContainer1Width = Math.abs(check) - Math.abs(marginRightValue);
							if (slideRightButton) {
								slideRightButton.classList.add("hidden");
							}
						}

						menuNav.style.marginInlineStart =
							(Number(menuNav.style.marginInlineStart.split("px")[0]) -
								Math.abs(mainContainer1Width)) +
							"px";
						if (slideLeftButton) {
							slideLeftButton.classList.remove("hidden");
						}
					}
				}
			}


			if (element) {
				element.classList.remove("active");
			}
			if (element1) {
				element1.style.display = "none";
			}
		}

		switcherArrowFn();
	}

	function slideLeft(): void {
		const menuNav = slidesArrow(".main-menu");
		const mainContainer1 = slidesArrow(".main-sidebar");
		const slideRightButton = slidesArrow("#slide-right");
		const slideLeftButton = slidesArrow("#slide-left");
		const element = slidesArrow(".main-menu > .slide.open");
		const element1 = slidesArrow(".main-menu > .slide.open > ul");
		if (menuNav && mainContainer1) {
			const marginLeftValue = Math.ceil(
				Number(window.getComputedStyle(menuNav).marginInlineStart.split("px")[0])
			);
			const marginRightValue = Math.ceil(
				Number(window.getComputedStyle(menuNav).marginInlineEnd.split("px")[0])
			);
			const check = menuNav.scrollWidth - mainContainer1.offsetWidth;
			let mainContainer1Width = mainContainer1.offsetWidth;

			if (menuNav.scrollWidth > mainContainer1.offsetWidth) {
				if (!(local_varaiable.dataVerticalStyle.dir === "rtl")) {
					if (Math.abs(check) <= Math.abs(marginLeftValue)) {
						menuNav.style.marginInlineStart = "0px";
					}
				} else {
					if (Math.abs(check) > Math.abs(marginRightValue)) {
						menuNav.style.marginInlineStart = "0";

						if (!(Math.abs(check) > Math.abs(marginRightValue) + mainContainer1Width)) {
							mainContainer1Width = Math.abs(check) - Math.abs(marginRightValue);

							if (slideRightButton) {
								slideRightButton.classList.add("hidden");
							}
						}

						menuNav.style.marginInlineStart =
							(Number(menuNav.style.marginInlineStart.split("px")[0]) -
								Math.abs(mainContainer1Width)) +
							"px";

						if (slideLeftButton) {
							slideLeftButton.classList.remove("hidden");
						}
					}
				}
			}

			if (element) {
				element.classList.remove("active");
			}
			if (element1) {
				element1.style.display = "none";
			}
		}

		switcherArrowFn();
	}

	const level = 0;
	let hasParent = false;
	let hasParentLevel = 0;

	function setSubmenu(event: MouseEvent, targetObject: Menuitemtype, menuItems = menuitems) {
		const theme = getState();
		if (!event?.ctrlKey) {
			for (const item of menuItems) {
				if (item === targetObject) {
					item.active = true;
					item.selected = true;
					setMenuAncestorsActive(item);
				} else if (!item.active && !item.selected) {
					item.active = false; // Set active to false for items not matching the target
					item.selected = false; // Set active to false for items not matching the target
				} else {
					removeActiveOtherMenus(item);
				}
				if (item.children && item.children.length > 0) {
					setSubmenu(event, targetObject, item.children);
				}
			}

		}

		setMenuitems((arr) => [...arr]);
	}
	function getParentObject(obj: Menuitemtype[], childObject: Menuitemtype) {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (typeof obj[key] === "object" && JSON.stringify(obj[key]) === JSON.stringify(childObject)) {
					return obj; // Return the parent object
				}
				if (typeof obj[key] === "object") {
					const parentObject: any = getParentObject(obj[key], childObject);
					if (parentObject !== null) {
						return parentObject;
					}
				}
			}
		}
		return null; // Object not found
	}
	function setMenuAncestorsActive(targetObject: Menuitemtype) {
		const parent = getParentObject(menuitems, targetObject);
		const theme = getState();
		if (parent) {
			if (hasParentLevel > 2) {
				hasParent = true;
			}
			parent.active = true;
			parent.selected = true;
			hasParentLevel += 1;
			setMenuAncestorsActive(parent);
		}
		else if (!hasParent) {
			if (theme.dataVerticalStyle == "doublemenu") {
				const newState = {
					toggled: "double-menu-close"
				}
				setState(newState)

			}
		}
	}
	function removeActiveOtherMenus(item: Menuitemtype | Menuitemtype[]) {
		if (!item) return;
		if (Array.isArray(item)) {
			for (const val of item) {
				val.active = false;
				val.selected = false;

				if (val.children && val.children.length > 0) {
					removeActiveOtherMenus(val.children);
				}
			}
		} else {
			item.active = false;
			item.selected = false;

			if (item.children && item.children.length > 0) {
				removeActiveOtherMenus(item.children);
			}
		}
	}
	//
	function setMenuUsingUrl(currentPath: string) {
		hasParent = false;
		hasParentLevel = 1;
		// Check current url and trigger the setSidemenu method to active the menu.
		const setSubmenuRecursively = (items: Menuitemtype[]) => {

			items?.forEach((item: Menuitemtype) => {
				if (item.path == '') { }
				else if (item.path === currentPath) {
					setSubmenu(null, item);
				}
				if (item.children) {
					setSubmenuRecursively(item.children);
				}
			});
		};
		setSubmenuRecursively(menuitems);
	}
	const [previousUrl, setPreviousUrl] = useState("/");

	useEffect(() => {
		const currentPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

		if (currentPath !== previousUrl) {
			setMenuUsingUrl(currentPath);
			setPreviousUrl(currentPath);
		}
	}, [pathname]);


	//
	function toggleSidemenu(event: MouseEvent, targetObject: Menuitemtype, menuItems = menuitems) {
		const theme = getState();
		let element = event.target;
		if ((theme.dataNavStyle != "icon-hover" && theme.dataNavStyle != "menu-hover") || (window.innerWidth < 992) || (theme.dataNavLayout != "horizontal") && (theme.toggled != "icon-hover-closed" && theme.toggled != "menu-hover-closed")) {
			for (const item of menuItems) {
				if (item === targetObject) {
					if (theme.dataVerticalStyle == "doublemenu" && item.active) { return; }
					item.active = !item.active;

					if (item.active) {
						closeOtherMenus(MENUITEMS, item);
					}
					else {
						if (theme.dataVerticalStyle == "doublemenu") {
							const newState = {
								toggled: "double-menu-close"
							}
							setState(newState)

						}
					}
					setAncestorsActive(MENUITEMS, item);

				}
				else if (!item.active) {
					if (theme.dataVerticalStyle != "doublemenu") {
						item.active = false; // Set active to false for items not matching the target
					}
				}
				if (item.children && item.children.length > 0) {
					toggleSidemenu(event, targetObject, item.children);
				}
			}
			if (targetObject?.children && targetObject.active) {
				if (theme.dataVerticalStyle == "doublemenu" && theme.toggled != "double-menu-open") {
					const newState = {
						toggled: "double-menu-open"
					}
					setState(newState)

				}
			}
			if (element && theme.dataNavLayout == "horizontal" && (theme.dataNavStyle == "menu-click" || theme.dataNavStyle == "icon-click")) {
				const listItem = element.closest("li");
				if (listItem) {
					// Find the first sibling <ul> element
					const siblingUL = listItem.querySelector("ul");
					let outterUlWidth = 0;
					let listItemUL = listItem.closest("ul:not(.main-menu)");
					while (listItemUL) {
						listItemUL = listItemUL.parentElement.closest("ul:not(.main-menu)");
						if (listItemUL) {
							outterUlWidth += listItemUL.clientWidth;
						}
					}
					if (siblingUL) {
						// You've found the sibling <ul> element
						let siblingULRect = listItem.getBoundingClientRect();
						if (theme.dir == "rtl") {
							if ((siblingULRect.left - siblingULRect.width - outterUlWidth + 150 < 0 && outterUlWidth < window.innerWidth) && (outterUlWidth + siblingULRect.width + siblingULRect.width < window.innerWidth)) {
								targetObject.dirchange = true;
							} else {
								targetObject.dirchange = false;
							}
						} else {
							if ((outterUlWidth + siblingULRect.right + siblingULRect.width + 50 > window.innerWidth && siblingULRect.right >= 0) && (outterUlWidth + siblingULRect.width + siblingULRect.width < window.innerWidth)) {
								targetObject.dirchange = true;
							} else {
								targetObject.dirchange = false;
							}
						}
					}
					setTimeout(() => {
						let computedValue = siblingUL.getBoundingClientRect();
						if ((computedValue.bottom) > window.innerHeight) {
							siblingUL.style.height = (window.innerHeight - computedValue.top - 8) + "px";
							siblingUL.style.overflow = "auto";
						}
					}, 100);
				}
			}
			setMenuitems((arr) => [...arr]);
		}
	}

	function setAncestorsActive(MENUITEMS: Menuitemtype, targetObject: Menuitemtype) {
		const theme = getState();
		const parent = findParent(MENUITEMS, targetObject);
		if (parent) {
			parent.active = true;
			if (parent.active) {
				const newState = {
					toggled: "double-menu-open"
				}
				setState(newState)

			}

			setAncestorsActive(MENUITEMS, parent);
		} else {
			if (theme.dataVerticalStyle == "doublemenu") {
				const newState = {
					toggled: "double-menu-close"
				}
				setState(newState)

			}

		}
	}

	function closeOtherMenus(MENUITEMS: Menuitemtype[], targetObject: Menuitemtype) {
		for (const item of MENUITEMS) {
			if (item !== targetObject) {
				item.active = false;
				if (item.children && item.children.length > 0) {
					closeOtherMenus(item.children, targetObject);
				}
			}
		}
	}

	function findParent(MenuItems: Menuitemtype[], targetObject: Menuitemtype): Menuitemtype | null {
		for (const item of MenuItems) {
			if (item.children && item.children.includes(targetObject)) {
				return item;
			}
			if (item.children && item.children.length > 0) {
				const parent: Menuitemtype | null = findParent(MenuItems = item.children, targetObject);
				if (parent) {
					return parent;
				}
			}
		}
		return null;
	}
	//
	function HoverToggleInnerMenuFn(event: MouseEvent, item: Menuitemtype) {
		const theme = getState();;
		let element = event.target;
		if (element && theme.dataNavLayout == "horizontal" && (theme.dataNavStyle == "menu-hover" || theme.dataNavStyle == "icon-hover")) {
			const listItem = element.closest("li");
			if (listItem) {
				// Find the first sibling <ul> element
				const siblingUL = listItem.querySelector("ul");
				let outterUlWidth = 0;
				let listItemUL = listItem.closest("ul:not(.main-menu)");
				while (listItemUL) {
					listItemUL = listItemUL.parentElement.closest("ul:not(.main-menu)");
					if (listItemUL) {
						outterUlWidth += listItemUL.clientWidth;
					}
				}
				if (siblingUL) {
					// You've found the sibling <ul> element
					let siblingULRect = listItem.getBoundingClientRect();
					if (theme.dir == "rtl") {
						if ((siblingULRect.left - siblingULRect.width - outterUlWidth + 150 < 0 && outterUlWidth < window.innerWidth) && (outterUlWidth + siblingULRect.width + siblingULRect.width < window.innerWidth)) {
							item.dirchange = true;
						} else {
							item.dirchange = false;
						}
					} else {
						if ((outterUlWidth + siblingULRect.right + siblingULRect.width + 50 > window.innerWidth && siblingULRect.right >= 0) && (outterUlWidth + siblingULRect.width + siblingULRect.width < window.innerWidth)) {
							item.dirchange = true;
						} else {
							item.dirchange = false;
						}
					}
				}
			}
		}
	}

	//to open menu
	const Sideclick = () => {
		if (window.innerWidth > 992) {
			let html = document.documentElement;
			if (html.getAttribute("data-icon-overlay") != "open") {
				html.setAttribute("data-icon-overlay", "open");
			}

		}
	};

	const handleClick = (event: MouseEvent) => {
		// Your logic here
		event.preventDefault(); // Prevents the default anchor behavior (navigation)
		// ... other logic you want to perform on click
	};
	const toggleTheme = () => {
		const currentTheme = getState();
		const newState = {
			dataThemeMode: currentTheme.dataThemeMode === 'dark' ? 'light' : 'dark',
			dataHeaderStyles: currentTheme.dataThemeMode === 'transparent' ? 'light' : 'transparent',
			dataMenuStyles: currentTheme.dataThemeMode === 'transparent' ? 'light' : 'transparent',
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
	return (
		<Fragment>
			<div id="responsive-overlay" ref={overlayRef} onClick={() => { menuClose(); }}></div>
			{/* <!-- Start::app-sidebar --> */}

			<aside className="app-sidebar sticky d-flex flex-column" id="sidebar" onMouseOver={Onhover} onMouseLeave={Outhover} >

				{/* <!-- Start::main-sidebar-header --> */}

				<div className="main-sidebar-header">
					<Link scroll={false} href="/dashboards/sales/" className="header-logo">
						<Image width={99} height={32} src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/desktop-logo.png`} alt="logo" className="desktop-logo" />
						<Image width={30} height={24} src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/toggle-dark.png`} alt="logo" className="toggle-dark" />
						<Image width={99} height={32} src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/desktop-dark.png`} alt="logo" className="desktop-dark" />
						<Image width={99} height={32} src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/desktop-white.png`} alt="logo" className="desktop-white" />
						<Image width={30} height={24} src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/toggle-logo.png`} alt="logo" className="toggle-logo" />
						<Image width={30} height={24} src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/toggle-white.png`} alt="logo" className="toggle-white" />
					</Link>
				</div>
				{/* <!-- End::main-sidebar-header --> */}

				{/* <!-- Start::main-sidebar --> */}

				<SimpleBar className="main-sidebar d-flex flex-column flex-fill" id="sidebar-scroll">

					{/* Show loading state */}
					{isLoading ? (
						<div className="d-flex justify-content-center align-items-center h-100">
							<div className="spinner-border text-primary" role="status">
								<span className="visually-hidden">Loading navigation...</span>
							</div>
						</div>
					) : (
						<>
							{/* <!-- Start::nav --> */}
							<nav className="main-menu-container nav nav-pills flex-column sub-open flex-fill">
						<div className="slide-left" id="slide-left" onClick={slideLeft} >
							<svg xmlns="http://www.w3.org/2000/svg" fill="#7b8191" width="24" height="24" viewBox="0 0 24 24"> <path d="M13.293 6.293 7.586 12l5.707 5.707 1.414-1.414L10.414 12l4.293-4.293z"></path> </svg>
						</div>
						<ul className="main-menu">

							{/* <!-- Start::slide --> */}

							{menuitems.map((list: Menuitemtype, index: number) => (
								<Fragment key={index}>
									<li className={` ${list.menutitle ? "slide__category" : ""} ${list.type === 'link' ? 'slide' : ''} ${list.type === 'sub' ? 'slide has-sub' : ''} ${list.active ? 'open' : ''}  ${list?.selected ? 'active' : ''}  `}>
										{list.menutitle ?
											<span className='category-name'>{list.menutitle}</span>
											:
											""}
										{list.type === "link" ?
											<Link href={list.path} className={`side-menu__item  ${list.selected ? 'active' : ''}`}>
												<span className={`${local_varaiable?.dataVerticalStyle == 'doublemenu' ? '' : 'd-none'}`}>
													<SpkTooltips placement="right" title={list.title}>
														<div>{list.icon}</div>
													</SpkTooltips>
												</span>
												{local_varaiable.dataVerticalStyle != "doublemenu" ? list.icon : ""}
												<span className="side-menu__label">{list.title} {list.badgetxt ? (<span className={list.class}>{list.badgetxt}</span>
												) : (
													""
												)}
												</span>
											</Link>
											: ""}
										{list.type === "empty" ?
											<Link href="#!" className='side-menu__item' onClick={handleClick} >{list.icon}<span className=""> {list.title} {list.badgetxt ? (
												<span className={list.class}>{list.badgetxt} </span>
											) : (
												""
											)}
											</span>
											</Link>
											: ""}
										{list.children && <Menuloop MenuItems={list} level={level + 1} handleToMenu={toggleSidemenu} HoverToggleInnerMenuFn={HoverToggleInnerMenuFn} />}
									</li>


								</Fragment>
							))}
							<li>
								<ul className="slide-menu child1 doublemenu_slide-menu">
									<li className="text-center p-3 text-fixed-white">
										<div className="doublemenu_slide-menu-background">
											<Image fill src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/media/backgrounds/13.png`} alt="" className="" />

										</div>
										<div className="d-flex flex-column align-items-center justify-content-between h-100">
											<div className="fs-15 fw-medium">Dashboard AI Helper</div>
											<div>
												<span className="avatar avatar-lg p-1">
													<Image fill src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/media/media-80.png`} alt="" className="" />

													<span className="top-right"></span>
													<span className="bottom-right"></span>
												</span>
											</div>
											<div className="d-grid w-100">
												<button className="btn btn-white border-0">Try Now</button>
											</div>
										</div>
									</li>
								</ul>
							</li>

							{/* <!-- End::slide --> */}

						</ul>
						<div className="slide-right" id="slide-right" onClick={slideRight} >
							<svg xmlns="http://www.w3.org/2000/svg" fill="#7b8191" width="24" height="24" viewBox="0 0 24 24">
								<path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"></path>
							</svg>
						</div>
					</nav>

							{/* <!-- End::nav --> */}
						</>
					)}

				</SimpleBar>

				{/* <!-- End::main-sidebar --> */}

				{/* <!-- Start::User Info Section - Fixed at Bottom --> */}
				<div className="sidebar-user-info border-top p-3">
					{membershipLoading ? (
						<div className="d-flex align-items-center justify-content-center">
							<div className="spinner-border spinner-border-sm me-2" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
							<span className="text-muted">Loading...</span>
						</div>
					) : (
						<div className="d-flex flex-column">
							<div className="d-flex align-items-center mb-2">
								<div className="avatar avatar-md bg-primary-transparent avatar-rounded me-2">
									<i className="ri-user-line fs-16"></i>
								</div>
								<div className="flex-fill min-w-0">
									<div className="fw-medium text-dark fs-14 text-truncate" title={membershipRecord?.username ?? ''}>
										{membershipRecord?.username ?? '—'}
									</div>
									<div className="text-muted fs-12 text-truncate" title={membershipRecord?.membership ?? ''}>
										{membershipRecord?.membership ?? '—'}
									</div>
								</div>
							</div>
							<SpkButton 
								Buttonvariant="outline-danger" 
								Size="sm" 
								onClickfunc={handleLogout}
								Customclass="w-100"
							>
								<i className="ri-logout-box-line me-1"></i>
								Logout
							</SpkButton>
						</div>
					)}
				</div>
				{/* <!-- End::User Info Section --> */}

			</aside>

			{/* <!-- End::app-sidebar --> */}

		</Fragment>
	)
}

export default Sidebar