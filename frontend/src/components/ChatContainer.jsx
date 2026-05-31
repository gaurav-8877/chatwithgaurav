import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import ImageLightbox from "./ImageLightbox";
import TypingIndicator from "./TypingIndicator";
import MessageReactions from "./MessageReactions";
import SmartReply from "./SmartReply";
import { Check, CheckCheck, Trash2, Edit2, Reply } from "lucide-react";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    setReplyingTo,
    setEditingMessage,
    addReaction,
    isTyping,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const contextMenuRef = useRef(null);
  const messageInputRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [smartReplyText, setSmartReplyText] = useState(null);

  useEffect(() => {
    // Guard: only fetch messages if selectedUser exists and has an _id
    if (!selectedUser || !selectedUser._id) {
      console.log("[ChatContainer] selectedUser not available yet, skipping message fetch");
      return;
    }

    console.log("[ChatContainer] Fetching messages for user:", selectedUser._id, selectedUser.fullName);
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    // clean up
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    // Use requestAnimationFrame to ensure scroll happens after DOM updates
    const scrollTimer = setTimeout(() => {
      if (messageEndRef.current && messages.length > 0) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 0);
    
    return () => clearTimeout(scrollTimer);
  }, [messages]);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Adjust context menu position to stay within viewport bounds and not overlap bubble
  useEffect(() => {
    if (!contextMenu || !contextMenuRef.current) return;

    // Use requestAnimationFrame to allow DOM to render first
    const adjustMenu = () => {
      const menu = contextMenuRef.current;
      if (!menu) return;

      const rect = menu.getBoundingClientRect();
      const menuWidth = rect.width;
      const menuHeight = rect.height;
      const OFFSET = 8;
      let adjustedX = contextMenu.x;
      let adjustedY = contextMenu.y;
      const isSent = contextMenu.isSent;
      const bubbleRect = contextMenu.bubbleRect;

      // If we have bubble position, use it for better positioning
      if (bubbleRect) {
        if (isSent) {
          // For sent messages (right side): place menu to the LEFT of bubble
          adjustedX = bubbleRect.left - menuWidth - OFFSET;
          // If goes off left edge, place to right of bubble
          if (adjustedX < OFFSET) {
            adjustedX = bubbleRect.right + OFFSET;
          }
        } else {
          // For received messages (left side): place menu to the RIGHT of bubble
          adjustedX = bubbleRect.right + OFFSET;
          // If goes off right edge, place to left of bubble
          if (adjustedX + menuWidth > window.innerWidth - OFFSET) {
            adjustedX = bubbleRect.left - menuWidth - OFFSET;
          }
        }
        
        // Vertical positioning: try to align with top of bubble, or above if needed
        adjustedY = bubbleRect.top;
        if (adjustedY + menuHeight > window.innerHeight - OFFSET) {
          adjustedY = window.innerHeight - menuHeight - OFFSET;
        }
      } else {
        // Fallback to original click-based positioning
        if (isSent) {
          adjustedX = contextMenu.x - menuWidth - OFFSET;
          if (adjustedX < OFFSET) {
            adjustedX = contextMenu.x + OFFSET;
          }
        } else {
          adjustedX = contextMenu.x + OFFSET;
          if (adjustedX + menuWidth > window.innerWidth - OFFSET) {
            adjustedX = contextMenu.x - menuWidth - OFFSET;
          }
        }

        if (contextMenu.y + menuHeight > window.innerHeight - OFFSET) {
          adjustedY = contextMenu.y - menuHeight - OFFSET;
        } else {
          adjustedY = contextMenu.y;
        }
      }

      // Ensure menu stays within viewport bounds
      adjustedX = Math.max(OFFSET, Math.min(adjustedX, window.innerWidth - menuWidth - OFFSET));
      adjustedY = Math.max(OFFSET, adjustedY);

      if (adjustedX !== contextMenu.x || adjustedY !== contextMenu.y) {
        setContextMenu((prev) => ({
          ...prev,
          x: adjustedX,
          y: adjustedY,
        }));
      }
    };

    requestAnimationFrame(adjustMenu);
  }, [contextMenu]);

  const handleRightClick = (e, message) => {
    e.preventDefault();
    
    const isSent = authUser && message.senderId.toString() === authUser._id.toString();
    
    // Get the bubble element's position for non-overlapping menu placement
    const bubbleElement = e.currentTarget.querySelector(".chat-bubble");
    let bubbleRect = null;
    if (bubbleElement) {
      bubbleRect = bubbleElement.getBoundingClientRect();
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message,
      isSent,
      bubbleRect: bubbleRect ? {
        left: bubbleRect.left,
        right: bubbleRect.right,
        top: bubbleRect.top,
        bottom: bubbleRect.bottom,
        width: bubbleRect.width,
        height: bubbleRect.height,
      } : null,
    });
  };

  const handleLongPress = (e, message) => {
    const isSent = authUser && message.senderId.toString() === authUser._id.toString();
    const touch = e.touches[0];
    
    // Get the bubble element's position for non-overlapping menu placement
    const bubbleElement = e.currentTarget.querySelector(".chat-bubble");
    let bubbleRect = null;
    if (bubbleElement) {
      bubbleRect = bubbleElement.getBoundingClientRect();
    }
    
    setContextMenu({
      x: touch.clientX,
      y: touch.clientY,
      message,
      isSent,
      bubbleRect: bubbleRect ? {
        left: bubbleRect.left,
        right: bubbleRect.right,
        top: bubbleRect.top,
        bottom: bubbleRect.bottom,
        width: bubbleRect.width,
        height: bubbleRect.height,
      } : null,
    });
  };

  const handleDeleteMessage = (messageId, deleteFor) => {
    deleteMessage(messageId, deleteFor);
    setContextMenu(null);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setContextMenu(null);
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setContextMenu(null);
  };

  const handleSmartReplySelect = (replyText) => {
    setSmartReplyText(replyText);
    // Focus the message input after a short delay to ensure it's mounted
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
        messageInputRef.current.setInputText(replyText);
      }
    }, 0);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900/50">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {messages
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .filter((msg) => {
                // Filter out messages deleted by sender (sender shouldn't see deleted placeholder)
                const isSent = authUser && msg.senderId.toString() === authUser._id.toString();
                const isDeleted = msg.deletedForEveryone;
                return !(isDeleted && isSent); // Hide deleted sent messages
              })
              .map((msg, index, filteredMessages) => {
              const isSent = authUser && msg.senderId.toString() === authUser._id.toString();
              const isDeleted = msg.deletedForEveryone;
              
              // Find the last received message
              const lastReceivedMessageIndex = filteredMessages.findLastIndex(
                (m) => authUser && m.senderId.toString() !== authUser._id.toString()
              );
              
              // Check if any sent messages exist after the last received message
              const hasSentMessagesAfter = filteredMessages.some(
                (m, i) => i > lastReceivedMessageIndex && authUser && m.senderId.toString() === authUser._id.toString()
              );
              
              // Show smart reply only for the last received message if no sent messages after it
              const shouldShowSmartReply = !isSent && !isDeleted && index === lastReceivedMessageIndex && !hasSentMessagesAfter;
              
              return (
                <div key={msg._id}>
                  <div
                    className={`flex ${isSent ? "justify-end" : "justify-start"} gap-2 group message-animation`}
                    onContextMenu={(e) => handleRightClick(e, msg)}
                    onTouchEnd={(e) => {
                      if (e.touches.length === 0) {
                        const touch = e.changedTouches[0];
                        handleLongPress({ touches: [touch] }, msg);
                      }
                    }}
                  >
                    <div
                      className={`flex flex-col max-w-xs sm:max-w-sm ${
                        isSent ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Reply preview */}
                      {msg.replyTo && (
                        <div className={`px-3 py-1 rounded-t-xl text-xs fade-in-up ${
                          isSent
                            ? "bg-cyan-700/40 text-cyan-200"
                            : "bg-slate-600/40 text-slate-300"
                        }`}>
                          <p className="text-xs font-semibold opacity-70">↳ Replying to message</p>
                        </div>
                      )}

                      <div
                        className={`px-4 py-2 break-words relative chat-bubble ${
                          isSent
                            ? `sent-bubble ${
                              msg.replyTo
                                ? "rounded-[16px_16px_4px_0]" // When replying, suppress bottom right radius
                                : "rounded-[16px_16px_4px_16px]" // Normal sent: top-left top-right bottom-right(4px) bottom-left
                            }`
                            : `received-bubble ${
                              msg.replyTo
                                ? "rounded-[16px_16px_0_4px]" // When replying, suppress bottom left radius
                                : "rounded-[16px_16px_16px_4px]" // Normal received: top-left top-right bottom-right bottom-left(4px)
                            }`
                        } ${isDeleted ? "opacity-60 italic" : ""}`}
                      >
                        {/* Show deleted placeholder only to receiver */}
                        {isDeleted && !isSent ? (
                          <p className="text-sm sm:text-base">🚫 This message was deleted</p>
                        ) : (
                          <>
                            {msg.image && (
                              <img
                                src={msg.image}
                                alt="Shared"
                                onClick={() => setLightboxImage(msg.image)}
                                className="w-40 sm:w-48 h-40 sm:h-48 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                              />
                            )}
                            {msg.text && <p className="text-sm sm:text-base leading-relaxed">{msg.text}</p>}
                          </>
                        )}
                        
                        {/* Timestamp, read status, and edited label - flex row layout */}
                        <div className="flex items-end gap-1 mt-1 text-xs opacity-80 flex-wrap">
                          <span className="whitespace-nowrap flex-shrink-0">
                            {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                          {msg.isEdited && (
                            <span className="whitespace-nowrap flex-shrink-0">
                              · edited {new Date(msg.updatedAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          )}
                          {isSent && !isDeleted && (
                            <>
                              {msg.isRead ? (
                                <CheckCheck className="w-4 h-4 text-blue-300 flex-shrink-0" />
                              ) : msg.delivered ? (
                                <CheckCheck className="w-4 h-4 text-slate-300 flex-shrink-0" />
                              ) : (
                                <Check className="w-4 h-4 text-slate-300 flex-shrink-0" />
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Reactions */}
                      <div className="mt-1 reaction-animation">
                        <MessageReactions 
                          message={msg}
                          onReact={(emoji) => addReaction(msg._id, emoji)}
                        />
                      </div>

                      {/* Smart Reply - only for last received message with no sent messages after it */}
                      {shouldShowSmartReply && (
                        <SmartReply 
                          message={msg}
                          onSelectReply={handleSmartReplySelect}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-700 text-slate-100 rounded-bl-none">
                  <TypingIndicator />
                </div>
              </div>
            )}
            
            {/* 👇 scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-slate-800 rounded-xl shadow-2xl border border-slate-600/50 z-[9999] py-1 min-w-max context-menu-animation"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            transform: 'translateY(-8px)',
          }}
        >
          {/* Reply - Available for all messages */}
          <button
            onClick={() => handleReply(contextMenu.message)}
            className="w-full px-4 py-2 text-left text-sm text-cyan-400 hover:bg-slate-700/70 flex items-center gap-2 transition-colors duration-150 first:rounded-t-lg"
          >
            <Reply className="w-4 h-4" />
            Reply
          </button>

          {/* Edit - Only for own messages */}
          {contextMenu.message.senderId.toString() === authUser._id.toString() && !contextMenu.message.deletedForEveryone && (
            <button
              onClick={() => handleEdit(contextMenu.message)}
              className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-slate-700/70 flex items-center gap-2 transition-colors duration-150"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}

          {/* Delete for Me - Always available */}
          <button
            onClick={() => handleDeleteMessage(contextMenu.message._id, "me")}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700/70 flex items-center gap-2 transition-colors duration-150"
          >
            <Trash2 className="w-4 h-4" />
            Delete for Me
          </button>

          {/* Delete for Everyone - Only for sender */}
          {contextMenu.message.senderId.toString() === authUser._id.toString() && !contextMenu.message.deletedForEveryone && (
            <button
              onClick={() => handleDeleteMessage(contextMenu.message._id, "everyone")}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-slate-700/70 flex items-center gap-2 transition-colors duration-150 last:rounded-b-lg"
            >
              <Trash2 className="w-4 h-4" />
              Delete for Everyone
            </button>
          )}
        </div>
      )}

      <MessageInput ref={messageInputRef} />

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}

export default ChatContainer;
