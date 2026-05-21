# Authentication and Dashboard Integration Plan

Implement complete authentication flow with login page and connect dashboard to real backend data, eliminating all hardcoded mock data.

## Current State
- Dashboard shows hardcoded stats (24 documents, 12 analyzed, risk 45, 3 pending)
- No authentication system exists
- Backend has document routes but no `/stats` endpoint
- Backend has no authentication routes

## Implementation Plan

### Phase 1: Frontend Authentication Service
**File:** `client/features/auth/authService.ts`
- Create User interface with id, name, email, token
- Implement login() function calling POST /auth/login
- Implement getCurrentUser() to read from localStorage
- Implement setCurrentUser() to save to localStorage
- Implement logout() to clear localStorage

### Phase 2: Login Page
**File:** `client/app/login/page.tsx`
- Create responsive login form with name and email fields
- Use authService.login() on form submit
- Redirect to dashboard on successful login
- Show loading state and error messages
- Purple gradient background matching LegalAI branding

### Phase 3: Dashboard Service
**File:** `client/features/dashboard/dashboardService.ts`
- Create DashboardStats interface
- Create RecentDocument interface
- Implement getDashboardStats() calling GET /documents/stats
- Implement getRecentDocuments() calling GET /documents with query params

### Phase 4: Update Dashboard Page
**File:** `client/app/page.tsx`
- Replace hardcoded stats array with useState and useEffect
- Add authentication check - redirect to /login if no user
- Fetch real data on component mount
- Show loading spinner while fetching
- Show error message if fetch fails
- Display real stats and documents from API
- Add clickable document links

### Phase 5: Backend Auth Routes
**File:** `server/features/auth/auth.route.js` (new)
- Create POST /auth/login endpoint
- Validate name and email fields
- Generate JWT token with user info
- Return user object with token

**File:** `server/app.js` (update)
- Import and register auth routes at /api/auth

### Phase 6: Backend Dashboard Stats
**File:** `server/features/document/document.route.js` (update)
- Add GET /documents/stats endpoint
- Query MongoDB for total document count
- Query for documents analyzed this month
- Calculate average risk score
- Query pending review count
- Return aggregated stats object

## Files to Create/Modify
1. `client/features/auth/authService.ts` - NEW
2. `client/app/login/page.tsx` - NEW
3. `client/features/dashboard/dashboardService.ts` - NEW
4. `client/app/page.tsx` - UPDATE (replace hardcoded data)
5. `server/features/auth/auth.route.js` - NEW
6. `server/app.js` - UPDATE (add auth routes)
7. `server/features/document/document.route.js` - UPDATE (add /stats)

## API Endpoints Required
- POST /api/auth/login - User login
- GET /api/documents/stats - Dashboard statistics
- GET /api/documents?limit=5&sort=createdAt:desc - Recent documents

## Dependencies
- jwt (server) - For token generation
- localStorage (client) - For token persistence

## Testing Steps
1. Navigate to /login
2. Enter name and email
3. Submit form
4. Verify redirect to dashboard
5. Verify stats load from backend
6. Verify documents list loads from backend
7. Refresh page - should stay logged in
8. Clear localStorage - should redirect to login
