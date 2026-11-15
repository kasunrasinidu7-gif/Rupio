export default function CardSecurityGuide() {
  return (
    <svg className="card-security-guide" viewBox="0 0 92 48" role="img" aria-label="CVN is printed on the back of the card">
      <rect x="2" y="5" width="58" height="37" rx="4" fill="#e8edf0" stroke="#9caab3" strokeWidth="1.5" />
      <rect x="3" y="11" width="56" height="8" fill="#56636d" />
      <rect x="8" y="25" width="37" height="9" rx="1" fill="#fff" stroke="#bcc6cc" />
      <text x="27" y="32" fill="#287b43" fontSize="8" fontWeight="700">123</text>
      <circle cx="65" cy="28" r="13" fill="#fff" fillOpacity=".75" stroke="#687984" strokeWidth="2" />
      <text x="57" y="31" fill="#287b43" fontSize="8" fontWeight="700">123</text>
      <path d="M74 37 86 46" stroke="#687984" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
