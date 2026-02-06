import { useEffect, useRef, useState } from 'react';
import styles from './style.module.css';

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_SDK_URL =
  '//dapi.kakao.com/v2/maps/sdk.js?appkey=978abb23ebefd464ebc147fb4197eed5&autoload=false';

// KakaoMap 컴포넌트에서 사용하는 props 타입
// stations  : 출발지 마커 정보 (호선 색 포함)
// polylines : 출발지 → 중간지점 경로
// midpoint  : 계산된 중간지점 좌표
type KakaoMapProps = {
  stations?: {
    id: string;
    latitude: number;
    longitude: number;
    color: string;
  }[];

  polylines?: {
    path: { latitude: number; longitude: number }[];
    color: string;
  }[];

  midpoint?: {
    latitude: number;
    longitude: number;
  } | null;

  children?: React.ReactNode;
};

// Kakao Map SDK를 1번만 로드하기 위한 유틸 함수
const loadKakaoScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

// 중간지점 전용 마커 이미지 생성 함수
// react-icons의 FiMapPin과 동일한 형태를 SVG로 직접 정의
// 색상은 항상 검정으로 고정하여 "결과 지점"의 의미를 명확히 함
const createMidpointPinImage = () => {
  const svg = `
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="#999999"
      stroke="#000000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" fill="white" />
    </svg>
  `;

  return new window.kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.kakao.maps.Size(48, 48),
    {
      offset: new window.kakao.maps.Point(24, 48),
    }
  );
};

// 출발지 마커용 원형 컬러 마커 생성
// 호선 색상과 UI 배지 색을 1:1로 맞추기 위함
const createColoredMarkerImage = (color: string) => {
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="10" fill="${color}" />
      <circle cx="16" cy="16" r="5" fill="#ffffff" />
    </svg>
  `;

  return new window.kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.kakao.maps.Size(32, 32),
    {
      offset: new window.kakao.maps.Point(16, 16),
    }
  );
};

export const KakaoMap = ({
  stations = [],
  polylines = [],
  midpoint,
  children,
}: KakaoMapProps) => {
  // 실제 지도가 마운트될 DOM ref
  const mapRef = useRef<HTMLDivElement>(null);

  // Kakao Map 인스턴스 (한 번 생성 후 유지)
  const mapInstance = useRef<any>(null);

  // 출발지 마커를 id 기준으로 관리하기 위한 Map
  const markerMap = useRef<Map<string, any>>(new Map());

  // 현재 그려진 polyline들을 추적 (재렌더링 전 제거용)
  const polylineList = useRef<any[]>([]);

  // 중간지점 마커 (FiMapPin 기반)
  const midpointMarker = useRef<any>(null);

  // 지도 초기화 완료 여부
  const [mapReady, setMapReady] = useState(false);

  // 지도 초기화
  // SDK 로드 → 지도 생성 → mapReady 활성화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    loadKakaoScript().then(() => {
      window.kakao.maps.load(() => {
        mapInstance.current = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.4979, 127.0276),
          level: 6,
        });

        setMapReady(true);
      });
    });
  }, []);

  // 출발지 마커 렌더링
  // stations 변경 시:
  // - 제거된 마커 정리
  // - 새 마커 생성
  // - 기존 마커 위치 갱신
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    markerMap.current.forEach((marker, id) => {
      if (!stations.find((s) => s.id === id)) {
        marker.setMap(null);
        markerMap.current.delete(id);
      }
    });

    stations.forEach((s) => {
      const position = new window.kakao.maps.LatLng(
        s.latitude,
        s.longitude
      );

      if (!markerMap.current.has(s.id)) {
        const marker = new window.kakao.maps.Marker({
          map: mapInstance.current,
          position,
          image: createColoredMarkerImage(s.color),
        });

        markerMap.current.set(s.id, marker);
      } else {
        markerMap.current.get(s.id)?.setPosition(position);
      }
    });
  }, [stations, mapReady]);

  // Polyline 렌더링
  // zoom/center 변경과 분리하여 선이 사라지는 현상을 방지
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    polylineList.current.forEach((line) => line.setMap(null));
    polylineList.current = [];

    polylines.forEach(({ path, color }) => {
      const kakaoPath = path
        .filter(
          (p) =>
            Number.isFinite(p.latitude) &&
            Number.isFinite(p.longitude)
        )
        .map(
          (p) =>
            new window.kakao.maps.LatLng(p.latitude, p.longitude)
        );

      if (kakaoPath.length < 2) return;

      const line = new window.kakao.maps.Polyline({
        path: kakaoPath,
        strokeWeight: 12,
        strokeColor: color,
        strokeOpacity: 1,
        zIndex: 30,
      });

      line.setMap(mapInstance.current);
      polylineList.current.push(line);
    });
  }, [polylines, mapReady]);

  // 중간지점 처리
  // midpoint 변경 시:
  // - 지도 중심을 중간지점으로 이동
  // - 강제 zoom 적용
  // - FiMapPin 기반 중간지점 마커 표시
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    if (midpointMarker.current) {
      midpointMarker.current.setMap(null);
      midpointMarker.current = null;
    }

    if (!midpoint) return;

    const center = new window.kakao.maps.LatLng(
      midpoint.latitude,
      midpoint.longitude
    );

    mapInstance.current.setCenter(center);
    mapInstance.current.setLevel(2);

    midpointMarker.current = new window.kakao.maps.Marker({
      map: mapInstance.current,
      position: center,
      image: createMidpointPinImage(),
      zIndex: 50,
    });
  }, [midpoint, mapReady]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />
      {children}
    </div>
  );
};
