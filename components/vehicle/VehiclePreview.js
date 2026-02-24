"use client";

/**
 * VehiclePreview — SVG vehicle silhouettes with highlighted wrap/decal zones.
 * Shows the selected vehicle body type with the graphic type coverage area.
 */

// --- Vehicle body SVG paths (side view, viewBox 0 0 300 140) ---
const VEHICLE_PATHS = {
  car: {
    body: "M40,95 L40,80 Q40,70 50,65 L80,55 Q90,50 100,46 L155,38 Q165,36 175,38 L210,46 Q225,50 235,58 L258,72 Q265,78 265,85 L265,95 Z",
    roof: "M100,46 L155,38 Q165,36 175,38 L210,46 Q200,30 180,24 L130,24 Q110,26 100,46 Z",
    windows: "M108,46 L130,28 L175,28 L205,46 Z",
    wheels: [
      { cx: 80, cy: 98, r: 16 },
      { cx: 230, cy: 98, r: 16 },
    ],
    ground: 114,
  },
  suv: {
    body: "M35,92 L35,72 Q35,62 45,58 L75,50 Q85,46 95,42 L120,36 Q130,34 200,34 L235,38 Q250,42 258,52 L268,68 Q272,76 272,82 L272,92 Z",
    roof: "M120,36 Q130,34 200,34 L235,38 Q238,26 220,20 L135,20 Q118,22 120,36 Z",
    windows: "M128,36 L140,24 L215,24 L230,38 Z",
    wheels: [
      { cx: 78, cy: 96, r: 18 },
      { cx: 236, cy: 96, r: 18 },
    ],
    ground: 114,
  },
  van: {
    body: "M30,92 L30,50 Q30,38 42,34 L62,28 Q72,26 200,26 L240,30 Q255,34 262,48 L268,66 Q272,78 272,88 L272,92 Z",
    roof: "M62,28 Q72,26 200,26 L240,30 Q240,16 220,14 L80,14 Q62,16 62,28 Z",
    windows: "M38,50 L38,34 Q38,30 42,28 L62,28 L62,50 Z M72,28 L200,26 L200,50 L72,50 Z",
    wheels: [
      { cx: 72, cy: 96, r: 18 },
      { cx: 240, cy: 96, r: 18 },
    ],
    ground: 114,
  },
  pickup: {
    body: "M35,92 L35,72 Q35,62 45,58 L75,50 Q85,46 95,42 L120,36 Q130,34 155,34 L165,36 Q170,38 170,44 L170,58 L240,58 Q260,58 268,68 L274,80 Q276,86 276,92 Z",
    roof: "M120,36 Q130,34 155,34 L165,36 Q165,24 150,20 L130,20 Q115,22 120,36 Z",
    windows: "M128,36 L135,24 L152,24 L162,36 Z",
    bed: "M172,58 L172,46 Q172,42 176,40 L240,40 Q248,40 250,44 L250,58 Z",
    wheels: [
      { cx: 80, cy: 96, r: 18 },
      { cx: 242, cy: 96, r: 18 },
    ],
    ground: 114,
  },
  "box-truck": {
    body: "M20,92 L20,60 Q20,48 32,44 L55,38 Q65,36 75,36 L90,36 Q95,36 95,42 L95,50 L250,50 Q262,50 268,56 L276,70 Q280,78 280,88 L280,92 Z",
    roof: "M75,36 Q65,36 55,38 L32,44 Q40,28 55,22 L82,22 Q95,22 95,36 Z",
    windows: "M28,48 L44,30 L85,30 L92,42 L92,48 Z",
    box: "M98,50 L98,24 Q98,20 102,20 L258,20 Q262,20 262,24 L262,50 Z",
    wheels: [
      { cx: 62, cy: 96, r: 18 },
      { cx: 248, cy: 96, r: 18 },
    ],
    ground: 114,
  },
  trailer: {
    body: "M10,92 L10,22 Q10,16 16,16 L270,16 Q276,16 276,22 L276,92 Z",
    wheels: [
      { cx: 220, cy: 96, r: 18 },
      { cx: 256, cy: 96, r: 18 },
    ],
    hitch: "M10,72 L0,72 L0,68 L10,68 Z",
    ground: 114,
  },
};

