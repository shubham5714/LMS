"use client";

import React, { Fragment, useState } from "react";
import { Card, Col, Form, Row } from "react-bootstrap";
import Link from "next/link";
import Seo from "@/shared/layouts-components/seo/seo";
import SpkTables from "@/shared/@spk-reusable-components/reusable-tables/spk-tables";
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";

const DatasetsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Fragment>
      <Seo title="Datasets" />

      <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
        <Col xl={12}>
          <Card className="custom-card" style={{ marginBottom: 0 }}>
            <Card.Header className="justify-content-between">
              <Card.Title>Datasets</Card.Title>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <Link scroll={false} href="#!" className="btn btn-primary">
                  <i className="ri-add-line me-1 fw-medium align-middle"></i>
                  New Dataset
                </Link>
                <div className="d-flex" role="search">
                  <Form.Control
                    className="me-2"
                    type="search"
                    placeholder="Search Dataset"
                    aria-label="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <SpkButton Buttonvariant="light" Customclass="btn" Buttontype="button">
                    Search
                  </SpkButton>
                </div>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      <Row className="g-0" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem" }}>
        <Col xl={12}>
          <Card className="custom-card overflow-hidden" style={{ marginBottom: 0 }}>
            <Card.Body className="p-0" style={{ minHeight: "90vh" }}>
              <div className="table-responsive" style={{ minHeight: "90vh" }}>
                <SpkTables
                  tableClass="table text-nowrap"
                  header={[
                    { title: "Dataset Name" },
                    { title: "Description" },
                    { title: "Tenant ID" },
                    { title: "Tool" },
                    { title: "Created At" },
                    { title: "Actions" },
                  ]}
                >
                  <tr>
                    <td className="text-center" colSpan={6}>
                      No data found
                    </td>
                  </tr>
                </SpkTables>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default DatasetsPage;

