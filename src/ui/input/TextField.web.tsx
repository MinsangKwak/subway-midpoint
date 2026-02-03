type TextFieldProps = {
  placeholder?: string;
};

export function TextField({ placeholder }: TextFieldProps) {
  return (
    <input
      placeholder={placeholder}
      style={{
        height: 48,
        padding: '0 16px',
        borderRadius: 10,
        border: '1.5px solid #3B82F6',
        fontSize: 15,
        outline: 'none',
      }}
    />
  );
}
