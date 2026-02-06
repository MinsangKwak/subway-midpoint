// src/ui/SelectedStationBadgeList/index.tsx
//
// 환승/단일 역 모두 대응
// - lineId 기반 CSS 완전 제거
// - HomePage에서 내려준 colors 배열만 사용
// - 런타임 undefined 방어 필수
//
// 중요:
// colors는 "항상 배열"이 이상적이지만
// 실제 런타임에서는 깨질 수 있으므로 여기서 방어한다

import type { CSSProperties } from 'react';
import styles from './style.module.css';

export type SelectedStationBadge = {
  id: string;        // 역 ID
  name: string;      // 역 이름
  colors: string[];  // 단일/환승 호선 색상 배열
  lineIds: string[]; // ← 추가 (["2"] / ["1","2"])
};

type Props = {
  stations: SelectedStationBadge[];

  // 뱃지 클릭 시 (지도 포커스)
  onSelect?: (id: string) => void;

  // X 버튼 클릭 시 (삭제)
  onRemove?: (id: string) => void;
};

export const SelectedStationBadgeList = ({
  stations,
  onSelect,
  onRemove,
}: Props) => {
  if (!stations || stations.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      {stations.map((station) => {
        // ------------------------------
        // 2026-02-06 런타임 방어
        // ------------------------------
        const colors = Array.isArray(station.colors)
          ? station.colors
          : [];

        // 기본 스타일 (색상 없을 때도 안전)
        let backgroundStyle: CSSProperties = {
          backgroundColor: colors[0] ?? '#E5E7EB',
        };

        // 환승역 (2개 이상일 때만 그라데이션)
        if (colors.length >= 2) {
          backgroundStyle = {
            background: `linear-gradient(
              90deg,
              ${colors[0]} 0%,
              ${colors[0]} 50%,
              ${colors[1]} 50%,
              ${colors[1]} 100%
            )`,
          };
        }

        return (
          <button
            key={station.id}
            type="button"
            className={styles.container}
            style={backgroundStyle}
            onClick={() => onSelect?.(station.id)}
          >
            {/* <span className={styles.badge} /> */}
            <span
              className={styles.badge}
              style={{
                color: colors[0] ?? '#111',
              }}
            >
              {station.lineIds.length === 1 ? station.lineIds[0] : ''}
            </span>

            <span className={styles.name}>
              {station.name}
            </span>

            {onRemove && (
              <span
                className={styles.remove}
                role="button"
                aria-label={`${station.name} 삭제`}
                onClick={(event) => {
                  event.stopPropagation(); // 뱃지 클릭 방지
                  onRemove(station.id);
                }}
              >
                ×
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
