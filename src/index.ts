import { getFeature, registerInjectablesFromModules } from "@k8slens/feature-core";
import modulesWithInjectables from "./**/*.injectable.(ts|tsx)";
import stylesheets from "./**/!(_*).(scss|css)";

export const kubeResourceMapFeature = getFeature({
  id: "kube-resource-map",
  register: (di) => registerInjectablesFromModules(di, [...modulesWithInjectables, ...stylesheets]),
});
