# URL Shortener

![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

High-performance URL shortener with enterprise link attribution, granular analytics, and tiered subdomain routing, built with Spring Boot and React.

## Table of Contents
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Setup](#setup)
- [Docker](#docker)
- [Configuration](#configuration)
- [Network Architecture](#network-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)

## Architecture

The system is deployed using a decoupled, domain-driven architecture that segments public traffic, management interfaces, and API services across dedicated subdomains.

### Three-Pillar Subdomain Design
The platform divides incoming traffic into three distinct functional pillars:

1. **Root Domain (`trim.com` / `localhost`)**:
   - Serves the public landing page (`/`).
   - Resolves all short link redirects (`/{hash}`).
   - Proxies short link resolution directly to the Spring Boot backend while maintaining fast static asset delivery.
   - Automatically redirects any dashboard paths accessed on the root domain to the dedicated application subdomain.

2. **App Subdomain (`app.trim.com` / `app.localhost`)**:
   - Serves the authenticated React single-page application (SPA).
   - Hosts the user dashboard, link manager, folder organization, tag categorization, analytics dashboards, and account settings.
   - Utilizes client-side routing with fallback for direct deep linking.

3. **API Subdomain (`api.trim.com` / `api.localhost`)**:
   - Exposes the Spring Boot REST API endpoints.
   - Handles authentication, link CRUD, QR generation, analytics aggregation, and user management.
   - Manages Cross-Origin Resource Sharing (CORS) preflight requests and enforces stateless JWT validation.

### Nginx Smart Traffic Routing
Nginx serves as an intelligent reverse proxy and traffic cop at the perimeter:
- **Root Domain Traffic**: Checks if the request path matches an authenticated frontend route (`/dashboard`, `/analytics`, `/folders`, `/tags`, `/settings`, etc.) and performs an HTTP 301 redirect to the `app.` subdomain. All single-segment short link hashes (`/{hash}`) are proxied to the backend for resolution and click tracking.
- **App Domain Traffic**: Serves compiled static frontend assets and routes all sub-paths to `/index.html` for React Router resolution.
- **API Domain Traffic**: Intercepts `OPTIONS` preflight requests to terminate CORS at the edge and proxies API requests directly to the Spring Boot service (`backend:8080`).

## Key Features

- **Redis Caching**: Sub-millisecond latency link resolution with automated cache eviction on URL update or deletion.
- **Asynchronous Analytics**: Geo-location, device, browser, and operating system parsing in background threads without delaying HTTP 302 redirects.
- **Password Protection**: Secure bcrypt-hashed password challenges for sensitive destination links.
- **Link Expiration & Scheduled Sweeper**: Time-bound short links with automated background cleanup and dedicated expiration landing pages.
- **Custom Aliases**: Custom short-code slug generation with duplicate detection and validation.
- **Live QR Codes**: Dynamic QR code generation for both authenticated short URLs and unauthenticated live previews.
- **Folder Organization**: Categorize links into custom folders with aggregated folder-level analytics.
- **Tagging System**: Multi-label colored tag system for advanced filtering and classification.
- **Stateless JWT Authentication**: Dual-token authentication with short-lived access tokens and secure HTTP-only refresh tokens.
- **Account Management**: Self-service profile updates, password modification, and transactional hard-deletion of user data.

## Setup

### Prerequisites
- Docker Engine (v20.10+)
- Docker Compose (v2.0+)

## Docker

To build and launch the complete production-grade application stack:

```bash
docker compose up -d --build
```

This command builds the backend and frontend images, provisions MySQL 8.0 and Redis 7 containers, applies database migrations, and exposes the services via Nginx on port `80` (mapped to internal port `8080`) and Spring Boot on port `8080`.

## Configuration

Before running the application, copy `.env.example` to `.env` and provide the required environment values:

```bash
cp .env.example .env
```

<details>
<summary><strong>Click to expand Environment Variables Reference Table</strong></summary>

<br>

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `API_DOMAIN_NAME` | Subdomain host for API endpoints (no protocol or port) | `api.localhost` | `api.trim.com` |
| `APP_DOMAIN_NAME` | Subdomain host for React SPA dashboard (no protocol or port) | `app.localhost` | `app.trim.com` |
| `ROOT_DOMAIN_NAME` | Root domain host for landing page and short links | `localhost` | `trim.com` |
| `ROOT_DOMAIN_URL` | Fully qualified base URL used by Spring to generate short links | `http://localhost:8080` | `https://trim.com` |
| `APP_DOMAIN_URL` | Allowed origin URL for Spring Security CORS configuration | `http://localhost:5173,http://localhost` | `https://app.trim.com` |
| `APP_DASHBOARD_URL` | Base URL used for redirecting password-protected and expired links | `http://app.localhost` | `https://app.trim.com` |
| `FRONTEND_URL` | General frontend origin URL | `http://localhost` | `https://trim.com` |
| `VITE_API_BASE_URL` | Base API URL used by Axios in the React frontend | `http://localhost:8080` | `https://api.trim.com` |
| `VITE_ROOT_DOMAIN` | Short link prefix displayed in the frontend link creator | `http://localhost:8080` | `https://trim.com` |
| `MYSQL_ROOT_PASSWORD` | Root administrative password for MySQL database | `root` | `my_secure_db_password` |
| `MYSQL_DATABASE` | Target MySQL database name | `url_shortener` | `url_shortener` |
| `SPRING_DATASOURCE_URL` | JDBC connection string for Spring Boot | `jdbc:mysql://mysql:3306/url_shortener...` | `jdbc:mysql://mysql:3306/url_shortener` |
| `SPRING_DATASOURCE_USERNAME` | Database username for Spring Boot connection | `root` | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Database password for Spring Boot connection | `root` | `my_secure_db_password` |
| `REDIS_HOST` | Hostname of the Redis instance | `redis` | `redis` |
| `REDIS_PORT` | Port of the Redis instance | `6379` | `6379` |
| `JWT_SECRET` | 256-bit secret key used to sign and verify HMAC-SHA JWT tokens | - | `your_256_bit_secure_random_key` |
| `ROOT_USER_EMAIL` | Email address for initial administrative root user | `admin@example.com` | `admin@trim.com` |
| `ROOT_USER_PASSWORD` | Initial password for the administrative root user | `root` | `secure_admin_password` |

</details>

## Network Architecture

The application defines a multi-tier network topology via Docker Compose:

- `db_network`: Internal isolated network bridging the Spring Boot backend, MySQL, and Redis containers. Database ports are not directly accessible from outside the container network in production.
- `web_network`: Public-facing network bridging Nginx and the Spring Boot application for HTTP routing and reverse proxy traffic.

## Technology Stack

- **Backend**: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Hibernate, Redis, Flyway, ZXing (QR Codes), Yauaa (User-Agent parsing).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Axios, React Router 6.
- **Database & Cache**: MySQL 8.0, Redis 7 (Alpine).
- **Infrastructure**: Nginx, Docker, Docker Compose

## Project Structure

```text
URL-Shortener/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/url_shortener/url_shortener/
│   │   │   │   ├── admin/
│   │   │   │   ├── analytics/
│   │   │   │   ├── auth/
│   │   │   │   ├── common/
│   │   │   │   ├── exception/
│   │   │   │   ├── urls/
│   │   │   │   └── users/
│   │   │   └── resources/
│   │   │       ├── db/migration/
│   │   │       └── application.yaml
│   │   └── test/
│   ├── pom.xml
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── types/
│   │   └── utils/
│   ├── nginx/
│   │   └── templates/default.conf.template
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
└── LICENSE
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for the full license text.
