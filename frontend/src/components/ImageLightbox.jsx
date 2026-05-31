import { useEffect, useRef } from "react";
import { Download, X } from "lucide-react";

function ImageLightbox({ imageUrl, onClose }) {
  const overlayRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on clicking outside the image (on the overlay)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Download image
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chatify-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[ImageLightbox] Download error:", error);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-200 hover:text-white transition-all duration-200 z-10"
        title="Close (ESC)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 left-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-200 hover:text-white transition-all duration-200 z-10 flex items-center gap-2"
        title="Download image"
      >
        <Download className="w-5 h-5" />
      </button>

      {/* Image container */}
      <div className="relative max-w-4xl max-h-screen flex items-center justify-center">
        <img
          src={imageUrl}
          alt="Full size preview"
          className="max-w-full max-h-screen object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Help text */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-slate-400 text-sm text-center">
        Press ESC to close • Click outside to close
      </div>
    </div>
  );
}

export default ImageLightbox;
