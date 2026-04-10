# Frontend Application - URL Shortener

Modern single-page application (SPA) built with React 18, TypeScript, Vite, and Tailwind CSS, featuring link management, interactive analytics, and multi-subdomain routing support.

## Key Features

- **Framer Motion Animations**: Fluid page transitions, modal dialog animations, and interactive hover states using Framer Motion.
- **Skeleton Loaders**: Dedicated skeleton loading placeholders preventing layout shifts during asynchronous data fetches across tables and cards.
- **Toast Notification System**: Integrated `react-hot-toast` notifications providing contextual feedback for API operations, clipboard actions, and coming-soon alerts.
- **Shared Layout Architecture**: Centralized `DashboardLayout` wrapping authenticated routes with a persistent sidebar, active navigation indicators, theme toggles, and responsive mobile drawers.
- **Dynamic Theming**: Light and dark mode support managed through React Context and persisted in local storage.
- **Subdomain Routing Support**: Built-in compatibility with the 3-pillar subdomain architecture (`app.domain.com` for application views and `domain.com` for root landing and link resolution).

## Setup

### Prerequisites
- Node.js 18.0+
- npm (Node Package Manager)

### Steps to Run Locally
1. Navigate to the `frontend` directory:
```bash
cd frontend
```
2. Install dependencies:
```bash
npm install
```
3. Create your local environment configuration:
```bash
cp .env.example .env
```
4. Start the Vite development server:
```bash
npm run dev
```
The frontend will be accessible at `http://localhost:5173`.

## Configuration

The frontend application requires the following environment variables:

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base endpoint of the Spring Boot REST API | `http://localhost:8080` | `https://api.trim.com` |
| `VITE_ROOT_DOMAIN` | Base domain displayed in short link input prefixes | `http://localhost:8080` | `https://trim.com` |

## Pages & Routing

The client-side routing is organized into public access pages and authenticated views wrapped within the shared `DashboardLayout`.

### Public Routes

| Route | Component | Description |
| :--- | :--- | :--- |
| `/` | `HomePage` | Public landing page featuring instant URL shortening, live previews, and feature showcases. |
| `/login` | `LoginPage` | Authentication portal for account login and access token retrieval. |
| `/register` | `RegisterPage` | Account registration interface for new users. |
| `/expired` | `ExpiredPage` | Landing notice presented when navigating to an expired short URL. |
| `/secure/:hash` | `SecurePage` | Password authentication screen required to unlock password-protected destination links. |

### Protected Routes (Wrapped in `DashboardLayout`)

| Route | Component | Description |
| :--- | :--- | :--- |
| `/dashboard` | `DashboardPage` | Main link management table with search, folder filtering, tag badges, and quick action modals. |
| `/analytics` | `AnalyticsPage` | Aggregate performance overview across all user-owned links. |
| `/analytics/:hash` | `AnalyticsPage` | In-depth 30-day analytics dashboard with timeseries charts, device breakdowns, and geo-distribution. |
| `/folders` | `FoldersPage` | Folder creation, management, and folder-level link aggregation. |
| `/tags` | `TagsPage` | Custom colored tag creation, editing, and deletion for multi-dimensional link classification. |
| `/settings` | `SettingsPage` | User profile details, account update forms, and account hard-delete controls. |
| `/settings/security` | `SecurityPage` | Password change form and security credentials management. |

## Core Components

| Component | Path | Description |
| :--- | :--- | :--- |
| `DashboardLayout` | `src/layouts/DashboardLayout.tsx` | Main shell with sidebar navigation, user profile header, and main content area. |
| `ProtectedRoute` | `src/components/ProtectedRoute.tsx` | Route guard validating JWT authentication and redirecting unauthenticated users. |
| `CreateLinkModal` | `src/components/CreateLinkModal.tsx` | Modal form supporting custom aliases, passwords, expiration dates, folders, and tags. |
| `EditLinkModal` | `src/components/EditLinkModal.tsx` | Modal form for editing existing link destinations and metadata. |
| `QrCodeModal` | `src/components/QrCodeModal.tsx` | Modal displaying generated QR code with image download capabilities. |
| `DeleteConfirmModal` | `src/components/DeleteConfirmModal.tsx` | Confirmation dialog for safe deletion of links, folders, and tags. |
| `Skeleton` | `src/components/Skeleton.tsx` | Reusable placeholder loading indicators for smooth UX during data fetching. |
