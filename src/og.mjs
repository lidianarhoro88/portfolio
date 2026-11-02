import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#F6F1EA"/>
<circle cx="1050" cy="120" r="260" fill="none" stroke="#C7A46A" stroke-opacity=".35"/>
<circle cx="1120" cy="560" r="180" fill="none" stroke="#5C2E3E" stroke-opacity=".15"/>
<g transform="translate(80,90)"><rect x="0" y="22" width="12" height="28" rx="5" fill="#5C2E3E"/><rect x="18" y="8" width="12" height="42" rx="5" fill="#5C2E3E"/><rect x="36" y="16" width="12" height="34" rx="5" fill="#C7A46A"/><rect x="54" y="0" width="12" height="50" rx="5" fill="#5C2E3E"/>
<text x="84" y="44" font-family="Georgia,serif" font-size="44" fill="#2A1A20">lidiana<tspan fill="#9A7633">.</tspan></text></g>
<text x="80" y="300" font-family="Georgia,serif" font-size="78" fill="#2A1A20">From scattered systems</text>
<text x="80" y="390" font-family="Georgia,serif" font-style="italic" font-size="78" fill="#5C2E3E">to clear answers.</text>
<text x="80" y="500" font-family="DejaVu Sans Mono,monospace" font-size="24" letter-spacing="3" fill="#6E5A61">LIDIANA HOURO · DATA ENGINEER &amp; BI DEVELOPER</text>
<text x="80" y="545" font-family="DejaVu Sans Mono,monospace" font-size="22" letter-spacing="2" fill="#9A7633">SQL · PYTHON · POWER BI · DATA WAREHOUSING</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('../public/social-card.png', import.meta.url).pathname);
console.log('social card ok');
