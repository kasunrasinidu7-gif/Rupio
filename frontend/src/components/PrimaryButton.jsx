export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button className={'primary-button ' + className} {...props}>
      {children}
    </button>
  );
}
