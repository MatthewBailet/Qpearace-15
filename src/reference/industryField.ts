export const INDUSTRIES = [
  "Commerce",
  "Finance",
  "Transportation",
  "Manufacturing",
  "Logistics",
  "Energy",
  "Real Estate",
  "Agriculture",
  "Technology",
  "Media",
  "Travel",
  "Infrastructure",
  "Automotive",
  "Telecommunications",
  "Insurance",
  "Healthcare",
] as const;

export const INDUSTRY_HOLD = 4.5;
export const INDUSTRY_BLEND = 0.38;

export function fieldLayout(width: number, height: number) {
  const gap = width < 760 ? 20 : 56;
  const room = width < 760 ? 168 : 0;
  const preferred = Math.min(width, height) * 0.4;
  if (room === 0) return { radius: preferred, gap };
  const capped = (width - 16 - gap - room) / 2;
  return { radius: Math.max(68, Math.min(preferred, capped)), gap };
}

export const NEUTRAL = { r: 184, g: 181, b: 174 };
export const STRUCTURE = { r: 92, g: 89, b: 84 };

type RGB = { r: number; g: number; b: number };

type Contribution = {
  emphasis: number;
  support: number;
  hub: number;
};

export type Look = {
  r: number;
  g: number;
  b: number;
  scale: number;
  alpha: number;
  emphasis: number;
};

type Pattern = {
  principal: RGB;
  support: RGB;
  accent?: RGB;
  frozen: number;
  evaluate: (nx: number, ny: number, time: number) => Contribution;
};

const NONE: Contribution = { emphasis: 0, support: 0, hub: 0 };

function hex(value: string): RGB {
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  };
}

export function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function smooth(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

type Sample = { x: number; y: number; s: number };

function resample(points: Array<[number, number]>, count: number): Sample[] {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    lengths.push(d);
    total += d;
  }
  const samples: Sample[] = [];
  for (let i = 0; i < count; i += 1) {
    const target = (i / (count - 1)) * total;
    let walked = 0;
    for (let s = 0; s < lengths.length; s += 1) {
      if (walked + lengths[s] >= target || s === lengths.length - 1) {
        const span = lengths[s] || 1;
        const t = clamp01((target - walked) / span);
        const a = points[s];
        const b = points[s + 1];
        samples.push({
          x: a[0] + (b[0] - a[0]) * t,
          y: a[1] + (b[1] - a[1]) * t,
          s: i / (count - 1),
        });
        break;
      }
      walked += lengths[s];
    }
  }
  return samples;
}

function polarLattice() {
  const dots: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  for (let ring = 1; ring <= 9; ring += 1) {
    const count = ring * 6;
    const r = ring / 9;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      dots.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
  }
  return dots;
}

const LATTICE = polarLattice();

function snapChain(points: Array<[number, number]>, count: number): Sample[] {
  const samples = resample(points, count);
  const used = new Set<number>();
  const chain: Sample[] = [];
  let current = -1;
  for (const sample of samples) {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < LATTICE.length; i += 1) {
      if (used.has(i)) continue;
      const dot = LATTICE[i];
      if (current >= 0) {
        const step = Math.hypot(dot.x - LATTICE[current].x, dot.y - LATTICE[current].y);
        if (step > 0.18) continue;
      }
      const d = (dot.x - sample.x) ** 2 + (dot.y - sample.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) continue;
    if (current >= 0 && best === current) continue;
    used.add(best);
    current = best;
    chain.push({ x: LATTICE[best].x, y: LATTICE[best].y, s: sample.s });
  }
  return chain;
}

function chainHit(chain: Sample[], nx: number, ny: number, width: number) {
  if (!chain.length) return { dist: 1, s: 0, x: 0, y: 0, emphasis: 0 };
  const hit = nearest(chain, nx, ny);
  return { ...hit, emphasis: Math.exp(-((hit.dist / width) ** 2)) };
}

function nearest(samples: Sample[], x: number, y: number) {
  let best = Infinity;
  let s = 0;
  let px = samples[0].x;
  let py = samples[0].y;
  for (const point of samples) {
    const d = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (d < best) {
      best = d;
      s = point.s;
      px = point.x;
      py = point.y;
    }
  }
  return { dist: Math.sqrt(best), s, x: px, y: py };
}

