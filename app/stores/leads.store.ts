import { makeAutoObservable, observable, action, runInAction } from "mobx";
import { apiService } from "../services/api.service";
import { ILead } from "@/app/typescript/interfaces/ILead";

class LeadStore {
  // Observable properties
  leads: ILead[] | null = [];
  selectedLead: ILead | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {
      leads: observable,
      selectedLead: observable,
      isLoading: observable,
      error: observable,
      fetchLeads: action.bound,
      selectLead: action.bound,
      createLead: action.bound,
      updateLead: action.bound,
      deleteLead: action.bound,
      clearSelectedLead: action.bound,
      setError: action.bound,
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
          this.leads = response.data;
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
  filterLeads(criteria: Partial<ILead>): ILead[] | undefined {
    return this.leads?.filter((lead) => {
      return Object.keys(criteria).every((key) => {
        const typedKey = key as keyof ILead;
        return lead[typedKey] === criteria[typedKey as keyof Partial<ILead>];
      });
    });
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
