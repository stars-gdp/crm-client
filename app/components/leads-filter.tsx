import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import leadsStore from "@/app/stores/leads.store";
import { LeadsFilterCriteria } from "@/app/typescript/leads-filter-criteria";

interface IProps {}

const LeadsFilter: React.FC<IProps> = () => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!!activeFilter) {
      applyFilter(activeFilter);
    }
  }, [leadsStore.leads]);

  const toggleFilter = (filterKey: string) => {
    if (activeFilter === filterKey) {
      // If tapping the already active filter, deactivate it
      setActiveFilter(null);
      leadsStore.resetFilters();
    } else {
      // Otherwise, set this as the only active filter
      setActiveFilter(filterKey);
      applyFilter(filterKey);
    }
  };

  const applyFilter = (filterKey: string) => {
    // Reset filters first
    leadsStore.resetFilters();

    // If no filters selected, show all leads
    if (!filterKey) return;

    const filter = LeadsFilterCriteria[filterKey];
    leadsStore.filterLeads(filter.criteria, filter.isNegation);
  };

  const renderFilterItem = ({
    item,
  }: {
    item: [
      string,
      (typeof LeadsFilterCriteria)[keyof typeof LeadsFilterCriteria],
    ];
  }) => {
    const [key, filter] = item;
    const isActive = activeFilter === key;

    return (
      <TouchableOpacity
        style={[styles.filterItem, isActive && styles.activeFilterItem]}
        onPress={() => toggleFilter(key)}
      >
        <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
          {filter.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={Object.entries(LeadsFilterCriteria)}
        renderItem={renderFilterItem}
        keyExtractor={([key]) => key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  filterItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeFilterItem: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    fontSize: 14,
    color: "#333",
  },
  activeFilterText: {
    color: "white",
  },
});

export default observer(LeadsFilter);
