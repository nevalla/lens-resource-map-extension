import "./KubeResourceMap.scss"
import * as React from "react";
import { KubeResourceChart } from "./KubeResourceChart"

export class KubeResourceMap extends React.Component {
  render() {
    return (
      <div className="KubeResourceMap">
        <h1>Resource Map</h1>
        <br/>
        <KubeResourceChart/>
      </div>
    );
  }
}
