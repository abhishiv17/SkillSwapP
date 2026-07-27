export function SkillExchangeBoard() {
  return (
    <div className="w-full max-w-[620px] mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 500" width="100%" height="100%">
        <defs>
          {/* Arrow Marker */}
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#111111" />
          </marker>
        </defs>

        {/* Abstract Background Elements */}
        <circle cx="310" cy="250" r="180" fill="#FFFDF2" stroke="#111111" strokeWidth="4" strokeDasharray="12 12" />
        <rect x="50" y="40" width="40" height="40" fill="#FFD84D" stroke="#111111" strokeWidth="3" />
        <circle cx="550" cy="400" r="20" fill="#FF5C5C" stroke="#111111" strokeWidth="3" />
        <path d="M 40 420 L 70 420 M 55 405 L 55 435" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        <path d="M 520 80 L 550 80 M 535 65 L 535 95" stroke="#111111" strokeWidth="4" strokeLinecap="round" />

        {/* --- NODE: CODE (Top Left) --- */}
        <g transform="translate(80, 100)">
          {/* Shadow */}
          <rect x="4" y="4" width="140" height="90" rx="4" fill="#111111" />
          {/* Card */}
          <rect x="0" y="0" width="140" height="90" rx="4" fill="#4DA8FF" stroke="#111111" strokeWidth="4" />
          {/* Terminal UI */}
          <rect x="10" y="10" width="120" height="70" rx="2" fill="#FFF9E9" stroke="#111111" strokeWidth="3" />
          <path d="M 20 30 L 40 45 L 20 60" fill="none" stroke="#111111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 50 60 L 80 60" fill="none" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
          {/* Label */}
          <rect x="35" y="-15" width="70" height="24" fill="#111111" rx="2" />
          <text x="70" y="1" fill="#FFF9E9" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">CODE</text>
        </g>

        {/* --- NODE: CAMERA (Top Right) --- */}
        <g transform="translate(380, 60)">
          <rect x="4" y="4" width="130" height="90" rx="4" fill="#111111" />
          <rect x="0" y="0" width="130" height="90" rx="4" fill="#FF5C5C" stroke="#111111" strokeWidth="4" />
          <rect x="30" y="-10" width="40" height="15" fill="#FF5C5C" stroke="#111111" strokeWidth="4" />
          <circle cx="65" cy="45" r="25" fill="#FFF9E9" stroke="#111111" strokeWidth="4" />
          <circle cx="65" cy="45" r="10" fill="#111111" />
          <rect x="30" y="100" width="70" height="24" fill="#111111" rx="2" />
          <text x="65" y="116" fill="#FFF9E9" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PHOTO</text>
        </g>

        {/* --- NODE: DESIGN (Center Right) --- */}
        <g transform="translate(420, 260)">
          <rect x="4" y="4" width="120" height="110" rx="4" fill="#111111" />
          <rect x="0" y="0" width="120" height="110" rx="4" fill="#7C3AED" stroke="#111111" strokeWidth="4" />
          {/* Pen Tool / Cursor */}
          <path d="M 30 70 L 60 20 L 90 70 Z" fill="#FFF9E9" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 60 70 L 60 100" fill="none" stroke="#111111" strokeWidth="4" />
          <rect x="25" y="-15" width="70" height="24" fill="#111111" rx="2" />
          <text x="60" y="1" fill="#FFF9E9" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">DESIGN</text>
        </g>

        {/* --- NODE: MUSIC (Bottom Left) --- */}
        <g transform="translate(60, 320)">
          <rect x="4" y="4" width="110" height="110" rx="4" fill="#111111" />
          <rect x="0" y="0" width="110" height="110" rx="4" fill="#FFD84D" stroke="#111111" strokeWidth="4" />
          {/* Headphones */}
          <path d="M 25 60 C 25 20, 85 20, 85 60" fill="none" stroke="#111111" strokeWidth="8" strokeLinecap="round" />
          <rect x="20" y="55" width="15" height="30" rx="4" fill="#FFF9E9" stroke="#111111" strokeWidth="4" />
          <rect x="75" y="55" width="15" height="30" rx="4" fill="#FFF9E9" stroke="#111111" strokeWidth="4" />
          <rect x="20" y="115" width="70" height="24" fill="#111111" rx="2" />
          <text x="55" y="131" fill="#FFF9E9" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MUSIC</text>
        </g>

        {/* --- NODE: LANGUAGE (Bottom Right Center) --- */}
        <g transform="translate(250, 370)">
          <rect x="4" y="4" width="130" height="80" rx="4" fill="#111111" />
          <rect x="0" y="0" width="130" height="80" rx="4" fill="#B7F34A" stroke="#111111" strokeWidth="4" />
          <path d="M 20 25 L 50 25 M 20 40 L 40 40 M 20 55 L 60 55" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
          <text x="95" y="50" fill="#111111" fontSize="36" fontWeight="bold" fontFamily="serif" textAnchor="middle">A</text>
          <rect x="25" y="-15" width="80" height="24" fill="#111111" rx="2" />
          <text x="65" y="1" fill="#FFF9E9" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">LANGUAGE</text>
        </g>

        {/* --- EXCHANGE ARROWS --- */}
        {/* Code to Camera */}
        <path d="M 230 130 C 280 110, 320 110, 370 120" fill="none" stroke="#111111" strokeWidth="6" strokeDasharray="12 6" markerEnd="url(#arrow)" />
        {/* Code to Design */}
        <path d="M 210 195 C 280 230, 350 250, 410 280" fill="none" stroke="#111111" strokeWidth="6" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
        {/* Design to Language */}
        <path d="M 420 360 C 400 380, 390 390, 390 390" fill="none" stroke="#111111" strokeWidth="6" markerEnd="url(#arrow)" />
        {/* Music to Code */}
        <path d="M 120 310 C 130 250, 140 220, 140 200" fill="none" stroke="#111111" strokeWidth="6" markerEnd="url(#arrow)" />
        {/* Music to Language */}
        <path d="M 180 390 L 240 390" fill="none" stroke="#111111" strokeWidth="6" markerEnd="url(#arrow)" markerStart="url(#arrow)" />

      </svg>
    </div>
  );
}
