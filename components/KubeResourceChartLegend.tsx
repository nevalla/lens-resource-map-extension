import "./KubeResourceChartLegend.scss"
import React from "react";
import { KubeResourceChart } from "./KubeResourceChart"
import { observer } from "mobx-react";

interface Props {
  iconSize?: number;
}

@observer
export class KubeResourceChartLegend extends React.Component<Props> {
  static defaultProps: Props = {
    iconSize: 32,
  };

  render() {
    const { iconSize } = this.props;
    return (
      <div className="KubeResourceChartLegend flex column">
        <p className="title">Legend:</p>
        {Object.entries(KubeResourceChart.icons).map(([kind, iconSrc]) => {
          const resource = kind[0].toUpperCase() + kind.substr(1);
          const color = KubeResourceChart.colors[kind as "pod"];
          const style = { "--color": color } as React.CSSProperties;
          return (
            <div key={kind} className="resource flex gaps align-center" style={style}>
              <img className="resource-icon" src={iconSrc} width={iconSize} height={iconSize} alt={kind}/>
              <span className="resource-kind">{resource}</span>
            </div>
          )
        })}
      </div>
    );
  }
}
