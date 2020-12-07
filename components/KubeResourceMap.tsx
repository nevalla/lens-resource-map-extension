import React from "react"
import { Component } from "@k8slens/extensions";

const { TabLayout } = Component;

class KubeResourceMapPage extends React.Component {
  render(): JSX.Element {
    return (
      <TabLayout>
        <div>
          <h1>Resource Map</h1>
          <br />
          <p>A very long paragraph</p>
        </div>
      </TabLayout>
    )
  }
}

export default KubeResourceMapPage
