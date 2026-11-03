/* Buddy To-Do — tasks, Google Calendar, and a little friend who reminds you. */
(() => {
  'use strict';

  const CONFIG = window.BUDDY_CONFIG || {};
  const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' ');
  const BUDDY_COLORS = { brown: '#c08a5e', caramel: '#dba26c', chocolate: '#8a5a3c', gray: '#a89f9a', cream: '#ead2ae', pink: '#f2b3bf' };
  const PALETTE = ['#ff8fb1', '#ff9f8a', '#ffbe85', '#f5d76e', '#6fcf9f', '#5cc6c0', '#7cb8f0', '#b39ae8', '#e29be0', '#b0a3b5'];
  // Hand-drawn style outline icons (24x24, drawn with the current text color).
  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    sunset: '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 10V3M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M9 6l3-3 3 3"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    calendarCheck: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 10h18M9 15.5l2 2 4-4"/>',
    list: '<path d="M11 6h10M11 12h10M11 18h10"/><path d="m3 6 1.5 1.5L7.5 4.5M3 12l1.5 1.5 3-3M3 18l1.5 1.5 3-3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flame: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-2.2 1.9-3 3.9-2 6 .5 1 1 1.6 1 3a2.5 2.5 0 0 1-5 0c-.6.7-1 1.9-1 3a7 7 0 0 0 7 7Z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    sprout: '<path d="M7 21h10M12 21v-9"/><path d="M12 12C12 8 9 6 5 6c0 4 3 6 7 6ZM12 10c0-3 2-5 6-5 0 3-2 5-6 5Z"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5"/>',
    heart: '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3.2A4.8 4.8 0 0 1 21 11c-2 4.6-9 9-9 9Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.8-3.5L3 10M3 4v6h6M4 13a8 8 0 0 0 14.8 3.5L21 14M21 20v-6h-6"/>',
    chevronLeft: '<path d="m15 5-7 7 7 7"/>',
    chevronRight: '<path d="m9 5 7 7-7 7"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 16l.6 1.6 1.6.6-1.6.6L19 20.4l-.6-1.6-1.6-.6 1.6-.6Z"/>',
    bubble: '<circle cx="12" cy="12" r="8"/><path d="M8.5 9.5a4 4 0 0 1 3-2.5"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v15H6.5A2.5 2.5 0 0 0 4 20.5 2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h14V9.5M10 20v-5.5h4V20"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    bath: '<path d="M3 12h18v1.5A5.5 5.5 0 0 1 15.5 19h-7A5.5 5.5 0 0 1 3 13.5Z"/><path d="M6 12V6.5a2.5 2.5 0 0 1 5 0M7 19l-1 2M17 19l1 2"/>',
    bag: '<path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.4-5A8.5 8.5 0 1 1 21 11.5Z"/>',
    gamepad: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4"/><path d="M15.5 11.5h.01M18 13.5h.01" stroke-width="3"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    paw: '<circle cx="6.5" cy="10" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="14" cy="5.5" r="2"/><circle cx="17.5" cy="10" r="2"/><path d="M8 18c0-3 2-5.5 4-5.5s4 2.5 4 5.5a2.3 2.3 0 0 1-4 1.5A2.3 2.3 0 0 1 8 18Z"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z"/><path d="M7.5 11h.01M10 7h.01M15 7.5h.01" stroke-width="3"/>',
    coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 10.5h1a2.5 2.5 0 0 1 0 5h-1M8 3v3M12 3v3"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12.5h12L22 7H6"/>',
    shell: '<path d="M12 20c-5 0-8.5-3-8.5-7.5C3.5 7.5 7.5 4 12 4s8.5 3.5 8.5 8.5C20.5 17 17 20 12 20Z"/><path d="M12 20V7M8 19 6.5 9M16 19l1.5-10"/>',
    plane: '<path d="M21 3 3 10.5l7 2.5 2.5 7Z"/><path d="m10 13 4-4"/>',
    wave: '<path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  };
  const CATEGORY_ICON_CHOICES = ['book', 'briefcase', 'home', 'dumbbell', 'bath', 'bag', 'chat', 'gamepad', 'music', 'paw',
    'palette', 'coffee', 'cart', 'shell', 'plane', 'sparkle', 'heart', 'star', 'sprout', 'wave'];

  function icon(name, cls) {
    const s = document.createElement('span');
    s.className = 'ic' + (cls ? ' ' + cls : '');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || ICONS.star) + '</svg>';
    return s;
  }

  const CATEGORY_VERSION = 3; // bump when DEFAULT_CATEGORIES changes in a way old saves should pick up
  const DEFAULT_CATEGORIES = [
    { id: 'school', name: 'School', icon: 'book', color: '#b39ae8' },
    { id: 'work', name: 'Work', icon: 'briefcase', color: '#7cb8f0' },
    { id: 'chores', name: 'Chores', icon: 'home', color: '#ffbe85' },
    { id: 'health', name: 'Health', icon: 'dumbbell', color: '#6fcf9f' },
    { id: 'selfcare', name: 'Self-care', icon: 'bath', color: '#e29be0' },
    { id: 'errands', name: 'Errands', icon: 'bag', color: '#f5d76e' },
    { id: 'social', name: 'Social', icon: 'chat', color: '#ff9f8a' },
    { id: 'fun', name: 'Fun', icon: 'gamepad', color: '#ff8fb1' },
  ];
  // Words that make Pebble auto-pick a built-in category. Words match the start of a word,
  // so "clean" also catches "cleaning". Longer phrases win over short ones.
  const CATEGORY_KEYWORDS = {
    school: ['homework', 'hw', 'essay', 'study', 'exam', 'test', 'quiz', 'class', 'lecture', 'assignment', 'project',
      'paper', 'reading', 'notes', 'professor', 'teacher', 'school', 'college', 'lab', 'midterm', 'final', 'tutor',
      'syllabus', 'chapter', 'math', 'history', 'english', 'science', 'bio', 'chem', 'physics', 'canvas', 'flashcard'],
    work: ['work', 'shift', 'meeting', 'email', 'boss', 'client', 'report', 'deadline', 'presentation', 'interview',
      'resume', 'slack', 'call with', 'zoom', 'office', 'invoice', 'timesheet', 'manager', 'coworker', 'job', 'standup'],
    chores: ['clean', 'laundry', 'dishes', 'vacuum', 'sweep', 'mop', 'trash', 'garbage', 'recycling', 'cook', 'dinner',
      'lunch', 'breakfast', 'meal prep', 'tidy', 'organize', 'make bed', 'bathroom', 'kitchen', 'fold', 'iron',
      'water the plants', 'plants', 'feed', 'dog', 'cat', 'pet', 'walk the dog', 'litter', 'fridge', 'chore', 'declutter'],
    health: ['gym', 'workout', 'run', 'walk', 'yoga', 'exercise', 'doctor', 'dentist', 'appointment', 'therapy',
      'therapist', 'meds', 'medicine', 'pills', 'vitamins', 'pharmacy', 'prescription', 'drink water', 'sleep', 'stretch',
      'physio', 'checkup', 'hospital', 'cardio', 'lift', 'pilates', 'swim'],
    selfcare: ['skincare', 'face mask', 'nails', 'hair', 'haircut', 'shower', 'bath', 'meditate', 'journal', 'relax',
      'nap', 'self care', 'self-care', 'read a book', 'rest', 'mental health', 'spa', 'massage', 'me time', 'affirmation'],
    errands: ['grocery', 'groceries', 'store', 'shop', 'buy', 'pick up', 'pickup', 'drop off', 'return', 'post office',
      'mail', 'package', 'bank', 'bill', 'pay', 'rent', 'gas', 'car wash', 'oil change', 'target', 'walmart', 'costco',
      'amazon', 'order', 'renew', 'dmv', 'errand'],
    social: ['call', 'text', 'mom', 'dad', 'family', 'friend', 'birthday', 'party', 'date', 'hang out', 'dinner with',
      'lunch with', 'brunch', 'coffee with', 'visit', 'grandma', 'grandpa', 'sister', 'brother', 'wedding', 'gift',
      'card', 'facetime', 'reply to'],
    fun: ['game', 'movie', 'show', 'netflix', 'music', 'concert', 'guitar', 'piano', 'paint', 'draw', 'craft', 'crochet',
      'knit', 'bake', 'hobby', 'book', 'anime', 'trip', 'vacation', 'beach', 'hike', 'play', 'fun', 'photo', 'sing'],
  };
  const PRIORITIES = {
    high: { label: 'High', icon: 'flame', rank: 0 },
    medium: { label: 'Medium', icon: 'star', rank: 1 },
    low: { label: 'Low', icon: 'sprout', rank: 2 },
  };

  // ---------- storage ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
    },
  };

  // ---------- dates ----------
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
  const todayKey = () => dateKey(new Date());
  const fmtTime = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const taskDue = (t) => { const d = parseKey(t.date); const [h, m] = t.time.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
  const shortDay = (k) => parseKey(k).toLocaleDateString([], { weekday: 'short' });

  // ---------- state ----------
  const state = {
    tasks: store.get('tasks', []),
    settings: Object.assign(
      {
        buddyName: 'Pebble', buddyColor: 'brown', remindBefore: 10, googleConnected: false,
        categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
        categoryVersion: CATEGORY_VERSION,
      },
      store.get('settings', {})
    ),
    notified: store.get('notified', {}),
    events: store.get('eventCache', {}), // dateKey -> [event]
    calStatus: 'idle', // idle | loading | ok | error
    viewDate: todayKey(),
    moodOverride: null,
    editingId: null,
    filter: null, // category id shown in the to-do list, or null for all
    pick: { category: null, priority: 'medium' }, // choices in the task sheet
    openColorFor: null, // category whose color palette is open in settings
    openIconFor: null, // category whose icon picker is open in settings
  };
  const saveTasks = () => store.set('tasks', state.tasks);
  const saveSettings = () => store.set('settings', state.settings);
  const savedSettings = store.get('settings', {});
  if (savedSettings.categories && (savedSettings.categoryVersion || 1) < CATEGORY_VERSION) {
    const version = savedSettings.categoryVersion || 1;
    if (version < 2) {
      // The first starter set was different; keep any custom categories and add the new built-ins.
      const oldDefaults = ['school', 'work', 'home', 'health', 'fun', 'errands'];
      const custom = state.settings.categories.filter((c) => !oldDefaults.includes(c.id));
      state.settings.categories = [...JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)), ...custom];
      for (const t of state.tasks) if (t.category === 'home') t.category = 'chores';
    }
    // Categories used emoji before drawn icons existed.
    for (const c of state.settings.categories) {
      if (!c.icon) c.icon = (DEFAULT_CATEGORIES.find((d) => d.id === c.id) || { icon: 'star' }).icon;
      delete c.emoji;
    }
    state.settings.categoryVersion = CATEGORY_VERSION;
    saveSettings();
    saveTasks();
  }
  const saveNotified = () => store.set('notified', state.notified);
  const saveEvents = () => {
    // only keep a week of cached days
    const keep = {};
    const min = addDays(todayKey(), -2), max = addDays(todayKey(), 7);
    for (const k of Object.keys(state.events)) if (k >= min && k <= max) keep[k] = state.events[k];
    state.events = keep;
    store.set('eventCache', keep);
  };

  // ---------- tiny DOM helper ----------
  const $ = (s) => document.querySelector(s);
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
    return el;
  }
  const checkSvg = () => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', 'M5 12.5l4.5 4.5L19 7.5');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '3.5');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.append(p);
    svg.style.color = 'var(--accent-ink)';
    return svg;
  };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function burst(x, y) {
    const bits = ['bubble', 'heart', 'sparkle', 'bubble', 'star', 'heart'];
    const colors = ['var(--accent)', 'var(--coral)', 'var(--mint)'];
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const r = 40 + Math.random() * 50;
      const s = h('span', { class: 'spark' }, icon(bits[i % bits.length]));
      s.style.color = colors[i % colors.length];
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(a) * r + 'px');
      s.style.setProperty('--dy', Math.sin(a) * r + 'px');
      s.style.setProperty('--rot', (Math.random() * 120 - 60) + 'deg');
      document.body.append(s);
      setTimeout(() => s.remove(), 900);
    }
  }

  // ---------- tasks ----------
  const catById = (id) => state.settings.categories.find((c) => c.id === id) || null;

  // Pick the category whose words best match the task title. Built-ins use CATEGORY_KEYWORDS;
  // categories you make yourself match on the words in their name.
  function guessCategory(title) {
    const text = title.toLowerCase();
    let best = null, bestScore = 0;
    for (const c of state.settings.categories) {
      const words = CATEGORY_KEYWORDS[c.id] ||
        c.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
      let score = 0;
      for (const w of words) {
        const re = new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (re.test(text)) score += w.length;
      }
      if (score > bestScore) { best = c.id; bestScore = score; }
    }
    return best;
  }
  const prioRank = (t) => (PRIORITIES[t.priority] || PRIORITIES.medium).rank;

  // Most important first; within the same importance, earlier times first.
  function visibleTasks() {
    const today = todayKey();
    const list = state.tasks.filter((t) =>
      state.viewDate === today ? t.date === today || (t.date < today && !t.done) : t.date === state.viewDate
    );
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const p = prioRank(a) - prioRank(b);
      if (p) return p;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.created - b.created;
    });
  }

  function toggleTask(task, el) {
    task.done = !task.done;
    task.doneAt = task.done ? Date.now() : null;
    saveTasks();
    if (task.done) {
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      const left = visibleTasks().filter((t) => !t.done).length;
      say(left === 0 ? pick(CHEERS_ALL_DONE) : pick(CHEERS_DONE), 'happy');
    }
    if (task.onCal) syncTaskToCalendar(task);
    render();
  }

  // ---------- buddy ----------
  const CHEERS_DONE = [
    'Yay! One down!', 'You\'re doing amazing!', 'Look at you go!', 'Checked! I\'m doing a happy splash.',
    'Nice work, bestie!', 'That\'s my human!', 'Another one bites the dust!', 'Otterly fantastic!',
  ];
  const CHEERS_ALL_DONE = ['ALL DONE?! You\'re a superstar!', 'Everything\'s checked! Time to float and relax.', 'Clean sweep! I\'m so proud of you.'];
  const TAP_LINES = [
    'Hi hi!', 'You\'ve got this!', 'Drink some water?', 'I believe in you!', 'Remember to stretch!',
    'Small steps still count.', 'Proud of you for showing up today.', 'Hehe, that tickles!', 'Take a deep breath…',
    'Want to hold paws? Otters do that so they don\'t drift apart.', 'Just keep swimming!',
  ];
  const NUDGES = ['You can do it!', 'Let\'s get it done together!', 'I\'m cheering for you!', 'Tiny step, big win.'];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let sayTimer;
  function say(text, mood) {
    state.moodOverride = { text, mood };
    renderBuddy(true);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { state.moodOverride = null; renderBuddy(); }, 4500);
  }

  function buddyThought() {
    const now = new Date();
    const hr = now.getHours();
    const today = todayKey();
    const list = visibleTasks();
    const left = list.filter((t) => !t.done);

    if (state.viewDate !== today) {
      if (state.viewDate > today) {
        const day = parseKey(state.viewDate).toLocaleDateString([], { weekday: 'long' });
        return { mood: 'idle', text: list.length ? `Planning ahead! ${list.length} thing${list.length > 1 ? 's' : ''} for ${day}.` : `Nothing planned for ${day} yet. Want to add something?` };
      }
      return { mood: 'idle', text: 'That day already happened! Tap "Today" to swim back.' };
    }

    const soon = (state.events[today] || []).find((e) => {
      if (e.allDay) return false;
      const mins = (new Date(e.start) - now) / 60000;
      return mins > 0 && mins <= 60;
    });
    if (soon) {
      const mins = Math.round((new Date(soon.start) - now) / 60000);
      return { mood: 'idle', text: `Heads up! "${soon.title}" starts in ${mins} min.` };
    }

    const late = left.find((t) => t.time && t.date === today && taskDue(t) < now);
    if (late) return { mood: 'worried', text: `Psst… "${late.title}" was for ${fmtTime(taskDue(late))}. Want to do it now?` };

    if (list.length === 0) {
      if (hr < 12) return { mood: 'idle', text: 'Good morning! What are we doing today? Tap + to add a task.' };
      if (hr >= 22) return { mood: 'sleepy', text: 'It\'s getting late… rest up, we\'ll plan tomorrow.' };
      return { mood: 'idle', text: 'Free day so far! Add a task whenever you\'re ready.' };
    }
    if (left.length === 0) return { mood: 'cheer', text: 'You finished everything today! I\'m SO proud!' };
    if (hr >= 22) return { mood: 'sleepy', text: `Sleepy time… ${left.length} left, but tomorrow-you can help.` };

    const next = left[0]; // most important first
    if (left.length === 1) return { mood: 'idle', text: `Just one left: "${next.title}". Almost there!` };
    const urgent = left.filter((t) => t.priority === 'high').length;
    if (urgent) return { mood: 'idle', text: `${left.length} to go! Top priority: "${next.title}"${urgent > 1 ? ` (+${urgent - 1} more important one${urgent > 2 ? 's' : ''})` : ''}` };
    if (hr < 12) return { mood: 'idle', text: `Morning! ${left.length} things today. Let's start with "${next.title}"!` };
    return { mood: 'idle', text: `${left.length} to go! Next up: "${next.title}"` };
  }

  // ---------- rendering ----------
  function greetingFor(hr) {
    if (hr < 5) return ['Up late?', 'moon'];
    if (hr < 12) return ['Good morning', 'sun'];
    if (hr < 17) return ['Good afternoon', 'sun'];
    if (hr < 22) return ['Good evening', 'sunset'];
    return ['Good night', 'moon'];
  }

  function renderHeader() {
    const isToday = state.viewDate === todayKey();
    const d = parseKey(state.viewDate);
    const [greet, greetIcon] = isToday ? greetingFor(new Date().getHours())
      : (state.viewDate > todayKey() ? ['Coming up', 'sparkle'] : ['Looking back', 'book']);
    $('#greeting').replaceChildren(greet + ' ', icon(greetIcon));
    $('#dateTitle').textContent = d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    $('#todayBtn').setAttribute('aria-pressed', String(isToday));
  }

  function renderBuddy(popBubble) {
    const thought = state.moodOverride || buddyThought();
    const buddy = $('#buddy');
    buddy.dataset.mood = thought.mood;
    buddy.dataset.color = state.settings.buddyColor;
    const bubble = $('#bubble');
    bubble.replaceChildren(h('span', { class: 'name' }, state.settings.buddyName), thought.text);
    if (popBubble) { bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop'); }
  }

  function renderProgress() {
    const list = visibleTasks();
    const done = list.filter((t) => t.done).length;
    $('#progressFill').style.width = list.length ? (done / list.length) * 100 + '%' : '0%';
    $('#progressText').textContent = list.length ? `${done} / ${list.length} done` : 'no tasks yet';
  }

  function renderFilters() {
    const wrap = $('#catFilters');
    const cats = state.settings.categories;
    if (state.filter && !catById(state.filter)) state.filter = null;
    const chip = (id, label, c) => h('button', {
      class: 'fchip', 'aria-pressed': String(state.filter === id), style: c ? `--c:${c.color}` : null,
      onclick: () => { state.filter = state.filter === id ? null : id; renderTasks(); },
    }, c ? icon(c.icon, 'cat-ic') : null, label);
    wrap.hidden = !cats.length;
    wrap.replaceChildren(chip(null, 'All'), ...cats.map((c) => chip(c.id, c.name, c)));
  }

  function taskRow(t) {
    const today = todayKey();
    const cat = catById(t.category);
    const prio = PRIORITIES[t.priority] || PRIORITIES.medium;
    const meta = [h('span', { class: 'prio prio-' + (t.priority || 'medium') }, icon(prio.icon), ' ', prio.label)];
    if (cat) meta.push(h('span', { class: 'cat-pill' }, icon(cat.icon), ' ', cat.name));
    if (t.date < today && state.viewDate === today) meta.push(h('span', { class: 'late' }, `from ${shortDay(t.date)}`));
    if (t.time) {
      const due = taskDue(t);
      meta.push(h('span', { class: !t.done && due < new Date() ? 'late' : null }, icon('clock'), ' ', fmtTime(due)));
    }
    if (t.onCal) meta.push(h('span', {}, icon('calendarCheck'), t.gcalId ? ' on calendar' : ' syncing…'));
    const li = h('li', { class: 'task' + (t.done ? ' done' : ''), style: cat ? `--cat:${cat.color}` : null });
    const check = h('button', { class: 'check', 'aria-label': t.done ? 'Mark not done' : 'Mark done', onclick: () => toggleTask(t, check) }, checkSvg());
    li.append(
      check,
      h('button', { class: 'task-main', onclick: () => openTaskDialog(t) },
        h('span', { class: 'task-title' }, t.title),
        h('span', { class: 'task-meta' }, ...meta.flatMap((m, i) => (i ? [' · ', m] : [m]))))
    );
    return li;
  }

  function renderTasks() {
    renderFilters();
    const ul = $('#taskList');
    const all = visibleTasks();
    const list = state.filter ? all.filter((t) => t.category === state.filter) : all;
    if (!list.length) {
      const cat = catById(state.filter);
      ul.replaceChildren(h('li', { class: 'empty', style: 'border:0;display:block' },
        cat ? `No ${cat.name} tasks here` : 'Nothing here yet — add your first task!'));
      return;
    }
    // Timed tasks in clock order, everything else from most to least important, finished ones last.
    const timed = list.filter((t) => !t.done && t.time)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || prioRank(a) - prioRank(b));
    const untimed = list.filter((t) => !t.done && !t.time);
    const done = list.filter((t) => t.done);
    const rows = [];
    const group = (ic, label, items) => {
      if (!items.length) return;
      rows.push(h('li', { class: 'group-label' }, icon(ic), ' ', label), ...items.map(taskRow));
    };
    group('clock', 'Timed', timed);
    group('flame', 'Most → least important', untimed);
    group('checkCircle', 'Done', done);
    ul.replaceChildren(...rows);
  }

  function eventTimeLabel(e) {
    if (e.allDay) return 'All day';
    return fmtTime(new Date(e.start));
  }

  function renderEvents() {
    const ul = $('#eventList');
    const refresh = $('#refreshCal');
    const hasClient = googleConfigured();
    const connected = state.settings.googleConnected;
    refresh.hidden = !connected;

    if (!hasClient) {
      ul.replaceChildren(h('li', { class: 'empty', style: 'border:0;display:block' },
        'Google Calendar isn\'t set up yet.', h('br'), h('small', {}, 'Follow step 2 in the README to add your Client ID.')));
      return;
    }
    if (!connected) {
      ul.replaceChildren(h('li', { class: 'empty', style: 'border:0;display:block' },
        'See your schedule right here!', h('br'),
        h('button', { class: 'btn primary', onclick: () => googleConnect(false) }, 'Connect Google Calendar')));
      return;
    }

    const events = state.events[state.viewDate];
    if (!getToken() && !events) {
      ul.replaceChildren(h('li', { class: 'empty', style: 'border:0;display:block' },
        'Google needs a quick check-in.', h('br'),
        h('button', { class: 'btn primary', onclick: () => googleConnect(false) }, 'Reconnect')));
      return;
    }
    if (!events) {
      ul.replaceChildren(h('li', { class: 'empty', style: 'border:0;display:block' },
        state.calStatus === 'error' ? 'Couldn\'t load your calendar. Tap refresh to try again.' : 'Loading your schedule…'));
      return;
    }
    if (!events.length) {
      ul.replaceChildren(h('li', { class: 'empty', style: 'border:0;display:block' }, 'Nothing on the calendar — free day!'));
      return;
    }
    const now = new Date();
    ul.replaceChildren(...events.map((e) => {
      let cls = null;
      if (!e.allDay) {
        const s = new Date(e.start), en = new Date(e.end);
        if (en < now) cls = 'past';
        else if (s <= now) cls = 'now';
      }
      const sub = [e.allDay ? null : `until ${fmtTime(new Date(e.end))}`, e.location].filter(Boolean).join(' · ');
      return h('li', { class: cls },
        h('span', { class: 'dot', style: `background:${e.color || 'var(--mint)'}` }),
        h('span', { class: 'when' }, eventTimeLabel(e)),
        h('span', { class: 'what' }, e.title, sub ? h('span', { class: 'sub' }, sub) : null)
      );
    }));
  }

  function render() {
    renderHeader();
    renderBuddy();
    renderProgress();
    renderEvents();
    renderTasks();
  }

  // ---------- task dialog ----------
  const taskDialog = $('#taskDialog');

  function openTaskDialog(task) {
    state.editingId = task ? task.id : null;
    $('#taskDialogTitle').textContent = task ? 'Edit task' : 'New task';
    $('#taskTitle').value = task ? task.title : '';
    $('#taskDate').value = task ? task.date : state.viewDate;
    $('#taskTime').value = task ? task.time : '';
    const canCal = state.settings.googleConnected && googleConfigured();
    const onCal = $('#taskOnCal');
    onCal.checked = task ? !!task.onCal : false;
    onCal.disabled = !canCal && !(task && task.onCal);
    $('#calHint').textContent = canCal
      ? 'Your phone\'s calendar app will buzz you, even when this app is closed.'
      : 'Connect Google Calendar in Settings to use this.';
    $('#deleteTask').hidden = !task;
    state.pick = {
      category: task ? task.category || null : state.filter,
      priority: task ? task.priority || 'medium' : 'medium',
      manual: !!task || !!state.filter, // once you choose a category yourself, auto-pick stops
      auto: false,
    };
    renderPickers();
    taskDialog.showModal();
    if (!task) setTimeout(() => $('#taskTitle').focus(), 50);
  }

  function renderPickers() {
    $('#taskPrio').replaceChildren(...Object.entries(PRIORITIES).map(([key, p]) =>
      h('button', {
        type: 'button', role: 'radio', 'aria-checked': String(state.pick.priority === key),
        class: 'prio-' + key,
        onclick: () => { state.pick.priority = key; renderPickers(); },
      }, icon(p.icon), ' ', p.label)
    ));
    const pick = (id, label, c) => h('button', {
      type: 'button', class: 'pick', role: 'radio', 'aria-checked': String(state.pick.category === id),
      style: c ? `--c:${c.color}` : null,
      onclick: () => { state.pick.category = id; state.pick.manual = true; state.pick.auto = false; renderPickers(); },
    }, c ? icon(c.icon, 'cat-ic') : null, label);
    $('#taskCats').replaceChildren(
      pick(null, 'None'),
      ...state.settings.categories.map((c) => pick(c.id, c.name, c))
    );
    const cat = catById(state.pick.category);
    $('#autoHint').replaceChildren(...(state.pick.auto && cat ? [icon('sparkle'), ` ${state.settings.buddyName} picked ${cat.name}`] : []));
  }

  $('#taskTitle').addEventListener('input', (e) => {
    if (state.pick.manual) return;
    const guess = guessCategory(e.target.value);
    if (guess === state.pick.category && state.pick.auto === !!guess) return;
    state.pick.category = guess;
    state.pick.auto = !!guess;
    renderPickers();
  });

  $('#taskForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const title = $('#taskTitle').value.trim();
    if (!title) return;
    const fields = {
      title, date: $('#taskDate').value || state.viewDate, time: $('#taskTime').value, onCal: $('#taskOnCal').checked,
      category: state.pick.category, priority: state.pick.priority,
    };
    let task;
    if (state.editingId) {
      task = state.tasks.find((t) => t.id === state.editingId);
      Object.assign(task, fields);
    } else {
      task = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), created: Date.now(), done: false, gcalId: null, ...fields };
      state.tasks.push(task);
      const remindLater = task.time && taskDue(task) > new Date();
      say(remindLater ? `Got it! I'll remind you at ${fmtTime(taskDue(task))}.` : 'Added! We\'ve got this.', 'happy');
    }
    saveTasks();
    taskDialog.close();
    if (task.onCal || task.gcalId) syncTaskToCalendar(task);
    render();
  });

  $('#cancelTask').addEventListener('click', () => taskDialog.close());
  $('#deleteTask').addEventListener('click', () => {
    const task = state.tasks.find((t) => t.id === state.editingId);
    if (!task) return;
    state.tasks = state.tasks.filter((t) => t.id !== task.id);
    saveTasks();
    if (task.gcalId) deleteCalendarEvent(task.gcalId);
    taskDialog.close();
    toast('Task deleted');
    render();
  });
  taskDialog.addEventListener('click', (e) => { if (e.target === taskDialog) taskDialog.close(); });

  // ---------- settings dialog ----------
  const settingsDialog = $('#settingsDialog');
  let deferredInstall = null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  function renderCatEditor() {
    const cats = state.settings.categories;
    $('#catEditor').replaceChildren(...cats.map((c) => {
      const row = h('div', { class: 'cat-row' },
        h('button', {
          class: 'cat-color', style: `background:${c.color}`, 'aria-label': `Change ${c.name} color`,
          'aria-expanded': String(state.openColorFor === c.id),
          onclick: () => {
            state.openColorFor = state.openColorFor === c.id ? null : c.id;
            state.openIconFor = null;
            renderCatEditor();
          },
        }),
        h('button', {
          class: 'cat-icon', style: `--c:${c.color}`, 'aria-label': `Change ${c.name} icon`,
          'aria-expanded': String(state.openIconFor === c.id),
          onclick: () => {
            state.openIconFor = state.openIconFor === c.id ? null : c.id;
            state.openColorFor = null;
            renderCatEditor();
          },
        }, icon(c.icon)),
        h('input', {
          class: 'cat-name', value: c.name, maxlength: '20', 'aria-label': 'Category name',
          oninput: (e) => { c.name = e.target.value.trim() || 'Untitled'; saveSettings(); renderTasks(); },
        }),
        h('button', { class: 'cat-del', 'aria-label': `Delete ${c.name}`, onclick: () => deleteCategory(c) }, '×')
      );
      if (state.openIconFor === c.id) {
        return h('div', {}, row, h('div', { class: 'icon-grid', role: 'radiogroup', 'aria-label': `${c.name} icon`, style: `--c:${c.color}` },
          CATEGORY_ICON_CHOICES.map((name) => h('button', {
            class: 'icon-choice', role: 'radio', 'aria-checked': String(name === c.icon), 'aria-label': name,
            onclick: () => { c.icon = name; state.openIconFor = null; saveSettings(); renderCatEditor(); renderTasks(); },
          }, icon(name)))));
      }
      if (state.openColorFor !== c.id) return row;
      return h('div', {}, row, h('div', { class: 'swatches small', role: 'radiogroup', 'aria-label': `${c.name} color` },
        PALETTE.map((col) => h('button', {
          class: 'swatch', role: 'radio', 'aria-checked': String(col === c.color), 'aria-label': col, style: `background:${col}`,
          onclick: () => { c.color = col; state.openColorFor = null; saveSettings(); renderCatEditor(); renderTasks(); },
        }))));
    }));
    $('#addCat').hidden = cats.length >= 12;
  }

  function deleteCategory(c) {
    const used = state.tasks.filter((t) => t.category === c.id).length;
    if (used && !confirm(`Delete "${c.name}"? Its ${used} task${used > 1 ? 's' : ''} will stay, just without a category.`)) return;
    state.settings.categories = state.settings.categories.filter((x) => x.id !== c.id);
    for (const t of state.tasks) if (t.category === c.id) t.category = null;
    saveSettings(); saveTasks();
    renderCatEditor(); renderTasks();
  }

  $('#addCat').addEventListener('click', () => {
    const cats = state.settings.categories;
    const used = new Set(cats.map((c) => c.color));
    const usedIcons = new Set(cats.map((x) => x.icon));
    const c = {
      id: 'c' + Date.now(), name: 'New category',
      icon: CATEGORY_ICON_CHOICES.find((i) => !usedIcons.has(i)) || 'star',
      color: PALETTE.find((p) => !used.has(p)) || PALETTE[0],
    };
    cats.push(c);
    saveSettings();
    renderCatEditor();
    renderTasks();
    const inputs = document.querySelectorAll('#catEditor .cat-name');
    const last = inputs[inputs.length - 1];
    if (last) { last.focus(); last.select(); }
  });

  function renderSettings() {
    renderCatEditor();
    $('#buddyName').value = state.settings.buddyName;
    $('#remindBefore').value = String(state.settings.remindBefore);
    $('#swatches').replaceChildren(...Object.entries(BUDDY_COLORS).map(([name, hex]) =>
      h('button', {
        class: 'swatch', role: 'radio', 'aria-label': name, 'aria-checked': String(state.settings.buddyColor === name),
        style: `background:${hex}`,
        onclick: () => { state.settings.buddyColor = name; saveSettings(); renderSettings(); renderBuddy(); },
      })
    ));

    // notifications
    const notif = $('#notifStatus');
    const enable = $('#enableNotif');
    if (!('Notification' in window)) {
      notif.textContent = isIOS && !isStandalone()
        ? 'On iPhone, add this app to your Home Screen first (see below), then open it from there to turn on notifications.'
        : 'This browser doesn\'t support notifications.';
      enable.hidden = true;
      $('#testNotif').hidden = true;
    } else {
      const p = Notification.permission;
      notif.textContent = p === 'granted'
        ? `On! ${state.settings.buddyName} will ping you for tasks with a time and upcoming events while the app is open or recently used. For can't-miss reminders, turn on "put it on my Google Calendar" for that task.`
        : p === 'denied'
          ? 'Notifications are blocked. Turn them on in your phone\'s settings for this app.'
          : 'Let your buddy tap you on the shoulder when it\'s time.';
      enable.hidden = p !== 'default';
      $('#testNotif').hidden = p !== 'granted';
    }

    // google
    const gs = $('#googleStatus');
    const connect = $('#googleConnect');
    const disconnect = $('#googleDisconnect');
    if (!googleConfigured()) {
      gs.textContent = 'Not set up yet. Add your Google Client ID to config.js (README step 2).';
      connect.hidden = true; disconnect.hidden = true;
    } else if (state.settings.googleConnected) {
      gs.textContent = getToken() ? 'Connected! Your events show up on the home screen.' : 'Connected, but Google wants you to sign in again.';
      connect.hidden = !!getToken(); connect.textContent = 'Reconnect';
      disconnect.hidden = false;
    } else {
      gs.textContent = 'Show your events and add tasks to your calendar.';
      connect.hidden = false; connect.textContent = 'Connect'; disconnect.hidden = true;
    }

    // install
    const inst = $('#installStatus');
    const instBtn = $('#installBtn');
    instBtn.hidden = !deferredInstall;
    if (isStandalone()) inst.textContent = 'You\'re using the installed app!';
    else if (isIOS) inst.textContent = 'In Safari, tap the Share button (square with an arrow), then "Add to Home Screen".';
    else if (deferredInstall) inst.textContent = 'Add Buddy to your home screen like a real app.';
    else inst.textContent = 'In Chrome, open the ⋮ menu and choose "Add to Home screen" or "Install app".';
  }

  $('#settingsBtn').addEventListener('click', () => { renderSettings(); settingsDialog.showModal(); });
  $('#closeSettings').addEventListener('click', () => settingsDialog.close());
  settingsDialog.addEventListener('click', (e) => { if (e.target === settingsDialog) settingsDialog.close(); });
  $('#buddyName').addEventListener('input', (e) => {
    state.settings.buddyName = e.target.value.trim() || 'Mochi';
    saveSettings();
    renderBuddy();
  });
  $('#remindBefore').addEventListener('change', (e) => { state.settings.remindBefore = Number(e.target.value); saveSettings(); });
  $('#enableNotif').addEventListener('click', async () => {
    try {
      const p = await Notification.requestPermission();
      if (p === 'granted') {
        notify(`${state.settings.buddyName} is here!`, 'I\'ll remind you when it\'s time to do things.', 'welcome');
      }
    } catch { /* ignore */ }
    renderSettings();
  });
  $('#testNotif').addEventListener('click', () => notify(`Hi from ${state.settings.buddyName}!`, pick(TAP_LINES), 'test'));
  $('#googleConnect').addEventListener('click', () => googleConnect(false));
  $('#googleDisconnect').addEventListener('click', () => {
    const t = getToken();
    if (t) fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(t), { method: 'POST' }).catch(() => {});
    store.set('gtoken', null);
    state.settings.googleConnected = false;
    state.events = {};
    saveSettings(); saveEvents();
    renderSettings(); render();
    toast('Disconnected from Google');
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice.catch(() => {});
    deferredInstall = null;
    renderSettings();
  });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });

  // ---------- main controls ----------
  $('#addBtn').addEventListener('click', () => openTaskDialog(null));
  $('#addRow').addEventListener('click', () => openTaskDialog(null));
  $('#prevDay').addEventListener('click', () => changeDay(-1));
  $('#nextDay').addEventListener('click', () => changeDay(1));
  $('#todayBtn').addEventListener('click', () => { state.viewDate = todayKey(); render(); loadEvents(state.viewDate); });
  $('#refreshCal').addEventListener('click', () => {
    if (!getToken()) return googleConnect(false);
    loadEvents(state.viewDate, true);
    if (state.viewDate !== todayKey()) loadEvents(todayKey(), true);
  });
  const buddyEl = $('#buddy');
  const tapBuddy = () => {
    const r = buddyEl.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height * 0.4);
    say(pick(TAP_LINES), 'happy');
  };
  buddyEl.addEventListener('click', tapBuddy);
  buddyEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapBuddy(); } });

  function changeDay(n) {
    state.viewDate = addDays(state.viewDate, n);
    state.moodOverride = null;
    render();
    loadEvents(state.viewDate);
  }

  // ---------- Google Calendar ----------
  function googleConfigured() {
    const id = CONFIG.GOOGLE_CLIENT_ID || '';
    return id.endsWith('.apps.googleusercontent.com');
  }
  const redirectUri = () => new URL('./', location.href).href;

  function getToken() {
    const t = store.get('gtoken', null);
    return t && t.exp > Date.now() + 60_000 ? t.token : null;
  }

  // Uses Google's browser sign-in redirect (no server needed). Tokens last ~1 hour,
  // after which we quietly bounce through Google again to get a new one.
  function googleConnect(silent) {
    if (!googleConfigured()) { toast('Add your Google Client ID to config.js first'); return; }
    const nonce = Math.random().toString(36).slice(2);
    sessionStorage.setItem('oauthState', nonce);
    sessionStorage.setItem('oauthSilent', silent ? '1' : '0');
    const params = new URLSearchParams({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri(),
      response_type: 'token',
      scope: GOOGLE_SCOPES,
      include_granted_scopes: 'true',
      state: nonce,
    });
    if (silent) params.set('prompt', 'none');
    location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params;
  }

  function handleOAuthRedirect() {
    const hash = location.hash.slice(1);
    if (!/access_token=|error=/.test(hash)) return;
    const p = new URLSearchParams(hash);
    history.replaceState(null, '', location.pathname + location.search);
    if (p.get('state') !== sessionStorage.getItem('oauthState')) return;
    sessionStorage.removeItem('oauthState');
    const silent = sessionStorage.getItem('oauthSilent') === '1';
    if (p.get('access_token')) {
      store.set('gtoken', { token: p.get('access_token'), exp: Date.now() + Number(p.get('expires_in') || 3600) * 1000 });
      if (!state.settings.googleConnected) setTimeout(() => say('Yay, I can see your calendar now!', 'happy'), 300);
      state.settings.googleConnected = true;
      saveSettings();
    } else if (!silent) {
      toast(p.get('error') === 'access_denied' ? 'No worries — you can connect later' : 'Google sign-in didn\'t work: ' + p.get('error'));
    }
  }

  async function gapi(path, opts = {}) {
    const token = getToken();
    if (!token) throw new Error('auth');
    const res = await fetch('https://www.googleapis.com/calendar/v3' + path, {
      ...opts,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    if (res.status === 401) { store.set('gtoken', null); throw new Error('auth'); }
    if (!res.ok) { const err = new Error('google ' + res.status); err.status = res.status; throw err; }
    return res.status === 204 ? null : res.json();
  }

  let calendarsPromise = null;
  function getCalendars() {
    if (!calendarsPromise) {
      calendarsPromise = gapi('/users/me/calendarList?minAccessRole=reader')
        .then((r) => (r.items || []).filter((c) => c.selected && !c.hidden))
        .catch((e) => { calendarsPromise = null; throw e; });
    }
    return calendarsPromise;
  }

  const loading = new Set();
  async function loadEvents(key, force) {
    if (!state.settings.googleConnected || !getToken()) { renderEvents(); return; }
    if (loading.has(key) || (!force && state.events[key] && state.events[key]._fresh)) return;
    loading.add(key);
    state.calStatus = 'loading';
    if (!state.events[key]) renderEvents();
    try {
      const cals = await getCalendars();
      const timeMin = parseKey(key).toISOString();
      const timeMax = parseKey(addDays(key, 1)).toISOString();
      const lists = await Promise.all(cals.map((c) =>
        gapi(`/calendars/${encodeURIComponent(c.id)}/events?` + new URLSearchParams({
          timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '50',
        })).then((r) => (r.items || [])
          .filter((e) => e.status !== 'cancelled' && !(e.extendedProperties && e.extendedProperties.private && e.extendedProperties.private.buddyTask))
          .filter((e) => !(e.attendees || []).some((a) => a.self && a.responseStatus === 'declined'))
          .map((e) => ({
            id: e.id,
            title: e.summary || '(busy)',
            allDay: !!e.start.date,
            start: e.start.dateTime || e.start.date,
            end: e.end.dateTime || e.end.date,
            location: e.location ? e.location.split(',')[0] : '',
            color: c.backgroundColor,
          }))
        ).catch((e) => { if (e.message === 'auth') throw e; return []; })
      ));
      const events = lists.flat().sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return new Date(a.start) - new Date(b.start);
      });
      state.events[key] = events;
      saveEvents();
      Object.defineProperty(events, '_fresh', { value: true, enumerable: false });
      state.calStatus = 'ok';
    } catch (e) {
      state.calStatus = 'error';
      if (e.message === 'auth') maybeSilentReconnect();
    } finally {
      loading.delete(key);
      render();
    }
  }

  function maybeSilentReconnect() {
    if (!state.settings.googleConnected || getToken() || !googleConfigured()) return false;
    if (sessionStorage.getItem('triedSilent')) return false;
    sessionStorage.setItem('triedSilent', '1');
    googleConnect(true);
    return true;
  }

  function taskEventBody(t) {
    const body = {
      summary: (t.done ? '✓ ' : '') + t.title,
      description: 'Added from Buddy To-Do' + (catById(t.category) ? ` · ${catById(t.category).name}` : ''),
      transparency: 'transparent',
      extendedProperties: { private: { buddyTask: '1' } },
    };
    const quiet = { useDefault: false, overrides: [] };
    if (t.time) {
      const s = taskDue(t);
      body.start = { dateTime: s.toISOString() };
      body.end = { dateTime: new Date(s.getTime() + 15 * 60000).toISOString() };
      body.reminders = t.done ? quiet : { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] };
    } else {
      body.start = { date: t.date };
      body.end = { date: addDays(t.date, 1) };
      body.reminders = t.done ? quiet : { useDefault: true };
    }
    return body;
  }

  async function syncTaskToCalendar(task) {
    if (!getToken()) {
      if (task.onCal && !task.gcalId) toast('Reconnect Google to add this to your calendar');
      return;
    }
    try {
      if (task.onCal && !task.gcalId) {
        const ev = await gapi('/calendars/primary/events', { method: 'POST', body: JSON.stringify(taskEventBody(task)) });
        task.gcalId = ev.id;
      } else if (task.onCal && task.gcalId) {
        await gapi(`/calendars/primary/events/${encodeURIComponent(task.gcalId)}`, { method: 'PUT', body: JSON.stringify(taskEventBody(task)) });
      } else if (!task.onCal && task.gcalId) {
        await deleteCalendarEvent(task.gcalId);
        task.gcalId = null;
      }
      saveTasks();
      renderTasks();
    } catch (e) {
      if (e.status === 404 || e.status === 410) { task.gcalId = null; saveTasks(); if (task.onCal) return syncTaskToCalendar(task); }
      toast(e.message === 'auth' ? 'Reconnect Google to sync your calendar' : 'Couldn\'t update your calendar');
    }
  }

  async function deleteCalendarEvent(id) {
    try { await gapi(`/calendars/primary/events/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
    catch (e) { if (e.message === 'auth') toast('Reconnect Google to remove it from your calendar'); }
  }

  // ---------- notifications ----------
  async function notify(title, body, tag) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/badge.png', vibrate: [80, 40, 80], data: { url: redirectUri() } };
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null;
      if (reg) await reg.showNotification(title, opts);
      else new Notification(title, opts);
    } catch {
      try { new Notification(title, opts); } catch { /* not allowed here */ }
    }
  }

  function checkReminders() {
    const now = Date.now();
    const today = todayKey();
    const name = state.settings.buddyName;
    let changed = false;

    for (const t of state.tasks) {
      if (t.done || !t.time || t.date !== today) continue;
      const due = taskDue(t).getTime();
      const key = `t:${t.id}:${t.date}:${t.time}`;
      if (now >= due && now - due < 30 * 60000 && !state.notified[key]) {
        state.notified[key] = now; changed = true;
        notify(`${name}: time for "${t.title}"!`, pick(NUDGES), key);
        say(`It's time for "${t.title}"! ${pick(NUDGES)}`, 'happy');
      }
    }

    const lead = state.settings.remindBefore * 60000;
    for (const e of state.events[today] || []) {
      if (e.allDay) continue;
      const start = new Date(e.start).getTime();
      const key = `e:${e.id}:${e.start}`;
      if (now >= start - lead && now < start && !state.notified[key]) {
        state.notified[key] = now; changed = true;
        const mins = Math.max(1, Math.round((start - now) / 60000));
        notify(`${e.title} in ${mins} min`, `${name} says: get ready!${e.location ? ' At ' + e.location + '.' : ''}`, key);
      }
    }

    if (changed) {
      for (const [k, v] of Object.entries(state.notified)) if (now - v > 2 * 86400000) delete state.notified[k];
      saveNotified();
    }
  }

  // ---------- startup ----------
  function tick() {
    // roll over to a new day at midnight
    const today = todayKey();
    if (tick.lastDay && tick.lastDay !== today && state.viewDate === tick.lastDay) state.viewDate = today;
    tick.lastDay = today;
    checkReminders();
    if (!state.moodOverride) render();
  }

  handleOAuthRedirect();

  for (const el of document.querySelectorAll('[data-icon]')) el.replaceWith(icon(el.dataset.icon));

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  render();
  if (state.settings.googleConnected && !getToken()) {
    if (!maybeSilentReconnect()) renderEvents();
  } else {
    loadEvents(todayKey());
  }

  setInterval(tick, 20_000);
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    loadEvents(todayKey(), true);
    if (state.viewDate !== todayKey()) loadEvents(state.viewDate, true);
  }, 10 * 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    tick();
    if (state.settings.googleConnected && !getToken()) { sessionStorage.removeItem('triedSilent'); maybeSilentReconnect(); }
    else loadEvents(todayKey());
  });
  tick();
})();
