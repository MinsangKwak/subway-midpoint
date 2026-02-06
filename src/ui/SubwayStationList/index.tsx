import type { SubwayStation } from '../../services/subway/subway.types';
import styles from './style.module.css';

type Props = {
  stations: SubwayStation[];
  keyword: string;
  highlightIndex: number;

  // 이미 선택된 역 ID 목록
  selectedStationIds: string[];

  onSelect: (station: SubwayStation) => void;
};

// 검색어 하이라이트 처리
const highlight = (text: string, keyword: string) => {
  if (!keyword) return text;

  const reg = new RegExp(`(${keyword})`, 'gi');
  return text.replace(reg, '<strong>$1</strong>');
};

export const SubwayStationList = ({
  stations,
  keyword,
  highlightIndex,
  selectedStationIds,
  onSelect,
}: Props) => {
  return (
    <ul className={styles.list}>
      {stations.map((station, index) => {
        const isActive = index === highlightIndex;
        const isSelected = selectedStationIds.includes(station.id);

        return (
          <li
            key={station.id}
            className={[
              isActive ? styles.active : '',
              isSelected ? styles.selected : '',
            ].join(' ')}
            onClick={() => onSelect(station)}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: highlight(station.name, keyword),
              }}
            />
          </li>
        );
      })}
    </ul>
  );
};
