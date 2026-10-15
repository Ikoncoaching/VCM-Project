/**
 * Per-type content for the Enneagram module.
 *
 * `summary` texts are original executive summaries written for this app,
 * informed by The Enneagram Institute's published type profiles.
 * `levels` are faithful paraphrases of the Riso-Hudson Levels of
 * Development, adapted with credit from The Enneagram Institute
 * (enneagraminstitute.com). Each level carries a short headline plus a
 * `detail` written to help a member recognize their current experience.
 * The app links to each type's full profile.
 */

export type LevelGroup = "Healthy" | "Average" | "Unhealthy";

export interface DevelopmentLevel {
  level: number;
  group: LevelGroup;
  text: string;
  detail: string;
}

export interface EnneagramType {
  number: number;
  name: string;
  need: string;
  fear: string;
  desire: string;
  peak: string;
  edge: string;
  url: string;
  summary: string[];
  levels: DevelopmentLevel[];
}

const L = (
  level: number,
  group: LevelGroup,
  text: string,
  detail: string
): DevelopmentLevel => ({ level, group, text, detail });

export const ENNEAGRAM_TYPES: EnneagramType[] = [
  {
    number: 1,
    name: "The Reformer",
    need: "The need to be perfect",
    fear: "being flawed or corrupt",
    desire: "to be good, have integrity, and have things be right",
    peak: "discerning, principled clarity that improves everything it touches",
    edge: "loosening self-judgment; letting go of needing to be beyond criticism",
    url: "https://www.enneagraminstitute.com/type-1/",
    summary: [
      "Ones are the principled, purposeful type. Their engine is the need to be perfect: an inner compass of right and wrong so strong that improving things (themselves, others, the world) feels less like a choice and more like an assignment they were born with.",
      "At their best, Ones are wise, discerning, fair, and ethical. They create value the way a fine editor does: they see the gap between what is and what could be, and they close it. Quality rises wherever they're standing: teams get more honest, work gets more careful, standards become contagious.",
      "The same engine has a cost: a relentless inner critic. Under pressure, high ideals slide into impatience, nit-picking, and resentment, the sense that they alone take things seriously enough. Feelings get held under tight control until they leak out as irritation.",
      "The growth path is accepting imperfection (in reality, in others, in themselves) without abandoning their ideals. A One who can forgive the world for being unfinished becomes what they were always meant to be: not a critic, but a builder of better things.",
    ],
    levels: [
      L(1, "Healthy", "At their best: deeply wise and discerning, able to accept reality as it is and see the best action to take in each moment.", "You can hold what's wrong in view without being consumed by it, and you act from a calm sense of what's genuinely best rather than what the rules demand. Others feel your fairness as freeing, not judging."),
      L(2, "Healthy", "Conscientious, guided by strong personal convictions and a keen sense of right and wrong.", "You live by firm inner convictions that shape your everyday choices, not just the big ones. Doing the right thing matters to you even when no one is watching."),
      L(3, "Healthy", "Highly principled: fairness, objectivity, and ethics matter most; truth and justice are the compass.", "You are the person others trust to be fair and objective when it counts, and you'll stand up for what's right even at a personal cost. People rely on your integrity instinctively."),
      L(4, "Average", "Growing dissatisfied with how things are: high-minded idealists and crusaders who feel personally responsible for improving everything.", "You feel personally responsible for improving what's around you, and a steady 'this could be better' runs underneath the day. Rest is hard while anything is unfinished."),
      L(5, "Average", "Fear of mistakes takes over: orderly and well-organized, but impersonal, rigid, and emotionally buttoned-up.", "You keep things orderly and controlled, and mistakes create real tension. Warmth can get squeezed out by the need to have everything correct and in its place."),
      L(6, "Average", "Sharply critical of themselves and others: picky, judgmental, perfectionistic, and opinionated, correcting and lecturing.", "You notice flaws fast, in yourself and others, and slip into correcting, criticizing, or lecturing. Irritation leaks out even when you're trying hard to be patient."),
      L(7, "Unhealthy", "Dogmatic and self-righteous: intolerant, inflexible, dealing in absolutes, certain they alone hold the truth.", "You feel increasingly certain that you alone see it rightly, with little room for other views. Positions harden into absolutes."),
      L(8, "Unhealthy", "Obsessed with imperfection and others' wrongdoing, while sliding into contradictory, hypocritical behavior themselves.", "You're preoccupied with what's wrong and with others' failings, while quietly acting against your own standards. The gap between your ideals and your behavior widens."),
      L(9, "Unhealthy", "Condemning and punitive toward 'wrongdoers'; prone to severe depression and breakdown.", "You feel harshly condemning toward wrongdoing and weighed down by it, near exhaustion, rigidity, or despair."),
    ],
  },
  {
    number: 2,
    name: "The Helper",
    need: "The need to be needed",
    fear: "being unwanted or unworthy of love",
    desire: "to be loved and needed",
    peak: "generosity that genuinely nourishes other people",
    edge: "noticing your own needs before they leak out as quiet resentment",
    url: "https://www.enneagraminstitute.com/type-2/",
    summary: [
      "Twos are the caring, interpersonal type. Their engine is the need to be needed: they move instinctively toward people, sensing what others require, often before those people know it themselves.",
      "At their best, Twos are warm, generous, and genuinely empathic. Their value creation is relational: they see the good in people and call it out, they anticipate needs, and they make others feel cared for in ways that unlock trust, loyalty, and growth. Teams and families run on the fuel Twos provide.",
      "The pattern's shadow: giving can become a strategy for being loved. Twos may lose track of their own needs entirely, drift into flattery and hovering, and accumulate quiet resentment when the care they pour out isn't returned. 'After all I've done…' is the sound of a Two at the edge.",
      "Growth means turning some of that world-class care inward: naming their own needs plainly instead of hoping someone notices. A Two who can receive as honestly as they give becomes love without the hook.",
    ],
    levels: [
      L(1, "Healthy", "At their best: genuinely unselfish and humble, offering unconditional love to others and to themselves.", "You give freely without needing anything back, and you can receive care as easily as you give it. Love without strings attached."),
      L(2, "Healthy", "Empathic and compassionate, sincerely attuned to what other people feel and need.", "You're genuinely tuned in to what others feel and need, and you respond with real warmth and tact. People feel understood around you."),
      L(3, "Healthy", "Encouraging and appreciative: they see the good in people, serve gladly, and still take care of themselves.", "You see the good in people and draw it out, and you serve gladly while still tending to your own needs and limits."),
      L(4, "Average", "Begin pleasing people to stay close: overly friendly, effusive, generous with flattery and approval.", "You start working to be liked and close: extra friendly, effusive, generous with praise and approval, wanting to be seen as loving."),
      L(5, "Average", "Become intrusive in the name of love: needing to be needed, they hover, meddle, and manage other people's lives.", "You get drawn into others' lives in the name of caring: hovering, advising, managing, needing to be needed and central to them."),
      L(6, "Average", "Increasingly self-important: convinced they are indispensable while overrating what they actually give.", "You feel indispensable and quietly overrate how much you give. A sense of 'they couldn't do this without me' creeps in."),
      L(7, "Unhealthy", "Manipulative and self-serving, instilling guilt with reminders of everything others owe them.", "You use guilt and reminders of your sacrifices to get what you want; care becomes a lever."),
      L(8, "Unhealthy", "Domineering and coercive: feeling entitled to whatever they want from the people they've 'served.'", "You feel entitled to repayment for all you've given, and grow coercive or self-pitying when it doesn't come."),
      L(9, "Unhealthy", "Excuse their own harmful behavior while feeling victimized and bitter; health often collapses under the resentment.", "You excuse your own hurtful behavior while feeling victimized and bitter; resentment overwhelms the goodwill."),
    ],
  },
  {
    number: 3,
    name: "The Achiever",
    need: "The need to succeed",
    fear: "being worthless apart from achievement",
    desire: "to feel valuable and worthwhile",
    peak: "authentic accomplishment that inspires others by example",
    edge: "separating real achievement from performing for an image",
    url: "https://www.enneagraminstitute.com/type-3/",
    summary: [
      "Threes are the success-oriented, adaptable type. Their engine is the need to succeed: worth and accomplishment got fused early, so they became brilliant at reading what a room values and becoming excellent at it.",
      "At their best, Threes create value by embodiment: energetic, competent, and inspiring, they show others what's possible. They set the pace, raise the ambient ambition of every group they join, and get real things done, often lots of them.",
      "The risk is the mask. When worth is welded to performance, Threes begin managing their image instead of living their life: packaging themselves for applause, boxing up feelings, and losing track of what they actually want beneath what wins.",
      "Growth is the question behind the trophies: what do I want? A Three who trades the impressive image for the true self discovers the paradox: authenticity turns out to be the most magnetic performance of all.",
    ],
    levels: [
      L(1, "Healthy", "At their best: self-accepting and authentic, exactly what they appear to be. Modest, warm, benevolent, with a full heart.", "You are exactly who you appear to be, with nothing to prove; warm, modest, and genuinely at home in yourself."),
      L(2, "Healthy", "Confident, energetic, and competent: genuine self-esteem grounded in believing in their own value.", "You're confident, energetic, and capable, with self-worth that comes from inside rather than from applause."),
      L(3, "Healthy", "Ambitious to grow into their best self, often becoming admired examples who motivate others to develop too.", "You're ambitious to become your best self and, in doing so, you inspire others to grow too."),
      L(4, "Average", "Performance takes over: driven to achieve as if self-worth depends on it, terrified of failure, constantly comparing themselves with others.", "You're driven to achieve as if your worth depends on it, afraid of failure and constantly measuring yourself against others."),
      L(5, "Average", "Image-conscious: packaging themselves for whatever success requires; smooth and efficient, but losing touch with their own feelings.", "You manage your image carefully, presenting whatever success requires; smooth and effective, but out of touch with your own feelings."),
      L(6, "Average", "Need to impress: self-promoting and grandiose, inflating their talents, arrogance masking envy of others' success.", "You promote and inflate yourself to impress; a touch grandiose, with envy of others' success running under the surface."),
      L(7, "Unhealthy", "Fear of humiliation turns exploitative and opportunistic, willing to do whatever preserves the illusion of superiority.", "Fear of humiliation pushes you to cut corners or exploit situations to protect the image of success."),
      L(8, "Unhealthy", "Deceptive and untrustworthy: concealing mistakes, sabotaging or betraying others to come out on top.", "You conceal failures and become willing to deceive, sabotage, or betray to stay on top."),
      L(9, "Unhealthy", "Vindictive: obsessed with ruining whatever reminds them of their own shortcomings.", "You're consumed with undermining whatever exposes your shortcomings."),
    ],
  },
  {
    number: 4,
    name: "The Individualist",
    need: "The need to be special",
    fear: "having no identity or significance",
    desire: "to be uniquely themselves and significant",
    peak: "turning personal experience into resonant, honest expression",
    edge: "building identity through consistent work, not waiting to feel ready",
    url: "https://www.enneagraminstitute.com/type-4/",
    summary: [
      "Fours are the sensitive, introspective type. Their engine is the need to be special: a lifelong search for identity and significance, driven by the feeling that something essential is missing and must be found or made.",
      "At their best, Fours create value through depth and honesty. They metabolize experience, including pain, into meaning, beauty, and truth-telling that others can't produce. They give voice to what everyone feels but nobody says, and they make things that last.",
      "The shadow: difference can become a fortress. Fantasy and longing quietly replace living; moods become weather systems; envy whispers that everyone else got the manual. Waiting to 'feel like themselves' postpones the very work that would build the self they're waiting for.",
      "Growth means building identity out of committed work and real relationships rather than emotional intensity. A Four who ships their gifts instead of guarding them discovers they were never missing anything: the depth was the identity all along.",
    ],
    levels: [
      L(1, "Healthy", "At their best: profoundly creative, transforming all of their experience, even pain, into something valuable, renewing themselves in the process.", "You transform everything you live through, even pain, into something meaningful and beautiful, renewing yourself in the process."),
      L(2, "Healthy", "Self-aware and introspective, sensitive and intuitive with themselves and others: gentle, tactful, compassionate.", "You're deeply self-aware and intuitive, gentle and compassionate with your own and others' inner worlds."),
      L(3, "Healthy", "True to themselves: individual, emotionally honest, humane: serious and funny, vulnerable and strong at the same time.", "You're fully yourself: emotionally honest and individual, both vulnerable and strong, serious and funny at once."),
      L(4, "Average", "Take a romantic, aesthetic stance toward life, using imagination and passionate feeling to heighten ordinary reality.", "You heighten ordinary life with imagination and feeling, living somewhat through fantasy and longing rather than what's in front of you."),
      L(5, "Average", "Take everything personally and turn inward: moody, hypersensitive, self-conscious, withdrawing to protect the self-image.", "You take things personally and turn inward; moody and self-conscious, withdrawing to protect a fragile sense of self."),
      L(6, "Average", "Feel fundamentally different and exempt from ordinary life: melancholy dreamers, where self-pity and envy breed self-indulgence.", "You feel set apart and exempt from ordinary demands; melancholy and dreamy, with self-pity and envy feeding self-indulgence."),
      L(7, "Unhealthy", "When the dream collapses: angry at themselves, depressed, alienated, creatively and emotionally blocked.", "The dream collapses into anger at yourself, depression, and a creative and emotional block."),
      L(8, "Unhealthy", "Tormented by self-contempt and morbid thoughts, blaming others and driving away anyone who tries to help.", "You're tormented by self-contempt and dark thoughts, pushing away anyone who tries to help."),
      L(9, "Unhealthy", "Despairing and self-destructive, possibly escaping through substances or worse.", "You're overtaken by despair and self-destructiveness."),
    ],
  },
  {
    number: 5,
    name: "The Investigator",
    need: "The need to know everything",
    fear: "being helpless, incapable, or incompetent",
    desire: "to be capable and competent",
    peak: "penetrating insight that sees what others miss",
    edge: "letting mastery lead back to people and action, not away from them",
    url: "https://www.enneagraminstitute.com/type-5/",
    summary: [
      "Fives are the intense, cerebral type. Their engine is the need to know everything: competence feels like survival, so they retreat, observe, and master, building an inner fortress of understanding before they'll risk the field.",
      "At their best, Fives create value through penetrating insight. They see the structure beneath the surface, connect what no one else connects, and go deeper than anyone else is willing to go. Whole fields advance because a Five wouldn't stop asking why.",
      "The retreat is also the trap. Preparing to live can replace living; ideas become a hiding place from people, practicality, and the body. The world starts to feel intrusive, and the expertise that was meant to enable action becomes a reason to delay it.",
      "Growth means letting knowledge lead back out: sharing before certainty, acting before mastery, connecting before comfort. A Five who engages discovers that the confidence they were stockpiling knowledge to earn was available through contact all along.",
    ],
    levels: [
      L(1, "Healthy", "At their best: visionaries, comprehending the world broadly while seeing into it deeply.", "You see broadly and deeply at once, a visionary grasp that takes in the whole while penetrating to the core."),
      L(2, "Healthy", "Extraordinarily perceptive and insightful observers: mentally alert, endlessly curious.", "You're extraordinarily perceptive and curious, alert to what others overlook and eager to understand it."),
      L(3, "Healthy", "Attain real mastery of whatever fascinates them; knowledge excites them, and they often become genuine experts.", "You reach real mastery of what fascinates you; knowledge energizes you, and you often become a genuine expert."),
      L(4, "Average", "Start conceptualizing and fine-tuning everything before acting, working life out in their heads instead of living it.", "You conceptualize and refine endlessly before acting, working things out in your head rather than living them."),
      L(5, "Average", "Increasingly detached: absorbed in complicated ideas or imagined worlds, drifting from people and practical life.", "You grow detached, absorbed in complex ideas or private worlds, drifting from people and practical life."),
      L(6, "Average", "Antagonistic toward whatever threatens the inner world: provocative, extreme, and cynical.", "You bristle at anything that intrudes on your inner world; provocative, contrarian, and cynical."),
      L(7, "Unhealthy", "Reclusive and cut off from reality: eccentric, nihilistic, unstable, and fearful.", "You're cut off and reclusive, eccentric and fearful, losing your grip on shared reality."),
      L(8, "Unhealthy", "Overwhelmed and frightened by their own darkening ideas.", "You're frightened and overwhelmed by your own darkening thoughts."),
      L(9, "Unhealthy", "Seeking oblivion: a full break with reality becomes possible.", "You seek escape from a reality that has come to feel unbearable."),
    ],
  },
  {
    number: 6,
    name: "The Loyalist",
    need: "The need to be safe",
    fear: "being without support or guidance",
    desire: "to have security and support",
    peak: "steady loyalty that builds trust others can lean on",
    edge: "trusting your own judgment, not just outside authorities",
    url: "https://www.enneagraminstitute.com/type-6/",
    summary: [
      "Sixes are the committed, security-oriented type. Their engine is the need to be safe: a vigilant mind that scans for what could go wrong and for something solid (people, systems, beliefs) to lean on.",
      "At their best, Sixes create value through trust. They are reliable in a way that compounds: loyal to people and causes, honest about risks everyone else is ignoring, and courageous precisely because they know what fear is. They build teams and communities that hold.",
      "Under pressure, vigilance turns on its owner: doubt, second-guessing, worst-case loops, suspicion of the very allies they depend on. Sixes can become a bundle of opposites (defiant and dependent, skeptical and credulous), looking everywhere for certainty except within.",
      "Growth means discovering their own inner authority. A Six who learns that they can handle it, that anxiety is a companion rather than a commander, becomes the steadiest person in any room, because their courage has been tested nightly for years.",
    ],
    levels: [
      L(1, "Healthy", "At their best: self-affirming and genuinely courageous, trusting themselves and others, independent yet deeply connected.", "You trust yourself and others; genuinely courageous, independent yet deeply connected, at peace with uncertainty."),
      L(2, "Healthy", "Warmly engaging and endearing, forming strong bonds and inspiring real affection.", "You're warm and endearing, forming strong bonds and inspiring real affection and trust."),
      L(3, "Healthy", "Devoted and dependable, committed to the people and causes they believe in; natural community builders.", "You're devoted and dependable, committed to people and causes you believe in, a natural builder of community."),
      L(4, "Average", "Invest their energy in whatever promises safety and stability: organizing, structuring, seeking reassurance.", "You pour energy into whatever promises safety: organizing, planning, seeking reassurance and clear ground rules."),
      L(5, "Average", "Push back passive-aggressively against demands: evasive, indecisive, cautious, and ambivalent.", "You push back against pressure indirectly; evasive, cautious, and indecisive, torn between options."),
      L(6, "Average", "Compensate for insecurity with sarcasm and blame: tough talk covering anxious doubt.", "You cover insecurity with tough talk, sarcasm, or blame; anxious doubt hides behind the bravado."),
      L(7, "Unhealthy", "Panicky and volatile, afraid they've ruined their own security, harshly disparaging themselves.", "You're panicky and volatile, sure you've undermined your own safety, and hard on yourself."),
      L(8, "Unhealthy", "Feeling persecuted, they lash out irrationally, bringing about the very things they fear.", "You feel persecuted and lash out, provoking the very outcomes you fear."),
      L(9, "Unhealthy", "Self-punishing and self-destructive; escape through addiction becomes likely.", "You turn self-punishing and self-defeating, prone to escape through addiction."),
    ],
  },
  {
    number: 7,
    name: "The Enthusiast",
    need: "The need to avoid pain",
    fear: "being deprived or trapped in pain",
    desire: "to be happy and fulfilled",
    peak: "joyful synthesis that opens possibility for other people",
    edge: "choosing depth over breadth; letting one thing be enough",
    url: "https://www.enneagraminstitute.com/type-7/",
    summary: [
      "Sevens are the busy, versatile type. Their engine is the need to avoid pain: a quick, hungry mind that stays airborne (planning, anticipating, sampling) so that anxiety and grief can never quite land.",
      "At their best, Sevens create value through possibility. They are energizing synthesizers: fast learners, cross-pollinators, morale engines who spot options nobody saw and remind everyone that the work, and life, can actually be enjoyed.",
      "The pattern's cost is depth. More options, more projects, more stimulation, and satisfaction stays one experience away. Commitment starts to feel like confinement, and the fleeing itself creates the emptiness they're fleeing.",
      "Growth means staying (in the project, the conversation, the feeling) past the moment the escape hatch opens. A Seven who chooses depth discovers what the running never found: 'enough' was here the whole time, and joy gets richer when pain is allowed in the room.",
    ],
    levels: [
      L(1, "Healthy", "At their best: taking experience in deeply: profoundly grateful, appreciative, and joyful.", "You take experience in fully and gratefully, deeply present, appreciative, and genuinely joyful."),
      L(2, "Healthy", "Responsive, excitable, enthusiastic: lively and cheerful, energized by sensation and experience.", "You're lively, excitable, and enthusiastic, energized by sensation, ideas, and new experience."),
      L(3, "Healthy", "Accomplished generalists: multi-talented, practical, productive, often prolific.", "You're a capable generalist: multi-talented, practical, and productive across many interests."),
      L(4, "Average", "Restless for more: more options, more novelty, more experiences: refined consumers of the next thing.", "You're restless for more, options, novelty, stimulation, always eyeing the next thing before finishing this one."),
      L(5, "Average", "Unable to tell what they actually need: hyperactive, unable to say no to themselves, in constant motion.", "You can't quite tell what you actually need; hyperactive and scattered, unable to say no to yourself."),
      L(6, "Average", "Slide into excess: self-centered, materialistic, and greedy, never feeling they have enough.", "You slide toward excess and acquisition, self-centered and hard to satisfy, never quite feeling it's enough."),
      L(7, "Unhealthy", "Impulsive and unrestrained, escaping anxiety through excess that begins to take a real toll.", "You're impulsive and unrestrained, using excess to outrun anxiety as it starts to cost you."),
      L(8, "Unhealthy", "In flight from themselves: acting out, erratic, and out of control.", "You're in flight from yourself, acting out and increasingly erratic."),
      L(9, "Unhealthy", "Energy spent: panic, claustrophobia, and deep despair when the running stops.", "You're spent and cornered: panic and despair set in when the running finally stops."),
    ],
  },
  {
    number: 8,
    name: "The Challenger",
    need: "The need to be against",
    fear: "being controlled or harmed by others",
    desire: "to protect themselves and control their own destiny",
    peak: "protective strength used to empower others",
    edge: "letting restraint and vulnerability in; it commands more than force",
    url: "https://www.enneagraminstitute.com/type-8/",
    summary: [
      "Eights are the powerful, dominating type. Their engine is the need to be against: life taught them early that the world contests your ground, so they claimed theirs: strong, decisive, allergic to being controlled.",
      "At their best, Eights create value through protective strength. They say what others won't, decide when others can't, and shelter the vulnerable with real force. Under a healthy Eight, people grow bold, because someone has their back.",
      "Unchecked, strength becomes weather: intimidation, escalation, adversaries manufactured just to have something to push against. The armor that protects also isolates: vulnerability starts to look like death, and control like the only love that's safe.",
      "Growth is the hardest surrender: letting tenderness in and letting strength serve something bigger than self-protection. An Eight who masters themselves (restraint, mercy, openness) becomes the rarest kind of leader: the strong one it's safe to be weak around.",
    ],
    levels: [
      L(1, "Healthy", "At their best: self-restrained and magnanimous: strength surrendered to something higher; merciful and forbearing.", "Your strength is surrendered to something higher: self-restrained, magnanimous, and merciful, using power to protect and uplift."),
      L(2, "Healthy", "Self-confident and assertive, standing up for what they need and want without apology.", "You're self-confident and assertive, standing up for what you need and want without apology."),
      L(3, "Healthy", "Decisive, authoritative, and commanding: the natural leader others instinctively look to.", "You're decisive and commanding, the natural leader others instinctively look to and follow."),
      L(4, "Average", "Focused on self-sufficiency and resources: enterprising, pragmatic, determined never to depend on anyone.", "You're focused on self-reliance and resources; enterprising and pragmatic, determined never to depend on anyone."),
      L(5, "Average", "Begin dominating the environment and the people in it, wanting everyone behind their efforts.", "You begin dominating your surroundings and the people in them, wanting everyone behind your agenda."),
      L(6, "Average", "Combative and intimidating to get their way, creating adversaries wherever they go.", "You're combative and intimidating to get your way, making adversaries wherever you go."),
      L(7, "Unhealthy", "Defying all control: ruthless and dictatorial: might makes right.", "You defy all limits; ruthless and domineering, acting as if might makes right."),
      L(8, "Unhealthy", "Delusions of invincibility and power take hold.", "You're gripped by a sense of invincibility and untouchable power."),
      L(9, "Unhealthy", "Would rather destroy everything than surrender.", "You would rather bring everything down than yield."),
    ],
  },
  {
    number: 9,
    name: "The Peacemaker",
    need: "The need to avoid",
    fear: "loss, separation, and fragmentation",
    desire: "to have inner stability and peace of mind",
    peak: "steady presence that unifies people and calms conflict",
    edge: "bringing your own agenda into the room instead of merging into others'",
    url: "https://www.enneagraminstitute.com/type-9/",
    summary: [
      "Nines are the easygoing, self-effacing type. Their engine is the need to avoid (conflict, disturbance, separation), which makes them instinctive harmonizers who can feel every side of every argument.",
      "At their best, Nines create value through presence and peace. They calm rooms, reconcile enemies, and hold groups together; people relax around them and hear each other again. It's an unglamorous superpower that every family, team, and community quietly runs on.",
      "The price appears when peace comes from disappearing: going along, numbing out, minimizing real problems, letting their own wants dissolve into everyone else's agenda. A Nine can be in the room for years without fully arriving.",
      "Growth is showing up whole, with their own agenda, their own anger, their own desires, and trusting that conflict survived is intimacy gained. The peace a Nine brings is only as real as the person bringing it; a Nine who is present is peace with a spine.",
    ],
    levels: [
      L(1, "Healthy", "At their best: self-possessed and fulfilled: profound equanimity, because they are truly present to themselves.", "You're fully present to yourself and others; a profound steadiness and equanimity that nothing easily shakes."),
      L(2, "Healthy", "Deeply receptive and accepting: emotionally stable, serene, at ease with themselves and life.", "You're deeply accepting and receptive; emotionally stable, serene, and at ease with yourself and life."),
      L(3, "Healthy", "Optimistic and reassuring: a healing, calming influence that harmonizes groups and brings people together.", "You're a calming, reassuring presence that harmonizes groups and brings people back together."),
      L(4, "Average", "Fear conflict, so they accommodate: idealizing others, going along, saying yes to things they don't actually want.", "You avoid conflict by accommodating: idealizing others, going along, agreeing to things you don't actually want."),
      L(5, "Average", "Present but disengaged: unreflective, unresponsive, complacent, walking away from problems.", "You're present but checked out; unreflective and complacent, tuning out problems rather than engaging them."),
      L(6, "Average", "Minimize problems for peace at any price: stubborn, fatalistic, resigned, as if nothing could be done.", "You keep the peace at any price; stubborn and resigned, minimizing what's wrong as if nothing could change."),
      L(7, "Unhealthy", "Repressed and ineffectual, feeling incapable of facing problems, dissociating from every conflict.", "You feel unable to face problems and dissociate from conflict, going passive and ineffectual."),
      L(8, "Unhealthy", "Blocking out everything that could affect them, numb and barely functioning.", "You're numb and shut down, blocking out anything that could disturb you."),
      L(9, "Unhealthy", "Severely disoriented, abandoning themselves entirely.", "You're severely disoriented, abandoning yourself entirely."),
    ],
  },
];

export function typeByNumber(n: number): EnneagramType | undefined {
  return ENNEAGRAM_TYPES.find((t) => t.number === n);
}
