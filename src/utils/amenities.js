// 숙소 편의시설 마스터 목록
// 호스트가 숙소 등록/수정 시 체크한 항목만 숙소 상세 페이지에 노출됩니다.
// icon 은 lucide-react 아이콘 이름(문자열)이며, AmenityIcon 컴포넌트에서 실제 컴포넌트로 매핑합니다.

export const AMENITY_GROUPS = [
  {
    group: '기본 시설',
    items: [
      { key: 'wifi', label: '무료 Wi-Fi', icon: 'Wifi' },
      { key: 'aircon', label: '에어컨', icon: 'Snowflake' },
      { key: 'heating', label: '난방', icon: 'Flame' },
      { key: 'tv', label: 'TV', icon: 'Tv' },
      { key: 'parking', label: '무료 주차', icon: 'ParkingCircle' },
      { key: 'elevator', label: '엘리베이터', icon: 'Building2' },
      { key: 'self_checkin', label: '셀프 체크인', icon: 'KeyRound' },
      { key: 'balcony', label: '발코니/테라스', icon: 'Sun' },
      { key: 'desk', label: '책상/업무공간', icon: 'BookOpen' },
      { key: 'sofa', label: '거실/소파 공간', icon: 'Sofa' }
    ]
  },
  {
    group: '주방/취사',
    items: [
      { key: 'kitchen', label: '주방/취사시설', icon: 'Utensils' },
      { key: 'refrigerator', label: '냉장고', icon: 'Refrigerator' },
      { key: 'water_purifier', label: '정수기/생수 제공', icon: 'GlassWater' },
      { key: 'coffee', label: '커피/차 제공', icon: 'Coffee' },
      { key: 'cookware', label: '조리도구/식기류', icon: 'Utensils' }
    ]
  },
  {
    group: '욕실/세탁',
    items: [
      { key: 'private_bathroom', label: '개인 화장실/욕실', icon: 'Bath' },
      { key: 'shared_bathroom', label: '공용 화장실/욕실', icon: 'Bath' },
      { key: 'hot_water', label: '온수', icon: 'Droplet' },
      { key: 'hair_dryer', label: '헤어드라이어', icon: 'Wind' },
      { key: 'washer', label: '세탁기', icon: 'Shirt' },
      { key: 'dryer', label: '건조기', icon: 'Wind' },
      { key: 'bedding', label: '침구/린넨 제공', icon: 'Bed' }
    ]
  },
  {
    group: '안전/편의',
    items: [
      { key: 'cctv', label: 'CCTV(공용구역)', icon: 'Camera' },
      { key: 'fire_extinguisher', label: '소화기 비치', icon: 'ShieldCheck' },
      { key: 'first_aid', label: '구급상자', icon: 'ShieldCheck' },
      { key: 'no_smoking', label: '전 객실 금연', icon: 'ShieldCheck' },
      { key: 'smoking_area', label: '흡연 가능 구역', icon: 'Cigarette' },
      { key: 'pet_friendly', label: '반려동물 동반 가능', icon: 'PawPrint' },
      { key: 'luggage_storage', label: '짐 보관 가능', icon: 'Luggage' },
      { key: 'wheelchair', label: '휠체어 접근 가능', icon: 'Users' }
    ]
  },
  {
    group: '주변/특화',
    items: [
      { key: 'garden', label: '마당/정원', icon: 'Trees' },
      { key: 'pool', label: '수영장', icon: 'Waves' },
      { key: 'gym', label: '피트니스 시설', icon: 'Dumbbell' },
      { key: 'prayer_room', label: '기도실/조용한 공간', icon: 'Church' },
      { key: 'crib', label: '아기 침대(요청 시)', icon: 'Baby' },
      { key: 'phone', label: '유선 전화', icon: 'Phone' },
      { key: 'quiet_area', label: '조용한 환경', icon: 'Volume2' }
    ]
  }
];

// 편의시설 key → { label, icon } 조회용 평탄화 맵
export const AMENITY_MAP = AMENITY_GROUPS.reduce((acc, group) => {
  group.items.forEach(item => {
    acc[item.key] = item;
  });
  return acc;
}, {});
