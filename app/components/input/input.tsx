import { IInput } from "@/app/models/IInput";

const Input: React.FC<IInput> = ({ 
  type, 
  id,
  className,
  placeholder,
  value, 
  onChange 
}) => {
  return (
    <input
      type={type}
      id={id}
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
};

export default Input