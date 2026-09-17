package com.url_shortener.url_shortener.urls;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtmTemplateRepository extends JpaRepository<UtmTemplate, Long> {

    List<UtmTemplate> findByUserOrderByCreatedAtDesc(Long userId);

    List<UtmTemplate> findByUserAndIsDefaultTrue(Long userId);

    Optional<UtmTemplate> findByIdAndUser(Long id, Long userId);

    boolean existsByNameIgnoreCaseAndUserId(String name, Long userId);
}