function gauss(distance: number, radius: number) {
  const x = distance / Math.max(radius, 0.0001);
  return Math.exp(-(x * x));
}

function prefer(current: Contribution, next: Contribution): Contribution {
  if (next.emphasis > current.emphasis) {
    return { emphasis: next.emphasis, support: next.support, hub: Math.max(current.hub, next.hub) };
  }
  return { ...current, hub: Math.max(current.hub, next.hub) };
}

function pathHead(time: number, speed: number, phase: number) {
  const head = (time * speed + phase) % 1;
  const edge = Math.min(smooth(head / 0.08), smooth((1 - head) / 0.1));
  return { head, edge };
}

function trail(samples: Sample[], nx: number, ny: number, head: number, width: number, length: number) {
  const hit = nearest(samples, nx, ny);
  const behind = head - hit.s;
  let along = 0;
  if (behind >= -0.025 && behind < length) {
    const t = behind < 0 ? behind / 0.025 : behind / length;
    along = Math.exp(-(t * t));
  }
  const across = Math.exp(-((hit.dist / width) ** 2));
  return { emphasis: across * along, across, s: hit.s, dist: hit.dist };
}

function swell(head: number) {
  if (head < 0.72) return 0.46;
  return 0.46 + 0.54 * Math.sin(clamp01((head - 0.72) / 0.28) * Math.PI);
}

const COMMERCE_MARKETS = [
  { x: 0.08, y: -0.08, sx: 0.58, sy: -0.62, phase: 0, r: 0.18 },
  { x: -0.4, y: 0.18, sx: -0.78, sy: 0.55, phase: 0.34, r: 0.16 },
  { x: 0.38, y: 0.3, sx: 0.74, sy: 0.66, phase: 0.67, r: 0.15 },
];

function commerce(nx: number, ny: number, time: number): Contribution {
  let best = NONE;
  for (const market of COMMERCE_MARKETS) {
    const { head, edge } = pathHead(time, 0.32, market.phase);
    const px = market.sx + (market.x - market.sx) * head;
    const py = market.sy + (market.y - market.sy) * head;
    const pulse = gauss(Math.hypot(nx - px, ny - py), 0.1) * edge;
    const grown = gauss(Math.hypot(nx - market.x, ny - market.y), market.r) * swell(head);
    const hub = Math.hypot(nx - market.x, ny - market.y) < 0.055 && swell(head) > 0.72 ? 1 : 0;
    best = prefer(best, { emphasis: pulse, support: 1, hub: 0 });
    best = prefer(best, { emphasis: grown, support: 0, hub });
  }
  return best;
}

const LOGISTICS_ROUTES = [
  resample([[-0.62, 0.34], [-0.16, 0.08], [0.24, -0.1], [0.66, -0.36]], 48),
  resample([[-0.58, -0.32], [-0.12, -0.04], [0.3, 0.16], [0.64, 0.4]], 48),
  resample([[-0.08, 0.66], [0.04, 0.16], [0.16, -0.28], [0.28, -0.62]], 40),
];

function logistics(nx: number, ny: number, time: number): Contribution {
  let best = NONE;
  LOGISTICS_ROUTES.forEach((route, index) => {
    const { head, edge } = pathHead(time, 0.24, index * 0.31);
    const moving = trail(route, nx, ny, head, 0.11, 0.2);
    const spine = moving.across * 0.46;
    const emphasis = Math.min(1, spine + moving.emphasis * edge);
    const atHub = (moving.s < 0.1 || moving.s > 0.9) && moving.dist < 0.09 && edge > 0.55 && moving.emphasis > 0.45;
    best = prefer(best, { emphasis, support: index === 2 ? 1 : 0, hub: atHub ? 1 : 0 });
  });
  return best;
}

const STAGE_X = [-0.28, 0, 0.28];

