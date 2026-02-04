import type { SubwayStation } from '../../services/subway/subway.types';
import styles from './style.module.css';

type Props = {
  stations: SubwayStation[];
  keyword: string;
  highlightIndex: number;
  onSelect: (station: SubwayStation) => void;
};

const highlight = (text: string, keyword: string) => {
  const reg = new RegExp(`(${keyword})`, 'gi');
  return text.replace(reg, '<strong>$1</strong>');
};

export const SubwayStationList = ({
  stations,
  keyword,
  highlightIndex,
  onSelect,
}: Props) => {
  return (
    <ul className={styles.list}>
      {stations.map((station, index) => (
        <li
          key={station.id}
          className={index === highlightIndex ? styles.active : ''}
          onClick={() => onSelect(station)}
        >
          <span className={`${styles.line} ${styles[`line${station.lineId}`]}`}>
            {station.lineId}호선
          </span>
          <span
            dangerouslySetInnerHTML={{
              __html: highlight(station.name, keyword),
            }}
          />
        </li>
      ))}
    </ul>
  );
};
