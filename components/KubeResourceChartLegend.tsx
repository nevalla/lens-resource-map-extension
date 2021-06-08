import "./KubeResourceChartLegend.scss"
import React from "react";
import { KubeForceChart } from "./KubeForceChart"
import { observer } from "mobx-react";

interface Props {
  iconSize?: number;
}

export class KubeResourceChartLegend extends React.Component<Props> {
  static defaultProps: Props = {
    iconSize: 32,
  };

  render() {
    const { iconSize } = this.props;
    return (
      <div className="KubeResourceChartLegend flex column">
        <p className="title">Legend:</p>
        {Object.entries(KubeForceChart.config).map(([kind, configItem]) => {
          const resource = kind;
          const style = { "--color": configItem.color } as React.CSSProperties;
          return (
            <div key={kind} className="resource flex gaps align-center" style={style}>
              <img className="resource-icon" src={configItem.icon} width={iconSize} height={iconSize} alt={kind}/>
              <span className="resource-kind">{resource}</span>
            </div>
          )
        })}
      </div>
    );
  }
}
