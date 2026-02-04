import styles from './style.module.css';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

type BottomSheetModalProps = {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export const BottomSheetModal = ({
  isOpen,
  onToggle,
  children,
}: BottomSheetModalProps) => {
  return (
    <>
      {/* Dimmed */}
      {isOpen && <div className={styles.dimmed} />}

      {/* Sheet */}
      <div
        className={`${styles.sheet} ${isOpen ? styles.open : styles.closed
          }`}
      >
        <div className={styles.header}>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={onToggle}
            aria-label={isOpen ? '접기' : '펼치기'}
          >
            {isOpen ? <FiChevronDown /> : <FiChevronUp />}
          </button>
        </div>

        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
};
