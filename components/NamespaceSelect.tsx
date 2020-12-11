// TODO: re-export to extensions-api & re-use <NamespaceSelect/>

import "./NamespaceSelect.scss";
import * as React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { Component, K8sApi, Util } from "@k8slens/extensions";

const namespaceStore = K8sApi.apiManager.getStore(K8sApi.namespacesApi) as K8sApi.NamespaceStore;

export const selectedNamespaces = observable.set(namespaceStore.contextNs);

interface Props {
  className?: string;
  placeholder?: string;
  onSelect?(namespace: string): void;
}

@observer
export class NamespaceSelect extends React.Component<Props> {
  async componentDidMount() {
    await namespaceStore.loadAll();
  }

  formatOptionLabel = ({ value }: Component.SelectOption) => {
    const isSelected = selectedNamespaces.has(value);
    return (
      <div className="NamespaceSelectOption flex gaps">
        <Component.Icon small material="layers"/>
        <span>{value}</span>
        {isSelected && <Component.Icon small material="check" className="box right"/>}
      </div>
    );
  };

  toggleNamespace = (namespace: string) => {
    if (selectedNamespaces.has(namespace)) {
      selectedNamespaces.delete(namespace)
    } else {
      selectedNamespaces.add(namespace);
    }
  }

  protected onSelect(namespace: string) {
    if (this.props.onSelect) {
      this.props.onSelect(namespace);
    }
    this.toggleNamespace(namespace);
  }

  render() {
    const { className, placeholder = "Namespaces" } = this.props;
    const Select = Component.Select as React.ComponentType<any>;
    return (
      <Select
        placeholder={placeholder}
        className={Util.cssNames("NamespaceSelect", className)}
        formatOptionLabel={this.formatOptionLabel}
        closeMenuOnSelect={false}
        controlShouldRenderValue={false}
        options={namespaceStore.items.map(ns => ({ value: ns.getName() }))}
        onChange={({ value }: Component.SelectOption) => this.onSelect(value)}
      />
    );
  }
}
