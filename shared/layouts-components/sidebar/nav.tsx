export type Menuitemtype = {
  menutitle?: string;
  title?: string;
  icon?: React.ReactNode;
  menusub?: boolean;
  type?: "sub" | "empty" | "link";
  active?: boolean;
  selected?: boolean;
  dirchange?: boolean;
  class?: string,
  children?: Menuitemtype[];
  badgetxt?: string;
  path?: string;
  background?: string;
  doublToggle?: boolean;
  ctive?: boolean;
};

const Dashboardlinkicon = <i className="ri-layout-line side-menu__icon" aria-hidden />;

function createAppsSideMenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

const Coursesicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>

const LearningPathsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>

const Communityicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.09 9.09 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>

export const MENUITEMS: Menuitemtype[] = [
  {
    menutitle: "Main"
  },
  {
    title: "Dashboard", icon: Dashboardlinkicon, type: "link", path: "/dashboard", active: false, selected: false, dirchange: false
  },
  {
    title: "Courses",
    icon: Coursesicon,
    type: "link",
    path: "/courses",
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: "Learning Paths",
    icon: LearningPathsicon,
    type: "link",
    path: "/learning-paths",
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: "Resources",
    icon: createAppsSideMenuIcon(),
    type: "sub",
    active: false,
    dirchange: false,
    children: [
      { path: "/resources", type: "link", active: false, selected: false, dirchange: false, title: "Overview" },
    ],
  },
  {
    title: "Community",
    icon: Communityicon,
    type: "sub",
    active: false,
    dirchange: false,
    children: [
      { path: "/community", type: "link", active: false, selected: false, dirchange: false, title: "Overview" },
    ],
  },
]
