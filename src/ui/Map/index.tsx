import { useEffect, useRef } from 'react';
import styles from './style.module.css';

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_SDK_URL =
  '//dapi.kakao.com/v2/maps/sdk.js?appkey=978abb23ebefd464ebc147fb4197eed5&autoload=false';

type KakaoMapProps = {
  /** 단일 포커스 이동용 (fallback) */
  center?: {
    latitude: number;
    longitude: number;
  };

  /** 선택된 모든 역 (마커 + bounds 제어용) */
  stations?: {
    id: string;
    latitude: number;
    longitude: number;
  }[];

  /** 지도 위 오버레이 UI */
  children?: React.ReactNode;
};

const loadKakaoScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
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
};

export const KakaoMap = ({
  center,
  stations = [],
  children,
}: KakaoMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  /** station.id 기준 마커 관리 */
  const markerMap = useRef<Map<string, any>>(new Map());

  /* ============================
   * 1️⃣ 지도 초기화
   * ============================ */
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    loadKakaoScript().then(() => {
      window.kakao.maps.load(() => {
        const defaultCenter = new window.kakao.maps.LatLng(
          37.4979,
          127.0276
        );

        mapInstance.current = new window.kakao.maps.Map(mapRef.current, {
          center: defaultCenter,
          level: 5,
        });
      });
    });
  }, []);

  /* ============================
   * 2️⃣ 선택된 역 마커 + zoom out
   * ============================ */
  useEffect(() => {
    if (!mapInstance.current) return;
    if (stations.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    stations.forEach((station) => {
      const position = new window.kakao.maps.LatLng(
        station.latitude,
        station.longitude
      );

      bounds.extend(position);

      // 마커 없으면 생성
      if (!markerMap.current.has(station.id)) {
        const marker = new window.kakao.maps.Marker({
          map: mapInstance.current,
          position,
        });

        markerMap.current.set(station.id, marker);
      } else {
        markerMap.current
          .get(station.id)
          ?.setPosition(position);
      }
    });

    // ⭐ 모든 마커가 보이도록 자동 zoom
    mapInstance.current.setBounds(bounds);
  }, [stations]);

  /* ============================
   * 3️⃣ 단일 center 이동 (fallback)
   * ============================ */
  useEffect(() => {
    if (!center) return;
    if (!mapInstance.current) return;
    if (stations.length > 1) return; // 여러 역일 땐 bounds가 우선

    const position = new window.kakao.maps.LatLng(
      center.latitude,
      center.longitude
    );

    mapInstance.current.setCenter(position);
  }, [center, stations.length]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />
      {children}
    </div>
  );
};
