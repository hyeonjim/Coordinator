package com.gt.codinnator.domain.ai.repository;

import com.gt.codinnator.domain.ai.entity.AiTestReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiTestReportRepository extends JpaRepository<AiTestReport, Long> {

    List<AiTestReport> findByUserIdOrderByCreatedAtDesc(Long userId);
}
