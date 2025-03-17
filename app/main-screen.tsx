import React from "react";
import { View, StyleSheet } from "react-native";
import { observer } from "mobx-react";
import Leads from "./leads";
import LeadChatScreen from "./lead-chat";

const MainScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.leadsListContainer}>
        <Leads />
      </View>

      <View style={styles.chatContainer}>
        <LeadChatScreen />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row", // Side-by-side layout for web
  },
  leadsListContainer: {
    width: "35%", // Takes 35% of the screen
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  chatContainer: {
    flex: 1, // Takes remaining space
  },
});

export default observer(MainScreen);
