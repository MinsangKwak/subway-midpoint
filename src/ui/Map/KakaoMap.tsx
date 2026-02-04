import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

export const KakaoMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.kakao || !mapRef.current) return;

    window.kakao.maps.load(() => {
      const center = new window.kakao.maps.LatLng(37.4979, 127.0276); // 강남
      const map = new window.kakao.maps.Map(mapRef.current, {
        center,
        level: 5,
      });

      new window.kakao.maps.Marker({
        map,
        position: center,
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
