import { DivIcon } from "leaflet";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pinMarker({
  fill,
  stroke,
  body,
  width,
  height,
  anchorY,
}: {
  fill: string;
  stroke: string;
  body: string;
  width: number;
  height: number;
  anchorY: number;
}) {
  return new DivIcon({
    html: `
      <div style="position:relative;width:${width}px;height:${height}px;cursor:pointer;">
        <svg width="${width}" height="${height - 6}" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <filter id="pin-shadow" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.3"/>
            </filter>
          </defs>
          <path
            d="M22 2C12.06 2 4 10.06 4 20c0 11.5 18 30 18 30s18-18.5 18-30C40 10.06 31.94 2 22 2Z"
            fill="${fill}"
            stroke="${stroke}"
            stroke-width="2.5"
            filter="url(#pin-shadow)"
          />
          <circle cx="22" cy="19" r="12" fill="rgba(255,255,255,0.18)"/>
          ${body}
        </svg>
      </div>
    `,
    className: "",
    iconSize: [width, height],
    iconAnchor: [width / 2, anchorY],
    popupAnchor: [0, -anchorY + 4],
  });
}

const KEY_SVG = `
  <g transform="translate(14 10)" fill="#ffffff">
    <circle cx="5" cy="5" r="4.5" fill="none" stroke="#ffffff" stroke-width="2"/>
    <path d="M9 5h8v2h-2v2h-2v-2h-2v-2z" fill="#ffffff"/>
  </g>
`;

export function createDepartmentMapIcon(
  code: string,
  distributorCount: number,
  isLight: boolean,
): DivIcon {
  const fill = isLight ? "#0284c7" : "#0ea5e9";
  const label = escapeHtml(code);
  const count = escapeHtml(String(distributorCount));

  const icon = pinMarker({
    fill,
    stroke: "#ffffff",
    width: 44,
    height: 58,
    anchorY: 50,
    body: `
      ${KEY_SVG}
      <text x="22" y="36" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="800" font-family="system-ui,sans-serif">${label}</text>
    `,
  });

  // Badge distributeurs — injecté via html wrapper
  const baseHtml = icon.options.html as string;
  icon.options.html = baseHtml.replace(
    "</div>",
    `<span style="
        position:absolute;
        top:-2px;
        right:-8px;
        min-width:18px;
        height:18px;
        padding:0 5px;
        border-radius:999px;
        background:${isLight ? "#18181b" : "#ffffff"};
        color:${isLight ? "#ffffff" : "#18181b"};
        font-size:10px;
        font-weight:800;
        line-height:18px;
        text-align:center;
        font-family:system-ui,sans-serif;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        border:2px solid #ffffff;
      ">${count}</span></div>`,
  );

  return icon;
}

export function createDistributorMapIcon(fillColor: string): DivIcon {
  return pinMarker({
    fill: fillColor,
    stroke: "#ffffff",
    width: 36,
    height: 44,
    anchorY: 40,
    body: KEY_SVG.replace('transform="translate(14 10)"', 'transform="translate(11 8)" scale(0.9)'),
  });
}
