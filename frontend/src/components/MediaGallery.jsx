import { Download, Eye } from "lucide-react";
import { useState } from "react";

export default function MediaGallery({ selectedUser }) {
  const [selectedImage, setSelectedImage] = useState(null);

  // Mock media data
  const media = [
    {
      id: 1,
      type: "image",
      url: "https://images.unsplash.com/photo-1618477388954-007caf861a25?w=200&h=200&fit=crop",
      date: "2 days ago",
    },
    {
      id: 2,
      type: "image",
      url: "https://images.unsplash.com/photo-1618477388954-007caf861a25?w=200&h=200&fit=crop",
      date: "1 week ago",
    },
    {
      id: 3,
      type: "image",
      url: "https://images.unsplash.com/photo-1618477388954-007caf861a25?w=200&h=200&fit=crop",
      date: "2 weeks ago",
    },
    {
      id: 4,
      type: "image",
      url: "https://images.unsplash.com/photo-1618477388954-007caf861a25?w=200&h=200&fit=crop",
      date: "1 month ago",
    },
  ];

  if (media.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-tertiary">No media shared yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 gap-2">
        {media.map((item) => (
          <div
            key={item.id}
            className="relative group rounded-lg overflow-hidden aspect-square"
          >
            <img
              src={item.url}
              alt="Shared media"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <button
                onClick={() => setSelectedImage(item)}
                className="btn-icon-sm bg-white/20 hover:bg-white/30 text-white"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button className="btn-icon-sm bg-white/20 hover:bg-white/30 text-white">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View all link */}
      <button className="w-full py-2 text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">
        View all media →
      </button>

      {/* Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 md:hidden"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full p-4">
            <img
              src={selectedImage.url}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 btn-icon-sm bg-black/50"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
