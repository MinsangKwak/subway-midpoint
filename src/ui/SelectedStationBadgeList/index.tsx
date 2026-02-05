import styles from './style.module.css';

export type SelectedStationBadge = {
  id: string;       // 역 ID
  name: string;     // 역 이름
  lineId: string;   // 노선 ID (1, 2, 4)
};

type Props = {
  stations: SelectedStationBadge[];

  /** 뱃지 클릭 시 (지도 포커스용) */
  onSelect?: (id: string) => void;

  /** X 버튼 클릭 시 (삭제) */
  onRemove?: (id: string) => void;
};

export const SelectedStationBadgeList = ({
  stations,
  onSelect,
  onRemove,
}: Props) => {
  if (stations.length === 0) return null;

  return (
    <div className={styles.container}>
      {stations.map((station) => (
        <button
          key={station.id}
          type="button"
          className={`${styles.badge} ${styles[`line${station.lineId}`]}`}
          onClick={() => onSelect?.(station.id)}
        >
          <span className={styles.line}>
            {station.lineId}호선
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
      ))}
    </div>
  );
};
