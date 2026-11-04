const STORAGE_KEY = 'focus-minutes';
const SESSIONS_KEY = 'focus-sessions';
const TICKS = 60;
const CELLS = 20;

const FACE = [
  '....#####....',
  '..##.....##..',
  '.#.........#.',
  '.#.........#.',
  '#...#...#...#',
  '#...#...#...#',
  '#...........#',
  '#...........#',
  '#...........#',
  '.#..#####..#.',
  '.#.........#.',
  '..##.....##..',
  '....#####....',
];
const SMILE_CORNERS = ['', '', '', '', '', '', '', '', '...#.....#...'];
const HEART_OUTLINE = [
  '.##...##.',
  '#..#.#..#',
  '#...#...#',
  '#.......#',
  '.#.....#.',
  '..#...#..',
  '...#.#...',
  '....#....',
];
const HEART_FILL = [
  '',
  '.##...##.',
  '.###.###.',
  '.#######.',
  '..#####..',
  '...###...',
  '....#....',
];

const input = document.querySelector<HTMLInputElement>('#time')!;
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const statusLabel = document.querySelector<HTMLElement>('#status')!;
const ticksGroup = document.querySelector<SVGGElement>('#ticks')!;
const bar = document.querySelector<HTMLElement>('#bar')!;
const faceIcon = document.querySelector<SVGSVGElement>('#face')!;
const heartsBox = document.querySelector<HTMLElement>('#hearts')!;

let duration = Number(localStorage.getItem(STORAGE_KEY) ?? 60) * 60_000;
let remaining = duration;
let endAt: number | null = null;
let done = false;
let interval = 0;
let audio: AudioContext | null = null;
let alarm: OscillatorNode[] = [];

function pixels(rows: string[]) {
  return rows.flatMap((row, y) => [...row].map((cell, x) => (cell === '#' ? `M${x} ${y}h1v1h-1z` : ''))).join('');
}

function tickLine(i: number) {
  const angle = (i / TICKS) * 2 * Math.PI;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const color = `color-mix(in oklch, var(--mint), var(--purple) ${(i / (TICKS - 1)) * 100}%)`;
  return `<line x1="${50 + 40 * sin}" y1="${50 - 40 * cos}" x2="${50 + 47 * sin}" y2="${50 - 47 * cos}" style="--c: ${color}" />`;
}

ticksGroup.innerHTML = Array.from({ length: TICKS }, (_, i) => tickLine(i)).join('');
bar.innerHTML = '<i></i>'.repeat(CELLS);
faceIcon.innerHTML = `<path d="${pixels(FACE)}" /><path class="corners" d="${pixels(SMILE_CORNERS)}" />`;
heartsBox.innerHTML = ['--purple', '--mint', '--yellow']
  .map(
    (color) =>
      `<svg viewBox="0 0 9 8" style="--c: var(${color})"><path class="fill" d="${pixels(HEART_FILL)}" /><path d="${pixels(HEART_OUTLINE)}" /></svg>`,
  )
  .join('');

const ticks = Array.from(ticksGroup.children);
const cells = Array.from(bar.children);
const hearts = Array.from(heartsBox.children);

function today() {
  return new Date().toLocaleDateString('sv');
}

function sessionsToday(): number {
  const saved = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? 'null');
  return saved?.date === today() ? saved.count : 0;
}

function renderHearts() {
  const count = sessionsToday();
  hearts.forEach((heart, i) => heart.classList.toggle('full', i < count));
}

function format(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function render(ms: number) {
  const text = format(ms);
  const elapsed = 1 - ms / duration;
  const running = endAt !== null;
  document.title = text;
  if (document.activeElement !== input) input.value = text;
  ticks.forEach((tick, i) => tick.classList.toggle('on', i < Math.floor(elapsed * TICKS)));
  cells.forEach((cell, i) => cell.classList.toggle('on', i < Math.floor(elapsed * CELLS)));
  statusLabel.textContent = done ? 'DONE!' : running ? 'RUNNING...' : ms < duration ? 'PAUSED' : 'READY...';
  document.body.toggleAttribute('data-running', running);
  document.body.toggleAttribute('data-smile', done || (running && elapsed >= 0.9));
  input.readOnly = running;
}

// The audio clock keeps running when Chrome throttles timers in a hidden window, so the alarm is scheduled at start to ring on time.
function scheduleAlarm(ms: number) {
  const ctx = (audio ??= new AudioContext());
  const at = ctx.currentTime + ms / 1000;
  alarm = [0, 0.4, 0.8].map((offset) => {
    const t = at + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
    return osc;
  });
}

function halt() {
  clearInterval(interval);
  endAt = null;
}

function finish() {
  halt();
  alarm = [];
  done = true;
  remaining = duration;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: today(), count: sessionsToday() + 1 }));
  renderHearts();
  render(remaining);
}

function tick() {
  const left = endAt! - Date.now();
  if (left > 0) render(left);
  else finish();
}

function start() {
  done = false;
  renderHearts();
  endAt = Date.now() + remaining;
  scheduleAlarm(remaining);
  interval = setInterval(tick, 250);
  tick();
}

function stop(nextRemaining: number) {
  halt();
  alarm.forEach((osc) => osc.disconnect());
  alarm = [];
  done = false;
  remaining = nextRemaining;
  render(remaining);
}

function apply() {
  if (input.value === format(remaining)) return;
  const minutes = Number.parseInt(input.value, 10);
  if (!(minutes > 0)) return;
  duration = minutes * 60_000;
  remaining = duration;
  done = false;
  localStorage.setItem(STORAGE_KEY, String(minutes));
}

input.addEventListener('focus', () => {
  if (endAt === null) input.select();
});

input.addEventListener('blur', () => {
  if (endAt !== null) return;
  apply();
  render(remaining);
});

input.addEventListener('keydown', (event) => {
  if (endAt !== null) return;
  if (event.key === 'Enter') {
    input.blur();
    start();
  }
  if (event.key === 'Escape') {
    input.value = format(remaining);
    input.blur();
  }
});

toggle.addEventListener('click', () => {
  if (endAt === null) start();
  else stop(endAt - Date.now());
});

reset.addEventListener('click', () => stop(duration));

renderHearts();
render(remaining);