function manufacturing(nx: number, ny: number, time: number): Contribution {
  const period = 1.25;
  const stage = Math.floor(time / period) % 3;
  const local = (time / period) % 1;
  const env = local < 0.18 ? smooth(local / 0.18) : local < 0.58 ? 1 : 1 - smooth((local - 0.58) / 0.42);
  const active = gauss(Math.abs(nx - STAGE_X[stage]), 0.15) * env;
  const next = gauss(Math.abs(nx - STAGE_X[(stage + 1) % 3]), 0.15) * (1 - env) * 0.55;
  if (next > active) return { emphasis: next, support: 1, hub: 0 };
  return { emphasis: active, support: 0, hub: 0 };
}

const FINANCE_GREEN = snapChain(
  [
    [-0.5, 0.22],
    [-0.28, 0.1],
    [-0.06, -0.02],
    [0.16, -0.16],
    [0.34, -0.28],
    [0.5, -0.4],
  ],
  28,
);

const FINANCE_RED = snapChain(
  [
    [-0.48, 0.34],
    [-0.26, 0.26],
    [-0.04, 0.2],
    [0.18, 0.16],
    [0.36, 0.2],
    [0.5, 0.28],
  ],
  26,
);

let financePeakAt = -1;
let financePeak: Sample[] = [];

function finance(nx: number, ny: number, time: number): Contribution {
  const green = chainHit(FINANCE_GREEN, nx, ny, 0.038);
  const red = chainHit(FINANCE_RED, nx, ny, 0.038);
  const peakIndex = Math.round(clamp01(0.55 + 0.38 * Math.sin(time * 0.55)) * (FINANCE_GREEN.length - 1));
  if (financePeakAt !== peakIndex) {
    financePeakAt = peakIndex;
    financePeak = FINANCE_GREEN.slice(Math.max(0, peakIndex - 1), Math.min(FINANCE_GREEN.length, peakIndex + 3));
  }
  const orange = chainHit(financePeak, nx, ny, 0.04);
  let best: Contribution = { emphasis: green.emphasis * 0.92, support: 0, hub: 0 };
  best = prefer(best, { emphasis: red.emphasis * 0.9, support: 1, hub: 0 });
  return prefer(best, {
    emphasis: orange.emphasis,
    support: 2,
    hub: orange.emphasis > 0.78 ? 0.7 : 0,
  });
}

const ENERGY_BRANCHES = [
  resample([[0, 0], [-0.22, 0.18], [-0.55, 0.38]], 28),
  resample([[0, 0], [0.2, 0.08], [0.52, 0.28]], 28),
  resample([[0, 0], [0.08, -0.22], [0.16, -0.58]], 28),
  resample([[0, 0], [-0.24, -0.12], [-0.58, -0.28]], 28),
];

function energy(nx: number, ny: number, time: number): Contribution {
  let best = { emphasis: gauss(Math.hypot(nx, ny), 0.08) * 0.45, support: 0, hub: Math.hypot(nx, ny) < 0.05 ? 0.4 : 0 };
  ENERGY_BRANCHES.forEach((branch, index) => {
    const { head, edge } = pathHead(time, 0.28, index * 0.22);
    const moving = trail(branch, nx, ny, head, 0.09, 0.16);
    best = prefer(best, { emphasis: moving.emphasis * edge + moving.across * 0.4, support: 0, hub: 0 });
    const end = branch[branch.length - 1];
    const arrived = swell(head);
    const cluster = gauss(Math.hypot(nx - end.x, ny - end.y), 0.14) * arrived;
    const hub = Math.hypot(nx - end.x, ny - end.y) < 0.05 && arrived > 0.7 ? 1 : 0;
    best = prefer(best, { emphasis: cluster, support: 1, hub });
  });
  return best;
}

const DISTRICTS = [
  { x: -0.34, y: -0.16, r: 0.18 },
  { x: 0.2, y: -0.24, r: 0.22 },
  { x: 0.36, y: 0.22, r: 0.15 },
  { x: -0.14, y: 0.34, r: 0.17 },
];