// --- Graphic type coverage zones (per vehicle body, approximate) ---
function getWrapZone(graphicType, vehicleBody) {
  const isLarge = vehicleBody === "box-truck" || vehicleBody === "trailer";
  switch (graphicType) {
    case "full-wrap":
    case "fleet-package":
      return { x: 20, y: 16, w: 260, h: 80, label: "Full Coverage" };
    case "partial-wrap":
      return isLarge
        ? { x: 20, y: 30, w: 200, h: 62, label: "Partial" }
        : { x: 60, y: 30, w: 160, h: 62, label: "Partial" };
    case "door-graphics":
      return isLarge
        ? { x: 20, y: 36, w: 70, h: 50, label: "Door" }
        : { x: 90, y: 36, w: 70, h: 50, label: "Door" };
    case "vehicle-decal":
      return isLarge
        ? { x: 100, y: 24, w: 100, h: 40, label: "Decal" }
        : { x: 120, y: 34, w: 60, h: 28, label: "Decal" };
    case "magnetic-sign":
      return { x: 100, y: 40, w: 60, h: 38, label: "Magnetic" };
    case "dot-numbers":
      return isLarge
        ? { x: 140, y: 56, w: 80, h: 24, label: "DOT#" }
        : { x: 140, y: 48, w: 70, h: 20, label: "DOT#" };
    case "compliance":
      return isLarge
        ? { x: 20, y: 56, w: 100, h: 24, label: "Compliance" }
        : { x: 60, y: 52, w: 80, h: 20, label: "Compliance" };
    default:
      return null;
  }
}

export default function VehiclePreview({
  vehicleBody = "car",
  graphicType = "full-wrap",
  text = "",
}) {
  const vehicle = VEHICLE_PATHS[vehicleBody] || VEHICLE_PATHS.car;
  const zone = getWrapZone(graphicType, vehicleBody);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 300 140"
        className="w-full max-w-[360px]"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))" }}
      >
        {/* Background */}
        <defs>
          <linearGradient id="vp-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f9fafb" />
            <stop offset="100%" stopColor="#f0f1f3" />
          </linearGradient>
          <linearGradient id="vp-zone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
          </linearGradient>
          <pattern id="vp-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.2" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="300" height="140" rx="12" fill="url(#vp-bg)" />

        {/* Ground line */}
        <line
          x1="10" y1={vehicle.ground}
          x2="290" y2={vehicle.ground}
          stroke="#d1d5db" strokeWidth="1.5"
        />

        {/* Vehicle body */}
        <path d={vehicle.body} fill="#9ca3af" stroke="#6b7280" strokeWidth="1.2" />

        {/* Roof */}
        {vehicle.roof && (
          <path d={vehicle.roof} fill="#8b95a5" stroke="#6b7280" strokeWidth="0.8" />
        )}

        {/* Box (box-truck) */}
        {vehicle.box && (
          <path d={vehicle.box} fill="#b0b8c5" stroke="#6b7280" strokeWidth="1" />
        )}

        {/* Truck bed */}
        {vehicle.bed && (
          <path d={vehicle.bed} fill="#a0a8b5" stroke="#6b7280" strokeWidth="0.8" />
        )}

        {/* Trailer hitch */}
        {vehicle.hitch && (
          <path d={vehicle.hitch} fill="#6b7280" />
        )}

        {/* Windows */}
        {vehicle.windows && (
          <path d={vehicle.windows} fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.6" fillOpacity="0.7" />
        )}

        {/* Wheels */}
        {vehicle.wheels.map((w, i) => (
          <g key={i}>
            <circle cx={w.cx} cy={w.cy} r={w.r} fill="#374151" stroke="#1f2937" strokeWidth="1.5" />
            <circle cx={w.cx} cy={w.cy} r={w.r * 0.55} fill="#6b7280" stroke="#4b5563" strokeWidth="0.8" />
            <circle cx={w.cx} cy={w.cy} r={w.r * 0.2} fill="#9ca3af" />
          </g>
        ))}

        {/* Wrap/decal zone overlay */}
        {zone && (
          <g>
            <rect
              x={zone.x} y={zone.y}
              width={zone.w} height={zone.h}
              rx="4"
              fill="url(#vp-zone)"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <rect
              x={zone.x} y={zone.y}
              width={zone.w} height={zone.h}
              rx="4"
              fill="url(#vp-hatch)"
            />
            {/* Zone label */}
            <text
              x={zone.x + zone.w / 2}
              y={zone.y + zone.h / 2 + (text ? -4 : 4)}
              textAnchor="middle"
              fill="#1d4ed8"
              fontSize="10"
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
            >
              {zone.label}
            </text>
            {/* Text preview in zone */}
            {text && (
              <text
                x={zone.x + zone.w / 2}
                y={zone.y + zone.h / 2 + 10}
                textAnchor="middle"
                fill="#1e3a5f"
                fontSize="8"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {text.length > 20 ? text.slice(0, 20) + "..." : text}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
