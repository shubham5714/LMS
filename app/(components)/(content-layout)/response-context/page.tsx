"use client"
import React, { Fragment } from "react";
import dynamic from "next/dynamic";
import { Card, Col, Row } from "react-bootstrap";
import Seo from "@/shared/layouts-components/seo/seo";

const ResponseContextWizard = dynamic(
  () => import("@/shared/data/response-context/response-context-wizard"),
  { ssr: false }
);

const ResponseContext: React.FC = () => {
  return (
    <Fragment>
      <Seo title="Response Context" />

      <div className="container-fluid">
        {/* Header Section */}
        <Row>
          <Col xl={12}>
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem", marginBottom: 0 }}
            >
              <h5 className="mb-0">Response Context</h5>
            </div>
          </Col>
        </Row>

        {/* Form Wizard Section */}
        <Row>
          <Col xl={12}>
            <Card className="custom-card">
              <Card.Header>
                <div className="card-title">Form</div>
              </Card.Header>
              <div className="card-body p-0 form-wizard1 pt-3">
                <ResponseContextWizard />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Fragment>
  );
};

export default ResponseContext;

