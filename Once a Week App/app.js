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
  const CATEGORY_VERSION = 2; // bump when DEFAULT_CATEGORIES changes in a way old saves should pick up
  const DEFAULT_CATEGORIES = [
    { id: 'school', name: 'School', emoji: '📚', color: '#b39ae8' },
    { id: 'work', name: 'Work', emoji: '💼', color: '#7cb8f0' },
    { id: 'chores', name: 'Chores', emoji: '🧹', color: '#ffbe85' },
    { id: 'health', name: 'Health', emoji: '💪', color: '#6fcf9f' },
    { id: 'selfcare', name: 'Self-care', emoji: '🛁', color: '#e29be0' },
    { id: 'errands', name: 'Errands', emoji: '🛒', color: '#f5d76e' },
    { id: 'social', name: 'Social', emoji: '💬', color: '#ff9f8a' },
    { id: 'fun', name: 'Fun', emoji: '🎮', color: '#ff8fb1' },
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
    high: { label: 'High', emoji: '🔥', rank: 0 },
    medium: { label: 'Medium', emoji: '⭐', rank: 1 },
    low: { label: 'Low', emoji: '🌱', rank: 2 },
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
  };
  const saveTasks = () => store.set('tasks', state.tasks);
  const saveSettings = () => store.set('settings', state.settings);
  const savedSettings = store.get('settings', {});
  if (savedSettings.categories && (savedSettings.categoryVersion || 1) < CATEGORY_VERSION) {
    // Older saves had a different starter set; keep any custom categories and add the new built-ins.
    const oldDefaults = ['school', 'work', 'home', 'health', 'fun', 'errands'];
    const custom = state.settings.categories.filter((c) => !oldDefaults.includes(c.id));
    state.settings.categories = [...JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)), ...custom];
    for (const t of state.tasks) if (t.category === 'home') t.category = 'chores';
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
    const bits = ['💗', '✨', '🌸', '⭐', '💖', '🌼'];
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const r = 40 + Math.random() * 50;
      const s = h('span', { class: 'spark' }, bits[i % bits.length]);
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
    'Yay! One down! 🎉', 'You\'re doing amazing!', 'Look at you go! ✨', 'Checked! I\'m doing a happy dance 💃',
    'Nice work, bestie!', 'That\'s my human! 💗', 'Another one bites the dust!',
  ];
  const CHEERS_ALL_DONE = ['ALL DONE?! You\'re a superstar! 🌟', 'Everything\'s checked! Time to relax 🛁', 'Clean sweep! I\'m so proud of you 🥹'];
  const TAP_LINES = [
    'Hi hi! 👋', 'You\'ve got this! 💪', 'Drink some water? 💧', 'I believe in you!', 'Remember to stretch 🙆',
    'Small steps still count 🐾', 'Proud of you for showing up today 💗', 'Hehe, that tickles!', 'Take a deep breath… 🌬️',
  ];
  const NUDGES = ['You can do it! 💪', 'Let\'s get it done together!', 'I\'m cheering for you!', 'Tiny step, big win ✨'];
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
      return { mood: 'idle', text: 'That day already happened! Tap "Today" to come back 🌱' };
    }

    const soon = (state.events[today] || []).find((e) => {
      if (e.allDay) return false;
      const mins = (new Date(e.start) - now) / 60000;
      return mins > 0 && mins <= 60;
    });
    if (soon) {
      const mins = Math.round((new Date(soon.start) - now) / 60000);
      return { mood: 'idle', text: `Heads up! "${soon.title}" starts in ${mins} min ⏰` };
    }

    const late = left.find((t) => t.time && t.date === today && taskDue(t) < now);
    if (late) return { mood: 'worried', text: `Psst… "${late.title}" was for ${fmtTime(taskDue(late))}. Want to do it now?` };

    if (list.length === 0) {
      if (hr < 12) return { mood: 'idle', text: 'Good morning! What are we doing today? Tap + to add a task 🌱' };
      if (hr >= 22) return { mood: 'sleepy', text: 'It\'s getting late… rest up, we\'ll plan tomorrow 💤' };
      return { mood: 'idle', text: 'Free day so far! Add a task whenever you\'re ready ✨' };
    }
    if (left.length === 0) return { mood: 'cheer', text: 'You finished everything today! I\'m SO proud 🎉' };
    if (hr >= 22) return { mood: 'sleepy', text: `Sleepy time… ${left.length} left, but tomorrow-you can help 💤` };

    const next = left[0]; // most important first
    if (left.length === 1) return { mood: 'idle', text: `Just one left: "${next.title}". Almost there! 💪` };
    const urgent = left.filter((t) => t.priority === 'high').length;
    if (urgent) return { mood: 'idle', text: `${left.length} to go! 🔥 Top priority: "${next.title}"${urgent > 1 ? ` (+${urgent - 1} more important one${urgent > 2 ? 's' : ''})` : ''}` };
    if (hr < 12) return { mood: 'idle', text: `Morning! ${left.length} things today. Let's start with "${next.title}"!` };
    return { mood: 'idle', text: `${left.length} to go! Next up: "${next.title}" 🦦` };
  }

  // ---------- rendering ----------
  function greetingFor(hr) {
    if (hr < 5) return 'Up late? 🌙';
    if (hr < 12) return 'Good morning ☀️';
    if (hr < 17) return 'Good afternoon 🌼';
    if (hr < 22) return 'Good evening 🌆';
    return 'Good night 🌙';
  }

  function renderHeader() {
    const isToday = state.viewDate === todayKey();
    const d = parseKey(state.viewDate);
    $('#greeting').textContent = isToday ? greetingFor(new Date().getHours()) : (state.viewDate > todayKey() ? 'Coming up 🔮' : 'Looking back 📖');
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
    const chip = (id, label, color) => h('button', {
      class: 'fchip', 'aria-pressed': String(state.filter === id), style: color ? `--c:${color}` : null,
      onclick: () => { state.filter = state.filter === id ? null : id; renderTasks(); },
    }, color ? h('span', { class: 'dot' }) : null, label);
    wrap.hidden = !cats.length;
    wrap.replaceChildren(chip(null, 'All'), ...cats.map((c) => chip(c.id, `${c.emoji} ${c.name}`, c.color)));
  }

  function taskRow(t) {
    const today = todayKey();
    const cat = catById(t.category);
    const prio = PRIORITIES[t.priority] || PRIORITIES.medium;
    const meta = [h('span', { class: t.priority === 'high' ? 'prio-high' : null }, `${prio.emoji} ${prio.label}`)];
    if (cat) meta.push(h('span', { class: 'cat-pill' }, `${cat.emoji} ${cat.name}`));
    if (t.date < today && state.viewDate === today) meta.push(h('span', { class: 'late' }, `from ${shortDay(t.date)}`));
    if (t.time) {
      const due = taskDue(t);
      meta.push(h('span', { class: !t.done && due < new Date() ? 'late' : null }, `⏰ ${fmtTime(due)}`));
    }
    if (t.onCal) meta.push(h('span', {}, t.gcalId ? '📅 on calendar' : '📅 syncing…'));
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
        cat ? `No ${cat.name} tasks here ${cat.emoji}` : 'Nothing here yet — add your first task! 🌱'));
      return;
    }
    // Timed tasks in clock order, everything else from most to least important, finished ones last.
    const timed = list.filter((t) => !t.done && t.time)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || prioRank(a) - prioRank(b));
    const untimed = list.filter((t) => !t.done && !t.time);
    const done = list.filter((t) => t.done);
    const rows = [];
    const group = (label, items) => {
      if (!items.length) return;
      rows.push(h('li', { class: 'group-label' }, label), ...items.map(taskRow));
    };
    group('⏰ Timed', timed);
    group('⭐ Most → least important', untimed);
    group('✅ Done', done);
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
        'Google needs a quick check-in 🔐', h('br'),
        h('button', { class: 'btn primary', onclick: () => googleConnect(false) }, 'Reconnect')));
      return;
    }
    if (!events) {
      ul.replaceChildren(h('li', { class: 'empty', style: 'border:0;display:block' },
        state.calStatus === 'error' ? 'Couldn\'t load your calendar 😿 Tap refresh to try again.' : 'Loading your schedule…'));
      return;
    }
    if (!events.length) {
      ul.replaceChildren(h('li', { class: 'empty', style: 'border:0;display:block' }, 'Nothing on the calendar — free day! 🌈'));
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
        onclick: () => { state.pick.priority = key; renderPickers(); },
      }, `${p.emoji} ${p.label}`)
    ));
    const pick = (id, label, color) => h('button', {
      type: 'button', class: 'pick', role: 'radio', 'aria-checked': String(state.pick.category === id),
      style: color ? `--c:${color}` : null,
      onclick: () => { state.pick.category = id; state.pick.manual = true; state.pick.auto = false; renderPickers(); },
    }, label);
    $('#taskCats').replaceChildren(
      pick(null, 'None'),
      ...state.settings.categories.map((c) => pick(c.id, `${c.emoji} ${c.name}`, c.color))
    );
    const cat = catById(state.pick.category);
    $('#autoHint').textContent = state.pick.auto && cat ? `✨ ${state.settings.buddyName} picked ${cat.name}` : '';
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
      say(remindLater ? `Got it! I'll remind you at ${fmtTime(taskDue(task))} ⏰` : 'Added! We\'ve got this 💪', 'happy');
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
          onclick: () => { state.openColorFor = state.openColorFor === c.id ? null : c.id; renderCatEditor(); },
        }),
        h('input', {
          class: 'cat-emoji', value: c.emoji, maxlength: '4', 'aria-label': `${c.name} emoji`,
          oninput: (e) => { c.emoji = e.target.value.trim(); saveSettings(); renderTasks(); },
        }),
        h('input', {
          class: 'cat-name', value: c.name, maxlength: '20', 'aria-label': 'Category name',
          oninput: (e) => { c.name = e.target.value.trim() || 'Untitled'; saveSettings(); renderTasks(); },
        }),
        h('button', { class: 'cat-del', 'aria-label': `Delete ${c.name}`, onclick: () => deleteCategory(c) }, '×')
      );
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
    const c = { id: 'c' + Date.now(), name: 'New category', emoji: '✨', color: PALETTE.find((p) => !used.has(p)) || PALETTE[0] };
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
      gs.textContent = getToken() ? 'Connected ✅ Your events show up on the home screen.' : 'Connected, but Google wants you to sign in again.';
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
    if (isStandalone()) inst.textContent = 'You\'re using the installed app 🎉';
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
        notify(`${state.settings.buddyName} is here! 💗`, 'I\'ll remind you when it\'s time to do things.', 'welcome');
      }
    } catch { /* ignore */ }
    renderSettings();
  });
  $('#testNotif').addEventListener('click', () => notify(`Hi from ${state.settings.buddyName}! 👋`, pick(TAP_LINES), 'test'));
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
      if (!state.settings.googleConnected) setTimeout(() => say('Yay, I can see your calendar now! 📅', 'happy'), 300);
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
      summary: (t.done ? '✓ ' : '') + (catById(t.category) ? catById(t.category).emoji + ' ' : '') + t.title,
      description: 'Added from Buddy To-Do 🌷',
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
      toast(e.message === 'auth' ? 'Reconnect Google to sync your calendar' : 'Couldn\'t update your calendar 😿');
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
        notify(`${name}: time for "${t.title}"! ⏰`, pick(NUDGES), key);
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
        notify(`📅 ${e.title} in ${mins} min`, `${name} says: get ready! ${e.location ? '📍 ' + e.location : ''}`.trim(), key);
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
