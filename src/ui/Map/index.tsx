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

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    loadKakaoScript().then(() => {
      window.kakao.maps.load(() => {
        mapInstance.current = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.4979, 127.0276),
          level: 5,
        });
      });
    });
  }, []);

  // 출발지 마커 동기화
  useEffect(() => {
    if (!mapInstance.current) return;

    markerMap.current.forEach((marker, id) => {
      if (!stations.find((s) => s.id === id)) {
        marker.setMap(null);
        markerMap.current.delete(id);
      }
    });

    if (stations.length === 0) return;

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
  }, [stations]);

  // Polyline 렌더링
  useEffect(() => {
    if (!mapInstance.current) return;

    polylineList.current.forEach((line) => line.setMap(null));
    polylineList.current = [];

    polylines.forEach(({ path, color }) => {
      if (path.length < 2) return;

      const latLngPath = path.map(
        (p) => new window.kakao.maps.LatLng(p.latitude, p.longitude)
      );

      const outline = new window.kakao.maps.Polyline({
        map: mapInstance.current,
        path: latLngPath,
        strokeWeight: 10,
        strokeColor: '#000000',
        strokeOpacity: 0.35,
        strokeStyle: 'solid',
      });

      const line = new window.kakao.maps.Polyline({
        map: mapInstance.current,
        path: latLngPath,
        strokeWeight: 6,
        strokeColor: color,
        strokeOpacity: 1,
        strokeStyle: 'solid',
      });

      polylineList.current.push(outline, line);
    });
  }, [polylines]);

  // 중간지점 마커
  useEffect(() => {
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
  }, [midpoint]);

  // 단일 center 이동
  useEffect(() => {
    if (!center) return;
    if (!mapInstance.current) return;
    if (stations.length > 1) return;

    mapInstance.current.setCenter(
      new window.kakao.maps.LatLng(center.latitude, center.longitude)
    );
  }, [center, stations.length]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />
      {children}
    </div>
  );
};
