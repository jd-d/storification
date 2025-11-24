# TODO

## HIGH PRIORITY
- [x] Left hand side slide navigation for each story for easy navigation between story chapters/ slides
- [x] Fix annoying bug where pressing Next or Previous nav buttons hides the buttons behind blue title panel
- [ ] Convert entire site into Wiki (see detailed plan below)

## Wiki Implementation Plan

### Overview
Convert Storification into a collaborative wiki platform where users can edit content, track changes, and manage revisions. This will enable community-driven storytelling and educational content creation.

### Phase 1: Authentication & User Management (Foundation)
**Goal**: Enable users to create accounts and log in to track their contributions.

**Tasks**:
1. **User Registration System**
   - Feature: Allow users to create accounts with email/username and password
   - Feature: Email verification for new accounts
   - Feature: Password reset functionality
   - Implementation: Consider using Firebase Auth, Auth0, or custom backend with JWT

2. **User Login/Logout**
   - Feature: Secure login with session management
   - Feature: "Remember me" option
   - Feature: Logout functionality with session cleanup

3. **User Profiles**
   - Feature: Display username, avatar, and contribution statistics
   - Feature: Edit profile page (change avatar, bio, email preferences)
   - Feature: Public profile showing user's contribution history

4. **Permission System**
   - Feature: Define user roles (Anonymous, Registered, Editor, Admin)
   - Feature: Anonymous users can read only
   - Feature: Registered users can edit and create content
   - Feature: Editors can approve/reject edits
   - Feature: Admins have full control

### Phase 2: Content Editing System (Core Wiki Functionality)
**Goal**: Allow users to edit story content and pages.

**Tasks**:
1. **Edit Mode Toggle**
   - Feature: "Edit" button on each page for authorized users
   - Feature: Switch between read mode and edit mode
   - Feature: Visual indication when in edit mode

2. **Rich Text Editor**
   - Feature: WYSIWYG editor (What You See Is What You Get)
   - Feature: Support for headings, paragraphs, lists, bold, italic, links
   - Feature: Image upload and embedding
   - Feature: Preview mode to see changes before saving
   - Implementation options: TinyMCE, Quill, or ProseMirror

3. **Markdown Support (Alternative)**
   - Feature: Option to use Markdown for editing
   - Feature: Syntax highlighting for Markdown
   - Feature: Live preview of rendered Markdown
   - Feature: Markdown cheatsheet/help

4. **Save & Publish**
   - Feature: Save draft functionality
   - Feature: Publish changes with edit summary
   - Feature: Cancel/discard changes option
   - Feature: Automatic save every N seconds (auto-save)

### Phase 3: Version Control & History (Essential Wiki Feature)
**Goal**: Track all changes and allow reverting to previous versions.

**Tasks**:
1. **Edit History Storage**
   - Feature: Store every version of each page
   - Feature: Track who made each edit and when
   - Feature: Store edit summary/comment for each change
   - Implementation: Database schema with version table

2. **History View Page**
   - Feature: List all previous versions of a page
   - Feature: Show date, author, and edit summary for each version
   - Feature: Pagination for long histories
   - Feature: Filter by date range or author

3. **Diff Viewer**
   - Feature: Show differences between two versions
   - Feature: Highlight added content (green)
   - Feature: Highlight removed content (red)
   - Feature: Side-by-side or inline diff view
   - Implementation: Use diff libraries like diff-match-patch

