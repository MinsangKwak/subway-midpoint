// OpenStreetMap(Overpass API)에서 수도권 전철 1~9호선과 신분당·경의중앙·수인분당·공항철도의
// 역 순서·좌표를 받아 src/data/subway/stations.ts 를 생성한다.
//
//   node scripts/fetch-stations.mjs
//
// 왜 OSM 인가: 키 없이 받을 수 있고, 노선(route relation)에 정차역이 운행 순서대로 들어 있다.
// 급행·특급·직통 노선은 역을 건너뛰어 가짜 인접 간선을 만들므로 제외한다.
// 데이터 라이선스: ODbL. 화면 하단에 © OpenStreetMap contributors 를 표기한다.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// 공식 서버가 바쁘면 미러로 넘어간다
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const BBOX = '36.7,126.3,38.1,127.7'; // 수도권 전철이 닿는 범위 (천안·연천·인천공항·지평·문산 포함)

// OSM route relation 의 ref → 이 앱의 노선 id. 1~9호선은 route=subway, 나머지는 route=train 으로 올라와 있다.
const LINE_BY_REF = {
  1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  '경의·중앙': '경의중앙',
  '수인·분당': '수인분당',
  신분당: '신분당',
  공항철도: '공항철도',
};
const LINE_IDS = Array.from(new Set(Object.values(LINE_BY_REF)));

// 노선마다 역 이름이 다른 환승역. 왼쪽(괄호 제거 후) 이름의 역을 오른쪽 이름과 같은 역으로 묶는다.
const TRANSFER_ALIASES = {
  총신대입구: '이수',
};

// 이름은 같지만 다른 곳에 있는 역. 노선별로 다른 키를 줘서 환승역으로 묶이지 않게 한다.
// (2호선 신촌과 경의중앙선 신촌은 약 1km, 5호선 양평과 경의중앙선 양평은 40km 넘게 떨어져 있다)
const DISTINCT_BY_LINE = {
  신촌: { 경의중앙: '신촌(경의중앙)' },
  양평: { 경의중앙: '양평(경의중앙)' },
};

// 같은 키로 묶인 노선별 노드가 이보다 멀면 다른 역일 가능성이 높아 경고한다
const TRANSFER_MAX_KM = 0.8;

// OSM 이름은 "강변(동서울터미널)", "신논현역 (Sinnonhyeon)"처럼 부기가 섞여 있다.
// 표시 이름은 괄호 앞부분만 쓰고, 원래 표기는 검색 별칭으로 남긴다. "서울역"만 예외로 역을 남긴다.
const displayName = (raw) => {
  const base = raw.replace(/\s*[(（].*?[)）]\s*/g, '').trim();
  return base === '서울역' ? base : base.replace(/역$/, '');
};

// --cached 옵션용 마지막 응답 저장 위치 (gitignore)
const CACHE = new URL('../.cache/overpass-lines.json', import.meta.url);

const refPattern = Object.keys(LINE_BY_REF).join('|');
const query = `
[out:json][timeout:300];
relation["type"="route"]["route"~"^(subway|train)$"]["ref"~"^(${refPattern})$"](${BBOX});
out body;
node(r);
out body;
`;

const fetchOverpass = async () => {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const url of OVERPASS_MIRRORS) {
      try {
        console.log(`요청: ${url}`);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'User-Agent': 'subway-midpoint-data/1.0 (github.com/MinsangKwak/subway-midpoint)',
          },
          body: `data=${encodeURIComponent(query)}`,
        });
        if (!res.ok) throw new Error(`Overpass ${res.status}`);
        return await res.json();
      } catch (err) {
        lastError = err;
        console.warn(`  실패: ${err.message}`);
      }
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  throw lastError;
};

const normalize = (name) => name.replace(/\s+/g, '').replace(/역$/, '');

const isExpress = (tags) =>
  /급행|특급|직통/.test(tags.name ?? '') || /express/i.test(tags.service ?? '');

const haversineKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// --cached 를 주면 마지막 응답을 다시 쓴다 (스크립트 수정 중 서버 부담을 줄이려고)
const loadData = async () => {
  if (process.argv.includes('--cached')) {
    try {
      return JSON.parse(await readFile(CACHE, 'utf8'));
    } catch {
      console.warn('캐시 없음, 새로 받는다');
    }
  }
  const data = await fetchOverpass();
  await mkdir(new URL('./', CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(data), 'utf8');
  return data;
};

const main = async () => {
  const data = await loadData();
  const nodesById = new Map();
  const relations = [];
  for (const el of data.elements) {
    if (el.type === 'node') nodesById.set(el.id, el);
    if (el.type === 'relation') relations.push(el);
  }

  // lineId → (정규화 이름 → 역)
  const stationsByLine = new Map(LINE_IDS.map((id) => [id, new Map()]));
  const segments = [];
  const skipped = [];

  for (const rel of relations.sort((a, b) => a.id - b.id)) {
    const lineId = LINE_BY_REF[rel.tags.ref];
    if (!lineId) continue;
    if (isExpress(rel.tags)) {
      skipped.push(`${rel.id} ${rel.tags.name} (급행)`);
      continue;
    }

    const byLine = stationsByLine.get(lineId);
    const ids = [];
    for (const m of rel.members) {
      if (m.type !== 'node') continue;
      const role = m.role ?? '';
      const node = nodesById.get(m.ref);
      if (!node) continue;
      const tags = node.tags ?? {};
      // 정차 위치(stop*) 또는 역 노드만. 승강장(platform)은 제외
      const isStop = role.startsWith('stop') || tags.railway === 'station' || tags.railway === 'stop';
      if (!isStop) continue;
      const rawName = tags.name;
      if (!rawName) {
        skipped.push(`${rel.id} node ${node.id} 이름 없음`);
        continue;
      }
      const name = displayName(rawName);
      const key = normalize(name);
      const id = `l${lineId}_${key}`;
      const existing = byLine.get(key);
      if (!existing) {
        byLine.set(key, {
          id,
          name,
          lineId,
          latitude: Number(node.lat.toFixed(5)),
          longitude: Number(node.lon.toFixed(5)),
          transferName: DISTINCT_BY_LINE[name]?.[lineId] ?? TRANSFER_ALIASES[name],
          aliases: new Set(rawName.trim() !== name ? [rawName.trim()] : []),
        });
      } else if (rawName.trim() !== name) {
        existing.aliases.add(rawName.trim());
      }
      // 같은 역이 연달아 나오면(양방향 정차 위치) 한 번만
      if (ids[ids.length - 1] !== id) ids.push(id);
    }
    if (ids.length >= 2) {
      segments.push({ lineId, stationIds: ids, source: `${rel.id} ${rel.tags.name}` });
    } else {
      skipped.push(`${rel.id} ${rel.tags.name} (정차역 ${ids.length}개)`);
    }
  }

  const stations = LINE_IDS.flatMap((id) =>
    Array.from(stationsByLine.get(id).values()).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
  );

  // 간선을 세어 노선별 끝 역(연결 1개)을 보고한다. 지선 끝이 아닌 곳이 나오면 데이터 문제다
  const degree = new Map();
  for (const seg of segments) {
    for (let i = 0; i < seg.stationIds.length - 1; i++) {
      const a = seg.stationIds[i];
      const b = seg.stationIds[i + 1];
      if (a === b) continue;
      (degree.get(a) ?? degree.set(a, new Set()).get(a)).add(b);
      (degree.get(b) ?? degree.set(b, new Set()).get(b)).add(a);
    }
  }
  for (const id of LINE_IDS) {
    const list = Array.from(stationsByLine.get(id).values());
    const ends = list.filter((s) => (degree.get(s.id)?.size ?? 0) <= 1).map((s) => s.name);
    console.log(`${/^\d+$/.test(id) ? `${id}호선` : id} ${list.length}역, 끝 역: ${ends.join(', ')}`);
  }
  if (skipped.length) console.log(`제외 ${skipped.length}건\n  ${skipped.slice(0, 12).join('\n  ')}`);

  // 같은 키로 묶인 노선별 노드가 서로 멀면 이름만 같은 다른 역이다. DISTINCT_BY_LINE 에 추가해야 한다
  const byKey = new Map();
  for (const s of stations) {
    const key = normalize(s.transferName ?? s.name);
    (byKey.get(key) ?? byKey.set(key, []).get(key)).push(s);
  }
  const suspicious = [];
  for (const [key, group] of byKey) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = { lat: group[i].latitude, lon: group[i].longitude };
        const b = { lat: group[j].latitude, lon: group[j].longitude };
        const km = haversineKm(a, b);
        if (km > TRANSFER_MAX_KM) suspicious.push(`${key}: ${group[i].id} ↔ ${group[j].id} ${km.toFixed(1)}km`);
      }
    }
  }
  if (suspicious.length) console.warn(`환승 묶음 의심 ${suspicious.length}건 (TRANSFER_MAX_KM=${TRANSFER_MAX_KM})\n  ${suspicious.join('\n  ')}`);

  const fmt = (s) =>
    `  { id: '${s.id}', name: '${s.name.replace(/'/g, "\\'")}', lineId: '${s.lineId}', latitude: ${s.latitude}, longitude: ${s.longitude}` +
    (s.transferName ? `, transferName: '${s.transferName}'` : '') +
    (s.aliases.size ? `, aliases: [${Array.from(s.aliases).map((a) => `'${a.replace(/'/g, "\\'")}'`).join(', ')}]` : '') +
    ' },';

  const out = `// 이 파일은 scripts/fetch-stations.mjs 가 생성한다. 직접 고치지 말고 스크립트를 다시 실행한다.
// 출처: OpenStreetMap contributors (ODbL), Overpass API, ${new Date().toISOString().slice(0, 10)} 기준.
// 노선 연결은 RAW_STATIONS 순서가 아니라 LINE_SEGMENTS(OSM route relation 의 정차 순서)가 정한다.
// 노선: ${LINE_IDS.join(', ')}
import type { LineSegment, RawStation } from '@/domain/subway/types';

export const RAW_STATIONS: RawStation[] = [
${stations.map(fmt).join('\n')}
];

export const LINE_SEGMENTS: LineSegment[] = [
${segments
  .map(
    (seg) =>
      `  // ${seg.source}\n  { lineId: '${seg.lineId}', stationIds: [${seg.stationIds.map((id) => `'${id}'`).join(', ')}] },`,
  )
  .join('\n')}
];
`;

  const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/subway/stations.ts');
  await writeFile(target, out, 'utf8');
  console.log(`\n${stations.length}역, 구간 ${segments.length}개 → ${path.relative(process.cwd(), target)}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
