import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ContactSearch from "../components/ContactSearch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import RightSidebar from "../components/RightSidebar";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedUser) {
      setIsSidebarOpen(false);
    }
  }, [selectedUser]);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-surface-primary">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-secondary border-b border-divider">
        <h1 className="text-lg font-bold text-primary">Chatify</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="btn-icon text-secondary"
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* LEFT SIDEBAR - DESKTOP & MOBILE */}
      <div
        className={`absolute md:relative md:flex inset-y-0 left-0 w-full md:w-80 bg-surface-secondary border-r border-divider flex flex-col transition-transform duration-300 z-40 md:z-0 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-divider">
          <h2 className="text-lg font-bold text-primary">Chats</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="btn-icon text-secondary"
          >
            <X />
          </button>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block">
          <div className="p-4">
            <ProfileHeader />
          </div>
          <div className="px-4 py-2">
            <ActiveTabSwitch />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <ContactSearch
            onSearch={setSearchTerm}
            placeholder={activeTab === "chats" ? "Search chats..." : "Search contacts..."}
          />
        </div>

        {/* Chat/Contact List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-3 space-y-2">
            {activeTab === "chats" ? (
              <ChatsList searchTerm={searchTerm} />
            ) : (
              <ContactList searchTerm={searchTerm} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* CENTER - CHAT AREA */}
      <div className="flex-1 flex flex-col h-full bg-surface-primary overflow-hidden md:min-w-0">
        {selectedUser ? (
          <ChatContainer />
        ) : (
          <div className="hidden md:flex md:items-center md:justify-center h-full">
            <NoConversationPlaceholder />
          </div>
        )}
        {/* Show placeholder on mobile when no chat selected */}
        {!selectedUser && (
          <div className="md:hidden flex items-center justify-center h-full">
            <NoConversationPlaceholder />
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - DESKTOP ONLY */}
      <RightSidebar selectedUser={selectedUser} />
    </div>
  );
}

export default ChatPage;
