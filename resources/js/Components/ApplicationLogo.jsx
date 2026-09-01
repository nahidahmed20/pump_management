export default function ApplicationLogo(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 256 256"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Hose Pipe (Back layer) */}
            <path
                d="M160 180 H192 C205.25 180 216 169.25 216 156 V96"
                stroke="#334155"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
            />

            {/* Main Base Stand */}
            <path
                d="M48 220 H176"
                stroke="#1E293B"
                strokeWidth="16"
                strokeLinecap="round"
            />

            {/* Pump Body */}
            <rect x="64" y="36" width="96" height="184" rx="16" fill="#1E293B" />

            {/* Top Indicator Light */}
            <rect x="96" y="20" width="32" height="16" rx="6" fill="#F59E0B" />

            {/* Digital Screen */}
            <rect x="80" y="56" width="64" height="64" rx="12" fill="#F59E0B" />

            {/* Oil/Fuel Drop inside Screen */}
            <path
                d="M112 106 C103.163 106 96 98.8366 96 90 C96 79 112 62 112 62 C112 62 128 79 128 90 C128 98.8366 120.837 106 112 106Z"
                fill="#FFFFFF"
            />

            {/* Decorative Details (Vents) */}
            <rect x="80" y="144" width="64" height="8" rx="4" fill="#334155" />
            <rect x="80" y="164" width="64" height="8" rx="4" fill="#334155" />
            <rect x="80" y="184" width="64" height="8" rx="4" fill="#334155" />

            {/* Nozzle Spout */}
            <path d="M204 76 L176 82 L176 90 L204 96 Z" fill="#334155" />

            {/* Nozzle Handle */}
            <rect x="204" y="64" width="24" height="44" rx="8" fill="#F59E0B" />

            {/* Nozzle Trigger Cutout */}
            <rect x="212" y="74" width="8" height="24" rx="4" fill="#1E293B" />
        </svg>
    );
}
