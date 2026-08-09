// 구글 지도 JavaScript API를 지연 로드하고, 주소 -> 좌표 변환(지오코딩)을 도와주는 유틸.
// 별도의 npm 패키지 없이 <script> 태그를 동적으로 삽입하는 방식이라 배포 리스크가 없습니다.

let loadPromise = null;

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('Google Maps API 키가 설정되지 않았습니다.'));
      return;
    }

    const callbackName = '__wewestayGoogleMapsLoaded';
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ko&region=KR&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Google Maps 스크립트를 불러오지 못했습니다.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

// 주소 문자열을 위도/경도로 변환합니다. (google.maps.Geocoder 사용)
export function geocodeAddress(mapsApi, address) {
  return new Promise((resolve, reject) => {
    const geocoder = new mapsApi.Geocoder();
    geocoder.geocode({ address, region: 'kr' }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
          formattedAddress: results[0].formatted_address,
        });
      } else {
        reject(new Error(`주소를 찾을 수 없습니다 (${status})`));
      }
    });
  });
}
