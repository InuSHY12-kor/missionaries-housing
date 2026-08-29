import React from 'react';
import {
  Wifi, Snowflake, Flame, Tv, ParkingCircle, Building2, KeyRound, Sun, BookOpen, Sofa,
  Utensils, Refrigerator, GlassWater, Coffee, Bath, Droplet, Wind, Shirt, Bed,
  Camera, ShieldCheck, Cigarette, PawPrint, Luggage, Users, Trees, Waves, Dumbbell,
  Church, Baby, Phone, Volume2, CheckCircle
} from 'lucide-react';

const ICONS = {
  Wifi, Snowflake, Flame, Tv, ParkingCircle, Building2, KeyRound, Sun, BookOpen, Sofa,
  Utensils, Refrigerator, GlassWater, Coffee, Bath, Droplet, Wind, Shirt, Bed,
  Camera, ShieldCheck, Cigarette, PawPrint, Luggage, Users, Trees, Waves, Dumbbell,
  Church, Baby, Phone, Volume2
};

// 편의시설 아이콘 이름(문자열)을 실제 lucide-react 아이콘 컴포넌트로 변환합니다.
// 목록에 없는 이름이 들어와도 항상 안전한 기본 아이콘(CheckCircle)으로 대체합니다.
function AmenityIcon({ name, size = 16 }) {
  const IconComponent = ICONS[name] || CheckCircle;
  return <IconComponent size={size} />;
}

export default AmenityIcon;
