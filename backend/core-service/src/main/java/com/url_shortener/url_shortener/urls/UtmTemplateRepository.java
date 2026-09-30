package com.url_shortener.url_shortener.urls;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtmTemplateRepository extends JpaRepository<UtmTemplate, Long> {

    List<UtmTemplate> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<UtmTemplate> findByUserIdAndIsDefaultTrue(Long userId);

    Optional<UtmTemplate> findByIdAndUserId(Long id, Long userId);

    boolean existsByNameIgnoreCaseAndUserId(String name, Long userId);
}
