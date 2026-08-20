/**
 * The steering and sailing rules as a decision engine. Rules 11 to 18,
 * International, vessels in sight of one another.
 *
 * WHAT THIS RETURNS, AND WHAT IT REFUSES TO
 *
 * It returns a situation, a role, an ordered list of obligations, and the rules
 * they come from. It never returns an alteration. No heading, no number of
 * degrees, no speed.
 *
 * That is not caution, it is the rule. Rule 8 sets standards for action — that
 * it be positive, made in ample time, readily apparent to another vessel
 * watching visually or by radar, and result in passing at a safe distance.
 * Those are standards a mariner applies to the circumstances in front of them.
 * "Alter thirty degrees to starboard" is a number the rule does not contain,
 * and a candidate who learns a number instead of a standard has learned the
 * wrong thing. Obligations here are therefore free of digits entirely, and a
 * test enforces it.
 *
 * RULE 19 IS OUT
 *
 * Restricted visibility is deliberately not modelled. It has no stand-on
 * vessel at all, so folding it in as a flag on this engine would produce
 * something that answers "who stands on" in a situation where nobody does.
 * Rule 11 gates the whole engine: not in sight, not applicable, see Rule 19.
 *
 * INLAND
 *
 * Every outcome carries `inland: null`. The Inland Rules differ on several of
 * these — the crossing rule on the Great Lakes and western rivers, and the
 * signals of Rule 34 being proposals rather than statements. That is a field to
 * fill, not a migration to perform.
 */

// --- vessel categories under Rule 18 --------------------------------------

export const MANOEUVRE_CATEGORIES = [
  'power-driven', 'sailing', 'fishing', 'ram', 'nuc', 'cbd', 'wig', 'seaplane'
];

export const CATEGORY_NAMES = {
  'power-driven': 'power-driven vessel',
  sailing: 'sailing vessel',
  fishing: 'vessel engaged in fishing',
  ram: 'vessel restricted in her ability to manoeuvre',
  nuc: 'vessel not under command',
  cbd: 'vessel constrained by her draught',
  wig: 'WIG craft',
  seaplane: 'seaplane'
};

/**
 * Rule 18 as a pairing table, expressed as rank.
 *
 * Higher rank means other vessels keep out of her way. It is a hierarchy
 * between vessels, not a property of either alone: nothing here says a fishing
 * vessel "has right of way", only that a power-driven vessel and a sailing
 * vessel keep out of hers.
 *
 * Equal rank means Rule 18 does not resolve it and the situation falls through
 * to Rule 12, 14 or 15.
 *
 * cbd, wig and seaplane are deliberately absent: they are not points on this
 * ladder and are handled separately below.
 */
const RULE_18_RANK = {
  nuc: 4,
  ram: 4,
  fishing: 3,
  sailing: 2,
  'power-driven': 1
};

export const rankOf = c => RULE_18_RANK[c] ?? null;

// --- geometry -------------------------------------------------------------

const norm360 = d => ((d % 360) + 360) % 360;

/** 22.5 degrees abaft the beam, which is where the sidelights end. */
export const OVERTAKING_LIMIT = 112.5;

/**
 * Is a vessel bearing `b` from another coming up from abaft her beam?
 *
 * Rule 13(b) says more than 22.5 degrees abaft the beam: the sector in which
 * only her sternlight shows and neither sidelight. Strictly more than, so the
 * boundary itself is not overtaking — but Rule 13(c) says that if there is any
 * doubt, assume you are overtaking and act accordingly, so the boundary is
 * reported as doubt rather than as a clean answer.
 */
export function overtakingSector(bearing) {
  const b = norm360(bearing);
  const onBoundary = b === OVERTAKING_LIMIT || b === 360 - OVERTAKING_LIMIT;
  return {
    inSector: b > OVERTAKING_LIMIT && b < 360 - OVERTAKING_LIMIT,
    onBoundary,
    // 13(c): doubt resolves towards overtaking, never away from it.
    treatAsOvertaking: onBoundary || (b > OVERTAKING_LIMIT && b < 360 - OVERTAKING_LIMIT)
  };
}

/** Nearly reciprocal, for Rule 14. A modelling tolerance, never an output. */
const HEAD_ON_ARC = 6;

const nearlyAhead = bearing => {
  const b = norm360(bearing);
  return b <= HEAD_ON_ARC || b >= 360 - HEAD_ON_ARC;
};