function realEstate(nx: number, ny: number, time: number): Contribution {
  const dwell = 2.6;
  const active = Math.floor(time / dwell) % DISTRICTS.length;
  const local = (time / dwell) % 1;
  const prominence = 0.34 + 0.66 * Math.sin(local * Math.PI);
  let best = NONE;
  DISTRICTS.forEach((district, index) => {
    const focus = index === active;
    const radius = district.r * (focus ? 1 + prominence * 0.18 : 1);
    const emphasis = gauss(Math.hypot(nx - district.x, ny - district.y), radius) * (focus ? 0.55 + prominence * 0.45 : 0.58);
    best = prefer(best, { emphasis, support: focus ? 0 : 1, hub: focus && emphasis > 0.8 ? 0.7 : 0 });
  });
  return best;
}

function agriculture(nx: number, ny: number, time: number): Contribution {
  const axis = (nx + ny) * 0.7071;
  const sweep = ((time * 0.14) % 1.15) - 0.55;
  const delta = axis - sweep;
  const body = gauss(Math.abs(delta), 0.18);
  const lead = delta > 0 ? gauss(delta, 0.07) : 0;
  if (lead > body * 0.85 && lead > 0.2) return { emphasis: lead, support: 1, hub: 0 };
  return { emphasis: body, support: 0, hub: 0 };
}

const TECH_SITES = [
  {
    origin: { x: -0.28, y: 0.06, r: 0.15 },
    pair: [
      { x: -0.08, y: 0.24, r: 0.12 },
      { x: -0.46, y: -0.1, r: 0.12 },
    ],
    leaves: [
      { x: 0.02, y: 0.02, r: 0.09 },
      { x: -0.16, y: 0.36, r: 0.085 },
      { x: -0.52, y: 0.08, r: 0.085 },
      { x: -0.22, y: -0.2, r: 0.09 },
    ],
  },
  {
    origin: { x: 0.26, y: -0.08, r: 0.15 },
    pair: [
      { x: 0.46, y: 0.1, r: 0.12 },
      { x: 0.08, y: -0.26, r: 0.12 },
    ],
    leaves: [
      { x: 0.56, y: -0.16, r: 0.09 },
      { x: 0.38, y: 0.26, r: 0.085 },
      { x: -0.02, y: -0.12, r: 0.09 },
      { x: 0.16, y: -0.4, r: 0.085 },
    ],
  },
];

function technology(nx: number, ny: number, time: number): Contribution {
  const cycle = 5.4;
  const site = TECH_SITES[Math.floor(time / cycle) % TECH_SITES.length];
  const local = time % cycle;
  const fade = local > 4.35 ? 1 - smooth((local - 4.35) / 0.85) : 1;
  let best = NONE;
  const originEnv = local < 1.15 ? smooth(local / 0.28) : 0.72;
  best = prefer(best, {
    emphasis: gauss(Math.hypot(nx - site.origin.x, ny - site.origin.y), site.origin.r) * originEnv * fade,
    support: 0,
    hub: 0,
  });
  const pairEnv = local < 1.05 ? 0 : smooth(Math.min(1, (local - 1.05) / 0.4));
  for (const node of site.pair) {
    best = prefer(best, {
      emphasis: gauss(Math.hypot(nx - node.x, ny - node.y), node.r) * pairEnv * fade,
      support: 1,
      hub: 0,
    });
  }
  const leafEnv = local < 2.35 ? 0 : smooth((local - 2.35) / 0.35) * (local < 4.2 ? 1 : fade);
  for (const node of site.leaves) {
    best = prefer(best, {
      emphasis: gauss(Math.hypot(nx - node.x, ny - node.y), node.r) * leafEnv,
      support: 1,
      hub: 0,
    });
  }
  return best;
}

function ring(ox: number, oy: number, nx: number, ny: number, time: number, speed: number, phase: number, width: number) {
  const cycle = (time * speed + phase) % 1;
  const radius = 0.08 + cycle * 0.82;
  const fade = smooth(cycle / 0.08) * (1 - smooth((cycle - 0.78) / 0.22));
  return gauss(Math.abs(Math.hypot(nx - ox, ny - oy) - radius), width) * fade;
}

function media(nx: number, ny: number, time: number): Contribution {
  const a = ring(-0.22, 0.1, nx, ny, time, 0.22, 0, 0.045);
  const b = ring(0.26, -0.12, nx, ny, time, 0.22, 0.5, 0.045);
  const hub = a > 0.45 && b > 0.45 ? 1 : 0;
  if (b > a) return { emphasis: b, support: 1, hub };
  return { emphasis: a, support: 0, hub };
}

