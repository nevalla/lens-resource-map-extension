// TODO: re-export to extensions-api & re-use <NamespaceSelect/>

import "./NamespaceSelect.scss";
import * as React from "react";
import { action, computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { Renderer, Common } from "@k8slens/extensions";

const namespaceStore: Renderer.K8sApi.NamespaceStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.namespacesApi) as Renderer.K8sApi.NamespaceStore;

export const selectedNamespaces = observable.set(namespaceStore.selectedNamespaces);

interface Props {
  className?: string;
  placeholder?: string;
  onSelect?(namespace: string): void;
}
@observer
export class NamespaceSelect extends React.Component<Props> {

  @computed.struct get options(): Renderer.Component.SelectOption[] {
    return namespaceStore.items.map(ns => ({ value: ns.getName() }));
  }

  constructor(props: {}) {
    super(props)
    makeObservable(this);
  }

  async componentDidMount() {
    //await namespaceStore.reloadAll();
  }

  @action
  toggleNamespace = (namespace: string) => {
    namespaceStore.toggleContext(namespace);
  }

  protected onSelect(namespace: string) {
    if (this.props.onSelect) {
      this.props.onSelect(namespace);
    }
    this.toggleNamespace(namespace);
  }

  render() {
    const { className } = this.props;
    return (
      <Renderer.Component.NamespaceSelectFilter
        className={Common.Util.cssNames("NamespaceSelect", className)}
      />
    );
  }
}
