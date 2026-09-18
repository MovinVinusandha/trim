# Backend Services - trim

High-performance, decoupled **Spring Boot 3 Multi-Module Microservices Architecture** powering URL redirection, real-time analytics, user authentication, and enterprise administration behind an intelligent Spring Cloud API Gateway.

## Microservices Modules

| Service | Port | Database | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **`common-lib`** | - | - | Shared DTOs, events, security constants, and model contracts. |
| **`api-gateway`** | `8080` | Redis | Single entry point, JWT authentication filter, role authorization, and distributed rate limiting. |
| **`auth-service`** | `8081` | `url_shortener_auth` | User accounts, registration, email verification, Google/GitHub OAuth2, and perimeter IP blocking. |
| **`core-service`** | `8082` | `url_shortener_core` | Link shortening, custom slugs, dynamic QR codes, folder organization, tags, and threat scanner. |
| **`analytics-service`** | `8083` | `url_shortener_analytics` | Asynchronous click tracking, Yauaa User-Agent parsing, IP geolocation, and timeseries stats. |
| **`redirect-service`** | `8084` | `url_shortener_core` / Redis | High-speed link resolution (`/{hash}`), Redis cache hits, and password protection unlock. |
| **`admin-service`** | `8085` | `url_shortener_admin` | Platform KPI overview, link triage & moderation, audit logs, dynamic settings, and Redis sync. |

## Key Architectural Features

- **Decoupled Database Boundaries**: Each microservice manages its own dedicated MySQL database schema with zero cross-database JOINs.
- **Shared Redis Event & Sync Bus**: Administrative domain blacklists, perimeter blocked IPs, and dynamic system settings are pushed to Redis by `admin-service` and consumed in real-time ($O(1)$) by `core-service` and `auth-service`.
- **Fault-Tolerant Resilience**: `admin-service` incorporates graceful fallback degradation for inter-service REST calls. If an upstream service is temporarily unavailable, the admin dashboard renders with safe fallback defaults instead of failing with HTTP 500.
- **UTC Everywhere Timezone Standard**: Global UTC timezone enforcement at the JVM level (`TimeZone.setDefault("UTC")`) with ISO-8601 UTC timestamp serialization across all entities, DTOs, and API responses.
- **Scheduled Expiration Sweeper**: Automated background worker (`@Scheduled(fixedRate = 60000)`) in `core-service` deactivating expired links and evicting stale cache keys from Redis.
- **Stateless JWT Security**: Dual-token architecture issuing short-lived access tokens (15 minutes) and securing long-lived refresh tokens (7 days) in HTTP-only, Secure cookies.

## Setup & Local Development

### Prerequisites
- Java 21 (JDK)
- Maven 3.9+
- MySQL 8.0+
- Redis 7.0+

### Building All Modules
```bash
cd backend
./mvnw clean package -DskipTests
```

### Running the Complete Stack
From the project root:
```bash
docker compose up -d --build
```

## API Endpoints

### System & Documentation

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` / `/api/health` | No | System health status and application version check. |
| `GET` | `/swagger-ui/index.html` | No | Interactive Swagger UI API documentation. |
| `GET` | `/v3/api-docs` | No | OpenAPI 3.0 specification JSON schema. |

### Authentication

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/auth/config` | No | Retrieve public instance authentication capabilities (registration status, OAuth providers, SMTP readiness). |
| `POST` | `/auth/login` | No | Authenticate credentials and receive an Access Token and Refresh Token cookie. |
| `POST` | `/auth/refresh` | Cookie | Issue a new Access Token using the valid `refreshToken` cookie. |
| `GET` | `/auth/me` | Yes | Retrieve the profile details of the currently authenticated user. |

### URLs & Redirection

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/shorten` | Yes | Create a new short URL with optional alias, password, expiration, folder, and tags. |
| `GET` | `/{hash}` | No | Resolve short link, enforce expiration/password checks, and redirect with HTTP 302. |
| `POST` | `/unlock/{hash}` | No | Validate password for a protected link and return the destination URL. |
| `GET` | `/url/{hash}` | Yes* | Retrieve metadata and live click counts for a specific short URL. |
| `PUT` | `/url/{hash}` | Yes* | Update destination URL, alias, expiration, folder, or tags and evict cache. |
| `DELETE` | `/url/{hash}` | Yes* | Delete short URL and evict its cached entry from Redis. |
| `GET` | `/url/{hash}/qr` | Yes* | Generate and return a PNG QR code image for a specific short link. |
| `GET` | `/url/all` | Yes (ROOT) | Retrieve the global list of all URLs across all system users. |
| `GET` | `/public/qr/preview` | No | Generate a live preview PNG QR code image for an arbitrary URL string. |

### Analytics

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/{hash}` | Yes* | Retrieve 30-day time-series, browser, device, OS, and geographic stats for a URL. |
| `GET` | `/analytics` | Yes | Retrieve aggregated analytics across all URLs owned by the authenticated user. |
| `GET` | `/analytics/folder/{folderId}` | Yes | Retrieve aggregated analytics for all URLs grouped within a specific folder. |
| `GET` | `/analytics/usage` | Yes | Retrieve account-wide usage summary (total links, active links, total clicks). |

### Folders

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/folders` | Yes | Retrieve all folders owned by the authenticated user with link counts. |
| `POST` | `/folders` | Yes | Create a new organizational folder. |
| `PUT` | `/folders/{id}` | Yes | Update the name of an existing folder. |
| `DELETE` | `/folders/{id}` | Yes | Delete a folder and remove folder associations from containing links. |

### Tags

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/tags` | Yes | Retrieve all tags created by the authenticated user. |
| `POST` | `/tags` | Yes | Create a new custom colored tag. |
| `PUT` | `/tags/{id}` | Yes | Update tag name or color code. |
| `DELETE` | `/tags/{id}` | Yes | Delete a tag and remove its associations across all assigned links. |

### User Account & Profile

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `PUT` | `/users/me` | Yes | Update authenticated user profile information (name, email). |
| `PUT` | `/users/me/password` | Yes | Change authenticated user password after verifying current password. |
| `DELETE` | `/users/me` | Yes | Transactionally hard-delete user account and all associated URLs and analytics. |
| `POST` | `/user` | No / Admin | Register a standard user account. |
| `GET` | `/user/all` | Yes (ROOT) | Retrieve a paginated list of all registered users. |
| `PUT` | `/user/{publicId}` | Yes (ROOT/Owner) | Update user profile by public UUID. |
| `DELETE` | `/user/{publicId}` | Yes (ROOT) | Delete user account by public UUID. |
| `POST` | `/admin/addNew` | Yes (ROOT) | Provision a new administrative user account. |

*\* Requires ownership of the resource or ROOT administrator role.*

## Testing

Execute unit and integration tests:
```bash
./mvnw test
```