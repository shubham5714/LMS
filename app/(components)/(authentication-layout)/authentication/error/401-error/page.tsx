"use client"
import Link from "next/link";
import React, { Fragment } from "react";
import { Col, Container, Row } from "react-bootstrap";

interface Error401Props { }

const Error401: React.FC<Error401Props> = () => {
    return (
        <Fragment>
            <div className="page error-bg">
                {/* <!-- Start::error-page --> */}
                <div className="error-page">
                    <Container className="">
                        <div className="my-auto">
                            <Row className=" align-items-center justify-content-center h-100 text-center">
                                <Col xl={7} lg={5} md={6} className=" col-12">
                                    <div className="error-text mb-4 text-fixed-white">401</div>
                                    <p className="fs-4 fw-normal mb-2 text-fixed-white">Unauthorized Access</p>
                                    <p className="fs-16 mb-5 text-fixed-white">You don't have permission to view this page. Please log in or contact support.</p>
                                    <Link scroll={false} href="/dashboard/" className="btn btn-primary"><i className="ri-arrow-left-line align-middle me-1 d-inline-block"></i> BACK TO HOME PAGE</Link>
                                </Col>
                            </Row>
                        </div>
                    </Container>
                </div>
            </div>
        </Fragment>
    );
};

export default Error401;