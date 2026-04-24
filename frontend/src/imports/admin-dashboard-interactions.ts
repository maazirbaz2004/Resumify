IMPORTANT CONTEXT:
Do NOT create a new project or new file.
Do NOT change any existing screens.
Do NOT alter the color theme, fonts, or design language of any existing screen.
You are working inside the existing Resumify design that already has 16 screens
(14 original + Admin Login + Admin Dashboard).
Make only the following targeted changes:

— — —

CHANGE 1 — UPDATE THE LANDING PAGE (Screen 1):

Find the existing landing page hero section.
It already has two CTA buttons: "I'm a Candidate" and "I'm a Recruiter"

Add a third, smaller access link below those two buttons:

Design of the admin access link:
- Text: "Admin Portal →"
- Style: NOT a full button — a subtle text link
- Font: DM Mono, 12px, letter-spacing: 0.15em
- Color: #6b7280 (muted gray) normally
- Hover: gold (#C9A84C)
- A small shield icon (Lucide, 14px) to the left of the text, same muted gray
- Below the two main CTA buttons, centered
- Above it: a thin horizontal rule, 1px solid rgba(255,255,255,0.08), 
  width 160px, centered, with 16px margin above and below
- This makes it visually separated and subtle — not competing with the 
  main candidate/recruiter CTAs
- On click: navigates to Admin Login screen (Screen 15)

Do not change anything else on the landing page.

— — —

CHANGE 2 — MAKE ALL ADMIN DASHBOARD BUTTONS FUNCTIONAL:

Find the Admin Dashboard (Screen 16).
Wire up every interactive element with proper navigation and state changes.
Here is exactly what each button/element must do:

SIDEBAR NAVIGATION:
- "Overview" → stays on Admin Dashboard main view (already active)
- "Users" → clicking it highlights it as active (gold border + gold text) 
  and scrolls main content to / shows the User Management section
- "Job Postings" → highlights as active and scrolls to / shows 
  the Job Postings section
- "Statistics" → highlights as active and scrolls to / shows 
  the System Statistics section
- "Settings" → highlights as active, shows a simple Settings panel:
  A centered card with placeholder settings:
  "Platform Name", "Contact Email", "Maintenance Mode" toggle (off by default)
  Save button in gold. Keep it minimal.
- "Sign Out" → navigates back to Admin Login page (Screen 15)

USER MANAGEMENT TABLE — Action buttons:
Each row has a "•••" action dropdown. 
When clicked, it opens a small dropdown menu with 3 options:
  "View Profile" — opens a simple modal overlay:
    Shows: Name, Email, Role badge, Status badge, Join Date, 
    "Close" button at bottom
  "Suspend User" — clicking changes that row's status badge 
    from "Active" (green) to "Suspended" (red) instantly
    Show a small confirmation toast notification at top-right:
    "User suspended successfully" with a red dot, auto-dismisses after 2s
  "Delete User" — shows a confirmation modal:
    Title: "Delete User?" in Playfair Display
    Body: "This action cannot be undone. The user and all their data 
    will be permanently removed."
    Two buttons: "Cancel" (ghost) · "Confirm Delete" (red background)
    On confirm: row disappears with a fade-out animation
    Toast: "User deleted" in red at top-right

"View all users →" link:
  Expands the table to show 10 rows instead of 5
  Link text changes to "Show less ↑"

JOB POSTINGS SECTION — Action buttons:
Each job card has two buttons:

  "Keep" button:
    On click: badge changes to "Approved" (green)
    Toast notification: "Job posting approved" with green dot

  "Remove" button:
    On click: shows confirmation modal:
    Title: "Remove Job Posting?"
    Body: "This job will be hidden from all candidates immediately."
    Buttons: "Cancel" (ghost) · "Confirm Remove" (red)
    On confirm: card fades out and disappears
    Toast: "Job posting removed" in red at top-right

"View all postings →" link:
  Shows 3 more job cards below (total 6)
  Link text changes to "Show less ↑"

KPI CARDS:
- Each KPI card is clickable
- On click: card gets a subtle gold border glow (1px solid #C9A84C, 
  box-shadow: 0 0 0 2px rgba(201,168,76,0.2))
- A small tooltip appears below the card with extra context:
  Total Users card → "8,203 Candidates · 4,644 Recruiters"
  Active Job Listings → "41 posted today · 12 flagged for review"
  Platform Matches Made → "↑ 12% from last week"

SYSTEM STATISTICS BARS:
- Each bar is animated on page load:
  Bars start at 0 width and fill to their value over 800ms 
  with an ease-out transition
- On hover over any bar: 
  The bar brightens slightly (gold becomes #e0c060)
  A tooltip shows the exact number

TOP HEADER — Notification Bell:
- Bell icon has an amber dot indicator (unread count: 3)
- On click: opens a small dropdown notification panel (240px wide):
  3 notifications:
  🔴 "New recruiter account pending verification — TechCorp"
  🟡 "Job posting flagged by AI — contains biased keyword"  
  🟢 "System health check passed — all models normal"
  Each notification: 13px DM Sans, timestamp in DM Mono muted
  "Mark all as read" link at bottom in gold
  On click: amber dot disappears from bell icon

— — —

FINAL RULES:
- All modals: centered overlay, dark background (#1a1a1a), 
  border-radius 16px, border 1px solid #2a2a3e, padding 32px
- All toast notifications: top-right corner, #1a1a1a background, 
  left border 3px solid (red/green depending on action), 
  DM Sans 13px, auto-dismiss after 2 seconds
- All transitions and animations must match the smooth, 
  professional motion already used in the existing 14 screens
- Do not touch, move, or redesign any existing screen
- Only add the Admin Portal link to landing page
- Only add interactivity to the admin dashboard
- All font, color, spacing decisions must match existing design system exactly