import { useEffect, useRef } from 'react';
import styles from './style.module.css';

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_SDK_URL = '//dapi.kakao.com/v2/maps/sdk.js?appkey=978abb23ebefd464ebc147fb4197eed5&autoload=false';

/**
 * KakaoMap 컴포넌트 Props
 */
type KakaoMapProps = {
  center?: {
    latitude: number;   // 지도 중심 위도
    longitude: number;  // 지도 중심 경도
  };
};

/**
 * Kakao Maps SDK 로드 함수
 * - SDK가 이미 로드된 경우 재사용
 */
const loadKakaoScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      console.log('[KakaoMap] SDK already loaded');
      resolve();
      return;
    }

    console.log('[KakaoMap] Loading SDK...');
    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => {
      console.log('[KakaoMap] SDK load success');
      resolve();
    };
    script.onerror = () => {
      console.error('[KakaoMap] SDK load failed');
      reject();
    };

    document.head.appendChild(script);
  });
};

export const KakaoMap = ({ center }: KakaoMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  /** Kakao 지도 인스턴스 */
  const mapInstanceRef = useRef<any>(null);

  /** 지도에 표시되는 마커 목록 */
  const markerInstancesRef = useRef<any[]>([]);

  /**
   * 지도 최초 생성
   */
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    loadKakaoScript()
      .then(() => {
        window.kakao.maps.load(() => {
          if (!mapContainerRef.current) return;

          const defaultLatitude = 37.4979;
          const defaultLongitude = 127.0276;

          console.log('[KakaoMap] 초기 위치 (기본값)', {
            latitude: defaultLatitude,
            longitude: defaultLongitude,
          });

          const defaultCenter = new window.kakao.maps.LatLng(
            defaultLatitude,
            defaultLongitude
          );

          mapInstanceRef.current = new window.kakao.maps.Map(
            mapContainerRef.current,
            {
              center: defaultCenter,
              level: 5,
            }
          );

          markerInstancesRef.current = [
            new window.kakao.maps.Marker({
              map: mapInstanceRef.current,
              position: defaultCenter,
            }),
          ];

          console.log('[KakaoMap] 지도 생성 완료', {
            mapReady: true,
          });
        });
      })
      .catch(() => {
        console.error('[KakaoMap] 지도 생성 실패', {
          mapReady: false,
        });
      });
  }, []);

  /**
   * 외부에서 전달된 center 좌표 반영
   */
  useEffect(() => {
    if (!center) {
      console.log('[KakaoMap] center 없음 (이동 안 함)');
      return;
    }

    if (!mapInstanceRef.current) {
      console.log('[KakaoMap] mapInstance 없음 (이동 불가)');
      return;
    }

    if (
      typeof center.latitude !== 'number' ||
      typeof center.longitude !== 'number'
    ) {
      console.warn('[KakaoMap] 유효하지 않은 좌표', center);
      return;
    }

    console.log('[KakaoMap] 검색어 위치 좌표 수신', {
      latitude: center.latitude,
      longitude: center.longitude,
    });

    const nextCenter = new window.kakao.maps.LatLng(
      center.latitude,
      center.longitude
    );

    // 다음 프레임에서 레이아웃 안정 후 이동
    requestAnimationFrame(() => {
      mapInstanceRef.current.relayout();
      mapInstanceRef.current.setCenter(nextCenter);
      markerInstancesRef.current[0]?.setPosition(nextCenter);

      console.log('[KakaoMap] 지도 표시 위치', {
        latitude: center.latitude,
        longitude: center.longitude,
      });
    });
  }, [center]);

  return <div ref={mapContainerRef} className={styles.container} />;
};
