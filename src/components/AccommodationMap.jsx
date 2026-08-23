import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';

function AccommodationMap({ lat, lng, title }) {
  const mapRef = useRef(null);
  const [error, setError] = useState(null);
  const hasCoords =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  useEffect(() => {
    if (!hasCoords) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        const center = { lat: Number(lat), lng: Number(lng) };
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        new maps.Marker({ position: center, map, title });
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [hasCoords, lat, lng, title]);

  if (!hasCoords) {
    return (
      <div className="accommodation-map-placeholder">
        아직 이 숙소의 지도 위치가 등록되지 않았습니다.
        <style>{`
          .accommodation-map-placeholder {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 1.5rem;
            text-align: center;
            color: #95a5a6;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accommodation-map-placeholder">
        지도를 불러올 수 없습니다.
        <style>{`
          .accommodation-map-placeholder {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 1.5rem;
            text-align: center;
            color: #95a5a6;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="accommodation-map" />
      <style>{`
        .accommodation-map {
          width: 100%;
          height: 300px;
          border-radius: 8px;
          overflow: hidden;
          background: #ecf0f1;
        }

        @media (max-width: 768px) {
          .accommodation-map {
            height: 260px;
          }
        }

        @media (max-width: 480px) {
          .accommodation-map {
            height: 220px;
            border-radius: 6px;
          }
        }
      `}</style>
    </>
  );
}

export default AccommodationMap;
