export type KakaoMaps = typeof kakao.maps;

let pending: Promise<KakaoMaps> | null = null;

// SDK 스크립트를 한 번만 넣고, 준비되면 kakao.maps 를 돌려준다.
export const loadKakaoMaps = (appKey: string): Promise<KakaoMaps> => {
  if (pending) return pending;

  pending = new Promise<KakaoMaps>((resolve, reject) => {
    const existing = window.kakao?.maps;
    if (existing) {
      existing.load(() => resolve(existing));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        pending = null;
        reject(new Error('카카오맵 SDK 를 불러왔지만 kakao.maps 가 없습니다.'));
        return;
      }
      maps.load(() => resolve(maps));
    };
    script.onerror = () => {
      pending = null;
      script.remove();
      reject(new Error('카카오맵 SDK 를 불러오지 못했습니다. 앱 키와 허용 도메인을 확인하세요.'));
    };
    document.head.appendChild(script);
  });

  return pending;
};