const onOwnStarboard = bearing => {
  const b = norm360(bearing);
  return b > 0 && b < 180;
};

// --- the outcome shape ----------------------------------------------------

const outcome = o => ({
  situation: 'none',
  role: null,
  obligations: [],
  rules: [],
  notApplicable: null,
  standOnStage: null,
  doubt: false,
  inland: null,          // the Inland fork is a field, not a migration
  ...o
});

// --- Rule 17, the three states --------------------------------------------

export const STAND_ON_STAGES = ['course-and-speed', 'may-act', 'must-act'];

/**
 * Rule 17 is three states, not one, and the transition between them is the
 * thing an examiner actually tests. A candidate who only knows "stand on"
 * does not know Rule 17.
 */
export function standOnObligations(stage, ownCategory, targetOnPortSide) {
  switch (stage) {
    case 'may-act':
      return {
        rules: ['Rule 17(a)(ii)'],
        obligations: [
          'You may take action to avoid collision by your manoeuvre alone, as soon as it '
          + 'becomes apparent to you that the give-way vessel is not taking appropriate action.',
          ...(ownCategory === 'power-driven' && targetOnPortSide
            ? ['If the circumstances of the case admit, do not alter course to port: '
               + 'she is on your own port side. (Rule 17(c))']
            : [])
        ]
      };
    case 'must-act':
      return {
        rules: ['Rule 17(b)'],
        obligations: [
          'You shall take such action as will best aid to avoid collision. You are now so '
          + 'close that collision cannot be avoided by the give-way vessel\'s action alone.'
        ]
      };
    default:
      return {
        rules: ['Rule 17(a)(i)'],
        obligations: ['Keep your course and speed.']
      };
  }
}

// --- the engine -----------------------------------------------------------

/**
 * Resolve a situation.
 *
 * `own` and `target` are { category, tack, windward } — tack and windward only
 * meaning anything for sailing vessels.
 *
 * `targetBearing` is the relative bearing of the target from own's head;
 * `ownBearingFromTarget` is the relative bearing of own from the target's head.
 * Both are needed because overtaking is defined by the second, not the first.
 */
