/**
 * Part A: application, responsibility, and the defined terms. Rules 1 to 3.
 *
 * Paraphrased from 33 CFR Subchapter E, a US Government work.
 *
 * This section is deliberately last. The definitions are what the other six
 * sections have been quietly relying on all along — every vessel state in
 * data/vessel-states.js is an instance of one or more terms defined here — so
 * `relatedStates` links them, and the app stops being six separate topics.
 *
 * The links are load-bearing. A term claiming a state that does not exist is a
 * broken cross-reference the reader will hit, so a test resolves every id, and
 * a second test makes sure no vessel state is orphaned: every one is reachable
 * from at least one definition, or listed in ORPHAN_EXCEPTIONS with a reason.
 *
 * RULE 2 IS HANDLED DIFFERENTLY. See the note on it below.
 */

export const DEFINITIONS = [
  // --- Rule 1: application ------------------------------------------------
  {
    id: 'application',
    term: 'Application',
    rule: 'Rule 1',
    definition: 'These rules apply to all vessels upon the high seas and in all waters '
      + 'connected to them that are navigable by seagoing vessels.',
    keyPoints: [
      'It is the water that decides, not the vessel: a dinghy on the high seas is covered '
      + 'and a ship in waters not connected to them is not.',
      'A government may make special rules for roadsteads, harbours, rivers, lakes or inland '
      + 'waterways connected to the high seas, and those rules must conform as closely as '
      + 'possible to these.',
      'Special rules may also be made for additional station or signal lights for vessels of '
      + 'war, vessels in convoy, and vessels fishing as a fleet.'
    ],
    commonError: 'Assuming the International Rules stop at some line offshore. They run right '
      + 'up to waters where a national demarcation replaces them, and where that happens the '
      + 'Inland Rules take over rather than nothing applying.',
    relatedStates: []
  },

  // --- Rule 2: responsibility ---------------------------------------------
  //
  // A standard, not a test. There are no situational questions on Rule 2
  // anywhere in this app, because the answer to "what does Rule 2 require here"
  // is a judgement about the circumstances, and a multiple-choice card that
  // pretends otherwise would be teaching that judgement has a lookup answer.
  // Questions ask what Rule 2 says and what it means. Nothing further.
  {
    id: 'responsibility',
    term: 'Responsibility',
    rule: 'Rule 2(a)',
    definition: 'Nothing in these rules exonerates any vessel, or her owner, master or crew, '
      + 'from the consequences of neglecting to comply with them, or of neglecting any '
      + 'precaution required by the ordinary practice of seamen or by the special circumstances '
      + 'of the case.',
    keyPoints: [
      'It closes the gap between obeying the rules and being seamanlike. Doing exactly what a '
      + 'rule says and nothing more is not a defence if an ordinary prudent mariner would have '
      + 'done something else as well.',
      'It binds the owner and the master as well as the vessel.',
      'The ordinary practice of seamen is not written down anywhere. That is the point of it.'
    ],
    commonError: 'Reading Rule 2(a) as a licence to ignore a rule you disagree with. It is the '
      + 'opposite: it adds an obligation on top of the rules, it does not subtract one.',
    relatedStates: []
  },
  {
    id: 'departure',
    term: 'Departure from the rules',
    rule: 'Rule 2(b)',
    definition: 'In construing and complying with these rules, due regard shall be had to all '
      + 'dangers of navigation and collision, and to any special circumstances, including the '
      + 'limitations of the vessels involved, which may make a departure from these rules '
      + 'necessary to avoid immediate danger.',
    keyPoints: [
      'The threshold is immediate danger, not inconvenience and not preference.',
      'It is permission to depart from a rule, not permission to ignore the system. You depart '
      + 'to avoid the danger and no further.',
      'The limitations of the vessels involved are expressly part of the judgement, which is '
      + 'why a large vessel\'s stopping distance is a special circumstance and not an excuse.'
    ],
    commonError: 'Treating 2(b) as the general escape clause. Departure has to be necessary to '
      + 'avoid immediate danger, and after the fact you have to be able to say what the danger '
      + 'was.',
    relatedStates: []
  },

  // --- Rule 3: general definitions ----------------------------------------
  {
    id: 'vessel',
    term: 'Vessel',
    rule: 'Rule 3(a)',
    definition: 'Every description of watercraft, including non-displacement craft, WIG craft '
      + 'and seaplanes, used or capable of being used as a means of transportation on water.',
    keyPoints: [
      '"Capable of being used" is doing the work: a craft does not stop being a vessel because '
      + 'she is not moving.',
      'It is deliberately broad. Non-displacement craft and seaplanes are named so that nobody '
      + 'argues them out of the definition.'
    ],
    commonError: 'Thinking a vessel must be self-propelled. A towed barge is a vessel.',
    relatedStates: []          // universal: every state is a vessel
  },
  {
    id: 'power-driven',
    term: 'Power-driven vessel',
    rule: 'Rule 3(b)',
    definition: 'Any vessel propelled by machinery.',
    keyPoints: [
      'The test is what is driving her now, not what she is rigged as.',
      'A sailing vessel with her engine running and in gear is a power-driven vessel for the '
      + 'purposes of these rules, whatever her sails are doing.'
    ],
    commonError: 'Calling a yacht a sailing vessel because she has masts. Under way under '
      + 'engine, she is power-driven and shows the lights of one.',
    relatedStates: ['pd-under50', 'pd-50plus', 'pd-under12', 'pd-under7',
      'tow-astern-short', 'tow-astern-long', 'pushing-alongside', 'sailing-and-power',
      'pilot-underway', 'mine-clearance', 'cbd']
  },
  {
    id: 'sailing',
    term: 'Sailing vessel',
    rule: 'Rule 3(c)',
    definition: 'Any vessel under sail, provided that propelling machinery, if fitted, is not '
      + 'being used.',
    keyPoints: [
      'The proviso is the whole definition. Sails up and engine in gear is not a sailing vessel.',
      'By day, a vessel under sail and power shows a cone apex downwards forward.'
    ],
    commonError: 'Assuming a sailing vessel always has priority. She keeps out of the way of a '
      + 'vessel engaged in fishing, one restricted in her ability to manoeuvre, and one not '
      + 'under command.',
    relatedStates: ['sailing', 'sailing-rg', 'sailing-under7']
  },
  {
    id: 'fishing',
    term: 'Vessel engaged in fishing',
    rule: 'Rule 3(d)',
    definition: 'A vessel fishing with nets, lines, trawls or other apparatus that restricts '
      + 'her manoeuvrability. It does not include a vessel fishing with trolling lines or other '
      + 'apparatus that does not restrict her manoeuvrability.',
    keyPoints: [
      'The test is restricted manoeuvrability, not the act of catching fish.',
      'Trolling lines are expressly excluded. A vessel trolling is an ordinary power-driven or '
      + 'sailing vessel and shows those lights.',
      'She is "engaged in fishing" only while her gear is out. Steaming to the grounds she is '
      + 'a power-driven vessel.'
    ],
    commonError: 'Treating any vessel with rods or lines out as a vessel engaged in fishing. '
      + 'Sport fishing under trolling lines does not qualify, and showing the fishing lights '
      + 'while trolling would be a false signal.',
    relatedStates: ['trawling-making-way', 'trawling-stopped',
      'fishing-other-making-way', 'fishing-gear-150']
  },
  {
    id: 'seaplane',
    term: 'Seaplane',
    rule: 'Rule 3(e)',
    definition: 'Any aircraft designed to manoeuvre on the water.',
    keyPoints: [
      'On the water she is a vessel and these rules apply to her.',
      'Rule 18(e): a seaplane shall in general keep well clear of all vessels and avoid '
      + 'impeding their navigation.'
    ],
    commonError: 'Assuming an aircraft is outside the rules. On the water she is inside them.',
    relatedStates: []          // no seaplane light state is modelled; see ORPHAN note
  },
  {
    id: 'nuc',
    term: 'Vessel not under command',
    rule: 'Rule 3(f)',
    definition: 'A vessel which through some exceptional circumstance is unable to manoeuvre as '
      + 'these rules require, and is therefore unable to keep out of the way of another vessel.',
    keyPoints: [
      'Exceptional circumstance means something has gone wrong: steering failure, engine '
      + 'breakdown, loss of power.',
      'It is a condition she is in, not a job she is doing. That is the difference from '
      + 'restricted in ability to manoeuvre.',
      'She never shows a masthead light while not under command, because she is not making the '
      + 'way a masthead light implies.'
    ],
    commonError: 'Confusing her with a vessel aground. A vessel aground shows the anchor lights '
      + 'as well as two all-round reds; not under command shows the two reds alone.',
    relatedStates: ['nuc-making-way', 'nuc-stopped']
  },
  {
    id: 'ram',
    term: 'Vessel restricted in her ability to manoeuvre',
    rule: 'Rule 3(g)',
    definition: 'A vessel which from the nature of her work is restricted in her ability to '
      + 'manoeuvre as these rules require, and is therefore unable to keep out of the way of '
      + 'another vessel.',
    keyPoints: [
      'From the nature of her work: she is restricted because of what she is doing, not because '
      + 'something has broken.',
      'Rule 3(g) gives examples: laying, servicing or picking up a navigation mark, submarine '
      + 'cable or pipeline; dredging, surveying or underwater operations; replenishment or '
      + 'transferring persons, provisions or cargo while under way; launching or recovering '
      + 'aircraft; mine clearance operations; and a towing operation such as severely restricts '
      + 'the towing vessel and her tow in their ability to deviate from their course.',
      'The list is examples, not a closed set.'
    ],
    commonError: 'Assuming any tug towing is restricted in her ability to manoeuvre. Only a tow '
      + 'that severely restricts the ability to deviate from course qualifies.',
    relatedStates: ['ram-making-way', 'ram-anchored', 'dredging', 'mine-clearance',
      'tow-astern-long', 'towed']
  },
  {
    id: 'cbd',
    term: 'Vessel constrained by her draught',
    rule: 'Rule 3(h)',
    definition: 'A power-driven vessel which, because of her draught in relation to the '
      + 'available depth and width of navigable water, is severely restricted in her ability to '
      + 'deviate from the course she is following.',
    keyPoints: [
      'She must be power-driven. There is no such thing as a sailing vessel constrained by her '
      + 'draught.',
      'It is draught against available water, not draught alone. A deep vessel in deep water is '
      + 'not constrained.',
      'Other vessels avoid impeding her safe passage. That is a lesser obligation than keeping '
      + 'out of the way, and it does not make her a stand-on vessel.',
      'International only. There is no equivalent in the Inland Rules.'
    ],
    commonError: 'Treating her as though she were restricted in her ability to manoeuvre. She '
      + 'is not, and the obligation on other vessels is different.',
    relatedStates: ['cbd']
  },
  {
    id: 'underway',
    term: 'Underway',
    rule: 'Rule 3(i)',
    definition: 'A vessel is underway when she is not at anchor, not made fast to the shore, '
      + 'and not aground.',
    keyPoints: [
      'It is defined by what she is not attached to, and says nothing about movement.',
      'A vessel drifting with her engines stopped is underway.'
    ],
    commonError: 'Reading underway as moving. It is the commonest confusion in Part A and it '
      + 'changes which lights she must show.',
    relatedStates: ['pd-under50', 'pd-50plus', 'sailing', 'nuc-stopped', 'trawling-stopped']
  },
  {
    id: 'making-way',
    term: 'Making way through the water',
    rule: 'Rule 3(i), and Rules 23 to 27',
    definition: 'A vessel is making way when she is underway and moving through the water. '
      + 'Underway and making way are not the same thing.',
    keyPoints: [
      'Every vessel making way is underway. Not every vessel underway is making way.',
      'The distinction drives the lights: sidelights and a sternlight appear when a vessel is '
      + 'making way, and a vessel not under command or fishing shows them only then.',
      'A power-driven vessel underway but stopped sounds two prolonged blasts in restricted '
      + 'visibility; making way, one.'
    ],
    commonError: 'Showing sidelights while stopped and drifting. A vessel not under command and '
      + 'making no way shows two all-round reds and nothing else.',
    relatedStates: ['nuc-making-way', 'nuc-stopped', 'trawling-making-way', 'trawling-stopped',
      'ram-making-way', 'fishing-other-making-way']
  },
  {
    id: 'in-sight',
    term: 'In sight of one another',
    rule: 'Rule 3(k)',
    definition: 'Vessels are in sight of one another only when one can be observed visually '
      + 'from the other.',
    keyPoints: [
      'Visually. A contact on radar is not in sight.',
      'It is the gate on the whole of Section II: Rules 11 to 18 apply only to vessels in sight '
      + 'of one another.',
      'One vessel seeing the other is enough for the definition; it does not require both.'
    ],
    commonError: 'Using the steering and sailing rules on a radar contact in fog. In restricted '
      + 'visibility Rule 19 governs and there is no stand-on vessel.',
    relatedStates: []          // universal: governs every encounter
  },
  {
    id: 'restricted-visibility',
    term: 'Restricted visibility',
    rule: 'Rule 3(l)',
    definition: 'Any condition in which visibility is restricted by fog, mist, falling snow, '
      + 'heavy rainstorms, sandstorms or any similar cause.',
    keyPoints: [
      'The list is examples. Anything with the same effect counts.',
      'Rule 19 applies in or near an area of restricted visibility, so it can bind you before '
      + 'you are in the fog.',
      'Darkness is not restricted visibility. A clear night is good visibility.'
    ],
    commonError: 'Treating night as restricted visibility. It is not, and the rules that apply '
      + 'are different.',
    relatedStates: []
  },
  {
    id: 'wig',
    term: 'WIG craft',
    rule: 'Rule 3(m)',
    definition: 'A multimodal craft which, in her main operational mode, flies close to the '
      + 'surface by using surface-effect action.',
    keyPoints: [
      'Taking off, landing or in flight near the surface, she keeps well clear of all other '
      + 'vessels and avoids impeding their navigation. (Rule 18(f))',
      'On the water surface she is simply a power-driven vessel and complies as one.',
      'In flight near the surface she shows a high intensity all-round flashing red light in '
      + 'addition to the lights of a power-driven vessel.'
    ],
    commonError: 'Reading the flashing red as a distress or emergency signal. It is a warning '
      + 'about her speed and behaviour, nothing more.',
    relatedStates: ['wig']
  },
  {
    id: 'length-breadth',
    term: 'Length and breadth',
    rule: 'Rule 3(j)',
    definition: 'The length and breadth of a vessel mean her length overall and her greatest '
      + 'breadth.',
    keyPoints: [
      'Length overall, not registered or waterline length. It is the measurement that decides '
      + 'which lights and shapes she must carry.',
      'The thresholds that matter: 7 m, 12 m, 20 m, 50 m and 100 m, each of which changes what '
      + 'she must show or carry.'
    ],
    commonError: 'Using registered length for the Rule 23 and Rule 30 thresholds. It is length '
      + 'overall.',
    relatedStates: ['pd-under7', 'pd-under12', 'pd-under50', 'pd-50plus',
      'sailing-under7', 'anchored-under50', 'anchored-50plus']
  },
  {
    id: 'aground',
    term: 'Aground',
    rule: 'Rule 3(i) by exclusion, and Rule 30(d)',
    definition: 'A vessel is aground when she is resting on the bottom. She is not underway, '
      + 'because underway means not at anchor, not made fast to the shore and not aground.',
    keyPoints: [
      'Aground is one of the three things that stop a vessel being underway.',
      'By night she shows the anchor lights plus two all-round reds in a vertical line; by day, '
      + 'three balls.',
      'Her fog signal is the anchor bell signal with three separate and distinct strokes '
      + 'immediately before and after the rapid ringing.'
    ],
    commonError: 'Confusing her with a vessel not under command. Two reds alone is not under '
      + 'command; two reds with the anchor lights is aground.',
    relatedStates: ['aground', 'anchored-under50', 'anchored-50plus', 'ram-anchored',
      'pilot-anchored']
  },
  {
    id: 'towing',
    term: 'Towing and pushing',
    rule: 'Rule 3(g)(vi), and Rule 24',
    definition: 'A vessel towing or pushing another. She is restricted in her ability to '
      + 'manoeuvre only where the towing operation severely restricts the towing vessel and her '
      + 'tow in their ability to deviate from their course.',
    keyPoints: [
      'The length of the tow decides the lights: more than 200 m and she shows three masthead '
      + 'lights in a vertical line and a diamond by day.',
      'A vessel being towed shows sidelights and a sternlight, and no masthead light. '
      + 'Sidelights with no masthead light means look ahead of her.',
      'Pushing ahead or towing alongside shows two masthead lights and no yellow towing light.'
    ],
    commonError: 'Assuming every tug and tow is restricted in her ability to manoeuvre. Only '
      + 'where the operation severely restricts the ability to deviate from course.',
    relatedStates: ['tow-astern-short', 'tow-astern-long', 'towed', 'pushing-alongside']
  },
  {
    id: 'air-cushion',
    term: 'Air-cushion vessel',
    rule: 'Rule 3(b), and Rule 23(b)',
    definition: 'A non-displacement craft operating in non-displacement mode. She is a '
      + 'power-driven vessel, and in that mode she shows an all-round flashing yellow light in '
      + 'addition to the lights of a power-driven vessel.',
    keyPoints: [
      'She is not a separate category under Rule 18. She is a power-driven vessel throughout.',
      'The flashing yellow warns of her speed and handling; it confers nothing.'
    ],
    commonError: 'Treating the flashing yellow as though it gave her some priority. It does not.',
    relatedStates: ['air-cushion']
  },
  {
    id: 'pilot-vessel',
    term: 'Pilot vessel on duty',
    rule: 'Rule 29',
    definition: 'A vessel engaged on pilotage duty. She is not a separate category under Rule '
      + '18 and has no special standing in the steering and sailing rules.',
    keyPoints: [
      'White over red at or near the masthead, plus sidelights and sternlight when underway.',
      'At anchor she shows white over red plus the anchor lights.',
      'She may sound an identity signal of four short blasts.'
    ],
    commonError: 'Reading white over red as conferring priority. It identifies a trade, not a '
      + 'status under Rule 18.',
    relatedStates: ['pilot-underway', 'pilot-anchored']
  }
];