4. **Revert Functionality**
   - Feature: Revert to any previous version
   - Feature: Confirmation dialog before reverting
   - Feature: Create new version when reverting (don't delete history)
   - Feature: Add automatic edit summary: "Reverted to version from [date]"

5. **Compare Versions**
   - Feature: Select any two versions to compare
   - Feature: Show detailed differences
   - Feature: Display metadata (author, date, edit summary)

### Phase 4: Collaboration Features (Wiki Essentials)
**Goal**: Enable multiple users to work together effectively.

**Tasks**:
1. **Discussion/Talk Pages**
   - Feature: Each story page has an associated discussion page
   - Feature: Users can discuss changes, ask questions, suggest improvements
   - Feature: Threaded comments or flat comment structure
   - Feature: Notifications for replies

2. **Recent Changes Feed**
   - Feature: Global recent changes page showing all edits across the site
   - Feature: Filter by story, date, or user
   - Feature: Show edit summaries and links to diff
   - Feature: RSS/Atom feed for recent changes

3. **Watchlist**
   - Feature: Users can "watch" specific pages
   - Feature: Receive notifications when watched pages are edited
   - Feature: Email notifications option
   - Feature: Watchlist management page

4. **Edit Conflict Resolution**
   - Feature: Detect when two users edit the same page simultaneously
   - Feature: Show warning about conflicting edits
   - Feature: Provide merge interface or force one user to refresh
   - Feature: Auto-merge if changes are in different sections

### Phase 5: Content Organization (Wiki Structure)
**Goal**: Make content discoverable and well-organized.

**Tasks**:
1. **Search Functionality**
   - Feature: Full-text search across all stories and pages
   - Feature: Search results with highlights
   - Feature: Filter by story or page type
   - Feature: Advanced search with operators
   - Implementation: Use Elasticsearch, Algolia, or built-in database search

2. **Categories & Tags**
   - Feature: Assign categories to pages (e.g., "Historical Stories", "Mythology")
   - Feature: Tags for more granular classification
   - Feature: Category pages listing all pages in that category
   - Feature: Tag cloud or tag list

3. **Wiki-style Links**
   - Feature: Internal linking between pages using [[Page Name]] syntax
   - Feature: Automatic link creation in editor
   - Feature: Backlinks (show which pages link to current page)
   - Feature: "What links here" feature

4. **Page Templates**
   - Feature: Create templates for common page structures
   - Feature: Story template, character template, location template
   - Feature: Easy insertion of templates when creating new pages
   - Feature: Template namespace (e.g., Template:Story)

### Phase 6: Moderation & Quality Control (Community Management)
**Goal**: Maintain content quality and prevent vandalism.

**Tasks**:
1. **Pending Changes/Flagged Revisions**
   - Feature: Edits from new users require approval before going live
   - Feature: Queue for moderators to review pending changes
   - Feature: Accept or reject pending edits
   - Feature: Graduated trust: trusted users' edits go live immediately

2. **Page Protection**
   - Feature: Protect pages from editing (full protection)
   - Feature: Semi-protection (only registered users can edit)
   - Feature: Protection log showing who protected what and why
   - Feature: Admin-only protection controls

3. **Vandalism Detection**
   - Feature: Automatic flagging of suspicious edits
   - Feature: Detect large deletions, spam links, profanity
   - Feature: Alert moderators to potential vandalism
   - Feature: Easy rollback/revert for vandalism

4. **User Blocking**
   - Feature: Admins can block disruptive users
   - Feature: Block by username or IP address
   - Feature: Temporary or permanent blocks
   - Feature: Block log and unblock functionality

### Phase 7: Technical Infrastructure (Backend)
**Goal**: Build the backend to support all wiki features.

**Tasks**:
1. **Database Design**
   - Feature: Design schema for pages, revisions, users, permissions
   - Feature: Optimize for version queries and diff operations
   - Feature: Consider using PostgreSQL or MongoDB
   - Feature: Plan for scalability

2. **API Development**
   - Feature: RESTful API for all wiki operations
   - Feature: Endpoints for authentication, editing, history, search
   - Feature: API documentation (OpenAPI/Swagger)
   - Feature: Rate limiting and security measures

3. **Backend Framework**
   - Feature: Choose backend technology (Node.js/Express, Python/Django, etc.)
   - Feature: Implement authentication middleware
   - Feature: Set up error handling and logging
   - Feature: Deploy backend (consider cloud platforms)

4. **Storage & Media Management**
   - Feature: Store images and media files
   - Feature: Image upload API with size/format validation
   - Feature: CDN integration for media delivery
   - Feature: Image optimization (thumbnails, compression)

### Phase 8: UI/UX Enhancements (Polish)
**Goal**: Make the wiki user-friendly and visually appealing.

**Tasks**:
1. **Edit Toolbar**
   - Feature: Formatting buttons in editor (bold, italic, link, etc.)
   - Feature: Insert image button
   - Feature: Help/documentation link
   - Feature: Keyboard shortcuts

2. **Mobile-Responsive Editing**
   - Feature: Ensure editor works well on mobile devices
   - Feature: Touch-friendly controls
   - Feature: Mobile-optimized history and diff views

3. **Notifications System**
   - Feature: In-app notifications for edits, replies, mentions
   - Feature: Notification center with unread indicators
   - Feature: Mark as read functionality
   - Feature: Email notification preferences

4. **Activity Dashboard**
   - Feature: Dashboard showing site statistics
   - Feature: Most edited pages, most active users
   - Feature: Recent uploads, new pages
   - Feature: Contribution graphs

### Phase 9: Advanced Features (Future Enhancements)
**Goal**: Add advanced wiki features for power users.

**Tasks**:
1. **Page Transclusion**
   - Feature: Include content from one page in another
   - Feature: {{Template inclusion}} syntax
   - Feature: Dynamic content updates

2. **Interwiki Links**
   - Feature: Link to other wikis or external resources
   - Feature: Configure interwiki prefixes
   - Feature: Show external link icon

3. **Export Functionality**
   - Feature: Export pages as PDF
   - Feature: Export as Markdown or HTML
   - Feature: Bulk export of entire story
   - Feature: Print-friendly version

4. **Internationalization (i18n)**
   - Feature: Multi-language support
   - Feature: Translate wiki interface
   - Feature: Language-specific content pages
   - Feature: Language switcher

### Implementation Roadmap

**Estimated Timeline**:
- **Phase 1-2** (Authentication & Editing): 6-8 weeks
- **Phase 3** (Version Control): 4-6 weeks  
- **Phase 4** (Collaboration): 4-6 weeks
- **Phase 5** (Organization): 3-4 weeks
- **Phase 6** (Moderation): 3-4 weeks
- **Phase 7** (Backend Infrastructure): 8-10 weeks (can be done in parallel)
- **Phase 8** (UI/UX Polish): 3-4 weeks
- **Phase 9** (Advanced Features): Ongoing as needed

**Total Estimated Time**: 6-9 months for full wiki functionality

**Technology Stack Recommendations**:
- **Frontend**: Keep existing HTML/CSS/JS, add React or Vue.js for complex UI
- **Backend**: Node.js + Express.js OR Python + Django/Flask
- **Database**: PostgreSQL (excellent for versioning) OR MongoDB (flexible schema)
- **Authentication**: Firebase Auth, Auth0, or custom JWT
- **Editor**: Quill.js or TinyMCE
- **Diff Library**: diff-match-patch
- **Hosting**: GitHub Pages + Netlify/Vercel for frontend, AWS/GCP/Heroku for backend

**Security Considerations**:
- Input sanitization to prevent XSS attacks
- CSRF protection on all forms
- Rate limiting on API endpoints
- Secure password storage (bcrypt)
- HTTPS everywhere
- Content Security Policy headers

**Notes**:
- Start with Phase 1-3 for MVP (Minimum Viable Product)
- Phases can overlap or be reordered based on priorities
- Consider using existing wiki software (MediaWiki, DokuWiki) as reference
- Regular backups of all content and user data essential

## DONE
- [x] Add a manifest.json file for PWA support.
- [x] Create a template icon for favicon and PWA.
- [x] Link manifest and favicon in index.html.
- [x] Convert template.svg to template.png.
- [x] Update `README.md` with PWA feature.
- [x] Redesign `index.html` to be more attractive.
- [x] Create `assets/css/style.css` with new styles.
- [x] Create `assets/js/main.js`.
- [x] Add Apple touch icon link to `index.html`.
- [x] Update `README.md` with all latest features.
- [x] Update `index.html` with all latest features.
