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

const Dashboardicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"></path></svg>

const Appsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"></path> </svg>

const Authenticationicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"></path> </svg>

const Erroricon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"></path> </svg>

const Pagesicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"></path> </svg>

const Formsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"></path> </svg>

const Elementsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"></path> </svg>

const Advanceuiicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z"></path> </svg>

const Utilitiesicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"></path> </svg>

const Widgetsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"></path> </svg>

const Mapsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"></path> </svg>

const Icons = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"></path> </svg>

const Chartsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"></path> </svg>

const Tableicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"></path> </svg>

const NestedmenuIcon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"></path> </svg>

const Integrationsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"></path> </svg>

const Ticketsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-9h9M5.25 6.75h13.5c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H5.25c-.621 0-1.125.504-1.125 1.125v.75c0 .621.504 1.125 1.125 1.125Zm0 9h13.5c.621 0 1.125-.504 1.125-1.125v-.75c0-.621-.504-1.125-1.125-1.125H5.25c-.621 0-1.125.504-1.125 1.125v.75c0 .621.504 1.125 1.125 1.125Z"></path> </svg>

const EnvironmentContexticon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"></path> </svg>

const ContextMemoryicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"></path> </svg>

const ThreatIntelligenceicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"></path> </svg>

const Approvalsicon = <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 side-menu__icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path> </svg>

