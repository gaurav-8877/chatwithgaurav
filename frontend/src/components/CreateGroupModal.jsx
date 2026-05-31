import { useState, useRef, useEffect } from "react";
import { X, Camera, Search, Check, Users, Loader2 } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

export default function CreateGroupModal({ onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileRef = useRef();
  const { allContacts, getAllContacts } = useChatStore();
  const { authUser } = useAuthStore();
  const { createGroup, setSelectedGroup, fetchGroupMessages, subscribeToGroupMessages } = useGroupStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  const contacts = allContacts.filter(
    (u) =>
      u._id !== authUser._id &&
      (u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleMember = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || selectedIds.length === 0) return;

    setIsSubmitting(true);
    const group = await createGroup({
      name,
      description,
      memberIds: selectedIds,
      avatar: avatarBase64,
    });
    setIsSubmitting(false);

    if (group) {
      setSelectedGroup(group);
      await fetchGroupMessages(group._id);
      subscribeToGroupMessages(group._id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-slate-100">Create New Group</h2>
          <button onClick={onClose} className="btn-icon-sm text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center flex-shrink-0 transition-all duration-200 overflow-hidden group"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-slate-500 group-hover:text-slate-300 transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Group name *"
                  required
                  maxLength={100}
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={200}
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all"
                />
              </div>
            </div>

            {/* Member count */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400">
                {selectedIds.length} member{selectedIds.length !== 1 ? "s" : ""} selected
                {selectedIds.length === 0 && " — select at least 1"}
              </span>
            </div>

            {/* Search contacts */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all"
              />
            </div>

            {/* Contact list */}
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {contacts.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-4">No contacts found</p>
              ) : (
                contacts.map((user) => {
                  const isSelected = selectedIds.includes(user._id);
                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleMember(user._id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                        isSelected
                          ? "bg-brand-500/15 border border-brand-500/20"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-700">
                          {user.profilePic ? (
                            <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-300">
                              {user.fullName[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? "bg-brand-500 border-brand-500" : "border-slate-600"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || selectedIds.length === 0 || isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
