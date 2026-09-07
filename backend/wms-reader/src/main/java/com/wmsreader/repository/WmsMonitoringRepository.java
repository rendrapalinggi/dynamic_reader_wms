package com.wmsreader.repository;

import com.wmsreader.model.WmsMonitoring;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WmsMonitoringRepository extends JpaRepository<WmsMonitoring, Long> {

    Optional<WmsMonitoring> findByWmsUrl(String wmsUrl);

    List<WmsMonitoring> findAllByOrderByCheckedAtDesc();
}
