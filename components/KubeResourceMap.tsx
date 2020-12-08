import "./KubeResourceMap.scss"
import * as React from "react";
import { Component } from "@k8slens/extensions";

// TODO: add chart wrapper
// https://www.amcharts.com/docs/v4/chart-types/force-directed/

export class KubeResourceMapPage extends React.Component {
  render(): React.ReactNode {
    return (
      <div className="KubeResourceMapPage">
        <Component.TabLayout>
          <div>
            <h1>Resource Map</h1>
            <br/>
            <p>A very long paragraph</p>
          </div>
        </Component.TabLayout>
      </div>
    );
  }
}
