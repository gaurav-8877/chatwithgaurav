import { useState } from "react";
import { ChevronDown, Image, Pin, Users } from "lucide-react";
import ConversationProfile from "./ConversationProfile";
import MediaGallery from "./MediaGallery";
import PinnedMessages from "./PinnedMessages";
import ConversationMembers from "./ConversationMembers";

export default function RightSidebar({ selectedUser }) {
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    media: true,
    pinned: true,
    members: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sections = [
    {
      id: "profile",
      title: "Profile",
      icon: null,
      component: <ConversationProfile selectedUser={selectedUser} />,
    },
    {
      id: "media",
      title: "Media & Files",
      icon: <Image className="w-4 h-4" />,
      component: <MediaGallery selectedUser={selectedUser} />,
    },
    {
      id: "pinned",
      title: "Pinned Messages",
      icon: <Pin className="w-4 h-4" />,
      component: <PinnedMessages selectedUser={selectedUser} />,
    },
    {
      id: "members",
      title: "Members",
      icon: <Users className="w-4 h-4" />,
      component: <ConversationMembers selectedUser={selectedUser} />,
    },
  ];

  return (
    <div className="hidden lg:flex flex-col w-right-panel h-full bg-surface-secondary border-l border-divider overflow-y-auto no-scrollbar">
      {/* Profile section - always visible */}
      <div className="p-4 border-b border-divider">
        <ConversationProfile selectedUser={selectedUser} />
      </div>

      {/* Collapsible sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.slice(1).map((section) => (
          <div key={section.id} className="border-b border-divider">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-tertiary/50 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-secondary group-hover:text-primary transition-colors">
                  {section.icon}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {section.title}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-tertiary transition-transform duration-300 ${
                  expandedSections[section.id] ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedSections[section.id] && (
              <div className="px-4 py-3 border-t border-divider/50 bg-surface-primary/30">
                {section.component}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
