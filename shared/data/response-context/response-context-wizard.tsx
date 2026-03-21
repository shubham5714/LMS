"use client"

import React from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import Swal from "sweetalert2";

interface ResponseContextWizardProps {}

/**
 * Blank (no prefilled) response context form.
 * Persistence/storage can be implemented later once the DB column is defined.
 */
export default function ResponseContextWizard(_props: ResponseContextWizardProps) {
  const [responseContext, setResponseContext] = React.useState("");

  const handleSave = () => {
    // UI-only placeholder to keep this page usable without requiring a DB schema change.
    Swal.fire({
      title: "Coming soon",
      text: "Response Context save is not wired to the database yet.",
      icon: "info",
    });
  };

  return (
    <Form>
      <Row>
        <Col md={12} className="mb-3">
          <Form.Group>
            <Form.Label>
              Response Context
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={responseContext}
              onChange={(e) => setResponseContext(e.target.value)}
              placeholder="Add guidance that the AI agent should follow when generating responses..."
            />
            <Form.Text className="text-muted">
              This form is intentionally blank (no prefilled values).
            </Form.Text>
          </Form.Group>
        </Col>

        <Col md={12}>
          <div className="d-flex justify-content-end">
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
  );
}

