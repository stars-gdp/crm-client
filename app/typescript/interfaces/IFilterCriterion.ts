import { ILead } from "@/app/typescript/interfaces/ILead";

export interface IFilterCriterion {
  name: string;
  criteria: Partial<ILead>;
  isNegation?: boolean;
}
