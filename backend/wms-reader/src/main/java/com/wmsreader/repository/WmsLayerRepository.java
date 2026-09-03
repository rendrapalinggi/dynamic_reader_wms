package com.wmsreader.repository;

import com.wmsreader.model.WmsLayer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WmsLayerRepository extends JpaRepository<WmsLayer, Long> {

    Optional<WmsLayer> findByQualifiedLayerNameAndGeoserverUrl(String qualifiedLayerName, String geoserverUrl);
}
