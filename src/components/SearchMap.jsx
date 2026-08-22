import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadGoogleMaps } from '../utils/googleMaps';

const KOREA_CENTER = { lat: 36.3, lng: 127.8 };
// 이 줌 레벨 이상으로 확대하면 빨간 핀 대신 "숙소명 · 가격" 라벨을 바로 표시합니다(아고다 스타일).
const LABEL_ZOOM_THRESHOLD = 12;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

// 지도 위에 "숙소명 · 가격" 라벨을 직접 그리는 커스텀 오버레이.
// google.maps.Marker의 label 옵션은 짧은 단일 문자만 지원해서, OverlayView로 직접 구현합니다.
function createLabelOverlayClass(maps) {
  return class AccommodationLabelOverlay extends maps.OverlayView {
    constructor(accommodation, onClick) {
      super();
      this.position = new maps.LatLng(Number(accommodation.latitude), Number(accommodation.longitude));
      this.accommodation = accommodation;
      this.onClick = onClick;
      this.div = null;
    }

    onAdd() {
      const div = document.createElement('div');
      div.className = 'acc-label-pin';
      const price = this.accommodation.price != null
        ? `₩${Number(this.accommodation.price).toLocaleString()}`
        : '가격 문의';
      div.innerHTML = `
        <div class="acc-label-pin-inner">
          <span class="acc-label-price">${price}</span>
          <span class="acc-label-name">${escapeHtml(this.accommodation.title)}</span>
        </div>
      `;
      div.addEventListener('click', () => this.onClick(this.accommodation));
      this.div = div;
      this.getPanes().overlayMouseTarget.appendChild(div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;
      const pos = projection.fromLatLngToDivPixel(this.position);
      if (pos) {
        this.div.style.left = `${pos.x}px`;
        this.div.style.top = `${pos.y}px`;
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    }
  };
}

// 검색 페이지용 지도: 승인된(+일정이 맞는) 숙소들을 마커/라벨로 표시하고,
// 지도가 확대/이동될 때마다 현재 화면 범위(bounds)를 부모로 전달해
// 그 범위 안에 있는 숙소만 하단 목록에 노출되도록 합니다.
function SearchMap({ accommodations, onBoundsChange }) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const mapsApiRef = useRef(null);
  const overlayClassRef = useRef(null);
  const pinMarkersRef = useRef([]);
  const labelOverlaysRef = useRef([]);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(7);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        mapsApiRef.current = maps;
        overlayClassRef.current = createLabelOverlayClass(maps);

        const map = new maps.Map(mapRef.current, {
          center: KOREA_CENTER,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        map.addListener('zoom_changed', () => setZoom(map.getZoom()));
        map.addListener('idle', () => {
          const bounds = map.getBounds();
          if (bounds && onBoundsChangeRef.current) onBoundsChangeRef.current(bounds);
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

  // 마커/라벨 렌더링 — 줌 레벨에 따라 "핀" ↔ "이름+가격 라벨" 전환.
  useEffect(() => {
    if (!ready) return;
    const maps = mapsApiRef.current;
    const OverlayClass = overlayClassRef.current;

    pinMarkersRef.current.forEach((m) => m.setMap(null));
    pinMarkersRef.current = [];
    labelOverlaysRef.current.forEach((o) => o.setMap(null));
    labelOverlaysRef.current = [];

    const withCoords = accommodations.filter((a) => a.latitude != null && a.longitude != null);
    const showLabels = zoom >= LABEL_ZOOM_THRESHOLD;

    if (showLabels) {
      labelOverlaysRef.current = withCoords.map((a) => {
        const overlay = new OverlayClass(a, (acc) => navigate(`/accommodations/${acc.id}`));
        overlay.setMap(mapObjRef.current);
        return overlay;
      });
    } else {
      pinMarkersRef.current = withCoords.map((a) => {
        const marker = new maps.Marker({
          position: { lat: Number(a.latitude), lng: Number(a.longitude) },
          map: mapObjRef.current,
          title: `${a.title} · ₩${Number(a.price || 0).toLocaleString()}/박`,
        });
        marker.addListener('click', () => navigate(`/accommodations/${a.id}`));
        return marker;
      });
    }
  }, [ready, accommodations, zoom, navigate]);

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
          height: 420px;
          border-radius: 8px;
          overflow: hidden;
          background: #ecf0f1;
        }

        .acc-label-pin {
          position: absolute;
          transform: translate(-50%, -100%);
          cursor: pointer;
        }

        .acc-label-pin-inner {
          position: relative;
          background: white;
          border: 1.5px solid #d97b3f;
          border-radius: 18px;
          padding: 0.35rem 0.75rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.25;
          white-space: nowrap;
          transition: transform 0.15s;
        }

        .acc-label-pin-inner:hover {
          transform: scale(1.07);
          z-index: 20;
        }

        .acc-label-pin-inner::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px 5px 0 5px;
          border-style: solid;
          border-color: #d97b3f transparent transparent transparent;
        }

        .acc-label-price {
          font-weight: 700;
          font-size: 0.8rem;
          color: #d97b3f;
        }

        .acc-label-name {
          font-size: 0.68rem;
          color: #555;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </>
  );
}

export default SearchMap;
