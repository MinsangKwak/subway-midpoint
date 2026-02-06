import { useEffect, useRef } from 'react';
import styles from './style.module.css';

import { TbMapPinHeart } from "react-icons/tb";
import { renderToStaticMarkup } from 'react-dom/server';

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
    script.onerror = () => reject(new Error('Failed to load Kakao SDK'));

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

  const mapRefInstance = useRef<any>(null);
  const stationMarkersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const midpointOverlayRef = useRef<any>(null);
  const whiteOverlayRef = useRef<any>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (initializedRef.current) return;

    const init = async () => {
      await loadKakaoScript();

      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const map = new window.kakao.maps.Map(mapRef.current, {
          center: center
            ? new window.kakao.maps.LatLng(center.latitude, center.longitude)
            : new window.kakao.maps.LatLng(37.4979, 127.0276),
          level: 5,
        });

        mapRefInstance.current = map;
        initializedRef.current = true;

        renderWhiteOverlay();
        renderStations();
        renderPolylines();
        fitBounds();
        renderMidpoint();
      });
    };

    init();
  }, []);

  const renderWhiteOverlay = () => {
    const map = mapRefInstance.current;
    if (!map) return;

    if (whiteOverlayRef.current) {
      whiteOverlayRef.current.setMap(null);
      whiteOverlayRef.current = null;
    }

    if (polylines.length === 0 && !midpoint) return;

    const overlay = new window.kakao.maps.CustomOverlay({
      position: map.getCenter(),
      content: `<div class="kakao-white-overlay"></div>`,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 1,
    });

    overlay.setMap(map);
    whiteOverlayRef.current = overlay;

    window.kakao.maps.event.addListener(map, 'idle', () => {
      overlay.setPosition(map.getCenter());
    });
  };

  const renderStations = () => {
    const map = mapRefInstance.current;
    if (!map) return;

    stationMarkersRef.current.forEach((m) => m.setMap(null));
    stationMarkersRef.current = [];

    stations.forEach((s) => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(s.latitude, s.longitude),
        zIndex: 5,
      });

      stationMarkersRef.current.push(marker);
    });
  };

  const renderPolylines = () => {
    const map = mapRefInstance.current;
    if (!map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    polylines.forEach((p) => {
      const polyline = new window.kakao.maps.Polyline({
        map,
        path: p.path.map(
          (pt) => new window.kakao.maps.LatLng(pt.latitude, pt.longitude)
        ),
        strokeWeight: 4,
        strokeColor: p.color,
        strokeOpacity: 1,
        zIndex: 5,
      });

      polylinesRef.current.push(polyline);
    });
  };

  const fitBounds = () => {
    const map = mapRefInstance.current;
    if (!map || polylines.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    polylines.forEach((p) => {
      p.path.forEach((pt) => {
        bounds.extend(
          new window.kakao.maps.LatLng(pt.latitude, pt.longitude)
        );
      });
    });

    map.setBounds(bounds, 40);
  };

  const renderMidpoint = () => {
    const map = mapRefInstance.current;
    if (!map) return;

    if (midpointOverlayRef.current) {
      midpointOverlayRef.current.setMap(null);
      midpointOverlayRef.current = null;
    }

    if (!midpoint) return;

    const iconHtml = renderToStaticMarkup(
      <TbMapPinHeart size={50} className="kakao-midpoint-icon" />
    );

    const overlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(
        midpoint.latitude,
        midpoint.longitude
      ),
      content: `<div class="kakao-midpoint-marker">${iconHtml}</div>`,
      yAnchor: 1,
      zIndex: 10,
    });

    overlay.setMap(map);
    midpointOverlayRef.current = overlay;
  };

  useEffect(() => {
    if (!initializedRef.current) return;

    renderWhiteOverlay();
    renderStations();
    renderPolylines();
    fitBounds();
    renderMidpoint();
  }, [stations, polylines, midpoint]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />
      {children}
    </div>
  );
};