/**
 * Vessel states no definition claims, and why.
 *
 * Kept as data rather than left to be discovered: a state nothing links to is
 * either an oversight or a decision, and this is where the difference is
 * recorded. The coverage test reads this list.
 */
export const ORPHAN_EXCEPTIONS = [];

/**
 * Edge cases for definition-boundary.
 *
 * Written out explicitly rather than generated, because these distinctions are
 * precisely what an examiner probes and a generated distractor would be close
 * enough to be wrong. Each states a situation, the term in question, whether it
 * is met, and why.
 */
export const DEFINITION_BOUNDARIES = [
  {
    id: 'trolling-not-fishing',
    term: 'fishing',
    situation: 'A sport boat under engine, towing two trolling lines astern, manoeuvring freely.',
    meets: false,
    because: 'Trolling lines are expressly excluded from Rule 3(d). The test is whether the '
      + 'apparatus restricts manoeuvrability, and hers does not. She is a power-driven vessel '
      + 'and shows those lights. Showing the fishing lights here would be a false signal.'
  },
  {
    id: 'trawling-is-fishing',
    term: 'fishing',
    situation: 'A vessel with a trawl down, unable to alter course sharply without fouling her gear.',
    meets: true,
    because: 'Her gear restricts her manoeuvrability, which is exactly what Rule 3(d) requires. '
      + 'She shows green over white and, when making way, sidelights and a sternlight.'
  },
  {
    id: 'steaming-to-grounds',
    term: 'fishing',
    situation: 'A trawler steaming out to the fishing grounds with her gear stowed inboard.',
    meets: false,
    because: 'She is engaged in fishing only while her gear is out. On passage she is an '
      + 'ordinary power-driven vessel and shows those lights, whatever is painted on her side.'
  },
  {
    id: 'drifting-is-underway',
    term: 'underway',
    situation: 'A vessel with her engines stopped, drifting on the tide, not anchored and not aground.',
    meets: true,
    because: 'Underway means not at anchor, not made fast to the shore and not aground. It says '
      + 'nothing about movement. She is underway but not making way.'
  },
  {
    id: 'drifting-not-making-way',
    term: 'making-way',
    situation: 'The same vessel, drifting with no way on her through the water.',
    meets: false,
    because: 'Making way requires movement through the water. She is underway and not making '
      + 'way, which is why a power-driven vessel in that state sounds two prolonged blasts in '
      + 'restricted visibility rather than one.'
  },
  {
    id: 'anchored-not-underway',
    term: 'underway',
    situation: 'A vessel at anchor, swinging to the tide and moving over the ground.',
    meets: false,
    because: 'She is at anchor, so she is not underway, however much she moves. Movement is not '
      + 'the test.'
  },
  {
    id: 'aground-not-nuc',
    term: 'nuc',
    situation: 'A vessel hard aground on a bank, unable to manoeuvre at all.',
    meets: false,
    because: 'She cannot manoeuvre, but she is aground, and aground has its own lights and its '
      + 'own fog signal. Two all-round reds alone is not under command; two reds with the '
      + 'anchor lights is aground.'
  },
  {
    id: 'breakdown-is-nuc',
    term: 'nuc',
    situation: 'A vessel underway whose main engine has failed, drifting and unable to keep out '
      + 'of the way.',
    meets: true,
    because: 'An exceptional circumstance has left her unable to manoeuvre as the rules require. '
      + 'That is Rule 3(f). She shows two all-round reds, and sidelights and a sternlight only '
      + 'if she is making way.'
  },
  {
    id: 'dredger-is-ram',
    term: 'ram',
    situation: 'A dredger working a channel, restricted by the nature of the operation.',
    meets: true,
    because: 'Dredging is one of the examples in Rule 3(g). She is restricted from the nature of '
      + 'her work rather than by a breakdown, which is what separates her from a vessel not '
      + 'under command.'
  },
  {
    id: 'deep-ship-not-cbd',
    term: 'cbd',
    situation: 'A loaded tanker of deep draught, in open water with hundreds of metres beneath her.',
    meets: false,
    because: 'Constrained by draught is draught against the available depth and width, not '
      + 'draught alone. With ample water under her she is not constrained and may not show the '
      + 'three all-round reds.'
  },
  {
    id: 'sailing-under-engine',
    term: 'sailing',
    situation: 'A yacht with all sail set and her engine running in gear to hold speed.',
    meets: false,
    because: 'Rule 3(c) has a proviso: under sail provided propelling machinery is not being '
      + 'used. She is a power-driven vessel, shows a masthead light, and by day a cone apex '
      + 'downwards.'
  },
  {
    id: 'radar-not-in-sight',
    term: 'in-sight',
    situation: 'Two vessels in fog, each with the other clearly on radar at two miles.',
    meets: false,
    because: 'In sight of one another means observed visually. Radar is not sight, so Rules 11 '
      + 'to 18 do not apply and Rule 19 governs. There is no stand-on vessel.'
  },
  {
    id: 'night-not-restricted',
    term: 'restricted-visibility',
    situation: 'A clear, dark night with no fog, mist or precipitation.',
    meets: false,
    because: 'Darkness is not restricted visibility. Visibility is good; it is simply night. '
      + 'The steering and sailing rules apply normally between vessels in sight of one another.'
  }
];

export const DEFINITION_RULES = [...new Set(DEFINITIONS.map(d => d.rule.split(',')[0].trim()))];

/** Definitions that govern a given vessel state. The reverse of relatedStates. */
export const definitionsForState = stateId =>
  DEFINITIONS.filter(d => (d.relatedStates || []).includes(stateId));

export const definitionById = id => DEFINITIONS.find(d => d.id === id) || null;
