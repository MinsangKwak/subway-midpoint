// src/ui/Map/index.tsx
// 최종 “안정” 버전 (마커/선/흰 배경/중간지점 + 줌/드래그 안정)
// - SDK 로드: script 존재 여부 + window.kakao.maps 존재 여부 둘 다 안전 처리
// - map 초기화 1회 보장
// - overlay/markers/polylines/midpoint 모두 "기존 제거 -> 재생성"으로 누적/유실 방지
// - idle 리스너 1개만 유지 (중복 등록 방지)
// - white overlay: zIndex 1
// - polylines: zIndex 6~7
// - station markers: zIndex 10
// - midpoint overlay: zIndex 20
// - 디버깅: 렌더링마다 개수/포인트 로그 출력

import { useEffect, useRef } from 'react';
import styles from './style.module.css';

import { TbMapPinHeart } from 'react-icons/tb';
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
    color?: string;
  }[];
  polylines?: {
    path: LatLng[];
    color?: string;
  }[];
  midpoint?: LatLng | null;
  children?: React.ReactNode;
};

const KAKAO_SDK_URL =
  '//dapi.kakao.com/v2/maps/sdk.js?appkey=978abb23ebefd464ebc147fb4197eed5&autoload=false';

// SDK 로드: script 존재/미존재 모두 안전하게 처리
const loadKakaoScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    // 이미 kakao.maps가 준비되어 있으면 바로 resolve
    if (window.kakao?.maps?.load) {
      resolve();
      return;
    }

    // script가 이미 있으면 onload를 기다릴 수가 없으니 폴링으로 대기
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
    );

    if (existing) {
      const maxTry = 100;
      let tryCount = 0;

      const tick = () => {
        tryCount += 1;
        if (window.kakao?.maps?.load) {
          resolve();
          return;
        }
        if (tryCount >= maxTry) {
          reject(new Error('Kakao SDK exists but kakao.maps.load is not ready'));
          return;
        }
        setTimeout(tick, 50);
      };

      tick();
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
  const mapElRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<any>(null);
  const initializedRef = useRef(false);

  // 그려진 객체들 레퍼런스
  const whiteOverlayRef = useRef<any>(null);
  const stationMarkersRef = useRef<any[]>([]);
  const polylineRefsRef = useRef<any[]>([]);
  const midpointOverlayRef = useRef<any>(null);

  // idle 리스너 중복 방지
  const idleHandlerRef = useRef<((...args: any[]) => void) | null>(null);

  // 초기화 1회
  useEffect(() => {
    if (!mapElRef.current) return;
    if (initializedRef.current) return;

    const init = async () => {
      await loadKakaoScript();

      window.kakao.maps.load(() => {
        if (!mapElRef.current) return;
        if (initializedRef.current) return;

        const initialCenter = new window.kakao.maps.LatLng(
          center?.latitude ?? 37.4979,
          center?.longitude ?? 127.0276
        );

        const map = new window.kakao.maps.Map(mapElRef.current, {
          center: initialCenter,
          level: 6,
        });

        mapRef.current = map;
        initializedRef.current = true;

        console.log('[Map] initialized');
        console.log('[Map] stations init:', stations.length);
        console.log('[Map] polylines init:', polylines.length);
        console.log('[Map] midpoint init:', midpoint);

        // 최초 렌더
        syncAllLayers(true);
      });
    };

    init().catch((e) => {
      console.error('[Map] init failed:', e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // center 변경 반영
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!center) return;

    console.log('[Map] center changed:', center);

    mapRef.current.setCenter(
      new window.kakao.maps.LatLng(center.latitude, center.longitude)
    );
  }, [center]);

  // 외부 props 변경 시 레이어 동기화
  useEffect(() => {
    if (!initializedRef.current) return;

    console.log('[Map] update triggered');
    console.log('[Map] stations:', stations.length);
    console.log('[Map] polylines:', polylines.map((p) => p.path?.length ?? 0));
    console.log('[Map] midpoint:', midpoint);

    syncAllLayers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, polylines, midpoint]);

  // 모든 레이어를 한 번에 동기화
  const syncAllLayers = (isFirst: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    // idle 핸들러는 1번만 등록/유지
    if (isFirst) {
      attachIdleHandler();
    }

    renderWhiteOverlay();
    renderPolylines();
    renderStations();
    renderMidpoint();
    fitBoundsIfPossible();
  };

  // idle 핸들러: 드래그/줌 후 overlay 위치 보정 + (원하면) 재렌더 트리거
  const attachIdleHandler = () => {
    const map = mapRef.current;
    if (!map) return;

    // 기존 핸들러 제거
    if (idleHandlerRef.current) {
      window.kakao.maps.event.removeListener(map, 'idle', idleHandlerRef.current);
      idleHandlerRef.current = null;
    }

    const onIdle = () => {
      // 흰 overlay는 center에 붙여두는 방식이면 위치 갱신 필요
      if (whiteOverlayRef.current) {
        whiteOverlayRef.current.setPosition(map.getCenter());
      }

      // midpoint overlay는 좌표에 붙어있으니 보통 필요 없지만,
      // CustomOverlay content가 깨지는 케이스 대비로 유지하고 싶으면 아래 주석 해제
      // renderMidpoint();
    };

    idleHandlerRef.current = onIdle;
    window.kakao.maps.event.addListener(map, 'idle', onIdle);
  };

  // 흰 배경 overlay (항상 Polyline 아래)
  const renderWhiteOverlay = () => {
    const map = mapRef.current;
    if (!map) return;

    if (whiteOverlayRef.current) {
      whiteOverlayRef.current.setMap(null);
      whiteOverlayRef.current = null;
    }

    // polylines, midpoint 둘 다 없으면 overlay 안 깔아도 됨
    if (polylines.length === 0 && !midpoint) return;

    const overlay = new window.kakao.maps.CustomOverlay({
      position: map.getCenter(),
      content: `<div class="kakao-white-overlay" id="kakao-white-overlay"></div>`,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 1,
    });

    overlay.setMap(map);
    whiteOverlayRef.current = overlay;

    console.log('[Map] renderWhiteOverlay');
  };

  // 역 마커
  const renderStations = () => {
    const map = mapRef.current;
    if (!map) return;

    stationMarkersRef.current.forEach((m) => m.setMap(null));
    stationMarkersRef.current = [];

    stations.forEach((s, idx) => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(s.latitude, s.longitude),
        zIndex: 10,
      });

      stationMarkersRef.current.push(marker);

      if (idx === 0) {
        console.log('[Map] renderStations sample:', s);
      }
    });

    console.log('[Map] renderStations count:', stations.length);
  };

  // Polyline: 외곽선 + 본선
  // - overlay(흰 배경) 위에 보이도록 zIndex를 확실히 올림
  // - 디버깅용으로 id를 DOM에 직접 부여하진 못하지만, refs 개수는 로그로 확인 가능
  const renderPolylines = () => {
    const map = mapRef.current;
    if (!map) return;

    polylineRefsRef.current.forEach((p) => p.setMap(null));
    polylineRefsRef.current = [];

    console.log('[Map] renderPolylines called');
    console.log('[Map] polylines prop len:', polylines.length);

    polylines.forEach((p, index) => {
      const pts = p.path ?? [];
      if (pts.length < 2) {
        console.warn(`[Map] polyline[${index}] skipped (len < 2)`);
        return;
      }

      const path = pts.map(
        (pt) => new window.kakao.maps.LatLng(pt.latitude, pt.longitude)
      );

      // 외곽선
      const outline = new window.kakao.maps.Polyline({
        map,
        path,
        strokeWeight: 12,
        strokeColor: '#FFFFFF',
        strokeOpacity: 1,
        zIndex: 6,
      });

      // 본선
      const main = new window.kakao.maps.Polyline({
        map,
        path,
        strokeWeight: 7,
        strokeColor: p.color ?? '#ff2db2',
        strokeOpacity: 1,
        zIndex: 7,
      });

      polylineRefsRef.current.push(outline, main);

      console.log(`[Map] polyline[${index}] points:`, pts.length);
    });

    console.log('[Map] polylines rendered objects:', polylineRefsRef.current.length);
  };

  // midpoint overlay
  const renderMidpoint = () => {
    const map = mapRef.current;
    if (!map) return;

    if (midpointOverlayRef.current) {
      midpointOverlayRef.current.setMap(null);
      midpointOverlayRef.current = null;
    }

    if (!midpoint) return;

    const iconHtml = renderToStaticMarkup(
      <TbMapPinHeart size={44} className="kakao-midpoint-icon" />
    );

    const overlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(midpoint.latitude, midpoint.longitude),
      content: `<div class="kakao-midpoint-marker" id="kakao-midpoint-marker">${iconHtml}</div>`,
      yAnchor: 1,
      zIndex: 20,
    });

    overlay.setMap(map);
    midpointOverlayRef.current = overlay;

    console.log('[Map] renderMidpoint:', midpoint);
  };

  // 경로가 있으면 bounds 맞추기
  const fitBoundsIfPossible = () => {
    const map = mapRef.current;
    if (!map) return;
    if (polylines.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    polylines.forEach((p) => {
      (p.path ?? []).forEach((pt) => {
        bounds.extend(new window.kakao.maps.LatLng(pt.latitude, pt.longitude));
      });
    });

    map.setBounds(bounds, 40);
    console.log('[Map] fitBounds');
  };

  return (
    <div className={styles.wrapper}>
      <div ref={mapElRef} className={styles.map} />
      {children}
    </div>
  );
};
