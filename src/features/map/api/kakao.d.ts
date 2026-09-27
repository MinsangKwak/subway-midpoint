// 카카오맵 SDK 중 이 앱이 쓰는 부분만 선언한다. 전체 타입은 SDK가 제공하지 않는다.
declare namespace kakao.maps {
  class LatLng {
    constructor(latitude: number, longitude: number);
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
  }

  type MapOptions = {
    center: LatLng;
    level?: number;
  };

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    panTo(latlng: LatLng): void;
    setLevel(level: number): void;
    setBounds(bounds: LatLngBounds, top?: number, right?: number, bottom?: number, left?: number): void;
    relayout(): void;
  }

  type PolylineOptions = {
    map?: Map;
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
    zIndex?: number;
  };

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
  }

  type CustomOverlayOptions = {
    map?: Map;
    position: LatLng;
    content: string | HTMLElement;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  };

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao?: { maps: typeof kakao.maps };
}
