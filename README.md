# trim

High-performance URL shortener with enterprise link attribution, granular analytics, dynamic QR codes, and tiered subdomain routing, built with Spring Boot 3 and React 19.

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat&logo=nginx&logoColor=white)

## Table of Contents
- [Architecture](#architecture)
  - [Three-Pillar Subdomain Design](#three-pillar-subdomain-design)
  - [Nginx Smart Traffic Routing](#nginx-smart-traffic-routing)
  - [AWS Application Load Balancer Setup](#aws-application-load-balancer-setup)
- [Key Features](#key-features)
- [Setup & Deployment](#setup--deployment)
  - [Prerequisites](#prerequisites)
  - [Docker Compose Quickstart](#docker-compose-quickstart)
  - [Local Development](#local-development)
- [Configuration](#configuration)
- [Network Architecture](#network-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [License](#license)

## Architecture

The system is deployed using a modern, decoupled **Microservices Architecture** that segments public traffic, management interfaces, and API services across dedicated subdomains and independent Spring Boot services behind an intelligent Spring Cloud API Gateway:

```
                            ┌─────────────────────────────────┐
                            │   Nginx Reverse Proxy (:80)     │
                            └────────────────┬────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
    trim.com / localhost           app.trim.com / app.localhost   api.trim.com / api.localhost
    (Landing & Redirects)             (React SPA Frontend)             (Spring Cloud Gateway)
               │                                                                   │
               ▼                                                                   ▼
    ┌──────────────────────┐                                       ┌───────────────────────────────┐
    │ redirect-service     │                                       │ api-gateway (:8080)           │
    │ (:8084)              │                                       │ (JWT / Role Auth / Rate Limit)│
    └──────────┬───────────┘                                       └───────────────┬───────────────┘
               │                                                                   │
               ├───────────────────────────────┬───────────────────┬───────────────┼───────────────┐
               ▼                               ▼                   ▼               ▼               ▼
    ┌──────────────────────┐       ┌──────────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  auth-service:8081   │       │   core-service:8082  │ │analytics:8083│ │ admin:8085 │ │ redirect:8084 │
    │  (Users, OAuth, JWT) │       │   (Links, Folders,   │ │ (Clicks,    │ │ (Audit,     │ │ (Fast Hash  │
    │                      │       │    Tags, Channels)   │ │  Geo, UA)   │ │  Settings)  │ │  Resolution)│
    └──────────┬───────────┘       └──────────┬───────────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
               │                              │                    │               │               │
               ▼                              ▼                    ▼               ▼               ▼
        MySQL (auth db)                MySQL (core db)      MySQL (analytics) MySQL (admin)   Redis (Cache)
```

### Microservices Ecosystem

1. **`api-gateway` (Port `8080`)**:
   - Single unified entry point for all API requests.
   - Enforces stateless JWT validation and role-based access control (`ADMIN`, `ROOT`, `USER`).
   - Built-in distributed Redis rate limiting and fallback handlers.
   - Injects authenticated user context headers (`X-User-Id`, `X-User-Role`, `X-User-Email`) downstream.

2. **`auth-service` (Port `8081`)**:
   - Authentication, registration, email verification, and password resets.
   - Dual-token lifecycle: short-lived access JWTs and HTTP-only refresh tokens.
   - Google and GitHub OAuth2 social logins.
   - Real-time perimeter IP blocking synchronized via Redis (`security:blocked_ips`).

3. **`core-service` (Port `8082`)**:
   - Core link management: URL shortening, custom aliases, dynamic QR codes.
   - Hierarchical folder organization, color-coded tagging, custom channels, and UTM templates.
   - Heuristic and Google Safe Browsing threat detection with Redis-synchronized blacklist (`security:blacklisted_domains`).
   - Scheduled automated link expiration sweeper.

4. **`analytics-service` (Port `8083`)**:
   - Asynchronous, non-blocking click tracking.
   - User-Agent device, operating system, and browser parsing (via Yauaa).
   - Country and IP geolocation attribution.
   - Aggregated timeseries, country heatmaps, and folder-level metrics.

5. **`redirect-service` (Port `8084`)**:
   - Ultra-low-latency short link resolution (`/{hash}`).
   - Direct Redis cache read ($O(1)$) with MySQL fallback.
   - Password protection challenge unlock interface (`/secure/:hash`).
   - Asynchronous event publishing on link click.

6. **`admin-service` (Port `8085`)**:
   - Administrative portal and platform KPI dashboard.
   - Link moderation, triage hub, and quarantine management.
   - Immutable SHA-256 hash-chained audit logs with integrity verification.
   - Dynamic system settings vault (`.env` synchronization and live SMTP testing).
   - Domain blacklist and perimeter blocked IP management with real-time Redis distribution.
   - Resilient multi-service aggregation with graceful fallback degradation.

7. **`common-lib`**:
   - Shared domain entities, DTOs, Kafka/internal events, and security constants used across all services.

### Three-Pillar Subdomain Design
The platform divides incoming traffic into three distinct functional pillars:

1. **Root Domain (`trim.com` / `localhost`)**:
   - Serves the public landing page (`/`).
   - Resolves all short link redirects (`/{hash}`).
   - Proxies short link resolution directly to `redirect-service:8084`.
   - Automatically redirects dashboard paths to `app.localhost`.

2. **App Subdomain (`app.trim.com` / `app.localhost`)**:
   - Serves the compiled React 19 SPA frontend.
   - Hosts user dashboard, link manager, analytics charts, and administrative portal.

3. **API Subdomain (`api.trim.com` / `api.localhost`)**:
   - Proxies requests to `api-gateway:8080`.
   - Routes traffic downstream to the respective microservices.

## Key Features

- **Sub-Millisecond Redis Caching**: Cached link lookups with aggressive cache eviction upon URL update, expiration, or deletion.
- **Asynchronous Click Analytics**: Non-blocking click processing leveraging Spring thread pools, the Yauaa library for User-Agent parsing (devices, browsers, OS), and IP-based geo-location logging without delaying HTTP 302 redirects.
- **Comprehensive Analytics Dashboard**: 30-day timeseries click volume charts, device breakdown pie charts, OS distribution bars, top browser metrics, country heatmaps, folder-level analytics, and global usage statistics.
- **Password Protection**: Secure bcrypt-hashed password protection for short links with an interactive unlock challenge interface (`/secure/:hash`).
- **Link Expiration & Scheduled Sweeper**: Time-bound short links with an automated background worker (`@Scheduled(fixedRate = 60000)`) and a dedicated landing page for expired URLs (`/expired`).
- **Custom Aliases**: User-defined short link slugs with instant uniqueness validation and collision avoidance.
- **Dynamic QR Codes**: PNG QR code generation for shortened links via ZXing, with live preview support for arbitrary URLs on the landing page.
- **Folder Organization**: Hierarchical link grouping with folder CRUD and aggregate folder-level click metrics.
- **Color-Coded Tagging System**: Multi-label colored tagging for multi-dimensional filtering, searching, and categorization.
- **Stateless JWT Dual-Token Authentication**: 5-minute access tokens paired with 7-day HTTP-only refresh tokens for seamless, secure user sessions.
- **Account Self-Service**: User profile updates, password change with current password validation, and transactional hard deletion cascading across links, tags, folders, and analytics.
- **Theme Support**: Seamless dark and light mode toggle with local storage persistence.

## Setup & Deployment

### Prerequisites
- Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- Java 21 (for local backend development)
- Node.js 18+ and npm (for local frontend development)

### Docker Compose Quickstart
To build and launch the complete production-grade application stack:

```bash
# 1. Clone repository
git clone https://github.com/your-username/trim.git
cd trim

# 2. Copy environment file
cp .env.example .env

# 3. Build and launch all services
docker compose up -d --build
```

This starts MySQL 8.0, Redis 7 (Alpine), the 6 Spring Boot microservices, and the Nginx perimeter reverse proxy:
- **Public Landing & Short Links**: `http://localhost` (or `http://trim.com`)
- **App Dashboard**: `http://app.localhost` (or `http://app.trim.com`)
- **API Gateway (Edge Router)**: `http://api.localhost` (or `http://api.trim.com` / `http://localhost:8080`)
- **Direct Service Endpoints**:
  - `auth-service`: `http://localhost:8081`
  - `core-service`: `http://localhost:8082`
  - `analytics-service`: `http://localhost:8083`
  - `redirect-service`: `http://localhost:8084`
  - `admin-service`: `http://localhost:8085`

### Local Development

#### Backend Development
```bash
cd backend
./mvnw clean package -DskipTests
```
You can run any individual service (e.g. `api-gateway`, `core-service`, `auth-service`) using:
```bash
./mvnw spring-boot:run -pl core-service
```

#### Frontend Development
```bash
cd frontend
npm install
npm run dev
```
Development server runs at `http://localhost:5173`.

## Configuration

Before running the application, copy `.env.example` to `.env` and configure your environment values:

```bash
cp .env.example .env
```

### Deployment Profiles (Dual-Mode Operation)

Trim is engineered to support two operational profiles out-of-the-box:

1. **Option A: Self-Hosted Mode**
   - Ideal for single-user homelabs, internal tools, or private servers.
   - Initial root admin (`ROOT_USER_EMAIL` / `ROOT_USER_PASSWORD`) is auto-verified on startup.
   - Public registrations can be locked (`ALLOW_REGISTRATION=false`).
   - Private domains (`.local`, `.lan`, `localhost`) are accepted without DNS MX lookups.
   - Zero required external services: works without SMTP or OAuth. Unconfigured social buttons appear muted/grayed out, and reset tokens log directly to console logs.

2. **Option B: Multi-Tenant SaaS Mode**
   - Production multi-user setup with public self-service registration (`ALLOW_REGISTRATION=true`).
   - Mandatory email verification links before login (`REQUIRE_EMAIL_VERIFICATION=true`).
   - Full Google and GitHub OAuth 2.0 social authentication and transactional SMTP emails.

<details>
<summary><strong>Click to expand Environment Variables Reference Table</strong></summary>

<br>

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `APP_SELF_HOSTED` | Enable self-hosted single-admin mode | `false` | `true` |
| `ALLOW_REGISTRATION` | Permit public visitor registration on the instance | `true` | `false` |
| `REQUIRE_EMAIL_VERIFICATION` | Enforce email verification token before allowing login | `true` | `false` |
| `API_DOMAIN_NAME` | Subdomain host for API endpoints (no protocol or port) | `api.localhost` | `api.trim.com` |
| `APP_DOMAIN_NAME` | Subdomain host for React SPA dashboard (no protocol or port) | `app.localhost` | `app.trim.com` |
| `ROOT_DOMAIN_NAME` | Root domain host for landing page and short links | `localhost` | `trim.com` |
| `ROOT_DOMAIN_URL` | Fully qualified base URL used by Spring to generate short links | `http://localhost:8080` | `https://trim.com` |
| `APP_DOMAIN_URL` | Allowed origin URL for Spring Security CORS configuration | `http://localhost:5173,http://localhost` | `https://app.trim.com` |
| `APP_DASHBOARD_URL` | Base URL used for redirecting password-protected and expired links | `http://app.localhost` | `https://app.trim.com` |
| `FRONTEND_URL` | General frontend origin URL | `http://localhost` | `https://trim.com` |
| `VITE_API_BASE_URL` | Base API URL used by Axios in the React frontend | `http://api.localhost` | `https://api.trim.com` |
| `VITE_ROOT_DOMAIN` | Short link prefix displayed in the frontend link creator | `http://localhost` | `https://trim.com` |
| `MYSQL_ROOT_PASSWORD` | Root administrative password for MySQL database | `rootpassword123` | `my_secure_db_password` |
| `MYSQL_DATABASE` | Primary database name (individual services use `_auth`, `_core`, `_analytics`, `_admin`) | `url_shortener_core` | `url_shortener_core` |
| `SPRING_DATASOURCE_USERNAME` | Database username for service connections | `root` | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Database password for service connections | `root` | `my_secure_db_password` |
| `REDIS_HOST` | Hostname of the Redis instance | `redis` | `redis` |
| `REDIS_PORT` | Port of the Redis instance | `6379` | `6379` |
| `JWT_SECRET` | 256-bit secret key used to sign and verify HMAC-SHA JWT tokens | - | `your_256_bit_secure_random_key` |
| `ROOT_USER_EMAIL` | Email address for initial administrative root user | `admin@example.com` | `admin@trim.com` |
| `ROOT_USER_PASSWORD` | Initial password for the administrative root user | `root` | `secure_admin_password` |
| `SPRING_MAIL_HOST` | Outgoing SMTP mail server host | - | `smtp.gmail.com` |
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID | - | `google-client-id` |
| `OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth client ID | - | `github-client-id` |

</details>

## Network Architecture

The application defines a multi-tier network topology via Docker Compose:

- `db_network`: Internal isolated network bridging the Spring Boot backend, MySQL, and Redis containers. Database ports are not directly accessible from outside the container network in production.
- `web_network`: Public-facing network bridging Nginx and the Spring Boot application for HTTP routing and reverse proxy traffic.

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.5, Spring Security 6, Spring Data JPA, Hibernate, Redis, Flyway, ZXing, Yauaa, Lombok, MapStruct, SpringDoc OpenAPI |
| **Frontend** | React 19, TypeScript 5, Vite 8, Tailwind CSS 3, Framer Motion 12, Recharts 3, Lucide Icons, React Router 7, React Hot Toast, React Loading Skeleton, Axios |
| **Database & Cache** | MySQL 8.0, Redis 7.0 (Alpine) |
| **Infrastructure & DevOps** | Nginx (Alpine), Docker, Docker Compose, AWS Application Load Balancer (ALB) |
| **Testing** | JUnit 5, Mockito, Spring Boot Test, H2 Database, Vitest 4, React Testing Library 16, Playwright, Oxlint |

## Project Structure

```text
trim/
├── backend/
│   ├── common-lib/             # Shared DTOs, events, and security constants
│   ├── api-gateway/            # Spring Cloud Gateway (Port 8080)
│   ├── auth-service/           # User Auth, OAuth2, JWT & IP Blocking (Port 8081)
│   ├── core-service/           # Links, Folders, Tags, QR Codes (Port 8082)
│   ├── analytics-service/      # Click Tracking, Geolocation, Device Analytics (Port 8083)
│   ├── redirect-service/       # High-speed Hash Resolution & Cache (Port 8084)
│   ├── admin-service/          # Admin Portal, Audit Logs, Settings, Blacklist (Port 8085)
│   └── pom.xml                 # Maven Multi-Module Root POM
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios instance & token refresh interceptors
│   │   ├── components/         # Modals, forms, tables, logos, theme toggle
│   │   ├── context/            # AuthContext & ThemeContext providers
│   │   ├── layouts/            # DashboardLayout shell with responsive sidebar
│   │   ├── pages/              # Public & protected route views
│   │   ├── types/              # TypeScript interfaces and data types
│   │   ├── utils/              # Color palettes & helper functions
│   │   └── test/               # Vitest setup & mocks
│   ├── nginx/
│   │   └── templates/default.conf.template  # Perimeter Subdomain routing template
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
└── LICENSE
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for the full license text.
