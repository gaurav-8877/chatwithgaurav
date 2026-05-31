import { useState, useRef } from "react";
import { X, Camera, Loader2, Check, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function EditProfileModal({ onClose }) {
  const { authUser, updateProfile } = useAuthStore();

  const [fullName,   setFullName]   = useState(authUser?.fullName || "");
  const [bio,        setBio]        = useState(authUser?.bio || "");
  const [avatarPrev, setAvatarPrev] = useState(authUser?.profilePic || null);
  const [avatarB64,  setAvatarB64]  = useState(null);
  const [isSaving,   setIsSaving]   = useState(false);

  const fileRef = useRef();

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPrev(reader.result);
      setAvatarB64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        fullName:   fullName.trim() !== authUser?.fullName ? fullName.trim() : undefined,
        bio:        bio.trim() !== (authUser?.bio || "") ? bio.trim() : undefined,
        profilePic: avatarB64 || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    background: "var(--s3)",
    border: "1px solid var(--border-2)",
    borderRadius: 14,
    color: "var(--t1)",
    fontSize: 14,
    outline: "none",
    width: "100%",
    padding: "12px 16px",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden animate-scale-in"
        style={{ background: "var(--s2)", border: "1px solid var(--border-2)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-sm font-semibold text-white">Edit Profile</h2>
          <button className="icon-btn-sm" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden"
                style={{ border: "3px solid rgba(109,93,252,0.4)" }}>
                {avatarPrev ? (
                  <img src={avatarPrev} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)" }}>
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              {/* overlay */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.55)" }}>
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            <p className="text-xs" style={{ color: "#52525B" }}>Click to change photo</p>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#A1A1AA" }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              required
              style={inputStyle}
              className="placeholder-zinc-600"
              onFocus={e => { e.target.style.borderColor = "rgba(109,93,252,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(109,93,252,0.10)"; }}
              onBlur={e =>  { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Bio */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "var(--t2)" }}>
                Bio <span style={{ color: "var(--t3)" }}>({bio.length}/200)</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="About me…"
                maxLength={200}
                rows={2}
                style={{ ...inputStyle, resize: "none", padding: "10px 16px" }}
                className="placeholder-zinc-500"
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-m)"; }}
                onBlur={e =>  { e.target.style.borderColor = "var(--border-2)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#A1A1AA" }}>
              Email (cannot change)
            </label>
            <input
              type="email"
              value={authUser?.email || ""}
              disabled
              style={{ ...inputStyle, opacity: 0.4, cursor: "not-allowed" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors"
              style={{ background: "#27272A", color: "#A1A1AA" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving || (!avatarB64 && fullName.trim() === authUser?.fullName)}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)", boxShadow: isSaving ? "none" : "0 4px 20px rgba(109,93,252,0.30)" }}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
