"use client";

import SecurityDashboardWidget from '@/shared/@spk-reusable-components/reusable-dashboard/security-dashboard-widget';
import Seo from '@/shared/layouts-components/seo/seo';
import React, { Fragment } from 'react';

export default function Analytics() {
  return (
    <Fragment>
      <Seo title="Dashboards Analytics" />
      <div className="analytics-page-full-dashboard" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem' }}>
        <div className="analytics-security-dashboard-wrapper">
          <SecurityDashboardWidget />
        </div>
      </div>
    </Fragment>
  );
}
