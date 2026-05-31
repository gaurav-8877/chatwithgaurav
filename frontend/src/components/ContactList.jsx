import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList({ searchTerm = "" }) {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  const filteredContacts = allContacts.filter(contact =>
    contact.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (filteredContacts.length === 0) return <div className="text-center text-slate-400 py-8">No contacts found</div>;

  return (
    <>
      {filteredContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-cyan-500/10 p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-2 sm:gap-3 justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                <div className="size-10 sm:size-12 rounded-full flex-shrink-0">
                  <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
                </div>
              </div>
              <h4 className="text-slate-200 font-medium text-sm sm:text-base truncate">{contact.fullName}</h4>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              onlineUsers.includes(contact._id)
                ? "bg-green-500/20 text-green-300"
                : "bg-gray-500/20 text-gray-300"
            }`}>
              {onlineUsers.includes(contact._id) ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
