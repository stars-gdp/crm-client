import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
} from "react-native";
import { observer } from "mobx-react";
import leadStore from "./stores/leads.store";
import { ILead } from "./typescript/interfaces/ILead";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import LeadsFilter from "@/app/components/leads-filter";

// Component for displaying a status item with label and value
const StatusItem = ({
  label,
  textValue,
  dateValue,
}: {
  label: string;
  textValue: string | null;
  dateValue: string | null;
}) => (
  <View style={styles.statusItem}>
    <Text style={styles.statusLabel}>{label}</Text>
    <Text style={styles.statusValue}>{textValue || "Not Set"}</Text>
    <Text style={styles.dateValue}>
      {dateValue ? format(new Date(dateValue), "MMM dd, yyyy") : "No date"}
    </Text>
  </View>
);

// Lead card component
const LeadCard = ({ lead, onPress }: { lead: ILead; onPress: () => void }) => {
  // Format the creation date
  const formattedCreationDate = format(
    new Date(lead.created_at),
    "MMM dd, yyyy",
  );

  // Determine if the card should have the "opted out" style
  const cardStyle = lead.opted_out
    ? [styles.card, styles.optedOutCard]
    : styles.card;

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => {
        onPress();
      }}
    >
      <View style={styles.headerRow}>
        <Text style={styles.leadName}>{lead.lead_name}</Text>
        {lead.opted_out && (
          <View style={styles.optedOutBadge}>
            <Text style={styles.optedOutText}>Opted Out</Text>
          </View>
        )}
      </View>

      <Text style={styles.leadPhone}>{lead.lead_phone}</Text>
      <Text style={styles.creationDate}>Created: {formattedCreationDate}</Text>

      <View style={styles.divider} />

      <View style={styles.statusContainer}>
        <StatusItem
          label="BOM"
          textValue={lead.bom_text}
          dateValue={lead.bom_date}
        />
        <StatusItem
          label="BIT"
          textValue={lead.bit_text}
          dateValue={lead.bit_date}
        />
        <StatusItem
          label="PT"
          textValue={lead.pt_text}
          dateValue={lead.pt_date}
        />
        <StatusItem
          label="WG"
          textValue={lead.wg_text}
          dateValue={lead.wg_date}
        />
      </View>
    </TouchableOpacity>
  );
};

// Main leads screen component
const Leads = () => {
  const router = useRouter();

  const [filteredPhone, setFilteredPhone] = useState<string>("");

  // Fetch leads when component mounts
  useEffect(() => {
    leadStore.fetchLeads().then(() => {
      leadStore.sortLeads("bom_date", "desc");
    });
  }, []);

  useEffect(() => {
    leadStore.filterByPhone(filteredPhone);
  }, [filteredPhone]);

  // Handle lead selection
  const handleLeadPress = (leadId: number) => {
    leadStore.selectLead(leadId);
    if (Platform.OS !== "web") {
      router.push("/lead-chat");
    }
  };

  // Render loading state
  if (leadStore.isLoading && leadStore!.leads?.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading leads...</Text>
      </SafeAreaView>
    );
  }

  // Render error state
  if (leadStore.error && leadStore!.leads?.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {leadStore.error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => leadStore.fetchLeads()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render the list of leads
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TextInput
        returnKeyType={"done"}
        style={styles.input}
        value={filteredPhone}
        onChangeText={setFilteredPhone.bind(this)}
        placeholder="Filter by phone..."
        placeholderTextColor="#888"
        multiline
        maxLength={1000}
        autoCapitalize="none"
      />

      {leadStore.isLoading && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      )}

      <LeadsFilter />

      <FlatList
        refreshing={leadStore.isLoading}
        onRefresh={() => {
          leadStore.fetchLeads().then(() => {
            leadStore.sortLeads("bom_date", "desc");
          });
        }}
        data={leadStore.filteredLeads ?? leadStore.leads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <LeadCard lead={item} onPress={() => handleLeadPress(item.id)} />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No leads found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff3b30",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007aff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  refreshIndicator: {
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 10,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optedOutCard: {
    backgroundColor: "#ffebee", // Light red background for opted out leads
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  leadName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  optedOutBadge: {
    backgroundColor: "#ff5252",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  optedOutText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  leadPhone: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  creationDate: {
    fontSize: 14,
    color: "#888",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  statusItem: {
    width: "50%",
    paddingVertical: 5,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
  statusValue: {
    fontSize: 14,
    color: "#555",
  },
  dateValue: {
    fontSize: 12,
    color: "#888",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10, // To center text vertically
    paddingRight: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
});

export default observer(Leads);
