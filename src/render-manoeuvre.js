/**
 * A situation, drawn in plan.
 *
 * Own vessel at the centre heading up the page, the other on her bearing. The
 * overtaking sector is marked because it is the one boundary in Rules 11 to 18
 * that is a number, and seeing where it falls is most of understanding Rule 13.
 *
 * Generated, like everything else here. No arrows saying which way to turn: the
 * engine does not produce an alteration and neither does the picture.
 */

import { OVERTAKING_LIMIT, CATEGORY_NAMES } from './manoeuvre-engine.js';

const MV_INK = '#10222C';
const MV_SOFT = '#4A626E';
const MV_MARK = '#C3006B';

const R = 92;
const polarAt = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
};

const arc = (r, from, to) => {
  const [x1, y1] = polarAt(r, from);
  const [x2, y2] = polarAt(r, to);
  const large = ((to - from + 360) % 360) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

/** A simple plan silhouette, pointing whichever way she heads. */
const hullAt = (x, y, heading, fill) =>
  `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${heading.toFixed(1)})">
     <path d="M 0 -13 L 6 -3 L 6 11 L -6 11 L -6 -3 Z" fill="${fill}"/>
   </g>`;

/**
 * `anonymous` keeps the categories and the outcome out of the label, so a drill
 * can show the geometry without a screen reader reading out the answer.
 */
export function renderManoeuvre(scenario, { width = 260, anonymous = false } = {}) {
  const { targetBearing, ownBearingFromTarget } = scenario;
  const [tx, ty] = polarAt(R * 0.62, targetBearing);

  // Her heading, in our frame: she bears `targetBearing` from us and we bear
  // `ownBearingFromTarget` from her, so she is turned by the difference.
  const targetHeading = (targetBearing - ownBearingFromTarget + 180 + 360) % 360;

  const label = anonymous
    ? 'A plan view of two vessels, own vessel at the centre'
    : `${CATEGORY_NAMES[scenario.own.category] || 'own vessel'} at the centre, `
      + `${CATEGORY_NAMES[scenario.target.category] || 'the other vessel'} bearing `
      + `${Math.round(targetBearing)} relative`;

  return `<svg viewBox="-120 -120 240 240" width="${width}" height="${width}"
    xmlns="http://www.w3.org/2000/svg" class="mvplan" role="img" aria-label="${label}">
    <circle cx="0" cy="0" r="${R}" fill="none" stroke="${MV_INK}" stroke-width="1" opacity=".25"/>

    <!-- the overtaking sector: abaft the beam on both sides -->
    <path d="${arc(R, OVERTAKING_LIMIT, 360 - OVERTAKING_LIMIT)}" fill="none"
      stroke="${MV_MARK}" stroke-width="7" opacity=".30"/>
    <text x="0" y="${R + 18}" text-anchor="middle" font-family="ui-monospace,monospace"
      font-size="8.5" fill="${MV_SOFT}">overtaking sector</text>

    ${[0, 90, 180, 270].map(d => {
      const [x1, y1] = polarAt(R, d), [x2, y2] = polarAt(R + 7, d);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
        stroke="${MV_INK}" stroke-width="1" opacity=".45"/>`;
    }).join('')}

    <line x1="0" y1="0" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}"
      stroke="${MV_MARK}" stroke-width="1" stroke-dasharray="3 3" opacity=".7"/>

    ${hullAt(0, 0, 0, MV_INK)}
    ${hullAt(tx, ty, targetHeading, MV_MARK)}

    <text x="0" y="${-R - 12}" text-anchor="middle" font-family="ui-monospace,monospace"
      font-size="9" fill="${MV_SOFT}">ahead</text>
  </svg>`;
}
