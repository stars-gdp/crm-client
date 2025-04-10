import leadStore from "@/app/stores/leads.store";

const switchNeedsAttention = (id: number) => {
  leadStore.switchAttention(id);
};

export const LEAD_ACTIONS = [
  { name: "Switch needs attention", action: switchNeedsAttention },
  { name: "Switch interested" },
  { name: "Send BOM link" },
  { name: "Send BIT link" },
  { name: "Send WG link" },
  { name: "Send PT link" },
];
