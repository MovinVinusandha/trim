package com.url_shortener.admin_service.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long>, JpaSpecificationExecutor<AdminAuditLog> {

    Optional<AdminAuditLog> findTopByOrderByIdDesc();

    List<AdminAuditLog> findAllByOrderByIdAsc();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "UPDATE admin_audit_logs SET prev_hash = :prevHash, entry_hash = :entryHash WHERE id = :id", nativeQuery = true)
    void updateHashes(@org.springframework.data.repository.query.Param("id") Long id,
                      @org.springframework.data.repository.query.Param("prevHash") String prevHash,
                      @org.springframework.data.repository.query.Param("entryHash") String entryHash);
}
