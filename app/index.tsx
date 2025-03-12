import React, { useEffect } from "react";
import MainScreen from "./main-screen";
import { Platform } from "react-native";
import Leads from "@/app/leads";
import SocketService from "@/app/services/socket.service";

const IndexPage: React.FC = () => {
  useEffect(() => {
    SocketService.connect();
    return () => SocketService.disconnect();
  }, []);

  return Platform.OS === "web" ? <MainScreen /> : <Leads />;
};

export default IndexPage;
