import { IFilterCriterion } from "@/app/typescript/interfaces/IFilterCriterion";

export const LeadsFilterCriteria: Record<string, IFilterCriterion> = {
  NeedsAttention: {
    name: "Needs Attention",
    criteria: { needs_attention: true, opted_out: false },
  },
  BOM: {
    name: "BOM",
    criteria: { bom_text: null, opted_out: true },
    isNegation: true,
  },
  BIT: {
    name: "BIT",
    criteria: { bit_text: null, opted_out: true },
    isNegation: true,
  },
  PT: {
    name: "PT",
    criteria: { pt_text: null, opted_out: true },
    isNegation: true,
  },
  WG: {
    name: "WG",
    criteria: { wg_text: null, opted_out: true },
    isNegation: true,
  },
  OptedOut: {
    name: "Not Interested",
    criteria: { opted_out: true },
  },
};
