import type { InputHTMLAttributes } from 'react';
import styles from './style.module.css';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  showRemoveButton?: boolean;
  onRemove?: () => void;
};

export const TextField = ({
  showRemoveButton = false,
  onRemove,
  ...inputProps
}: TextFieldProps) => {
  return (
    <div className={styles['input-wrapper']}>
      <input
        {...inputProps}
        className={styles['input-field']}
      />

      {showRemoveButton && (
        <button
          type="button"
          aria-label="입력값 삭제"
          className={styles['button-input__remove']}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  );
};
