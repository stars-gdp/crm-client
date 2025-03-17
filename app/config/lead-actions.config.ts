import leadStore from "@/app/stores/leads.store";

const switchNeedsAttention = (phone: string) => {
  leadStore.switchAttention(phone);
};

export const LEAD_ACTIONS = [
  { name: "Switch needs attention", action: switchNeedsAttention },
  { name: "Switch interested" },
  { name: "Send BOM link" },
  { name: "Send BIT link" },
  { name: "Send WG link" },
  { name: "Send PT link" },
];
