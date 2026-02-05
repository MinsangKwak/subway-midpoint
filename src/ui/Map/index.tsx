import { useEffect, useRef, useState } from 'react';
import styles from './style.module.css';

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_SDK_URL =
  '//dapi.kakao.com/v2/maps/sdk.js?appkey=978abb23ebefd464ebc147fb4197eed5&autoload=false';

type KakaoMapProps = {
  center?: {
    latitude: number;
    longitude: number;
  };

  stations?: {
    id: string;
    latitude: number;
    longitude: number;
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
  polylines = [],
  midpoint,
  children,
}: KakaoMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const markerMap = useRef<Map<string, any>>(new Map());
  const polylineList = useRef<any[]>([]);
  const midpointMarker = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    loadKakaoScript().then(() => {
      window.kakao.maps.load(() => {
        mapInstance.current = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.4979, 127.0276),
          level: 5,
        });

        setMapReady(true);
      });
    });
  }, []);

  // 출발지 마커 동기화 + (출발지 상태에서만) bounds
  useEffect(() => {
    if (!mapReady) return;
    if (!mapInstance.current) return;

    // 기존 마커 중 삭제된 것 정리
    markerMap.current.forEach((marker, id) => {
      if (!stations.find((s) => s.id === id)) {
        marker.setMap(null);
        markerMap.current.delete(id);
      }
    });

    if (stations.length === 0) return;

    // polylines가 그려진 상태면 bounds를 polylines effect에서 잡을 거라 여기서 안 건드린다
    if (polylines.length > 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    stations.forEach((station) => {
      const position = new window.kakao.maps.LatLng(
        station.latitude,
        station.longitude
      );

      bounds.extend(position);

      if (!markerMap.current.has(station.id)) {
        const marker = new window.kakao.maps.Marker({
          map: mapInstance.current,
          position,
        });
        markerMap.current.set(station.id, marker);
      } else {
        markerMap.current.get(station.id)?.setPosition(position);
      }
    });

    mapInstance.current.setBounds(bounds);
  }, [stations, polylines.length, mapReady]);

  // Polyline 렌더링 + polyline 기준 bounds
  useEffect(() => {
    if (!mapReady) return;
    if (!mapInstance.current) return;

    // 기존 polyline 제거
    polylineList.current.forEach((line) => line.setMap(null));
    polylineList.current = [];

    if (polylines.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasPathPoint = false;

    polylines.forEach(({ path, color }) => {
      if (path.length < 2) return;

      const kakaoPath = path
        .filter(
          (p) =>
            Number.isFinite(p.latitude) &&
            Number.isFinite(p.longitude)
        )
        .map((p) => {
          const latlng = new window.kakao.maps.LatLng(p.latitude, p.longitude);
          bounds.extend(latlng);
          hasPathPoint = true;
          return latlng;
        });

      if (kakaoPath.length < 2) return;

      // 아웃라인
      const outline = new window.kakao.maps.Polyline({
        path: kakaoPath,
        strokeWeight: 20,
        strokeColor: '#FF00FF',
        strokeOpacity: 1,
        strokeStyle: 'solid',
      });
      outline.setMap(mapInstance.current);
      outline.setZIndex(10);

      // 실제 라인
      const line = new window.kakao.maps.Polyline({
        path: kakaoPath,
        strokeWeight: 10,
        strokeColor: color,
        strokeOpacity: 1,
        strokeStyle: 'solid',
      });
      line.setMap(mapInstance.current);
      line.setZIndex(11);

      polylineList.current.push(outline);
      polylineList.current.push(line);
    });

    // midpoint도 bounds에 포함 (있으면)
    if (midpoint) {
      const midpointLatLng = new window.kakao.maps.LatLng(
        midpoint.latitude,
        midpoint.longitude
      );
      bounds.extend(midpointLatLng);
      hasPathPoint = true;
    }

    if (hasPathPoint) {
      mapInstance.current.setBounds(bounds);
    }
  }, [polylines, midpoint, mapReady]);

  // 중간지점 마커
  useEffect(() => {
    if (!mapReady) return;
    if (!mapInstance.current) return;

    if (midpointMarker.current) {
      midpointMarker.current.setMap(null);
      midpointMarker.current = null;
    }

    if (!midpoint) return;

    midpointMarker.current = new window.kakao.maps.Marker({
      map: mapInstance.current,
      position: new window.kakao.maps.LatLng(
        midpoint.latitude,
        midpoint.longitude
      ),
      image: new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
        new window.kakao.maps.Size(24, 35)
      ),
    });
  }, [midpoint, mapReady]);

  // 단일 center 이동 (출발지만 있을 때만)
  useEffect(() => {
    if (!mapReady) return;
    if (!center) return;
    if (!mapInstance.current) return;
    if (stations.length > 1) return;
    if (polylines.length > 0) return;

    mapInstance.current.setCenter(
      new window.kakao.maps.LatLng(center.latitude, center.longitude)
    );
  }, [center, stations.length, polylines.length, mapReady]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />
      {children}
    </div>
  );
};
