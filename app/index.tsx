import React from "react";
import MainScreen from "./main-screen";
import { Platform } from "react-native";
import Leads from "@/app/leads";

const IndexPage: React.FC = () => {
  return Platform.OS === "web" ? <MainScreen /> : <Leads />;
};

export default IndexPage;
