"use client";

import Seo from "@/shared/layouts-components/seo/seo";
import React, { Fragment } from "react";

const CHART_URL = "https://go-view-six.vercel.app/#/chart/preview/2030314028500451330";

const Hrm: React.FC = () => {
  return (
    <Fragment>
      <Seo title="Dashboards HRM" />
      <div
        className="dashboards-hrm-embed w-100 overflow-hidden"
        style={{
          position: "relative",
          minHeight: "calc(100vh - 120px)",
          margin: "0 -12px", // offset container-fluid padding for full width
        }}
      >
        <iframe
          src={CHART_URL}
          title="HRM Chart"
          className="border-0 w-100 h-100"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            minHeight: "calc(100vh - 120px)",
          }}
          allowFullScreen
        />
      </div>
    </Fragment>
  );
};

export default Hrm;
