import React from "react";
import { observer } from "mobx-react";
import PopupView from "@/app/components/popup-view";
import { View, Text, TouchableOpacity } from "react-native";
import { map } from "lodash";
import { LEAD_ACTIONS } from "@/app/config/lead-actions.config";
import leadStore from "@/app/stores/leads.store";

const LeadActionsPopup: React.FC = () => {
  return (
    <PopupView
      containerStyle={{
        height: "100%",
        width: 50,
        backgroundColor: "red",
      }}
    >
      <View style={{ width: "100%", gap: 5 }}>
        {map(LEAD_ACTIONS, (item, index) => {
          return (
            <TouchableOpacity
              onPress={() => {
                item.action?.(leadStore.selectedLead?.lead_phone ?? "");
              }}
              style={{
                backgroundColor: "cyan",
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              key={index}
            >
              <Text>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </PopupView>
  );
};

export default observer(LeadActionsPopup);
