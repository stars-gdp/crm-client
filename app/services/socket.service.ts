import { io } from "socket.io-client";
import { API_URL } from "@/app/config/api.config";

class SocketService {
  private readonly socket = io(API_URL, {
    reconnection: true,
  });

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  subscribeToLead(leadPhone: string) {
    this.socket.emit("subscribe-to-lead", leadPhone);
  }

  unSubscribeToLead(leadPhone: string) {
    this.socket.emit("unsubscribe-from-lead", leadPhone);
  }

  onNewLeadMessage(callback: (data: any) => void) {
    this.socket.on("new-message", callback);
  }

  onMessageActivity(callback: (data: any) => void) {
    this.socket.on("message-activity", callback);
  }

  offMessageActivity(callback: (data: any) => void) {
    this.socket.off("message-activity", callback);
  }
}

export default new SocketService();