const TRAVEL_ARCS = [
  resample([[-0.7, 0.22], [-0.28, 0.42], [0.22, 0.18], [0.62, -0.16]], 48),
  resample([[-0.55, -0.42], [-0.05, -0.12], [0.28, 0.22], [0.58, 0.48]], 48),
];

function travel(nx: number, ny: number, time: number): Contribution {
  let best = NONE;
  TRAVEL_ARCS.forEach((arc, index) => {
    const { head, edge } = pathHead(time, 0.22, index * 0.48);
    const moving = trail(arc, nx, ny, head, 0.11, 0.2);
    const end = arc[arc.length - 1];
    const arrived = swell(head);
    const destination = gauss(Math.hypot(nx - end.x, ny - end.y), 0.12) * arrived;
    best = prefer(best, { emphasis: moving.emphasis * edge + moving.across * 0.36, support: index, hub: 0 });
    best = prefer(best, {
      emphasis: destination,
      support: index,
      hub: Math.hypot(nx - end.x, ny - end.y) < 0.05 && arrived > 0.7 ? 1 : 0,
    });
  });
  return best;
}

const NETWORK = [
  resample([[-0.62, 0.08], [-0.18, 0.22], [0.22, 0.08], [0.62, 0.24]], 36),
  resample([[-0.62, 0.08], [-0.2, -0.18], [0.16, -0.08], [0.6, -0.28]], 36),
  resample([[-0.18, 0.22], [-0.2, -0.18], [-0.08, -0.55]], 28),
  resample([[0.22, 0.08], [0.16, -0.08], [0.34, -0.48]], 28),
];

function infrastructure(nx: number, ny: number, time: number): Contribution {
  let best = NONE;
  NETWORK.forEach((segment, index) => {
    const hit = nearest(segment, nx, ny);
    const across = Math.exp(-((hit.dist / 0.055) ** 2));
    const { head, edge } = pathHead(time, 0.12, index * 0.08);
    const moving = trail(segment, nx, ny, head, 0.06, 0.12);
    const junction = hit.s < 0.08 || hit.s > 0.92;
    const emphasis = Math.min(1, across * (junction ? 0.62 : 0.4) + moving.emphasis * edge);
    best = prefer(best, { emphasis, support: index > 1 ? 1 : 0, hub: 0 });
  });
  return best;
}

const LANES = [
  resample([[-0.72, 0.08], [-0.2, 0.28], [0.28, 0.12], [0.7, -0.08]], 48),
  resample([[-0.72, -0.16], [-0.2, 0.04], [0.28, -0.12], [0.7, -0.32]], 48),
];

function automotive(nx: number, ny: number, time: number): Contribution {
  let best = NONE;
  LANES.forEach((lane, laneIndex) => {
    for (let i = 0; i < 3; i += 1) {
      const { head, edge } = pathHead(time, 0.2, i / 3 + laneIndex * 0.06);
      const moving = trail(lane, nx, ny, head, 0.055, 0.1);
      best = prefer(best, {
        emphasis: moving.emphasis * edge + moving.across * 0.16,
        support: laneIndex,
        hub: 0,
      });
    }
  });
  return best;
}

const TRANSMITTERS = [
  { x: -0.28, y: 0.12, phase: 0 },
  { x: 0.3, y: -0.08, phase: 0.33 },
  { x: 0.02, y: 0.34, phase: 0.66 },
];

function telecommunications(nx: number, ny: number, time: number): Contribution {
  let best = NONE;
  TRANSMITTERS.forEach((tower, index) => {
    const emphasis = ring(tower.x, tower.y, nx, ny, time, 0.2, tower.phase, 0.042);
    const core = gauss(Math.hypot(nx - tower.x, ny - tower.y), 0.06) * 0.55;
    best = prefer(best, { emphasis: Math.max(emphasis, core), support: index === 0 ? 0 : 1, hub: core > 0.5 ? 0.5 : 0 });
  });
  return best;
}

const COVERED = [
  { x: -0.32, y: 0.14 },
  { x: 0.22, y: -0.22 },
  { x: 0.06, y: 0.34 },
  { x: -0.12, y: -0.3 },
];

