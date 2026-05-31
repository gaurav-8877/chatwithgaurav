import { User, Mail, Phone, MapPin, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ConversationProfile({ selectedUser }) {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!selectedUser) return null;

  const isOnline = true; // You can get this from your real-time data

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="relative">
        <img
          src={selectedUser.profilePic}
          alt={selectedUser.fullName}
          className="w-24 h-24 rounded-full object-cover ring-2 ring-brand-500/30"
        />
        <div
          className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface-secondary ${
            isOnline ? "bg-green-500" : "bg-slate-500"
          } animate-pulse-glow`}
        />
      </div>

      {/* User info */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-primary">{selectedUser.fullName}</h3>
        <p className="text-sm text-secondary">
          {isOnline ? "Active now" : "Last seen 2 hours ago"}
        </p>
      </div>

      {/* Status/Bio */}
      <p className="text-sm text-tertiary text-center px-2">
        "Always learning, always growing 🚀"
      </p>

      {/* Contact info */}
      <div className="w-full space-y-2">
        {/* Email */}
        <div
          className="px-3 py-2 bg-surface-tertiary/50 rounded-lg flex items-center justify-between gap-2 group cursor-pointer hover:bg-surface-tertiary/80 transition-colors"
          onClick={() => copyToClipboard(selectedUser.email, "email")}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
            <span className="text-xs text-tertiary truncate">
              {selectedUser.email}
            </span>
          </div>
          {copiedField === "email" ? (
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          ) : (
            <Copy className="w-4 h-4 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          )}
        </div>

        {/* Phone */}
        <div className="px-3 py-2 bg-surface-tertiary/50 rounded-lg flex items-center justify-between gap-2 group cursor-pointer hover:bg-surface-tertiary/80 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
            <span className="text-xs text-tertiary">+1 (555) 000-0000</span>
          </div>
          <Copy className="w-4 h-4 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>

        {/* Location */}
        <div className="px-3 py-2 bg-surface-tertiary/50 rounded-lg flex items-center gap-3">
          <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
          <span className="text-xs text-tertiary">San Francisco, CA</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full grid grid-cols-2 gap-2">
        <button className="btn-secondary text-sm">Call</button>
        <button className="btn-secondary text-sm">Video</button>
      </div>
    </div>
  );
}