export function resolveManoeuvre({
  own, target, targetBearing, ownBearingFromTarget,
  inSight = true, standOnStage = 'course-and-speed'
} = {}) {
  // --- Rule 11 ------------------------------------------------------------
  if (!inSight) {
    return outcome({
      notApplicable: {
        rule: 'Rule 11',
        reason: 'These rules apply only to vessels in sight of one another. '
              + 'In or near an area of restricted visibility, Rule 19 governs, and it '
              + 'gives neither vessel the right to stand on.'
      },
      rules: ['Rule 11', 'Rule 19']
    });
  }

  const ownCat = own && own.category;
  const targetCat = target && target.category;

  // --- Rule 13, and it comes first ---------------------------------------
  //
  // "Notwithstanding anything contained in the Rules of Part B, Sections I and
  // II" — so before Rule 18, before 14, before 15. A power-driven vessel
  // overtaking a vessel not under command still keeps out of the way.
  const weAreOvertaking = overtakingSector(ownBearingFromTarget);
  const theyAreOvertaking = overtakingSector(targetBearing);

  if (weAreOvertaking.treatAsOvertaking) {
    return outcome({
      situation: 'overtaking',
      role: 'give-way',
      doubt: weAreOvertaking.onBoundary,
      rules: ['Rule 13', ...(weAreOvertaking.onBoundary ? ['Rule 13(c)'] : []), 'Rule 16'],
      obligations: [
        'You are the overtaking vessel. Keep out of the way of the vessel being overtaken.',
        'Take early and substantial action to keep well clear. (Rule 16)',
        'You remain the overtaking vessel until finally past and clear. Any subsequent '
        + 'alteration of the bearing between you does not make you a crossing vessel or '
        + 'relieve you of this duty.',
        ...(weAreOvertaking.onBoundary
          ? ['You are on the boundary of the overtaking sector. Where there is any doubt, '
             + 'assume that you are overtaking and act accordingly. (Rule 13(c))']
          : [])
      ]
    });
  }

  if (theyAreOvertaking.treatAsOvertaking) {
    const so = standOnObligations(standOnStage, ownCat, false);
    return outcome({
      situation: 'overtaking',
      role: 'stand-on',
      standOnStage,
      doubt: theyAreOvertaking.onBoundary,
      rules: ['Rule 13', ...so.rules],
      obligations: [
        'She is overtaking you. You are the stand-on vessel.',
        ...so.obligations,
        'She remains bound to keep clear until finally past and clear of you.'
      ]
    });
  }

  // --- Rule 18(f): WIG craft ---------------------------------------------
  if (ownCat === 'wig' || targetCat === 'wig') {
    const weAreWig = ownCat === 'wig';
    return outcome({
      situation: 'crossing',
      role: weAreWig ? 'give-way' : 'stand-on',
      standOnStage: weAreWig ? null : standOnStage,
      rules: ['Rule 18(f)'],
      obligations: weAreWig
        ? ['When taking off, landing or in flight near the surface, keep well clear of all '
           + 'other vessels and avoid impeding their navigation.',
           'When operating on the water surface, comply with the rules for a power-driven vessel.']
        : ['A WIG craft taking off, landing or in flight near the surface keeps well clear of you.']
    });
  }

  // --- Rule 18(e): seaplanes ---------------------------------------------
  if (ownCat === 'seaplane' || targetCat === 'seaplane') {
    const weAreSeaplane = ownCat === 'seaplane';
    return outcome({
      situation: 'crossing',
      role: weAreSeaplane ? 'give-way' : 'stand-on',
      rules: ['Rule 18(e)'],
      obligations: weAreSeaplane
        ? ['Keep well clear of all vessels and avoid impeding their navigation.']
        : ['A seaplane on the water keeps well clear of you.']
    });
  }

  // --- Rule 18(d): constrained by draught --------------------------------
  //
  // "Avoid impeding" is a different and lesser obligation than "keep out of the
  // way". A vessel constrained by her draught is not a stand-on vessel and the
  // ordinary rules still run between her and another vessel.
  if (targetCat === 'cbd' || ownCat === 'cbd') {
    const theyAreCbd = targetCat === 'cbd';
    return outcome({
      situation: 'crossing',
      role: theyAreCbd ? 'give-way' : 'stand-on',
      rules: ['Rule 18(d)'],
      obligations: theyAreCbd
        ? ['Avoid impeding the safe passage of a vessel constrained by her draught, '
           + 'navigating with caution and having full regard to her condition.',
           'Avoiding impeding is not the same obligation as keeping out of the way. '
           + 'It does not make her a stand-on vessel, and the ordinary steering rules '
           + 'still run between you.']
        : ['Other vessels are to avoid impeding your safe passage.',
           'This does not relieve you of your own obligations under these rules, and it '
           + 'is not the same as their being required to keep out of your way.']
    });
  }

  // --- Rule 18 hierarchy --------------------------------------------------
  const ownRank = rankOf(ownCat);
  const targetRank = rankOf(targetCat);

  if (ownRank !== null && targetRank !== null && ownRank !== targetRank) {
    const weGiveWay = ownRank < targetRank;
    const so = weGiveWay ? null : standOnObligations(standOnStage, ownCat, onOwnStarboard(targetBearing) === false);
    return outcome({
      situation: 'crossing',
      role: weGiveWay ? 'give-way' : 'stand-on',
      standOnStage: weGiveWay ? null : standOnStage,
      rules: ['Rule 18', ...(weGiveWay ? ['Rule 16'] : so.rules)],
      obligations: weGiveWay
        ? [`As a ${CATEGORY_NAMES[ownCat]} you keep out of the way of a ${CATEGORY_NAMES[targetCat]}.`,
           'Take early and substantial action to keep well clear. (Rule 16)']
        : [`A ${CATEGORY_NAMES[targetCat]} keeps out of your way.`, ...so.obligations]
    });
  }

  // --- Rule 12: two sailing vessels ---------------------------------------
  if (ownCat === 'sailing' && targetCat === 'sailing') {
    return sailingOutcome(own, target, standOnStage);
  }

  // --- Rules 14 and 15: two power-driven vessels --------------------------
  if (ownCat === 'power-driven' && targetCat === 'power-driven') {
    if (nearlyAhead(targetBearing) && nearlyAhead(ownBearingFromTarget)) {
      return outcome({
        situation: 'head-on',
        role: 'both-give-way',
        rules: ['Rule 14', 'Rule 14(c)'],
        obligations: [
          'You are meeting on reciprocal or nearly reciprocal courses so as to involve risk '
          + 'of collision. Each of you shall alter course to starboard so that you pass on '
          + 'the port side of the other.',
          'Where there is any doubt whether this is a head-on situation, assume that it '
          + 'exists and act accordingly. (Rule 14(c))'
        ]
      });
    }

    if (onOwnStarboard(targetBearing)) {
      return outcome({
        situation: 'crossing',
        role: 'give-way',
        rules: ['Rule 15', 'Rule 16'],
        obligations: [
          'She is on your own starboard side. You keep out of the way.',
          'If the circumstances of the case admit, avoid crossing ahead of her.',
          'Take early and substantial action to keep well clear. (Rule 16)'
        ]
      });
    }

    const so = standOnObligations(standOnStage, ownCat, true);
    return outcome({
      situation: 'crossing',
      role: 'stand-on',
      standOnStage,
      rules: ['Rule 15', ...so.rules],
      obligations: ['She is on your own port side. She keeps out of your way.', ...so.obligations]
    });
  }

  // --- nothing in Rules 11 to 18 resolves this ----------------------------
  return outcome({
    notApplicable: {
      rule: 'Rules 11 to 18',
      reason: 'No steering and sailing rule assigns a give-way and a stand-on vessel here. '
            + 'Rule 5 lookout, Rule 7 risk of collision and Rule 8 action to avoid collision '
            + 'still apply, as does Rule 2.'
    },
    rules: ['Rule 2', 'Rule 5', 'Rule 7', 'Rule 8']
  });
}

