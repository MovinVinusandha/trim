package com.url_shortener.url_shortener.admin;

import com.url_shortener.url_shortener.admin.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Portal", description = "Administration and platform monitoring endpoints")
public class AdminPortalController {

    private final AdminService adminService;
    private final jakarta.servlet.http.HttpServletRequest httpRequest;

    @GetMapping("/overview")
    @Operation(summary = "Get platform overview KPIs, system health, activity graphs, and top target domains")
    public ResponseEntity<AdminOverviewDto> getOverview(
            @RequestParam(defaultValue = "7") int days
    ) {
        return ResponseEntity.ok(adminService.getOverviewStats(days));
    }

    @GetMapping("/links")
    @Operation(summary = "Browse, slice by time/metrics, and search links across the instance")
    public ResponseEntity<Page<AdminLinkDto>> getLinks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate,
            @RequestParam(required = false) Long minClicks,
            @RequestParam(required = false) String domain,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        return ResponseEntity.ok(adminService.getLinks(page, size, search, status, startDate, endDate, minClicks, domain, sortBy, sortDir));
    }

    @GetMapping("/links/triage-summary")
    @Operation(summary = "Get high-level moderation triage statistics and queues")
    public ResponseEntity<AdminLinkTriageSummaryDto> getTriageSummary() {
        return ResponseEntity.ok(adminService.getTriageSummary());
    }

    @PostMapping("/links/bulk-quarantine")
    @Operation(summary = "Bulk quarantine multiple short links")
    public ResponseEntity<List<AdminLinkDto>> bulkQuarantineLinks(
            @Valid @RequestBody BulkLinkQuarantineRequestDto request
    ) {
        return ResponseEntity.ok(adminService.bulkQuarantineLinks(request.getHashes(), request.getReason()));
    }

    @PostMapping("/links/bulk-delete")
    @Operation(summary = "Bulk delete multiple short links")
    public ResponseEntity<Map<String, Object>> bulkDeleteLinks(
            @Valid @RequestBody BulkLinkDeleteRequestDto request
    ) {
        adminService.bulkDeleteLinks(request.getHashes());
        return ResponseEntity.ok(Map.of("message", "Links deleted successfully", "count", request.getHashes().size()));
    }

    @PostMapping("/links/block-domain")
    @Operation(summary = "Quick blacklist a domain from a link in the Moderation Hub")
    public ResponseEntity<BlacklistedDomain> blockDomainFromLink(
            @Valid @RequestBody BlockDomainFromLinkDto request
    ) {
        return ResponseEntity.ok(adminService.addBlacklistDomain(request.getDomainPattern(), request.getReason()));
    }

    @PostMapping("/links/{hash}/quarantine")
    @Operation(summary = "Quarantine/disable a short link with a reason")
    public ResponseEntity<AdminLinkDto> quarantineLink(
            @PathVariable String hash,
            @Valid @RequestBody QuarantineRequestDto request
    ) {
        return ResponseEntity.ok(adminService.quarantineLink(hash, request.getReason()));
    }

    @PostMapping("/links/{hash}/unquarantine")
    @Operation(summary = "Restore a quarantined short link")
    public ResponseEntity<AdminLinkDto> unquarantineLink(@PathVariable String hash) {
        return ResponseEntity.ok(adminService.unquarantineLink(hash));
    }

    @DeleteMapping("/links/{hash}")
    @Operation(summary = "Hard-delete a short link by admin")
    public ResponseEntity<Map<String, String>> deleteLink(@PathVariable String hash) {
        adminService.deleteLink(hash);
        return ResponseEntity.ok(Map.of("message", "Link deleted successfully"));
    }

    @GetMapping("/users")
    @Operation(summary = "Browse and search registered users")
    public ResponseEntity<Page<AdminUserDto>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(adminService.getUsers(page, size, search));
    }

    @PostMapping("/users/{publicId}/suspend")
    @Operation(summary = "Toggle user suspension status and revoke active tokens")
    public ResponseEntity<AdminUserDto> toggleSuspend(
            @PathVariable String publicId,
            @RequestBody(required = false) SuspendRequestDto request
    ) {
        Long currentUserId = getCurrentUserId();
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(adminService.toggleUserSuspension(publicId, reason, currentUserId));
    }

    @GetMapping("/users/{publicId}")
    @Operation(summary = "Get detailed user profile, OAuth providers, and recent links")
    public ResponseEntity<AdminUserDetailDto> getUserDetails(@PathVariable String publicId) {
        return ResponseEntity.ok(adminService.getUserDetails(publicId));
    }

    @DeleteMapping("/users/{publicId}")
    @Operation(summary = "Permanently delete a user account, their links, and associated data")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String publicId) {
        Long currentUserId = getCurrentUserId();
        adminService.deleteUser(publicId, currentUserId);
        return ResponseEntity.ok(Map.of("message", "User account and all associated resources deleted successfully"));
    }

    @PostMapping("/users/{publicId}/verify-email")
    @Operation(summary = "Manually mark a user's email address as verified")
    public ResponseEntity<AdminUserDto> manuallyVerifyEmail(@PathVariable String publicId) {
        return ResponseEntity.ok(adminService.manuallyVerifyEmail(publicId));
    }

    @PostMapping("/users/{publicId}/resend-verification")
    @Operation(summary = "Dispatch a new email verification message to the user")
    public ResponseEntity<Map<String, String>> resendVerificationEmail(@PathVariable String publicId) {
        adminService.resendVerificationEmail(publicId);
        return ResponseEntity.ok(Map.of("message", "Verification email dispatched successfully"));
    }

    @PutMapping("/users/{publicId}/quota")
    @Operation(summary = "Update or reset a custom link quota for a user")
    public ResponseEntity<AdminUserDto> updateUserQuota(
            @PathVariable String publicId,
            @Valid @RequestBody UserQuotaUpdateRequestDto request
    ) {
        return ResponseEntity.ok(adminService.updateUserQuota(publicId, request.getCustomMaxLinks()));
    }

    @PutMapping("/users/{publicId}/role")
    @Operation(summary = "Update user role (ROOT only)")
    public ResponseEntity<AdminUserDto> updateUserRole(
            @PathVariable String publicId,
            @Valid @RequestBody RoleUpdateRequestDto request
    ) {
        Long currentUserId = getCurrentUserId();
        return ResponseEntity.ok(adminService.updateUserRole(publicId, request.getRole(), currentUserId));
    }

    @GetMapping("/blacklist")
    @Operation(summary = "List all blacklisted domain patterns")
    public ResponseEntity<List<BlacklistedDomain>> getBlacklist() {
        return ResponseEntity.ok(adminService.getBlacklist());
    }

    @PostMapping("/blacklist")
    @Operation(summary = "Add a domain to the blacklist")
    public ResponseEntity<BlacklistedDomain> addBlacklist(@Valid @RequestBody BlacklistRequestDto request) {
        return ResponseEntity.ok(adminService.addBlacklistDomain(request.getDomainPattern(), request.getReason()));
    }

    @DeleteMapping("/blacklist/{id}")
    @Operation(summary = "Remove a domain from the blacklist")
    public ResponseEntity<Map<String, String>> deleteBlacklist(@PathVariable Long id) {
        adminService.deleteBlacklistDomain(id);
        return ResponseEntity.ok(Map.of("message", "Blacklisted domain removed"));
    }

    @GetMapping("/settings")
    @Operation(summary = "Get live runtime system settings (ROOT only)")
    public ResponseEntity<List<SystemSettingDto>> getSettings() {
        return ResponseEntity.ok(adminService.getSystemSettings());
    }

    @PutMapping("/settings/{key}")
    @Operation(summary = "Update a live system setting (ROOT only)")
    public ResponseEntity<SystemSettingDto> updateSetting(
            @PathVariable String key,
            @RequestBody SystemSettingDto request
    ) {
        return ResponseEntity.ok(adminService.updateSystemSetting(
                key,
                request.getSettingValue(),
                request.getDescription()
        ));
    }

    @GetMapping("/settings/vault")
    @Operation(summary = "Get categorized and sanitized environment vault (ROOT only)")
    public ResponseEntity<List<EnvironmentVaultDto>> getEnvironmentVault() {
        return ResponseEntity.ok(adminService.getEnvironmentVault());
    }

    @PutMapping("/settings/vault")
    @Operation(summary = "Update an environment variable with .env file synchronization (ROOT only)")
    public ResponseEntity<EnvironmentVaultDto> updateEnvVariable(
            @Valid @RequestBody EnvVariableUpdateRequestDto request
    ) {
        return ResponseEntity.ok(adminService.updateEnvVariable(request.getKey(), request.getValue()));
    }

    @PostMapping("/settings/test-smtp")
    @Operation(summary = "Diagnostic SMTP connection and delivery test (ROOT only)")
    public ResponseEntity<SmtpTestResultDto> testSmtpConnection(
            @Valid @RequestBody SmtpTestRequestDto request
    ) {
        return ResponseEntity.ok(adminService.testSmtpConnection(request.getRecipientEmail()));
    }

    @PostMapping("/settings/test-safe-browsing")
    @Operation(summary = "Diagnostic test for Google Safe Browsing v4 API key (ROOT and ADMIN)")
    public ResponseEntity<com.url_shortener.url_shortener.admin.dto.SafeBrowsingDiagnosticResultDto> testSafeBrowsingKey(
            @RequestBody(required = false) Map<String, String> request
    ) {
        String key = request != null ? request.get("key") : null;
        return ResponseEntity.ok(adminService.testSafeBrowsingKey(key));
    }

    @GetMapping("/incidents")
    @Operation(summary = "Get list of security threat incidents")
    public ResponseEntity<Page<com.url_shortener.url_shortener.security.SecurityIncident>> getIncidents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean resolved
    ) {
        return ResponseEntity.ok(adminService.getSecurityIncidents(page, size, resolved));
    }

    @PostMapping("/incidents/{id}/resolve")
    @Operation(summary = "Mark a security incident as resolved")
    public ResponseEntity<com.url_shortener.url_shortener.security.SecurityIncident> resolveIncident(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.resolveSecurityIncident(id, getCurrentUserEmail()));
    }

    @PostMapping("/threat-scanner/test")
    @Operation(summary = "On-demand diagnostic threat scanner for any URL")
    public ResponseEntity<com.url_shortener.url_shortener.security.dto.ThreatScanResultDto> testThreatScanner(
            @Valid @RequestBody com.url_shortener.url_shortener.security.dto.ThreatScanRequestDto request
    ) {
        return ResponseEntity.ok(adminService.testThreatScanner(request.getUrl()));
    }

    @GetMapping("/blocked-ips")
    @Operation(summary = "List all perimeter blacklisted IPs and CIDR subnets")
    public ResponseEntity<List<com.url_shortener.url_shortener.security.BlockedIp>> getBlockedIps() {
        return ResponseEntity.ok(adminService.getBlockedIps());
    }

    @PostMapping("/blocked-ips")
    @Operation(summary = "Add an IP address or CIDR subnet to perimeter blacklist")
    public ResponseEntity<com.url_shortener.url_shortener.security.BlockedIp> addBlockedIp(
            @Valid @RequestBody com.url_shortener.url_shortener.security.dto.BlockedIpRequestDto request
    ) {
        return ResponseEntity.ok(adminService.addBlockedIp(request.getIpAddress(), request.getReason(), getCurrentUserEmail()));
    }

    @DeleteMapping("/blocked-ips/{id}")
    @Operation(summary = "Remove an IP address or CIDR subnet from perimeter blacklist")
    public ResponseEntity<Map<String, String>> deleteBlockedIp(@PathVariable Long id) {
        adminService.deleteBlockedIp(id);
        return ResponseEntity.ok(Map.of("message", "IP unblocked successfully"));
    }

    private Long getCurrentUserId() {
        if (httpRequest != null) {
            String id = httpRequest.getHeader("X-User-Id");
            if (id != null && !id.isBlank()) {
                try {
                    return Long.valueOf(id.trim());
                } catch (NumberFormatException ignored) {}
            }
        }
        return 1L;
    }

    private String getCurrentUserEmail() {
        if (httpRequest != null) {
            String email = httpRequest.getHeader("X-User-Email");
            if (email != null && !email.isBlank()) {
                return email.trim();
            }
        }
        return "admin@trim.com";
    }
}
