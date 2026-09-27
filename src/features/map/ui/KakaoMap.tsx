import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@/domain/subway/types';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/Button/Button';
import { loadKakaoMaps, type KakaoMaps } from '../api/kakaoLoader';
import styles from './KakaoMap.module.css';

export type MapMarker = {
  id: string;
  position: LatLng;
  color: string;
  label: string;
};

export type MapRoute = {
  id: string;
  color: string;
  points: LatLng[];
};

type Props = {
  // 결과가 없을 때 바라볼 중심. 바뀔 때마다 이동한다
  focus: LatLng | null;
  markers: MapMarker[];
  routes: MapRoute[];
  midpoint: (LatLng & { name: string }) | null;
  // 데스크톱에서 왼쪽 패널이 가리는 폭. bounds 맞출 때 여백으로 쓴다
  insetLeft?: number;
  insetBottom?: number;
};

type Status = 'loading' | 'ready' | 'missing-key' | 'error';

const DEFAULT_CENTER: LatLng = { latitude: 37.5563, longitude: 126.9723 };
const DEFAULT_LEVEL = 7;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const markerHtml = (m: MapMarker) =>
  `<div class="${styles.marker}" style="--marker:${m.color}"><span class="${styles.markerDot}"></span><span class="${styles.markerLabel}">${escapeHtml(m.label)}</span></div>`;

const midpointHtml = (name: string) =>
  `<div class="${styles.midpoint}"><span class="${styles.midpointPulse}"></span><span class="${styles.midpointPin}"></span><span class="${styles.midpointLabel}">${escapeHtml(name)}</span></div>`;

export const KakaoMap = ({ focus, markers, routes, midpoint, insetLeft = 0, insetBottom = 0 }: Props) => {
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  const elRef = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const linesRef = useRef<kakao.maps.Polyline[]>([]);
  const [status, setStatus] = useState<Status>(appKey ? 'loading' : 'missing-key');
  const [message, setMessage] = useState<string | null>(null);

  // SDK 로드 + 지도 1회 생성
  useEffect(() => {
    if (!appKey || !elRef.current) return;
    let cancelled = false;

    loadKakaoMaps(appKey)
      .then((maps) => {
        if (cancelled || !elRef.current) return;
        mapsRef.current = maps;
        mapRef.current = new maps.Map(elRef.current, {
          center: new maps.LatLng(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude),
          level: DEFAULT_LEVEL,
        });
        setStatus('ready');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [appKey]);

  // 결과가 없을 때만 포커스 이동
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (status !== 'ready' || !maps || !map || !focus || midpoint) return;
    map.panTo(new maps.LatLng(focus.latitude, focus.longitude));
  }, [status, focus, midpoint]);

  // 마커·경로·중간지점 동기화. 매번 지우고 다시 그린다 (수십 개 수준이라 충분)
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (status !== 'ready' || !maps || !map) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    linesRef.current.forEach((l) => l.setMap(null));
    overlaysRef.current = [];
    linesRef.current = [];

    const bounds = new maps.LatLngBounds();
    let hasBounds = false;

    for (const r of routes) {
      if (r.points.length < 2) continue;
      const path = r.points.map((p) => new maps.LatLng(p.latitude, p.longitude));
      path.forEach((p) => bounds.extend(p));
      hasBounds = true;
      linesRef.current.push(
        new maps.Polyline({ map, path, strokeWeight: 10, strokeColor: '#ffffff', strokeOpacity: 0.9, zIndex: 1 }),
        new maps.Polyline({ map, path, strokeWeight: 5, strokeColor: r.color, strokeOpacity: 1, zIndex: 2 }),
      );
    }

    for (const m of markers) {
      const position = new maps.LatLng(m.position.latitude, m.position.longitude);
      overlaysRef.current.push(
        new maps.CustomOverlay({ map, position, content: markerHtml(m), xAnchor: 0.5, yAnchor: 0.5, zIndex: 3 }),
      );
    }

    if (midpoint) {
      const position = new maps.LatLng(midpoint.latitude, midpoint.longitude);
      bounds.extend(position);
      hasBounds = true;
      overlaysRef.current.push(
        new maps.CustomOverlay({ map, position, content: midpointHtml(midpoint.name), xAnchor: 0.5, yAnchor: 1, zIndex: 4 }),
      );
    }

    if (hasBounds) {
      map.setBounds(bounds, 48, 48, 48 + insetBottom, 48 + insetLeft);
    }
  }, [status, markers, routes, midpoint, insetLeft, insetBottom]);

  // 창 크기가 바뀌면 타일 재배치
  useEffect(() => {
    if (status !== 'ready') return;
    const onResize = () => mapRef.current?.relayout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [status]);

  const locate = () => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.panTo(new maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        map.setLevel(5);
      },
      () => setMessage('현재 위치를 가져오지 못했어요.'),
    );
  };

  return (
    <div className={styles.wrap}>
      <div ref={elRef} className={styles.canvas} aria-label="지도" role="application" />

      {midpoint && <div className={styles.dim} aria-hidden="true" />}

      {status === 'ready' && (
        <div className={styles.controls} style={{ bottom: insetBottom + 16 }}>
          <IconButton label="현재 위치로 이동" tone="accent" onClick={locate}>
            <Icon name="locate" />
          </IconButton>
        </div>
      )}

      {status !== 'ready' && (
        <div className={styles.fallback} role="status">
          {status === 'loading' && <p>지도를 불러오는 중…</p>}
          {status === 'missing-key' && (
            <p>
              카카오맵 키가 없어 지도를 표시할 수 없어요.
              <br />
              <code>VITE_KAKAO_MAP_KEY</code> 를 설정하면 지도가 나타나요. 중간지점 계산은 그대로 동작해요.
            </p>
          )}
          {status === 'error' && <p>{message ?? '지도를 불러오지 못했어요.'}</p>}
        </div>
      )}

      {status === 'ready' && message && (
        <p className={styles.toast} role="status" onAnimationEnd={() => setMessage(null)}>
          {message}
        </p>
      )}
    </div>
  );
};
