import { useEffect, useRef } from 'react';
import styles from './style.module.css';

declare global {
  interface Window {
    kakao: any;
  }
}

type LatLng = {
  latitude: number;
  longitude: number;
};

export type KakaoMapProps = {
  center?: LatLng;

  stations?: {
    id: string;
    latitude: number;
    longitude: number;
    color: string;
  }[];

  polylines?: {
    path: LatLng[];
    color: string;
  }[];

  midpoint?: LatLng | null;

  children?: React.ReactNode;
};

const KAKAO_SDK_URL =
  '//dapi.kakao.com/v2/maps/sdk.js?appkey=978abb23ebefd464ebc147fb4197eed5&autoload=false';

const loadKakaoScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="dapi.kakao.com"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Failed to load Kakao SDK'));

    document.head.appendChild(script);
  });

export const KakaoMap = ({
  center,
  stations = [],
  polylines = [],
  midpoint = null,
  children,
}: KakaoMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const midpointMarkerRef = useRef<any>(null);

  const isInitializedRef = useRef(false);

  // =========================
  // 1️⃣ 지도 초기화 (중요)
  // =========================
  useEffect(() => {
    if (!mapRef.current) return;
    if (isInitializedRef.current) return;

    const init = async () => {
      await loadKakaoScript();

      // 🔥 이게 핵심이다. 존재 여부와 상관없이 반드시 load 호출
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const initialCenter = center
          ? new window.kakao.maps.LatLng(
            center.latitude,
            center.longitude
          )
          : new window.kakao.maps.LatLng(37.4979, 127.0276);

        const map = new window.kakao.maps.Map(mapRef.current, {
          center: initialCenter,
          level: 5,
        });

        mapInstanceRef.current = map;
        isInitializedRef.current = true;

        renderStations();
        renderPolylines();
        renderMidpoint();
      });
    };

    init().catch(console.error);
  }, []);

  // =========================
  // 2️⃣ center 이동
  // =========================
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!center) return;

    mapInstanceRef.current.setCenter(
      new window.kakao.maps.LatLng(
        center.latitude,
        center.longitude
      )
    );
  }, [center?.latitude, center?.longitude]);

  // =========================
  // 3️⃣ 출발지 마커
  // =========================
  const renderStations = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    stations.forEach((s) => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(
          s.latitude,
          s.longitude
        ),
      });

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!isInitializedRef.current) return;
    renderStations();
  }, [stations]);

  // =========================
  // 4️⃣ 폴리라인
  // =========================
  const renderPolylines = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    polylines.forEach((p) => {
      const polyline = new window.kakao.maps.Polyline({
        map,
        path: p.path.map(
          (pt) =>
            new window.kakao.maps.LatLng(
              pt.latitude,
              pt.longitude
            )
        ),
        strokeWeight: 4,
        strokeColor: p.color,
        strokeOpacity: 1,
      });

      polylinesRef.current.push(polyline);
    });
  };

  useEffect(() => {
    if (!isInitializedRef.current) return;
    renderPolylines();
  }, [polylines]);

  // =========================
  // 5️⃣ 중간지점 마커
  // =========================
  const renderMidpoint = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (midpointMarkerRef.current) {
      midpointMarkerRef.current.setMap(null);
      midpointMarkerRef.current = null;
    }

    if (!midpoint) return;

    const position = new window.kakao.maps.LatLng(
      midpoint.latitude,
      midpoint.longitude
    );

    map.setCenter(position);
    map.setLevel(2, { animate: true });

    midpointMarkerRef.current = new window.kakao.maps.Marker({
      map,
      position,
    });
  };


  useEffect(() => {
    if (!isInitializedRef.current) return;
    renderMidpoint();
  }, [midpoint?.latitude, midpoint?.longitude]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />
      {children}
    </div>
  );
};
