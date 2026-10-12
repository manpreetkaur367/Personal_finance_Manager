const FinanceIllustration = () => (
  <div className="finance-illustration" aria-hidden="true">
    <svg viewBox="0 0 520 460" role="presentation">
      <defs>
        <linearGradient id="cardFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#122b49" />
          <stop offset="1" stopColor="#09172a" />
        </linearGradient>
        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5ec8ff" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="coinFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#59f0c1" />
          <stop offset="1" stopColor="#16a882" />
        </linearGradient>
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <ellipse cx="265" cy="237" rx="174" ry="153" fill="#1d4ed8" opacity=".13" filter="url(#softGlow)" />
      <circle className="illustration-orbit" cx="260" cy="226" r="178" fill="none" stroke="#5ec8ff" strokeOpacity=".13" strokeDasharray="4 11" />

      <g className="illustration-dashboard">
        <rect x="102" y="82" width="316" height="252" rx="22" fill="url(#cardFill)" stroke="#5ec8ff" strokeOpacity=".35" strokeWidth="2" />
        <path d="M102 126h316" stroke="#5ec8ff" strokeOpacity=".18" />
        <circle cx="126" cy="104" r="4" fill="#ff6b6b" />
        <circle cx="142" cy="104" r="4" fill="#fbbf24" />
        <circle cx="158" cy="104" r="4" fill="#59f0c1" />
        <rect x="128" y="150" width="124" height="70" rx="13" fill="#0b1f3a" stroke="#59f0c1" strokeOpacity=".22" />
        <text x="145" y="173" fill="#9bb2cc" fontSize="11" fontFamily="sans-serif">TOTAL SAVINGS</text>
        <text x="145" y="200" fill="#edf6ff" fontSize="21" fontWeight="700" fontFamily="sans-serif">₹ 84,250</text>
        <rect x="270" y="150" width="120" height="70" rx="13" fill="#0b1f3a" stroke="#5ec8ff" strokeOpacity=".22" />
        <text x="286" y="173" fill="#9bb2cc" fontSize="11" fontFamily="sans-serif">MONTHLY GROWTH</text>
        <text x="286" y="200" fill="#59f0c1" fontSize="20" fontWeight="700" fontFamily="sans-serif">+12.8%</text>
        <path d="M137 286h246" stroke="#9bb2cc" strokeOpacity=".16" />
        <rect className="chart-bar bar-one" x="151" y="258" width="23" height="28" rx="5" fill="url(#barFill)" />
        <rect className="chart-bar bar-two" x="194" y="241" width="23" height="45" rx="5" fill="url(#barFill)" />
        <rect className="chart-bar bar-three" x="237" y="250" width="23" height="36" rx="5" fill="url(#barFill)" />
        <rect className="chart-bar bar-four" x="280" y="222" width="23" height="64" rx="5" fill="url(#barFill)" />
        <rect className="chart-bar bar-five" x="323" y="231" width="23" height="55" rx="5" fill="url(#barFill)" />
        <rect className="chart-bar bar-six" x="366" y="202" width="23" height="84" rx="5" fill="url(#barFill)" />
      </g>

      <g className="illustration-coin">
        <circle cx="399" cy="323" r="43" fill="#59f0c1" opacity=".12" />
        <circle cx="399" cy="323" r="31" fill="url(#coinFill)" stroke="#9affdf" strokeWidth="2" />
        <text x="388" y="334" fill="#042a27" fontSize="29" fontWeight="700" fontFamily="sans-serif">₹</text>
      </g>

      <g className="illustration-wallet">
        <rect x="82" y="279" width="122" height="83" rx="17" fill="#123250" stroke="#5ec8ff" strokeOpacity=".55" strokeWidth="2" />
        <path d="M82 301h122v15H82z" fill="#1d4ed8" opacity=".8" />
        <path d="M165 316h42v31h-42a12 12 0 0 1 0-31z" fill="#0b1f3a" stroke="#5ec8ff" strokeOpacity=".55" />
        <circle cx="176" cy="331" r="4" fill="#59f0c1" />
      </g>

      <g className="illustration-spark spark-one" fill="#59f0c1">
        <path d="M92 143l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" />
      </g>
      <g className="illustration-spark spark-two" fill="#5ec8ff">
        <path d="M422 169l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
      </g>
      <circle className="illustration-dot dot-one" cx="109" cy="235" r="5" fill="#5ec8ff" />
      <circle className="illustration-dot dot-two" cx="428" cy="252" r="4" fill="#59f0c1" />
    </svg>
    <p>Make every rupee count.</p>
  </div>
);

export default FinanceIllustration;
