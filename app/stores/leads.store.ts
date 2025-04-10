import { makeAutoObservable, observable, action, runInAction } from "mobx";
import { apiService } from "../services/api.service";
import { ILead } from "@/app/typescript/interfaces/ILead";

class LeadStore {
  // Observable properties
  leads: ILead[] | null = [];
  filteredLeads?: ILead[] | null = [];
  selectedLead: ILead | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {
      leads: observable,
      selectedLead: observable,
      isLoading: observable,
      error: observable,
      filteredLeads: observable,
      fetchLeads: action.bound,
      selectLead: action.bound,
      createLead: action.bound,
      updateLead: action.bound,
      deleteLead: action.bound,
      clearSelectedLead: action.bound,
      setError: action.bound,
      sortLeads: action.bound,
      switchAttention: action.bound,
      filterByPhone: action.bound,
    });
  }

  /**
   * Fetch all leads from the API
   */
  async fetchLeads() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.getLeads<ILead[]>();

      runInAction(() => {
        if (response.error) {
          this.error = response.error;
        } else {
          this.leads = response.data!.map((lead: ILead) => ({
            ...lead,
            lead_phone: lead.lead_phone || lead.tg_username,
          }));
          this.filteredLeads = response.data;
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch leads";
        this.isLoading = false;
      });
    }
  }

  async switchAttention(id: number) {
    this.error = null;

    try {
      const response = await apiService.switchAttention(id);

      runInAction(() => {
        if (response.error) {
          this.error = response.error;
        } else {
          this.fetchLeads();
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to switch attention";
      });
    }
  }

  /**
   * Select a lead to view/edit details
   */
  selectLead(id: number | null = null) {
    if (id === null) {
      this.selectedLead = null;
      return;
    }
    const lead = this.leads?.find((lead) => lead.id === id);
    // if (!!lead) {
    //   SocketService.subscribeToLead(lead.lead_phone);
    // } else {
    //   SocketService.unSubscribeToLead(this.selectedLead?.lead_phone || "");
    // }
    this.selectedLead = lead || null;
  }

  /**
   * Clear the selected lead
   */
  clearSelectedLead() {
    this.selectedLead = null;
  }

  /**
   * Create a new lead
   */
  async createLead(lead: Omit<ILead, "id" | "created_at">) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.post<ILead>("/leads", lead);

      runInAction(() => {
        if (response.error) {
          this.error = response.error;
        } else {
          this.leads?.push(response.data!);
          this.selectedLead = response.data;
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to create lead";
        this.isLoading = false;
      });
    }
  }

  /**
   * Update an existing lead
   */
  async updateLead(id: number, updates: Partial<ILead>) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.put<ILead>(`/leads/${id}`, updates);

      runInAction(() => {
        if (response.error) {
          this.error = response.error;
        } else {
          // Update the lead in the leads array
          const index = this.leads?.findIndex((lead) => lead.id === id);
          if (!!index && index !== -1 && !!this.leads && !!this.leads[index]) {
            this.leads[index] = response.data!;
          }

          // Update the selected lead if it matches the updated lead
          if (this.selectedLead && this.selectedLead.id === id) {
            this.selectedLead = response.data;
          }
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to update lead";
        this.isLoading = false;
      });
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: number) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.delete<{ success: boolean }>(
        `/leads/${id}`,
      );

      runInAction(() => {
        if (response.error) {
          this.error = response.error;
        } else {
          // Remove the lead from the leads array
          this.leads = this.leads?.filter((lead) => lead.id !== id) || null;

          // Clear the selected lead if it matches the deleted lead
          if (this.selectedLead && this.selectedLead.id === id) {
            this.selectedLead = null;
          }
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to delete lead";
        this.isLoading = false;
      });
    }
  }

  /**
   * Set error message
   */
  setError(error: string | null) {
    this.error = error;
  }

  /**
   * Get lead by ID
   */
  getLeadById(id: number): ILead | undefined {
    return this.leads?.find((lead) => lead.id === id);
  }

  /**
   * Filter leads by various criteria
   */
  filterLeads(
    criteria: Partial<ILead>,
    isNegation: boolean = false,
  ): ILead[] | undefined {
    this.filteredLeads = this.leads?.filter((lead) => {
      return Object.keys(criteria).every((key) => {
        const typedKey = key as keyof ILead;
        const criteriaValue = criteria[typedKey as keyof Partial<ILead>];

        if (isNegation) {
          return lead[typedKey] !== criteriaValue;
        } else {
          return lead[typedKey] === criteriaValue;
        }
      });
    });

    return this.filteredLeads;
  }

  filterByPhone(phone: string) {
    console.log(phone);
    if (!!phone) {
      this.filteredLeads = this.leads?.filter((lead) => {
        // Handle case when phone is undefined or empty
        if (!phone) return false;

        // Check if the lead phone number contains the search term
        return lead.lead_phone.includes(phone);
      });
    } else {
      this.filteredLeads = this.leads;
    }
  }

  sortLeads(sortField: keyof ILead = "id", order: "asc" | "desc" = "asc") {
    this.filteredLeads = this.leads?.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Handle date fields
      const dateFields: Array<keyof ILead> = [
        "created_at",
        "bom_date",
        "bit_date",
        "pt_date",
        "wg_date",
      ];
      if (dateFields.includes(sortField)) {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();

        return order === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle id field
      if (sortField === "id") {
        return order === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }

      // For other fields (strings)
      const strA = String(aValue || "");
      const strB = String(bValue || "");

      return order === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }

  resetFilters(): void {
    this.filteredLeads = this.leads;
  }

  /**
   * Get leads that have opted out
   */
  get optedOutLeads(): ILead[] | undefined {
    return this.leads?.filter((lead) => lead.opted_out);
  }

  /**
   * Get leads that need follow-up
   */
  get needsFollowUpLeads(): ILead[] | undefined {
    return this.leads?.filter((lead) => {
      return (
        !lead.opted_out &&
        (!lead.fu_bom_sent ||
          (lead.fu_bom_sent && !lead.fu_bom_confirmed && !lead.fu2_bom_sent) ||
          (!lead.fu_bit_sent && lead.bit_date !== null))
      );
    });
  }
}

// Create a singleton instance of the store
const leadStore = new LeadStore();

export default leadStore;