function insurance(nx: number, ny: number, time: number): Contribution {
  const dwell = 1.7;
  const index = Math.floor(time / dwell) % COVERED.length;
  const local = (time / dwell) % 1;
  const env = Math.sin(clamp01(local) * Math.PI);
  const point = COVERED[index];
  const dist = Math.hypot(nx - point.x, ny - point.y);
  const core = gauss(dist, 0.045) * env;
  const halo = gauss(dist, 0.26) * env * 0.9;
  if (dist < 0.06) return { emphasis: Math.max(core, halo), support: 0, hub: env > 0.65 ? 1 : 0 };
  return { emphasis: halo, support: 1, hub: 0 };
}

const CARE_PATHS = [
  resample([[-0.55, 0.05], [-0.12, 0.12], [0.18, 0.02], [0.52, 0.22]], 36),
  resample([[-0.12, 0.12], [0.08, 0.32], [0.28, 0.5]], 24),
  resample([[0.18, 0.02], [0.22, -0.24], [0.16, -0.5]], 24),
];

function healthcare(nx: number, ny: number, time: number): Contribution {
  let best = NONE;
  CARE_PATHS.forEach((path, index) => {
    const { head, edge } = pathHead(time, 0.14, 0);
    const moving = trail(path, nx, ny, head, 0.1, 0.18);
    best = prefer(best, { emphasis: moving.emphasis * edge + moving.across * 0.34, support: 0, hub: 0 });
    const end = path[path.length - 1];
    const arrived = index === 0 ? swell(head) : swell(Math.max(0, head - 0.35));
    const cluster = gauss(Math.hypot(nx - end.x, ny - end.y), 0.13) * arrived;
    best = prefer(best, { emphasis: cluster, support: 1, hub: 0 });
  });
  return best;
}

const TRANSPORT_ROUTE = resample([[-0.68, -0.2], [-0.2, 0.05], [0.22, -0.02], [0.68, 0.22]], 48);

function transportation(nx: number, ny: number, time: number): Contribution {
  let best = NONE;
  for (let i = 0; i < 2; i += 1) {
    const { head, edge } = pathHead(time, 0.22, i * 0.5);
    const moving = trail(TRANSPORT_ROUTE, nx, ny, head, 0.1, 0.16);
    best = prefer(best, { emphasis: moving.emphasis * edge + moving.across * 0.4, support: i, hub: 0 });
  }
  return best;
}

const PATTERNS: Record<string, Pattern> = {
  Commerce: { principal: hex("#B9654D"), support: hex("#BD944F"), frozen: 2.7, evaluate: commerce },
  Logistics: { principal: hex("#397C80"), support: hex("#668CA5"), frozen: 1.4, evaluate: logistics },
  Manufacturing: { principal: hex("#597B96"), support: hex("#A58A60"), frozen: 0.7, evaluate: manufacturing },
  Finance: {
    principal: hex("#5B8C62"),
    support: hex("#B0584C"),
    accent: hex("#C67F38"),
    frozen: 1.8,
    evaluate: finance,
  },
  Energy: { principal: hex("#B18A39"), support: hex("#B96E46"), frozen: 2.4, evaluate: energy },
  "Real Estate": { principal: hex("#AC7561"), support: hex("#958975"), frozen: 1.3, evaluate: realEstate },
  Agriculture: { principal: hex("#738650"), support: hex("#B39B56"), frozen: 2.2, evaluate: agriculture },
  Technology: { principal: hex("#7467A0"), support: hex("#648EA7"), frozen: 3.1, evaluate: technology },
  Media: { principal: hex("#956D91"), support: hex("#B47E86"), frozen: 1.6, evaluate: media },
  Travel: { principal: hex("#4F8D9E"), support: hex("#B59C70"), frozen: 3.2, evaluate: travel },
  Infrastructure: { principal: hex("#657E8D"), support: hex("#A58D68"), frozen: 2.1, evaluate: infrastructure },
  Automotive: { principal: hex("#497D86"), support: hex("#B07857"), frozen: 1.1, evaluate: automotive },
  Telecommunications: { principal: hex("#7978AA"), support: hex("#6191A8"), frozen: 1.8, evaluate: telecommunications },
  Insurance: { principal: hex("#729488"), support: hex("#73869C"), frozen: 0.85, evaluate: insurance },
  Healthcare: { principal: hex("#568F88"), support: hex("#A78396"), frozen: 4.2, evaluate: healthcare },
  Transportation: { principal: hex("#5E7380"), support: hex("#A48462"), frozen: 1.5, evaluate: transportation },
};

