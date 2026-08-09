import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, geocodeAddress } from '../utils/googleMaps';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청 기본값

// 호스트가 숙소 등록/수정 시 지도에서 정확한 위치를 지정할 수 있게 해주는 컴포넌트.
// "입력한 지역으로 위치 찾기" 버튼으로 지오코딩하거나, 지도를 클릭/마커 드래그로 직접 조정 가능.
function LocationPicker({ address, lat, lng, onChange }) {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markerRef = useRef(null);
  const mapsApiRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [status, setStatus] = useState('loading'); // loading | ready | error | geocoding | geocode-error

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        mapsApiRef.current = maps;
        const hasInitial = lat != null && lng != null;
        const initialPos = hasInitial ? { lat: Number(lat), lng: Number(lng) } : DEFAULT_CENTER;

        const map = new maps.Map(mapRef.current, {
          center: initialPos,
          zoom: hasInitial ? 15 : 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const marker = new maps.Marker({
          position: initialPos,
          map,
          draggable: true,
        });

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          onChangeRef.current({ lat: pos.lat(), lng: pos.lng() });
        });

        map.addListener('click', (e) => {
          marker.setPosition(e.latLng);
          onChangeRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });

        mapObjRef.current = map;
        markerRef.current = marker;
        setStatus('ready');
      })
      .catch(() => setStatus('error'));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGeocode = async () => {
    if (!address || !mapsApiRef.current || !mapObjRef.current || !markerRef.current) return;
    setStatus('geocoding');
    try {
      const coords = await geocodeAddress(mapsApiRef.current, address);
      mapObjRef.current.setCenter(coords);
      mapObjRef.current.setZoom(15);
      markerRef.current.setPosition(coords);
      onChangeRef.current(coords);
      setStatus('ready');
    } catch (err) {
      setStatus('geocode-error');
    }
  };

  return (
    <div className="location-picker">
      <div className="location-picker-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleGeocode}
          disabled={!address || status === 'geocoding' || status === 'loading'}
        >
          {status === 'geocoding' ? '주소 검색 중...' : '입력한 지역으로 위치 찾기'}
        </button>
        <span className="location-picker-hint">
          지도를 클릭하거나 마커를 드래그해서 정확한 위치로 조정하세요.
        </span>
      </div>

      {status === 'geocode-error' && (
        <p className="form-error">주소를 찾을 수 없습니다. 지도를 클릭해서 직접 위치를 지정해주세요.</p>
      )}
      {status === 'error' && (
        <p className="form-error">지도를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      )}
      {lat != null && lng != null && (
        <p className="location-picker-coords">
          현재 좌표: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
        </p>
      )}

      <div ref={mapRef} className="location-picker-map" />

      <style>{`
        .location-picker {
          margin: 0.5rem 0 1rem;
        }

        .location-picker-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .location-picker-hint {
          font-size: 0.85rem;
          color: #7f8c8d;
        }

        .location-picker-coords {
          font-size: 0.85rem;
          color: #16808E;
          margin: 0.25rem 0 0.5rem;
        }

        .location-picker-map {
          width: 100%;
          height: 280px;
          border-radius: 6px;
          overflow: hidden;
          background: #ecf0f1;
        }
      `}</style>
    </div>
  );
}

export default LocationPicker;
