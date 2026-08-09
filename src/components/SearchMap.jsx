import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';

const KOREA_CENTER = { lat: 36.3, lng: 127.8 };

// 검색 페이지용 지도: 승인된 숙소들을 마커로 표시하고,
// 사용자가 지도를 클릭(또는 마커 드래그)하면 그 위치를 중심으로 반경 원을 그려줍니다.
function SearchMap({ accommodations, selectedPoint, onSelectPoint, radiusKm }) {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const mapsApiRef = useRef(null);
  const markersRef = useRef([]);
  const centerMarkerRef = useRef(null);
  const circleRef = useRef(null);
  const onSelectPointRef = useRef(onSelectPoint);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    onSelectPointRef.current = onSelectPoint;
  }, [onSelectPoint]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        mapsApiRef.current = maps;
        const map = new maps.Map(mapRef.current, {
          center: KOREA_CENTER,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        map.addListener('click', (e) => {
          onSelectPointRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
        mapObjRef.current = map;
        setReady(true);
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 숙소 마커 렌더링
  useEffect(() => {
    if (!ready) return;
    const maps = mapsApiRef.current;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = accommodations
      .filter((a) => a.latitude != null && a.longitude != null)
      .map(
        (a) =>
          new maps.Marker({
            position: { lat: Number(a.latitude), lng: Number(a.longitude) },
            map: mapObjRef.current,
            title: a.title,
          })
      );
  }, [ready, accommodations]);

  // 선택 위치 마커 + 반경 원
  useEffect(() => {
    if (!ready) return;
    const maps = mapsApiRef.current;

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
      centerMarkerRef.current = null;
    }
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    if (selectedPoint) {
      centerMarkerRef.current = new maps.Marker({
        position: selectedPoint,
        map: mapObjRef.current,
        draggable: true,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#e74c3c',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 999,
      });
      centerMarkerRef.current.addListener('dragend', () => {
        const pos = centerMarkerRef.current.getPosition();
        onSelectPointRef.current({ lat: pos.lat(), lng: pos.lng() });
      });

      circleRef.current = new maps.Circle({
        map: mapObjRef.current,
        center: selectedPoint,
        radius: radiusKm * 1000,
        fillColor: '#16808E',
        fillOpacity: 0.08,
        strokeColor: '#16808E',
        strokeOpacity: 0.5,
        strokeWeight: 1,
      });

      mapObjRef.current.panTo(selectedPoint);
    }
  }, [ready, selectedPoint, radiusKm]);

  if (error) {
    return (
      <div className="search-map-placeholder">
        지도를 불러올 수 없습니다: {error}
        <style>{`
          .search-map-placeholder {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            color: #95a5a6;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="search-map" />
      <style>{`
        .search-map {
          width: 100%;
          height: 360px;
          border-radius: 8px;
          overflow: hidden;
          background: #ecf0f1;
        }
      `}</style>
    </>
  );
}

export default SearchMap;
