export interface ILead {
  id: number;
  lead_name: string;
  lead_phone: string;
  bom_text: string | null;
  bom_date: string | null;
  bit_text: string | null;
  bit_date: string | null;
  pt_text: string | null;
  pt_date: string | null;
  wg_text: string | null;
  wg_date: string | null;
  opted_out: boolean;
  fu_bom_sent: boolean;
  fu_bom_confirmed: boolean;
  fu2_bom_sent: boolean;
  fu_bit_sent: boolean;
  fu2_bit_sent: boolean;
  created_at: string;
}
