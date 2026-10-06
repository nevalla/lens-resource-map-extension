import type { Relation } from "../types";
import { helmReleases } from "./helm-releases";
import { ingressBackends } from "./ingress-backends";
import { ownerReferences } from "./owner-references";
import { podReferences } from "./pod-references";
import { serviceSelector } from "./service-selector";

export const relations: readonly Relation[] = [ownerReferences, serviceSelector, ingressBackends, podReferences, helmReleases];
