"use client"
import SpkSalesCard from "@/shared/@spk-reusable-components/reusable-dashboard/spk-sales";
import Spkapexcharts from "@/shared/@spk-reusable-components/reusable-plugins/spk-apexcharts";
import SpkTables from "@/shared/@spk-reusable-components/reusable-tables/spk-tables";
import SpkBadge from "@/shared/@spk-reusable-components/reusable-uiElements/spk-badge";
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";
import SpkDropdown from "@/shared/@spk-reusable-components/reusable-uiElements/spk-dropdown";
import { CountrySales, notifications, OrdersOverview, OverviewProgress, RecentOrders, RecentOrdersType, RecentTransactions, SalesStatisticsOptions, SalesStatisticsSeries, SelesCardData, TopCustomers, VisitorsByDevice, VisitorsByDeviceOptions, VisitorsByDeviceSeries } from "@/shared/data/dashboards/salesdata";
import Seo from "@/shared/layouts-components/seo/seo";
import Image from "next/image";
import Link from "next/link";
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Card, Col, Dropdown, Form, ListGroup, ProgressBar, Row } from "react-bootstrap";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { useRouter } from "next/navigation";
import { useTenantContext } from "@/shared/contextapi/TenantContext";
import { useUserContext } from "@/shared/contextapi/UserContext";
import { useDateRangeContext } from "@/shared/contextapi/DateRangeContext";
import RouteProtection from "@/shared/components/RouteProtection";

interface SalesProps { }

