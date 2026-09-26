import type { LineSegment, RawStation } from '@/domain/subway/types';

// 수도권 지하철 일부 역. 환승역은 노선마다 별도 항목(id 접미사 _노선)을 가진다.
// 연결 관계는 이 배열 순서가 아니라 아래 LINE_SEGMENTS 가 정한다.
export const RAW_STATIONS: RawStation[] = [
  // 1호선
  { id: 'incheon', name: '인천', lineId: '1', latitude: 37.4767, longitude: 126.6163 },
  { id: 'dongincheon', name: '동인천', lineId: '1', latitude: 37.4746, longitude: 126.6326 },
  { id: 'jemulpo', name: '제물포', lineId: '1', latitude: 37.4668, longitude: 126.6566 },
  { id: 'dohwa', name: '도화', lineId: '1', latitude: 37.4661, longitude: 126.6684 },
  { id: 'juan', name: '주안', lineId: '1', latitude: 37.4643, longitude: 126.6796 },
  { id: 'guro', name: '구로', lineId: '1', latitude: 37.503, longitude: 126.8827 },
  { id: 'sindorim_1', name: '신도림', lineId: '1', latitude: 37.509, longitude: 126.8912 },
  { id: 'yeongdeungpo', name: '영등포', lineId: '1', latitude: 37.5156, longitude: 126.9076 },
  { id: 'singil', name: '신길', lineId: '1', latitude: 37.5171, longitude: 126.9178 },
  { id: 'daebang', name: '대방', lineId: '1', latitude: 37.5134, longitude: 126.9263 },
  { id: 'noryangjin', name: '노량진', lineId: '1', latitude: 37.5133, longitude: 126.941 },
  { id: 'yongsan', name: '용산', lineId: '1', latitude: 37.5299, longitude: 126.9648 },
  { id: 'seoul_1', name: '서울역', lineId: '1', latitude: 37.5563, longitude: 126.9723 },
  { id: 'cityhall_1', name: '시청', lineId: '1', latitude: 37.5657, longitude: 126.9769 },
  { id: 'jonggak', name: '종각', lineId: '1', latitude: 37.5704, longitude: 126.9826 },
  { id: 'jongno3_1', name: '종로3가', lineId: '1', latitude: 37.5716, longitude: 126.9918 },
  { id: 'jongno5', name: '종로5가', lineId: '1', latitude: 37.5709, longitude: 127.0016 },
  { id: 'dongdaemun_1', name: '동대문', lineId: '1', latitude: 37.5714, longitude: 127.009 },
  { id: 'sinseol_1', name: '신설동', lineId: '1', latitude: 37.576, longitude: 127.0257 },
  { id: 'jegidong', name: '제기동', lineId: '1', latitude: 37.5781, longitude: 127.0347 },
  { id: 'cheongnyangni', name: '청량리', lineId: '1', latitude: 37.58, longitude: 127.0463 },
  { id: 'hoegi', name: '회기', lineId: '1', latitude: 37.5898, longitude: 127.0571 },
  { id: 'hufs', name: '한국외대앞', lineId: '1', latitude: 37.5961, longitude: 127.0634 },
  { id: 'seokgye', name: '석계', lineId: '1', latitude: 37.6148, longitude: 127.0657 },
  { id: 'kwangwoon', name: '광운대', lineId: '1', latitude: 37.6236, longitude: 127.061 },
  { id: 'changdong', name: '창동', lineId: '1', latitude: 37.653, longitude: 127.047 },
  { id: 'dobong', name: '도봉', lineId: '1', latitude: 37.6795, longitude: 127.0452 },
  { id: 'uijeongbu', name: '의정부', lineId: '1', latitude: 37.7381, longitude: 127.0456 },
  { id: 'gasan', name: '가산디지털단지', lineId: '1', latitude: 37.4816, longitude: 126.8825 },
  { id: 'geumcheon', name: '금천구청', lineId: '1', latitude: 37.4556, longitude: 126.8946 },
  { id: 'anyang', name: '안양', lineId: '1', latitude: 37.4019, longitude: 126.9227 },
  { id: 'myeonghak', name: '명학', lineId: '1', latitude: 37.3844, longitude: 126.9354 },
  { id: 'geumjeong', name: '금정', lineId: '1', latitude: 37.3722, longitude: 126.9434 },
  { id: 'gunpo', name: '군포', lineId: '1', latitude: 37.3537, longitude: 126.9485 },
  { id: 'dangjeong', name: '당정', lineId: '1', latitude: 37.3444, longitude: 126.9488 },
  { id: 'uiwang', name: '의왕', lineId: '1', latitude: 37.3204, longitude: 126.948 },
  { id: 'skku', name: '성균관대', lineId: '1', latitude: 37.3003, longitude: 126.9716 },
  { id: 'suwon', name: '수원', lineId: '1', latitude: 37.2665, longitude: 126.9995 },
  { id: 'seryu', name: '세류', lineId: '1', latitude: 37.2453, longitude: 127.0131 },
  { id: 'byeongjeom', name: '병점', lineId: '1', latitude: 37.2066, longitude: 127.0327 },
  { id: 'seodongtan', name: '서동탄', lineId: '1', latitude: 37.1951, longitude: 127.0513 },
  { id: 'osan', name: '오산', lineId: '1', latitude: 37.1459, longitude: 127.0667 },
  { id: 'songtan', name: '송탄', lineId: '1', latitude: 37.0753, longitude: 127.0555 },
  { id: 'pyeongtaek', name: '평택', lineId: '1', latitude: 36.9903, longitude: 127.0851 },
  { id: 'seojeongri', name: '서정리', lineId: '1', latitude: 36.9956, longitude: 127.1032 },
  { id: 'cheonan', name: '천안', lineId: '1', latitude: 36.81, longitude: 127.1464 },

  // 2호선
  { id: 'cityhall_2', name: '시청', lineId: '2', latitude: 37.5647, longitude: 126.9771 },
  { id: 'euljiro3_2', name: '을지로3가', lineId: '2', latitude: 37.5663, longitude: 126.9923 },
  { id: 'ddp_2', name: '동대문역사문화공원', lineId: '2', latitude: 37.5651, longitude: 127.0091 },
  { id: 'wangsimni_2', name: '왕십리', lineId: '2', latitude: 37.5615, longitude: 127.037 },
  { id: 'seolleung_2', name: '선릉', lineId: '2', latitude: 37.5045, longitude: 127.0489 },
  { id: 'gangnam_2', name: '강남', lineId: '2', latitude: 37.4979, longitude: 127.0276 },
  { id: 'sadang_2', name: '사당', lineId: '2', latitude: 37.4766, longitude: 126.9816 },
  { id: 'sindorim_2', name: '신도림', lineId: '2', latitude: 37.509, longitude: 126.8912 },
  { id: 'hongdae_2', name: '홍대입구', lineId: '2', latitude: 37.5572, longitude: 126.9245 },

  // 3호선
  { id: 'gyeongbokgung_3', name: '경복궁', lineId: '3', latitude: 37.5759, longitude: 126.9736 },
  { id: 'jongno3_3', name: '종로3가', lineId: '3', latitude: 37.5716, longitude: 126.9918 },
  { id: 'euljiro3_3', name: '을지로3가', lineId: '3', latitude: 37.5663, longitude: 126.9923 },
  { id: 'chungmuro_3', name: '충무로', lineId: '3', latitude: 37.5612, longitude: 126.9946 },
  { id: 'expressbus_3', name: '고속터미널', lineId: '3', latitude: 37.5048, longitude: 127.0049 },

  // 4호선
  { id: 'seoul_4', name: '서울역', lineId: '4', latitude: 37.5563, longitude: 126.9723 },
  { id: 'sookmyung_4', name: '숙대입구', lineId: '4', latitude: 37.5446, longitude: 126.9723 },
  { id: 'samgakji_4', name: '삼각지', lineId: '4', latitude: 37.5346, longitude: 126.9726 },
  { id: 'dongjak_4', name: '동작', lineId: '4', latitude: 37.5029, longitude: 126.9803 },
  { id: 'sadang_4', name: '사당', lineId: '4', latitude: 37.4766, longitude: 126.9816 },

  // 5호선
  { id: 'gwanghwamun_5', name: '광화문', lineId: '5', latitude: 37.5716, longitude: 126.9769 },
  { id: 'jongno3_5', name: '종로3가', lineId: '5', latitude: 37.5716, longitude: 126.9918 },
  { id: 'ddp_5', name: '동대문역사문화공원', lineId: '5', latitude: 37.5651, longitude: 127.0091 },
  { id: 'wangsimni_5', name: '왕십리', lineId: '5', latitude: 37.5615, longitude: 127.037 },

  // 6호선
  { id: 'itaewon_6', name: '이태원', lineId: '6', latitude: 37.5345, longitude: 126.9946 },
  { id: 'samgakji_6', name: '삼각지', lineId: '6', latitude: 37.5346, longitude: 126.9726 },
  { id: 'hyochang_6', name: '효창공원앞', lineId: '6', latitude: 37.5392, longitude: 126.961 },

  // 7호선
  { id: 'expressbus_7', name: '고속터미널', lineId: '7', latitude: 37.5048, longitude: 127.0049 },
  { id: 'konkuk_7', name: '건대입구', lineId: '7', latitude: 37.5404, longitude: 127.0692 },

  // 8호선
  { id: 'jamsil_8', name: '잠실', lineId: '8', latitude: 37.5133, longitude: 127.1 },
  { id: 'seongnae_8', name: '성내', lineId: '8', latitude: 37.4935, longitude: 127.1225 },

  // 9호선
  { id: 'dangsan_9', name: '당산', lineId: '9', latitude: 37.5338, longitude: 126.902 },
  { id: 'yeouido_9', name: '여의도', lineId: '9', latitude: 37.5216, longitude: 126.9244 },
  { id: 'expressbus_9', name: '고속터미널', lineId: '9', latitude: 37.5048, longitude: 127.0049 },
];