export const MENUITEMS: Menuitemtype[] = [

  {
    menutitle: "Main"
  },

  {
    title: "Dashboards", icon: Dashboardicon, type: "sub", active: false, dirchange: false, children: [
      { path: "/dashboards/sales", type: "link", active: false, selected: false, dirchange: false, title: "Sales" },
      { path: "/dashboards/overview", type: "link", active: false, selected: false, dirchange: false, title: "Overview" },
      { path: "/dashboards/executive", type: "link", active: false, selected: false, dirchange: false, title: "Executive" },
      { path: "/dashboards/crm", type: "link", active: false, selected: false, dirchange: false, title: "CRM" },
      { path: "/dashboards/hrm", type: "link", active: false, selected: false, dirchange: false, title: "HRM" },
      { path: "/dashboards/nft", type: "link", active: false, selected: false, dirchange: false, title: "NFT" },
      { path: "/dashboards/crypto", type: "link", active: false, selected: false, dirchange: false, title: "Crypto" },
      { path: "/dashboards/jobs", type: "link", active: false, selected: false, dirchange: false, title: "Jobs" },
      { path: "/dashboards/projects", type: "link", active: false, selected: false, dirchange: false, title: "Projects" },
      { path: "/dashboards/courses", type: "link", active: false, selected: false, dirchange: false, title: "Courses" },
      { path: "/dashboards/stocks", type: "link", active: false, selected: false, dirchange: false, title: "Stocks" },
      { path: "/dashboards/medical", type: "link", active: false, selected: false, dirchange: false, title: "Medical" },
      { path: "/dashboards/pos-system", type: "link", active: false, selected: false, dirchange: false, title: "POS System" },
      { path: "/dashboards/podcast", type: "link", active: false, selected: false, dirchange: false, title: "Podcast" },
      { path: "/dashboards/school", type: "link", active: false, selected: false, dirchange: false, title: "School" },
      { path: "/dashboards/social-media", type: "link", active: false, selected: false, dirchange: false, title: "Social Media" },
    ]
  },

  {
    title: "Investigations", icon: Mapsicon, type: "link", path: "/tickets", active: false, selected: false, dirchange: false
  },

  {
    title: "Approvals", icon: Approvalsicon, type: "link", path: "/approvals", active: false, selected: false, dirchange: false
  },

  {
    title: "Threat Intelligence", icon: ThreatIntelligenceicon, type: "link", path: "/integrations", active: false, selected: false, dirchange: false
  },

  {
    title: "Context Memory", icon: ContextMemoryicon, type: "sub", active: false, dirchange: false, children: [
      { path: "/environment-context", type: "link", active: false, selected: false, dirchange: false, title: "Environment Context" },
      { path: "/investigation-context", type: "link", active: false, selected: false, dirchange: false, title: "Investigation Context" },
      { path: "/response-context", type: "link", active: false, selected: false, dirchange: false, title: "Response Context" },
    ]
  },

  {
    title: "Integrations", icon: Appsicon, type: "link", path: "/integrations", active: false, selected: false, dirchange: false
  },

  {
    menutitle: "WEB APPS"
  },

  {
    title: "Apps", icon: Appsicon, type: "sub", active: false, selected: false, dirchange: false, children: [

      {
        title: "Executive", type: "sub", active: false, dirchange: false, children: [
          { path: "/apps/executive/add-product", type: "link", active: false, selected: false, dirchange: false, title: "Add Products" },
          { path: "/apps/executive/cart", type: "link", active: false, selected: false, dirchange: false, title: "Cart" },
          { path: "/apps/executive/checkout", type: "link", active: false, selected: false, dirchange: false, title: "Checkout" },
          { path: "/apps/executive/edit-products", type: "link", active: false, selected: false, dirchange: false, title: "Edit Products" },
          { path: "/apps/executive/order-details", type: "link", active: false, selected: false, dirchange: false, title: "Order Details" },
          { path: "/apps/executive/orders", type: "link", active: false, selected: false, dirchange: false, title: "Orders" },
          { path: "/apps/executive/products", type: "link", active: false, selected: false, dirchange: false, title: "Products" },
          { path: "/apps/executive/product-details", type: "link", active: false, selected: false, dirchange: false, title: "Product Details" },
          { path: "/apps/executive/products-list", type: "link", active: false, selected: false, dirchange: false, title: "Products List" },
          { path: "/apps/executive/wishlist", type: "link", active: false, selected: false, dirchange: false, title: "Wishlist" },
        ]
      },
      { path: "/apps/full-calendar", type: "link", active: false, selected: false, dirchange: false, title: "Full Calendar" },
      { path: "/apps/gallery", type: "link", active: false, selected: false, dirchange: false, title: "Gallery" },
      { path: "/apps/sweet-alerts", type: "link", active: false, selected: false, dirchange: false, title: "Sweet Alerts" },


      {
        title: "Projects", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/apps/projects/projects-list", type: "link", active: false, selected: false, dirchange: false, title: "Projects List" },
          { path: "/apps/projects/project-overview", type: "link", active: false, selected: false, dirchange: false, title: "Project Overview" },
          { path: "/apps/projects/create-project", type: "link", active: false, selected: false, dirchange: false, title: "Create Project" },
        ],
      },

      {
        title: "Task", type: "sub", active: false, selected: false, dirchange: false, doublToggle: false, children: [

          { path: "/apps/task/kanban-board", type: "link", active: false, selected: false, dirchange: false, title: "Kanban Board" },
          { path: "/apps/task/list-view", type: "link", active: false, selected: false, dirchange: false, title: "List View" },
          { path: "/apps/task/task-details", type: "link", active: false, selected: false, dirchange: false, title: "Task Details" },
        ]
      },

      {
        title: "Jobs", type: "sub", active: false, selected: false, children: [
          { path: "/apps/jobs/job-details", type: "link", active: false, selected: false, dirchange: false, title: "Job Details" },
          { path: "/apps/jobs/search-company", type: "link", active: false, selected: false, dirchange: false, title: "Search Company" },
          { path: "/apps/jobs/search-jobs", type: "link", active: false, selected: false, dirchange: false, title: "Search Jobs" },
          { path: "/apps/jobs/job-post", type: "link", active: false, selected: false, dirchange: false, title: " Job Post" },
          { path: "/apps/jobs/jobs-list", type: "link", active: false, selected: false, dirchange: false, title: " Jobs List" },
          { path: "/apps/jobs/search-candidate", type: "link", active: false, selected: false, dirchange: false, title: " Search Candidate" },
          { path: "/apps/jobs/candidate-details", type: "link", active: false, selected: false, dirchange: false, title: "Candidate Details" },
        ],
      },
      {
        title: "NFT", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/apps/nft/market-place", type: "link", active: false, selected: false, dirchange: false, title: "Market Place" },
          { path: "/apps/nft/nft-details", type: "link", active: false, selected: false, dirchange: false, title: "NFT Details" },
          { path: "/apps/nft/create-nft", type: "link", active: false, selected: false, dirchange: false, title: "Create NFT" },
          { path: "/apps/nft/wallet-integration", type: "link", active: false, selected: false, dirchange: false, title: " Wallet Integration" },
          { path: "/apps/nft/live-acuation", type: "link", active: false, selected: false, dirchange: false, title: "Live Auction" },
        ],
      },
      {
        title: "CRM", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/apps/crm/contacts", type: "link", active: false, selected: false, dirchange: false, title: "Contacts" },
          { path: "/apps/crm/companies", type: "link", active: false, selected: false, dirchange: false, title: "Companies" },
          { path: "/apps/crm/deals", type: "link", active: false, selected: false, dirchange: false, title: "Deals" },
          { path: "/apps/crm/leads", type: "link", active: false, selected: false, dirchange: false, title: " Leads" },
        ],
      },
      {
        title: "Crypto", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/apps/crypto/transactions", type: "link", active: false, selected: false, dirchange: false, title: "Transactions" },
          { path: "/apps/crypto/currency-exchange", type: "link", active: false, selected: false, dirchange: false, title: "Currency Exchange" },
          { path: "/apps/crypto/buy-sell", type: "link", active: false, selected: false, dirchange: false, title: "Buy & Sell" },
          { path: "/apps/crypto/marketcap", type: "link", active: false, selected: false, dirchange: false, title: " Marketcap" },
          { path: "/apps/crypto/wallet", type: "link", active: false, selected: false, dirchange: false, title: "Wallet" },
        ],
      },

    ],
  },
  {
    icon: NestedmenuIcon,
    title: "Nested Menu",
    selected: false,
    active: false,
    dirchange: false,
    type: "sub",
    children: [
      {
        path: "",
        title: "Nested-1",
        type: "empty",
        active: false,
        selected: false,

        dirchange: false,
      },

      {
        title: "Nested-2",
        type: "sub",
        active: false,
        selected: false,
        dirchange: false,
        children: [
          {
            path: "",
            type: "empty",
            active: false,
            selected: false,
            dirchange: false,
            title: "Nested-2-1",
          },
          {
            path: "",
            type: "empty",
            ctive: false,
            selected: false,
            dirchange: false,
            title: "Nested-2-2",
          },
          {
            path: "",
            type: "empty",
            active: false,
            selected: false,
            dirchange: false,
            title: "Nested-2-3",
          },
        ],
      },
    ],
  },
  {
    menutitle: "Pages"
  },
  {
    icon: Authenticationicon, title: "Authentication", type: "sub", active: false, selected: false, dirchange: false, children: [
      { path: "/authentication/coming-soon", type: "link", active: false, selected: false, title: "Coming Soon" },

      {
        title: "Create Password", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/authentication/create-password/create-basic", type: "link", active: false, selected: false, dirchange: false, title: "Basic" },
          { path: "/authentication/create-password/create-cover", type: "link", active: false, selected: false, title: "Cover" },
        ],
      },
      {
        title: "Lock Screen", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/authentication/lock-screen/lock-basic", type: "link", active: false, selected: false, dirchange: false, title: "Basic" },
          { path: "/authentication/lock-screen/lock-cover", type: "link", active: false, selected: false, title: "Cover" },
        ],
      },
      {
        title: "Reset Password", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/authentication/reset-password/reset-basic", type: "link", active: false, selected: false, dirchange: false, title: "Basic" },
          { path: "/authentication/reset-password/reset-cover", type: "link", active: false, selected: false, dirchange: false, title: "Cover" },
        ],
      },
      {
        title: "Sign Up", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/authentication/sign-up/sign-up-basic", type: "link", active: false, selected: false, dirchange: false, title: "Basic" },
          { path: "/authentication/sign-up/sign-up-cover", type: "link", active: false, selected: false, dirchange: false, title: "Cover" },
        ],
      },
      {
        title: "Sign In", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/authentication/sign-in/sign-in-basic", type: "link", active: false, selected: false, dirchange: false, title: "Basic" },
          { path: "/authentication/sign-in/sign-in-cover", type: "link", active: false, selected: false, dirchange: false, title: "Cover" },
        ],
      },
      {
        title: "Two Step Verification", type: "sub", active: false, selected: false, dirchange: false, children: [
          { path: "/authentication/two-step-verification/two-step-basic", type: "link", active: false, selected: false, dirchange: false, title: "Basic" },
          { path: "/authentication/two-step-verification/two-step-cover", type: "link", active: false, selected: false, dirchange: false, title: "Cover" },
        ],
      },
      { path: "/authentication/under-maintenance", type: "link", active: false, selected: false, dirchange: false, title: "Under Maintainance" },
    ]
  },
  {
    icon: Erroricon, title: "Error", type: "sub", active: false, selected: false, dirchange: false, children: [

      { path: "/authentication/error/401-error", type: "link", active: false, selected: false, dirchange: false, title: "401-Error" },
      { path: "/authentication/error/404-error", type: "link", active: false, selected: false, dirchange: false, title: "404-Error" },
      { path: "/authentication/error/500-error", type: "link", active: false, selected: false, dirchange: false, title: "500-Error" },
    ]
  },
  {
    icon: Pagesicon, title: "Pages", type: "sub", active: false, dirchange: false, children: [
      {
        title: "Blog", type: "sub", active: false, dirchange: false, children: [
          { path: "/pages/blog/blog", type: "link", active: false, selected: false, dirchange: false, title: "Blog" },
          { path: "/pages/blog/blog-details", type: "link", active: false, selected: false, dirchange: false, title: "Blog Details" },
          { path: "/pages/blog/create-blog", type: "link", active: false, selected: false, dirchange: false, title: "Create Blog" },
        ]
      },
      { path: "/pages/chat", type: "link", active: false, selected: false, dirchange: false, title: "Chat" },
      {
        title: "Email", type: "sub", active: false, children: [
          { path: "/pages/email/mail-app", type: "link", active: false, selected: false, dirchange: false, title: "Mail-App" },
          { path: "/pages/email/mail-settings", type: "link", active: false, selected: false, dirchange: false, title: "Mail-Settings" },
        ]
      },
      { path: "/pages/empty", type: "link", active: false, selected: false, dirchange: false, title: "Empty", },
      { path: "/pages/faqs", type: "link", active: false, selected: false, dirchange: false, title: "FAQ's" },
      { path: "/pages/file-manager", type: "link", active: false, selected: false, dirchange: false, title: "File Manager" },

      {
        title: "Invoice", type: "sub", menusub: true, active: false, selected: false, dirchange: false, children: [
          { path: "/pages/invoice/create-invoice", type: "link", active: false, selected: false, dirchange: false, title: "Create Invoice" },
          { path: "/pages/invoice/invoice-details", type: "link", active: false, selected: false, dirchange: false, title: "Invoice Details" },
          { path: "/pages/invoice/invoice-list", type: "link", active: false, selected: false, dirchange: false, title: "Invoice List" },
        ],
      },
      { path: "/landing", type: "link", active: false, selected: false, dirchange: false, title: "Landing Page" },
      { path: "/pages/pricing", type: "link", active: false, selected: false, dirchange: false, title: "Pricing" },
      { path: "/pages/profile", type: "link", active: false, selected: false, dirchange: false, title: "Profile" },
      { path: "/pages/profile-settings", type: "link", active: false, selected: false, dirchange: false, title: "Profile Settings" },
      { path: "/pages/reviews", type: "link", active: false, selected: false, dirchange: false, title: "Reviews" },
      { path: "/pages/search", type: "link", active: false, selected: false, dirchange: false, title: "Search" },
      { path: "/pages/team", type: "link", active: false, selected: false, dirchange: false, title: "Team", },
      { path: "/pages/terms-conditions", type: "link", active: false, selected: false, dirchange: false, title: "Terms & Conditions" },
      { path: "/pages/timeline", type: "link", active: false, selected: false, dirchange: false, title: "Timeline" },
      { path: "/pages/todolist", type: "link", active: false, selected: false, dirchange: false, title: "To Do List" },

    ]
  },
  {
    menutitle: "General"
  },
  {
    title: "Forms", icon: Formsicon, type: "sub", active: false, selected: false, dirchange: false, children: [

      { path: "/forms/form-advanced", type: "link", active: false, selected: false, dirchange: false, title: "Form Advanced" },

      {
        title: "Form Elements", type: "sub", menusub: true, active: false, selected: false, dirchange: false, children: [
          { path: "/forms/form-elements/inputs", type: "link", active: false, selected: false, dirchange: false, title: "Inputs" },
          { path: "/forms/form-elements/checks-radios", type: "link", active: false, selected: false, dirchange: false, title: "Checks & Radios " },
          { path: "/forms/form-elements/input-group", type: "link", active: false, selected: false, dirchange: false, title: "Input Group" },
          { path: "/forms/form-elements/form-select", type: "link", active: false, selected: false, dirchange: false, title: "Form Select" },
          { path: "/forms/form-elements/range-slider", type: "link", active: false, selected: false, dirchange: false, title: "Range Slider" },
          { path: "/forms/form-elements/input-masks", type: "link", active: false, selected: false, dirchange: false, title: "Input Masks" },
          { path: "/forms/form-elements/file-uploads", type: "link", active: false, selected: false, dirchange: false, title: "File Uploads" },
          { path: "/forms/form-elements/date-time-picker", type: "link", active: false, selected: false, dirchange: false, title: "Date,Time Picker" },
          { path: "/forms/form-elements/color-picker", type: "link", active: false, selected: false, dirchange: false, title: "Color Pickers" },

        ],
      },
      { path: "/forms/floating-labels", type: "link", active: false, selected: false, dirchange: false, title: "Floating Labels" },
      { path: "/forms/form-layouts", type: "link", active: false, selected: false, dirchange: false, title: "Form Layouts" },
      { path: "/forms/form-wizards", type: "link", active: false, selected: false, dirchange: false, title: "Form Wizards" },
      { path: "/forms/sun-editor", type: "link", active: false, selected: false, dirchange: false, title: "Sun Editor" },
      { path: "/forms/validation", type: "link", active: false, selected: false, dirchange: false, title: "Validation" },
      { path: "/forms/select2", type: "link", active: false, selected: false, dirchange: false, title: "React-Select" },
    ],
  },
  {
    title: "Ui Elements", icon: Elementsicon, type: "sub", active: false, selected: false, dirchange: false, children: [
      { path: "/ui-elements/alerts", type: "link", active: false, selected: false, dirchange: false, title: "Alerts" },
      { path: "/ui-elements/badge", type: "link", active: false, selected: false, dirchange: false, title: "Badge" },
      { path: "/ui-elements/breadcrumb", type: "link", active: false, selected: false, dirchange: false, title: "Breadcrumb" },
      { path: "/ui-elements/buttons", type: "link", active: false, selected: false, dirchange: false, title: "Buttons" },
      { path: "/ui-elements/button-group", type: "link", active: false, selected: false, dirchange: false, title: "Button Group" },
      { path: "/ui-elements/cards", type: "link", active: false, selected: false, dirchange: false, title: "Cards" },
      { path: "/ui-elements/dropdowns", type: "link", active: false, selected: false, dirchange: false, title: "Dropdowns" },
      { path: "/ui-elements/images-figures", type: "link", active: false, selected: false, dirchange: false, title: "Images & Figures" },
      { path: "/ui-elements/links-interactions", type: "link", active: false, selected: false, dirchange: false, title: "Link & Interactions" },
      { path: "/ui-elements/list-group", type: "link", active: false, selected: false, dirchange: false, title: "List Group" },
      { path: "/ui-elements/navs-tabs", type: "link", active: false, selected: false, dirchange: false, title: "Navs & Tabs" },
      { path: "/ui-elements/object-fit", type: "link", active: false, selected: false, dirchange: false, title: "Object Fit" },
      { path: "/ui-elements/pagination", type: "link", active: false, selected: false, dirchange: false, title: "Pagination" },
      { path: "/ui-elements/popovers", type: "link", active: false, selected: false, dirchange: false, title: "Popovers" },
      { path: "/ui-elements/progress", type: "link", active: false, selected: false, dirchange: false, title: "Progress" },
      { path: "/ui-elements/spinners", type: "link", active: false, selected: false, dirchange: false, title: "Spinners" },
      { path: "/ui-elements/toasts", type: "link", active: false, selected: false, dirchange: false, title: "Toasts" },
      { path: "/ui-elements/tooltips", type: "link", active: false, selected: false, dirchange: false, title: "Tooltips" },
      { path: "/ui-elements/typography", type: "link", active: false, selected: false, dirchange: false, title: "Typography" },
    ],
  },
  {
    title: "Advanced Ui", icon: Advanceuiicon, type: "sub", active: false, selected: false, dirchange: false, children: [
      { path: "/advanced-ui/accordions-collapse", type: "link", active: false, selected: false, dirchange: false, title: "Accordions & collapse" },
      { path: "/advanced-ui/carousel", type: "link", active: false, selected: false, dirchange: false, title: "Carousel" },
      { path: "/advanced-ui/draggable-cards", type: "link", active: false, selected: false, dirchange: false, title: "Draggable Cards" },
      { path: "/advanced-ui/media-player", type: "link", active: false, selected: false, dirchange: false, title: "Media Player" },
      { path: "/advanced-ui/modals-closes", type: "link", active: false, selected: false, dirchange: false, title: "Modals & Closes" },
      { path: "/advanced-ui/navbar", type: "link", active: false, selected: false, dirchange: false, title: "Navbar" },
      { path: "/advanced-ui/offcanvas", type: "link", active: false, selected: false, dirchange: false, title: "Offcanvas" },
      { path: "/advanced-ui/placeholders", type: "link", active: false, selected: false, dirchange: false, title: "Placeholders" },
      { path: "/advanced-ui/ratings", type: "link", active: false, selected: false, dirchange: false, title: "Ratings" },
      { path: "/advanced-ui/ribbons", type: "link", active: false, selected: false, dirchange: false, title: "Ribbons" },
      { path: "/advanced-ui/sortable-js", type: "link", active: false, selected: false, dirchange: false, title: "Sortable Js" },
      { path: "/advanced-ui/swiper-js", type: "link", active: false, selected: false, dirchange: false, title: "Swiper JS" },
      { path: "/advanced-ui/tour", type: "link", active: false, selected: false, dirchange: false, title: "Tour" },
    ],
  },
  {
    title: "Utilities", icon: Utilitiesicon, type: "sub", active: false, selected: false, dirchange: false, children: [
      { path: "/utilities/avatars", type: "link", active: false, selected: false, dirchange: false, title: "Avatars" },
      { path: "/utilities/borders", type: "link", active: false, selected: false, dirchange: false, title: "Borders" },
      { path: "/utilities/breakpoints", type: "link", active: false, selected: false, dirchange: false, title: "Breakpoints" },
      { path: "/utilities/colors", type: "link", active: false, selected: false, dirchange: false, title: "Colors" },
      { path: "/utilities/columns", type: "link", active: false, selected: false, dirchange: false, title: "Columns" },
      { path: "/utilities/css-grid", type: "link", active: false, selected: false, dirchange: false, title: "Css Grid" },
      { path: "/utilities/flex", type: "link", active: false, selected: false, dirchange: false, title: "Flex" },
      { path: "/utilities/gutters", type: "link", active: false, selected: false, dirchange: false, title: "Gutters" },
      { path: "/utilities/helpers", type: "link", active: false, selected: false, dirchange: false, title: "Helpers" },
      { path: "/utilities/position", type: "link", active: false, selected: false, dirchange: false, title: "Position" },
      { path: "/utilities/additional-content", type: "link", active: false, selected: false, dirchange: false, title: "Additional Content" },

    ],
  },
  { path: "/widgets", title: "widgets", icon: Widgetsicon, type: "link", active: false, dirchange: false, selected: false },
  {
    menutitle: "Tables & Charts"
  },
  {
    title: "Charts", icon: Chartsicon, type: "sub", dirchange: false, children: [
      {
        title: "Apex Charts", type: "sub", menusub: true, active: false, selected: false, dirchange: false, children: [

          { path: "/charts/apex-charts/line-chart", type: "link", active: false, selected: false, dirchange: false, title: "Line Charts" },
          { path: "/charts/apex-charts/area-chart", type: "link", active: false, selected: false, dirchange: false, title: "Area Charts " },
          { path: "/charts/apex-charts/column-chart", type: "link", active: false, selected: false, dirchange: false, title: "Column Charts" },
          { path: "/charts/apex-charts/bar-chart", type: "link", active: false, selected: false, dirchange: false, title: "Bar Charts" },
          { path: "/charts/apex-charts/mixed-chart", type: "link", active: false, selected: false, dirchange: false, title: "Mixed Charts" },
          { path: "/charts/apex-charts/range-area-chart", type: "link", active: false, selected: false, dirchange: false, title: "Range Area Charts" },
          { path: "/charts/apex-charts/timeline-chart", type: "link", active: false, selected: false, dirchange: false, title: "Timeline Charts" },
          { path: "/charts/apex-charts/funnel-chart", type: "link", active: false, selected: false, dirchange: false, title: "Funnel Charts" },
          { path: "/charts/apex-charts/candlestick-chart", type: "link", active: false, selected: false, dirchange: false, title: "CandleStick Charts" },
          { path: "/charts/apex-charts/boxplot-chart", type: "link", active: false, selected: false, dirchange: false, title: "Boxplot Charts" },
          { path: "/charts/apex-charts/bubble-chart", type: "link", active: false, selected: false, dirchange: false, title: "Bubble Charts" },
          { path: "/charts/apex-charts/scatter-chart", type: "link", active: false, selected: false, dirchange: false, title: "Scatter Charts" },
          { path: "/charts/apex-charts/heatmap-chart", type: "link", active: false, selected: false, dirchange: false, title: "Heatmap Charts" },
          { path: "/charts/apex-charts/treemap-chart", type: "link", active: false, selected: false, dirchange: false, title: "Treemap Charts" },
          { path: "/charts/apex-charts/pie-chart", type: "link", active: false, selected: false, dirchange: false, title: "Pie Charts" },
          { path: "/charts/apex-charts/radialbar-chart", type: "link", active: false, selected: false, dirchange: false, title: "Radialbar Charts" },
          { path: "/charts/apex-charts/radar-chart", type: "link", active: false, selected: false, dirchange: false, title: "Radar Charts" },
          { path: "/charts/apex-charts/polararea-chart", type: "link", active: false, selected: false, dirchange: false, title: "Polararea Charts" },
          { path: "/charts/apex-charts/slope-chart", type: "link", active: false, selected: false, dirchange: false, title: "Slope Charts" },
        ],
      },
      { path: "/charts/chartjs-charts", type: "link", active: false, selected: false, dirchange: false, title: "Chartjs Charts" },
      { path: "/charts/echart-charts", type: "link", active: false, selected: false, dirchange: false, title: "Echart Charts" },
    ],
  },
  {
    title: "Tables", icon: Tableicon, type: "sub", menutitle: "", active: false, selected: false, dirchange: false, children: [
      { path: "/tables/tables", type: "link", active: false, selected: false, dirchange: false, title: "Tables" },
      { path: "/tables/grid-js-tables", type: "link", active: false, selected: false, dirchange: false, title: "Grid JS Tables" },
      { path: "/tables/data-tables", type: "link", active: false, selected: false, dirchange: false, title: "Data Tables" },
    ],
  },
  {
    menutitle: "Maps & Icons"
  },
  {
    title: "Maps", icon: Mapsicon, type: "sub", background: "hor-rightangle", active: false, selected: false, dirchange: false, children: [
      { path: "/maps/leaflet-maps", type: "link", active: false, selected: false, dirchange: false, title: "Leaflet Maps" },
      { path: "/maps/pigeon-maps", type: "link", active: false, selected: false, dirchange: false, title: "Pigeon Maps" },

    ],
  },
  { path: "/icons", icon: Icons, type: "link", active: false, selected: false, dirchange: false, title: "Icons" },
]