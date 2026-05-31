---
name: project-phase1-redesign
description: chatwithgaurav Phase 1 + Full redesign completed — zinc/violet DS, 4-column layout
metadata:
  type: project
---

Phase 1 (group chats) + full UI redesign complete (2026-05-31).

**Design system:** zinc palette (#09090B bg, #18181B card, #27272A elevated) + violet accent #6D5DFC.
**Layout:** WorkspaceRail (72px) → ConversationExplorer (360px) → ChatArea (flex) → SmartProfilePanel (320px, optional).

**New components:**
- `WorkspaceRail.jsx` — 72px icon rail, active violet bar indicator
- `ConversationExplorer.jsx` — 360px panel: search, All/Unread/Contacts filters, DM + group cards
- `ChatHeader.jsx` — avatar ring (green = online), typing dots, action buttons
- `MessageComposer.jsx` — floating pill composer with slash-command picker, auto-resize
- `ChatContainer.jsx` — message grouping (5min gap = new group), gradient sent bubbles, hover toolbar, inline reactions
- `SmartProfilePanel.jsx` — tabbed panel (Overview/Media/Files/Groups), shared media grid, mutual groups
- `GroupChatContainer.jsx` — updated to new zinc/violet design
- `PageLoader.jsx` — branded spinner
- `LoginPage.jsx` / `SignUpPage.jsx` — split-panel premium auth screens
- `App.jsx` — clean, #09090B bg, no glow effects

**Backend:** All group routes at `/api/groups`, Socket.io group rooms, `global.userSocketMap`.
**Backend connection:** `axiosInstance` → `http://localhost:3000/api` (dev). Socket → `http://localhost:3000`.

**How to run:**
```bash
cd backend  && npm run dev    # port 3000
cd frontend && npm run dev    # port 5173
```

**Phase 3 next:** WebRTC voice/video, push notifications, cursor-based pagination, Docker setup.
