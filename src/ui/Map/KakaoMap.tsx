import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_SDK_URL = '//dapi.kakao.com/v2/maps/sdk.js?appkey=978abb23ebefd464ebc147fb4197eed5&autoload=false';


export const KakaoMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!mapRef.current || isInitialized.current) return;

    const loadKakaoScript = () =>
      new Promise<void>((resolve, reject) => {
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

    loadKakaoScript().then(() => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const center = new window.kakao.maps.LatLng(37.4979, 127.0276);

        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 5,
        });

        new window.kakao.maps.Marker({
          map,
          position: center,
        });

        isInitialized.current = true;
      });
    });
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 12,
      }}
    />
  );
};
