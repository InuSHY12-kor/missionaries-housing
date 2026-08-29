// 두 좌표 사이의 거리를 km 단위로 계산합니다 (Haversine 공식).
export function haversineDistanceKm(a, b) {
  const R = 6371; // 지구 반지름(km)
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
