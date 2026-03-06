"use client";

import SecurityDashboardWidget from '@/shared/@spk-reusable-components/reusable-dashboard/security-dashboard-widget';
import Seo from '@/shared/layouts-components/seo/seo';
import React, { Fragment } from 'react';

export default function Overview() {
  return (
    <Fragment>
      <Seo title="Dashboards Overview" />
      <div className="analytics-page-full-dashboard">
        <div className="analytics-security-dashboard-wrapper">
          <SecurityDashboardWidget />
        </div>
      </div>
    </Fragment>
  );
}