// 운행 순서. 분기는 구간을 나누고, 순환선은 loop 로 표현한다.
export const LINE_SEGMENTS: LineSegment[] = [
  {
    // 1호선 경인선·본선: 인천 → 구로 → 서울 도심 → 의정부
    lineId: '1',
    stationIds: [
      'incheon', 'dongincheon', 'jemulpo', 'dohwa', 'juan', 'guro',
      'sindorim_1', 'yeongdeungpo', 'singil', 'daebang', 'noryangjin', 'yongsan',
      'seoul_1', 'cityhall_1', 'jonggak', 'jongno3_1', 'jongno5', 'dongdaemun_1', 'sinseol_1',
      'jegidong', 'cheongnyangni', 'hoegi', 'hufs', 'seokgye', 'kwangwoon',
      'changdong', 'dobong', 'uijeongbu',
    ],
  },
  {
    // 1호선 경부선 지선: 구로에서 갈라져 천안까지
    lineId: '1',
    stationIds: [
      'guro', 'gasan', 'geumcheon', 'anyang', 'myeonghak', 'geumjeong',
      'gunpo', 'dangjeong', 'uiwang', 'skku', 'suwon', 'seryu', 'byeongjeom',
      'seodongtan', 'osan', 'songtan', 'pyeongtaek', 'seojeongri', 'cheonan',
    ],
  },
  {
    // 2호선 순환. 홍대입구 → 시청으로 닫힌다
    lineId: '2',
    loop: true,
    stationIds: [
      'cityhall_2', 'euljiro3_2', 'ddp_2', 'wangsimni_2', 'seolleung_2',
      'gangnam_2', 'sadang_2', 'sindorim_2', 'hongdae_2',
    ],
  },
  { lineId: '3', stationIds: ['gyeongbokgung_3', 'jongno3_3', 'euljiro3_3', 'chungmuro_3', 'expressbus_3'] },
  { lineId: '4', stationIds: ['seoul_4', 'sookmyung_4', 'samgakji_4', 'dongjak_4', 'sadang_4'] },
  { lineId: '5', stationIds: ['gwanghwamun_5', 'jongno3_5', 'ddp_5', 'wangsimni_5'] },
  { lineId: '6', stationIds: ['hyochang_6', 'samgakji_6', 'itaewon_6'] },
  { lineId: '7', stationIds: ['expressbus_7', 'konkuk_7'] },
  { lineId: '8', stationIds: ['jamsil_8', 'seongnae_8'] },
  { lineId: '9', stationIds: ['dangsan_9', 'yeouido_9', 'expressbus_9'] },
];