const NEUTRAL_PATTERN: Pattern = {
  principal: NEUTRAL,
  support: NEUTRAL,
  frozen: 0,
  evaluate: () => NONE,
};

function patternFor(name: string) {
  return PATTERNS[name] ?? NEUTRAL_PATTERN;
}

function writeWeighted(
  pattern: Pattern,
  nx: number,
  ny: number,
  time: number,
  weight: number,
  structural: boolean,
  out: Look,
) {
  const signal = pattern.evaluate(nx, ny, time);
  const emphasis = clamp01(signal.emphasis * weight);
  const hub = clamp01(signal.hub * weight);
  const accent =
    signal.support > 1.5
      ? (pattern.accent ?? pattern.support)
      : signal.support > 0.5
        ? pattern.support
        : pattern.principal;
  const gain = structural ? Math.min(1, emphasis / 0.5) : emphasis ** 0.82;
  const color = mix(structural ? STRUCTURE : NEUTRAL, accent, gain);
  let scale = 1 + emphasis * 0.9;
  if (hub > 0.62) scale = Math.min(2.2, 1.5 + hub * 0.7);
  out.r = color.r;
  out.g = color.g;
  out.b = color.b;
  out.scale = scale;
  out.alpha = (structural ? 0.94 : 0.88) + emphasis * 0.12;
  out.emphasis = emphasis;
}

const lookA: Look = { r: 0, g: 0, b: 0, scale: 1, alpha: 1, emphasis: 0 };
const lookB: Look = { r: 0, g: 0, b: 0, scale: 1, alpha: 1, emphasis: 0 };

export function blendWeights(linear: number) {
  const u = smooth(linear);
  return {
    outW: 1 - smooth(clamp01(u / 0.72)),
    inW: smooth(clamp01((u - 0.28) / 0.72)),
  };
}

export function composeDot(
  from: string,
  to: string | null,
  linearBlend: number,
  time: number,
  reduced: boolean,
  nx: number,
  ny: number,
  structural: boolean,
  out: Look,
) {
  const source = patternFor(from);
  const target = to ? patternFor(to) : null;
  const weights = target ? blendWeights(linearBlend) : { outW: 1, inW: 0 };
  if (!source) {
    out.r = structural ? STRUCTURE.r : NEUTRAL.r;
    out.g = structural ? STRUCTURE.g : NEUTRAL.g;
    out.b = structural ? STRUCTURE.b : NEUTRAL.b;
    out.scale = 1;
    out.alpha = structural ? 0.94 : 0.88;
    out.emphasis = 0;
    return;
  }
  const fromTime = reduced ? source.frozen : time;
  writeWeighted(source, nx, ny, fromTime, weights.outW, structural, lookA);
  if (!target || weights.inW <= 0) {
    out.r = lookA.r;
    out.g = lookA.g;
    out.b = lookA.b;
    out.scale = lookA.scale;
    out.alpha = lookA.alpha;
    out.emphasis = lookA.emphasis;
    return;
  }
  const toTime = reduced ? target.frozen : time;
  writeWeighted(target, nx, ny, toTime, weights.inW, structural, lookB);
  const sum = lookA.emphasis + lookB.emphasis;
  const mixTo = sum < 1e-4 ? 0 : lookB.emphasis / sum;
  out.r = lookA.r + (lookB.r - lookA.r) * mixTo;
  out.g = lookA.g + (lookB.g - lookA.g) * mixTo;
  out.b = lookA.b + (lookB.b - lookA.b) * mixTo;
  out.scale = Math.min(2.2, 1 + (lookA.scale - 1) + (lookB.scale - 1));
  out.alpha = Math.min(1, Math.max(lookA.alpha, lookB.alpha));
  out.emphasis = Math.min(1, sum);
}