const SalesInner: React.FC = () => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Use tenant context
    const { assignedTenants, selectedTenantIds, isLoading: tenantLoading } = useTenantContext();
    
    // Use user context
    const { userData, isLoading: userLoading } = useUserContext();
    
    // Use date range context
    const { dateRange, isLoading: dateRangeLoading } = useDateRangeContext();

    // State for dashboard functionality
    const [state, setState] = useState(() => {
        return {
            checkedItems: RecentOrders.reduce((acc, item) => {
                acc[item.id] = item.checked || false;
                return acc;
            }, {} as { [key: number]: boolean }),
            isAllChecked: RecentOrders.every((item) => item.checked),
            searchTerm: ''
        };
    });

    // Fetch total alerts count from tickets respecting tenant selection and date range
    const { data: totalAlertsCount } = useQuery({
        queryKey: ["total-alerts-count", selectedTenantIds, dateRange],
        queryFn: async () => {
            // Resolve tenant filter: 'all' means use all assigned tenants
            let tenantFilter: string[] | null = null;
            
            if (selectedTenantIds === 'all') {
                tenantFilter = assignedTenants.map(t => t.id);
            } else if (typeof selectedTenantIds === 'string') {
                tenantFilter = [selectedTenantIds];
            } else {
                tenantFilter = selectedTenantIds;
            }

            let query = supabase.from('tickets').select('*', { count: 'exact', head: true });
            if (tenantFilter && tenantFilter.length > 0) {
                query = query.in('tenant_id', tenantFilter as string[]);
            }
            
            // Add date range filter if dates are available
            if (dateRange && dateRange[0] && dateRange[1]) {
                query = query.gte('created_at', dateRange[0].toISOString()).lte('created_at', dateRange[1].toISOString());
            }
            
            const { count, error } = await query;
            if (error) throw error;
            return count ?? 0;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        enabled: isAuthenticated // Only run query when authenticated
    });

    // Memoized cards data
    const cards = useMemo(() => {
        const cloned = [...SelesCardData];
        if (cloned.length > 0 && typeof totalAlertsCount === 'number') {
            cloned[0] = { ...cloned[0], title: totalAlertsCount.toString() };
        }
        return cloned;
    }, [totalAlertsCount]);


    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    router.push('/signin');
                    return;
                }
                setIsAuthenticated(true);
            } catch (error) {
                router.push('/signin');
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [router, supabase.auth]);

    // Show loading or redirect if not authenticated or contexts are loading
    if (isLoading || tenantLoading || userLoading || dateRangeLoading) {
        return (
            <Fragment>
                <Seo title="Dashboard" />
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="fs-5 fw-medium text-primary">Loading Dashboard...</div>
                        <div className="fs-6 text-muted mt-2">Preparing your data</div>
                    </div>
                </div>
            </Fragment>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    // Tenant selection is now handled globally in header


    const handleSelectAllChange = () => {
        const newChecked = !state.isAllChecked;
        const updatedCheckedItems = Object.fromEntries(
            RecentOrders.map((item) => [item.id, newChecked])
        );

        setState(prev => ({
            ...prev,
            isAllChecked: newChecked,
            checkedItems: updatedCheckedItems
        }));
    };

    const handleCheckboxChange = (id: number) => {
        setState(prev => {
            const updated = { ...prev.checkedItems, [id]: !prev.checkedItems[id] };
            const allChecked = Object.values(updated).every(Boolean);
            return {
                ...prev,
                checkedItems: updated,
                isAllChecked: allChecked
            };
        });
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(prev => ({
            ...prev,
            searchTerm: e.target.value
        }));
    };

    const Recentorders: RecentOrdersType[] = RecentOrders.filter(project =>
        project.category.toLowerCase().includes(state.searchTerm.toLowerCase())
    );

    return (
        <RouteProtection>
            <Fragment>
                <Seo title="Dashboard" />
                {/*<!-- Start::page-header -->*/}
                <div className="d-flex align-items-center justify-content-between my-4 page-header-breadcrumb flex-wrap gap-2">
                    <div>
                        <p className="fw-medium fs-20 mb-0">
                            Hey, {userData?.username || 'User'} &#128075;
                        </p>
                        <p className="fs-13 text-muted mb-0">Manage alerts with AI Insights.</p>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="d-flex align-items-center gap-2">
                            <SpkButton Buttonvariant="primary" Customclass="btn btn-wave border-0"> <i className="ri-filter-3-fill me-2 lh-1 align-middle"></i>Filter </SpkButton>
                        </div>
                    </div>
                </div>
                {/*<!-- End::page-header -->*/}

            {/*<!-- Start:: row-1 -->*/}
            <Row>
                <Col xxl={9}>
                    <Row>
                        <Col xxl={5} >
                            <Row>
                                {cards.map((idx) => (
                                    <Col xl={6} key={idx.id}>
                                        <SpkSalesCard card={idx} />
                                    </Col>
                                ))}
                                <Col xl={12}>
                                    <Card className="custom-card overflow-hidden">
                                        <Card.Header className="justify-content-between">
                                            <Card.Title>Orders Overview</Card.Title>
                                            <Link scroll={false} href="#!" className="fs-13 text-muted"> View All<i className="ti ti-arrow-narrow-right ms-1"></i> </Link>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <div className="px-4 py-3 border-bottom">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <h5 className="mb-0">1,45,876</h5>
                                                        <span className="d-block fs-12 text-muted">Orders</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="text-orange fw-medium d-block">+0.125%</span>
                                                        <span className="fs-11 text-muted mb-0">This Month</span>
                                                    </div>
                                                </div>
                                                <ProgressBar className="progress-stacked progress-animate bg-transparent progress-sm mt-2 mb-1">
                                                    {OverviewProgress.map((idx) => (
                                                        <ProgressBar className={`progress-bar-striped bg-${idx.color}`} role="progressbar" key={idx.id}
                                                            style={{ width: `${idx.value}%` }} aria-valuenow={idx.value} aria-valuemin={0} aria-valuemax={100}>
                                                        </ProgressBar>
                                                    ))}
                                                </ProgressBar>
                                            </div>
                                            <div className="table-responsive custom-table-padding">
                                                <SpkTables tableClass="table text-nowrap">
                                                    {OrdersOverview.map((idx) => (
                                                        <tr key={idx.id} className="mt-3">
                                                            <td className={idx.tdClass}>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="lh-1">
                                                                        <span className={`avatar avatar-md border border-${idx.bgClass} border-opacity-25 avatar-rounded`}>
                                                                            <span
                                                                                className={`avatar avatar-sm bg-${idx.bgClass}-transparent  avatar-rounded`}>
                                                                                <i className={`ri-${idx.icon} fs-20`}></i>
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                    <div> <span className="fw-medium d-block">{idx.status}</span> <span className="d-block text-muted fs-12">{idx.orders}</span> </div>
                                                                </div>
                                                            </td>
                                                            <td className={idx.tdClass}>
                                                                <SpkBadge variant={`${idx.arrow === 'up' ? 'success' : 'danger'}-transparent`} Customclass={`text-${idx.arrow === 'up' ? 'success' : 'danger'} fw-medium`}><i className={`ri-arrow-${idx.arrow}-line`}></i>{idx.change}</SpkBadge>
                                                            </td>
                                                            <td className={`text-end ${idx.tdClass}`}>
                                                                <div>
                                                                    <span className="d-block fw-medium mb-0">{idx.amount}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </SpkTables>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                        <Col xxl={7}>
                            <Row>
                                <Col xl={12}>
                                    <Card className="custom-card">
                                        <Card.Header>
                                            <Card.Title>
                                                Sales Statistics
                                            </Card.Title>
                                        </Card.Header>
                                        <Card.Body className="px-0 px-sm-3">
                                            <div id="sales-statistics">
                                                <Spkapexcharts chartOptions={SalesStatisticsOptions} chartSeries={SalesStatisticsSeries} type="bar" width={'100%'} height={300} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xl={6}>
                                    <Card className="custom-card">
                                        <Card.Header>
                                            <Card.Title>
                                                Top Customers
                                            </Card.Title>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <ListGroup className="list-group-flush custom-list">
                                                {TopCustomers.map((idx) => (
                                                    <ListGroup.Item key={idx.id}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="lh-1">
                                                                <span className="avatar avatar-md avatar-rounded custom-width">
                                                                    <Image fill src={idx.avatar} alt="" className="" />
                                                                </span>
                                                            </div>
                                                            <div className="flex-fill">
                                                                <span className="d-block fw-medium">{idx.name}</span>
                                                                <span className="fs-12 text-muted">{idx.country}</span>
                                                            </div>
                                                            <div className="fw-medium">{idx.amount}</div>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xl={6}>
                                    <Card className="custom-card">
                                        <Card.Header>
                                            <Card.Title>
                                                Top Country Sales
                                            </Card.Title>
                                        </Card.Header>
                                        <Card.Body>
                                            <ul className="list-unstyled top-countries-list">
                                                {CountrySales.map((idx) => (
                                                    <li key={idx.id}>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="lh-1">
                                                                <span className="avatar avatar-sm avatar-rounded">
                                                                    <Image width={28} height={28} src={idx.flag} alt="" />
                                                                </span>
                                                            </div>
                                                            <div className="flex-fill d-flex align-items-end gap-3">
                                                                <div className="flex-fill">
                                                                    <span className="fw-medium d-block mb-1">{idx.name}</span>
                                                                    <div className="progress progress-animate progress-sm" role="progressbar" aria-valuenow={idx.progress} aria-valuemin={0} aria-valuemax={100}>
                                                                        <div className={`progress-bar progress-bar-striped progress-bar-animated bg-${idx.bgColor}`} style={{ width: `${idx.progress}%` }}> </div>
                                                                    </div>
                                                                </div>
                                                                <div className="fw-medium lh-1">{idx.progress}%</div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                        <Col xl={12}>
                            <Card className="custom-card">
                                <Card.Header className="justify-content-between">
                                    <Card.Title>
                                        Recent Orders
                                    </Card.Title>
                                    <div className="d-flex flex-wrap gap-2">
                                        <div>
                                            <Form.Control className="form-control-sm custom-control" type="text" placeholder="Search Here" aria-label=".form-control-sm example " value={state.searchTerm} onChange={handleSearch} />
                                        </div>
                                        <SpkDropdown toggleas='a' Customtoggleclass="btn btn-primary btn-sm btn-wave waves-effect waves-light no-caret" Toggletext="Sort By" Icon={true} IconClass="ri-arrow-down-s-line align-middle ms-1 d-inline-block">
                                            <li><Dropdown.Item className="dropdown-item" href="#!">New</Dropdown.Item></li>
                                            <li><Dropdown.Item className="dropdown-item" href="#!">Popular</Dropdown.Item></li>
                                            <li><Dropdown.Item className="dropdown-item" href="#!">Relevant</Dropdown.Item></li>
                                        </SpkDropdown>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="table-responsive">
                                        <SpkTables checked={state.isAllChecked} onChange={handleSelectAllChange} tableClass="table text-nowrap" showCheckbox={true} header={[{ title: 'Product' }, { title: 'Category' }, { title: 'Status' }, { title: 'Customer' }, { title: 'Qty' }, { title: 'Date Ordered' }, { title: 'Price' }, { title: 'Action' },]}>
                                            {Recentorders.length > 0 ? (
                                                Recentorders.map((idx) => (
                                                    <tr key={idx.id} className={idx.trclass}>
                                                        <td><input className="form-check-input" type="checkbox" id="checkboxNoLabeljob2" aria-label="..." checked={state.checkedItems[idx.id]} onChange={() => handleCheckboxChange(idx.id)} /></td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="lh-1">
                                                                    <span className="avatar avatar-md avatar-rounded custom-width">
                                                                        <Image fill src={idx.image} alt="" />
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <p className="fw-medium fs-13 mb-0 d-flex align-items-center"><Link scroll={false} href="#!">{idx.name}</Link></p>
                                                                    <p className="fs-12 text-muted mb-0">{idx.brand}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {idx.category}
                                                        </td>
                                                        <td><SpkBadge variant={`${idx.statusClass}-transparent`} Customclass="">{idx.status}</SpkBadge></td>
                                                        <td>
                                                            <span className="d-block fw-medium fs-13">{idx.customername}</span>
                                                            <span className="d-block text-muted fs-12 fw-normal">{idx.email}</span>
                                                        </td>
                                                        <td>
                                                            {idx.quantity}
                                                        </td>
                                                        <td>{idx.date}</td>
                                                        <td className="fw-medium">{idx.price}</td>
                                                        <td>
                                                            <div className="btn-list">
                                                                <SpkButton Buttonvariant="secondary-light" Customclass="btn btn-sm btn-icon btn-wave rounded-circle">
                                                                    <i className="ri-edit-line"></i>
                                                                </SpkButton>
                                                                <SpkButton Buttonvariant="primary-light" Customclass="btn btn-sm btn-icon  btn-wave rounded-circle">
                                                                    <i className="ri-eye-line"></i>
                                                                </SpkButton>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td className='text-center' colSpan={9}>No data found</td>
                                                </tr>
                                            )
                                            }


                                        </SpkTables>
                                    </div>
                                </Card.Body>
                                <Card.Footer>
                                    <div className="d-flex align-items-center">
                                        <div> Showing 5 Entries <i className="bi bi-arrow-right ms-2 fw-medium"></i> </div>
                                        <div className="ms-auto">
                                            <nav aria-label="Page navigation" className="pagination-style-4">
                                                <ul className="pagination mb-0">
                                                    <li className="page-item disabled"> <Link scroll={false} className="page-link" href="#!"> Prev </Link> </li>
                                                    <li className="page-item active"><Link scroll={false} className="page-link" href="#!">1</Link></li>
                                                    <li className="page-item"><Link scroll={false} className="page-link" href="#!">2</Link></li>
                                                    <li className="page-item"> <Link scroll={false} className="page-link text-primary" href="#!"> next </Link> </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    </Row>
                </Col>
                <Col xxl={3}>
                    <Row>
                        <Col xl={12}>
                            <div className="card custom-card oveflow-hidden">
                                <Card.Header>
                                    <Card.Title>
                                        Visitors By Device
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <div id="visitors-device">
                                        <Spkapexcharts chartOptions={VisitorsByDeviceOptions} chartSeries={VisitorsByDeviceSeries} type="donut" width={'100%'} height={230} />
                                    </div>
                                </Card.Body>
                                <Card.Footer>
                                    <Row className="gy-4">
                                        {VisitorsByDevice.map((idx) => (
                                            <div className="col-6" key={idx.id}>
                                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                                    <div className="lh-1">
                                                        <span className={`avatar avatar-rounded avatar-md bg-${idx.colorClass}-transparent`}>
                                                            {idx.icon}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="d-block fs-12 text-muted fw-medium">{idx.title}</span>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <h6 className="fw-medium mb-0">{idx.value}</h6>
                                                            <span className={`text-${idx.arrow === 'up' ? 'success' : 'danger'} fs-12 fw-medium`}><i className={`ti ti-arrow-narrow-${idx.arrow}`}></i>{idx.change}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </Row>
                                </Card.Footer>
                            </div>
                        </Col>
                        <Col xl={12}>
                            <Card className="custom-card">
                                <Card.Header>
                                    <Card.Title>
                                        Recent Activity
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ul className="list-unstyled recent-activity-sales-list">
                                        {notifications.map((idx) => (
                                            <li key={idx.id}>
                                                {idx.content}
                                                <span className="d-block text-muted fs-12">{idx.timestamp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={12}>
                            <Card className="custom-card overflow-hidden">
                                <Card.Header className="justify-content-between">
                                    <Card.Title>
                                        Recent Transactions
                                    </Card.Title>
                                    <Link scroll={false} href="#!" className="fs-12 text-muted"> View All<i className="ti ti-arrow-narrow-right ms-1"></i> </Link>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="table-responsive">
                                        <SpkTables tableClass="table text-nowrap" header={[{ title: 'Payment Mode' }, { title: 'Amount Paid', headerClassname: 'text-end' },]}>
                                            {RecentTransactions.map((idx) => (
                                                <tr key={idx.id}>
                                                    <td className={idx.tdClass}>
                                                        <div className="d-flex align-items-start gap-2">
                                                            <div>
                                                                <span className="avatar avatar-md p-2 border custom-width">
                                                                    <Image fill src={idx.logo} alt="" />
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="d-block fw-medium mb-1">{idx.name}</span>
                                                                <span className="d-block fs-11 text-muted">{idx.method}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={idx.tdClass}>
                                                        <div className="text-end">
                                                            <span className="d-block fw-medium mb-1">{idx.amount}</span>
                                                            <span className="d-block fs-11 text-muted">{idx.date}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </SpkTables>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
            {/*<!-- End:: row-1 -->*/}
            </Fragment>
        </RouteProtection>
    )
};

const Sales: React.FC<SalesProps> = () => {
    const queryClientRef = useRef<QueryClient | null>(null);
    if (!queryClientRef.current) {
        queryClientRef.current = new QueryClient();
    }
    return (
        <QueryClientProvider client={queryClientRef.current}>
            <SalesInner />
        </QueryClientProvider>
    );
};

export default Sales;