/**
 * Rule 12.
 *
 * Windward is defined as the side opposite that on which the mainsail is
 * carried, which is why tack is an input rather than something derivable from
 * a bearing.
 */
function sailingOutcome(own, target, standOnStage) {
  const ownTack = own.tack;
  const targetTack = target.tack;

  // Rule 12(a)(iii): a port-tack vessel that sees a vessel to windward and
  // cannot determine her tack keeps out of the way. Doubt resolves against her.
  if (ownTack === 'port' && !targetTack && own.targetToWindward) {
    return outcome({
      situation: 'crossing',
      role: 'give-way',
      doubt: true,
      rules: ['Rule 12(a)(iii)'],
      obligations: [
        'You have the wind on your port side and cannot determine the tack of a vessel to '
        + 'windward. Keep out of her way.'
      ]
    });
  }

  if (ownTack && targetTack && ownTack !== targetTack) {
    const weGiveWay = ownTack === 'port';
    const so = weGiveWay ? null : standOnObligations(standOnStage, 'sailing', false);
    return outcome({
      situation: 'crossing',
      role: weGiveWay ? 'give-way' : 'stand-on',
      standOnStage: weGiveWay ? null : standOnStage,
      rules: ['Rule 12(a)(i)', ...(weGiveWay ? ['Rule 16'] : so.rules)],
      obligations: weGiveWay
        ? ['You have the wind on your port side and she has it on her starboard side. '
           + 'Keep out of her way.',
           'Take early and substantial action to keep well clear. (Rule 16)']
        : ['She has the wind on her port side and you have it on your starboard side. '
           + 'She keeps out of your way.', ...so.obligations]
    });
  }

  if (ownTack && targetTack && ownTack === targetTack) {
    const weAreWindward = !!own.windward;
    const so = weAreWindward ? null : standOnObligations(standOnStage, 'sailing', false);
    return outcome({
      situation: 'crossing',
      role: weAreWindward ? 'give-way' : 'stand-on',
      standOnStage: weAreWindward ? null : standOnStage,
      rules: ['Rule 12(a)(ii)', ...(weAreWindward ? ['Rule 16'] : so.rules)],
      obligations: weAreWindward
        ? ['You have the wind on the same side as she does and you are to windward. '
           + 'Keep out of her way.',
           'The windward side is the side opposite that on which the mainsail is carried.',
           'Take early and substantial action to keep well clear. (Rule 16)']
        : ['You have the wind on the same side as she does and you are to leeward. '
           + 'She keeps out of your way.', ...so.obligations]
    });
  }

  return outcome({
    notApplicable: {
      rule: 'Rule 12',
      reason: 'Rule 12 turns on which tack each vessel is on, and that is not established here.'
    },
    rules: ['Rule 12']
  });
}
