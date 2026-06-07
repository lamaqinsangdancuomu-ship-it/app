const STORAGE_KEY = "jigmeyPhuntsokNotebook.v3";
const TEACHING_STORAGE_KEY = "jigmeyPhuntsokTeachings.v1";
const MODULE_STORAGE_KEY = "jigmeyPhuntsokModules.v1";

let deferredInstallPrompt = null;

const typeLabels = {
  diary: "ཉིན་ཐོ། 日记",
  reading: "ཀློག་ཐོ། 读书",
  memo: "དྲན་ཐོ། 备忘",
  timeline: "གདམས་ངག 教言"
};

const seedNotes = [];

const seedTeachingQuotes = [
  "真正令你受尽折磨的，实际上是心魔。",
  "有多少傲慢、贪心、吝啬、嗔心、愚痴，你就有多少苦。",
  "贪也是白贪。",
  "越吝啬，活得越穷。",
  "尽量像对待母亲一样原谅怨敌。",
  "别人有福报，一定要随喜。",
  "贪心在得到满足之后会更增上。",
  "有嗔心之人，连一个快乐的机会都没有。",
  "越愚痴，前途越黑暗。",
  "贪嗔痴是一切祸害的根源。",
  "我们经常“自讨苦吃”。",
  "想过自己死后要去哪儿吗。",
  "临终弥留际，唯福能救护。",
  "活着不是为了怀念过去。",
  "别认为青春永远无敌。",
  "如果我们脸上没有污渍，在镜子中也照不出来。",
  "对所有人都要有慈悲心。",
  "耍小聪明的人衰败起来很快。",
  "别妄想依靠有权有势的人。",
  "忘恩之人享用不到任何功德。",
  "越有钱有势，对周围的人越要看得起。",
  "占便宜就是颠倒因果。",
  "爱说妄语，小心报应。",
  "喜欢热闹有极大的过失。",
  "无论贫富，都要有利他之心。",
  "任何时候都别抱怨他人。",
  "一切都还来得及。",
  "别再心猿意马了。",
  "念一百万遍阿弥陀佛名号就能往生极乐。",
  "仅仅念诵一遍《普贤行愿品》，也能遣除任何邪恶的损害。",
  "骂了人，请马上念“嗡班匝儿萨埵吽”。",
  "菩提心可遣除一切负能量。",
  "不要让自己成为欲望的奴隶。",
  "众生皆苦，能断为大。",
  "怎样断除贪恋一个人的痛苦。",
  "人生真是一场梦吗。",
  "人生最可靠的是信心和正见。",
  "再小的善业，也可换来无量安乐。",
  "因缘聚合时，其果定成熟。",
  "世间的琐事，若去希求，就没有一个完结之时。",
  "平时一定不能攀缘太多。",
  "问道要问过来人。"
].map((text, index) => ({
  id: `seed-teaching-${index + 1}`,
  text,
  createdAt: Date.now() - index
}));

const defaultModules = {
  focusGallery: [
    {
      id: "focus-gallery-1",
      image: "assets/larung-real-panorama.jpg",
      title: "夜色山谷",
      subtitle: "LARUNG GAR",
      feature: true
    },
    {
      id: "focus-gallery-2",
      image: "assets/larung-real-lights.jpg",
      title: "灯火红屋",
      subtitle: "LIGHTS"
    },
    {
      id: "focus-gallery-3",
      image: "assets/larung-real-snow.jpg",
      title: "雪落山坡",
      subtitle: "SNOW"
    }
  ],
  portraits: [
    {
      id: "portrait-1",
      image: "assets/fawang-portrait-seat.jpg",
      title: "ཡིད་བཞིན་ནོར་བུ། 法王如意宝",
      subtitle: "YISHIN NORBU",
      feature: true
    },
    {
      id: "portrait-2",
      image: "assets/fawang-langlang-mountain.jpg",
      title: "ལྷ་རི། 朗朗神山",
      subtitle: "LANG LANG"
    },
    {
      id: "portrait-3",
      image: "assets/fawang-radiance.jpg",
      title: "འོད་གསལ། 光明留影",
      subtitle: "BLESSING"
    }
  ],
  academy: [
    {
      id: "academy-1",
      image: "assets/larung-real-stairs-night.jpg",
      title: "བླ་རུང་། 夜色阶梯",
      subtitle: "LARUNG",
      layout: "tall"
    },
    {
      id: "academy-2",
      image: "assets/larung-real-temple-mist.jpg",
      title: "སྨུག་པ། 晨雾寺院",
      subtitle: "MIST"
    },
    {
      id: "academy-3",
      image: "assets/larung-real-red-valley.jpg",
      title: "རི་ཁྲོད། 红色山谷",
      subtitle: "VALLEY"
    },
    {
      id: "academy-4",
      image: "assets/larung-real-snow.jpg",
      title: "ཁ་བ། 雪景红屋",
      subtitle: "SNOW",
      layout: "wide"
    }
  ],
  milestones: [
    {
      id: "milestone-1",
      subtitle: "1933",
      title: "སྐྱེ་བ། 降生与认定",
      body: "生于康区色达一带，后被认定为伏藏大师列绕朗巴的转世。",
      tone: "red"
    },
    {
      id: "milestone-2",
      subtitle: "1980",
      title: "བླ་རུང་། 喇荣启航",
      body: "在色达喇荣沟创立喇荣佛学院，后来成为重要的佛学教育中心。",
      tone: "blue"
    },
    {
      id: "milestone-3",
      subtitle: "1987",
      title: "རི་བོ་རྩེ་ལྔ། 五台山",
      body: "率众朝礼五台山，并在此创作、开示与文殊信仰相关的重要教言。",
      tone: "gold"
    },
    {
      id: "milestone-4",
      subtitle: "2004",
      title: "མྱང་འདས། 示现圆寂",
      body: "2004 年 1 月 7 日于成都示现圆寂，弟子以祈祷、闻思修行纪念师恩。",
      tone: "green"
    }
  ],
  colorPages: [
    {
      id: "color-1",
      image: "assets/color-page-boulder.jpg",
      title: "ན་བཟའ། BOULDER · 红衣",
      subtitle: "BOULDER"
    },
    {
      id: "color-2",
      image: "assets/color-page-yogurt.jpg",
      title: "ཞོ། NAPA VALLEY · 酸奶",
      subtitle: "NAPA VALLEY"
    },
    {
      id: "color-3",
      image: "assets/color-page-bodhisattva.jpg",
      title: "འཇམ་དཔལ། WASHINGTON · 文殊静修",
      subtitle: "WASHINGTON"
    },
    {
      id: "color-4",
      image: "assets/color-page-new-york.jpg",
      title: "དབང་བསྐུར། NEW YORK · 灌顶",
      subtitle: "NEW YORK"
    },
    {
      id: "color-5",
      image: "assets/color-page-confidence.jpg",
      title: "དད་པ། HALIFAX · 信心所依",
      subtitle: "HALIFAX"
    }
  ],
  practiceCounters: [
    {
      id: "practice-refuge",
      title: "皈依发心 / 大礼拜",
      subtitle: "མགོན་སྐྱབས།",
      count: 0,
      target: 100000,
      step: 108
    },
    {
      id: "practice-bodhicitta",
      title: "发菩提心",
      subtitle: "བྱང་ཆུབ་སེམས།",
      count: 0,
      target: 100000,
      step: 108
    },
    {
      id: "practice-vajrasattva",
      title: "金刚萨埵百字明",
      subtitle: "རྡོ་རྗེ་སེམས་དཔའ།",
      count: 0,
      target: 100000,
      step: 108
    },
    {
      id: "practice-mandala",
      title: "供曼扎",
      subtitle: "མཎྜལ།",
      count: 0,
      target: 100000,
      step: 108
    },
    {
      id: "practice-guru-yoga",
      title: "上师瑜伽",
      subtitle: "བླ་མའི་རྣལ་འབྱོར།",
      count: 0,
      target: 100000,
      step: 108
    }
  ],
  pptNotes: [
    {
      id: "ppt-note-template",
      title: "课堂笔记整理模板",
      subtitle: "第 1 课 / 重点页",
      body: "主题：\n核心教言：\n可放入 PPT 的三条要点：\n待复习问题：",
      createdAt: Date.now()
    }
  ]
};

const pageThemeClassNames = [
  "page-sky",
  "page-night",
  "page-kindness1",
  "page-kindness2",
  "page-kindness3",
  "page-kindness4",
  "page-kindness5"
];

const pageThemes = new Set(pageThemeClassNames.map((className) => className.replace("page-", "")));

const pageDecorations = [
  {
    image: "assets/decor-crystal-point.jpg",
    kind: "crystal",
    position: "center 36%",
    size: "148%"
  },
  {
    image: "assets/decor-crystal-stupa.jpg",
    kind: "crystal",
    position: "center 48%",
    size: "118%"
  },
  {
    image: "assets/decor-flower-meadow.jpg",
    kind: "flower",
    position: "center bottom",
    size: "cover"
  },
  {
    image: "assets/decor-flower-rock.jpg",
    kind: "flower",
    position: "left bottom",
    size: "cover"
  },
  {
    image: "assets/decor-flower-white.jpg",
    kind: "flower",
    position: "center bottom",
    size: "cover"
  },
  {
    image: "assets/decor-flower-yellow.jpg",
    kind: "flower",
    position: "center bottom",
    size: "cover"
  },
  {
    image: "assets/decor-star-butterflies.jpg",
    kind: "star",
    position: "center 22%",
    size: "cover"
  },
  {
    image: "assets/decor-star-hanging.jpg",
    kind: "star",
    position: "center 16%",
    size: "cover"
  },
  {
    image: "assets/decor-flower-scroll.jpg",
    kind: "flower",
    position: "center 42%",
    size: "cover"
  },
  {
    image: "assets/decor-flower-garden.jpg",
    kind: "flower",
    position: "center bottom",
    size: "cover"
  }
];

const state = {
  notes: loadNotes(),
  teachingQuotes: loadTeachingQuotes(),
  modules: loadModules(),
  activeId: null,
  filter: "all",
  query: "",
  sort: "updated",
  view: "write",
  saveTimer: null,
  renderTimer: null
};

const notebookPager = {
  pages: [],
  currentIndex: 0,
  scrollFrame: null,
  wheelUntil: 0,
  touchStart: null,
  touchHandled: false,
  turnTimer: null,
  turnSwapTimer: null,
  prevButton: null,
  nextButton: null,
  status: null,
  footerControls: []
};

const els = {
  appShell: document.querySelector(".app-shell"),
  todayLine: document.querySelector("#todayLine"),
  focusPerson: document.querySelector("#focusPerson"),
  focusMeta: document.querySelector("#focusMeta"),
  totalCount: document.querySelector("#totalCount"),
  personCount: document.querySelector("#personCount"),
  tagCount: document.querySelector("#tagCount"),
  searchInput: document.querySelector("#searchInput"),
  tocJumpButton: document.querySelector("#tocJumpButton"),
  newNoteButton: document.querySelector("#newNoteButton"),
  editorNewNoteButton: document.querySelector("#editorNewNoteButton"),
  exportButton: document.querySelector("#exportButton"),
  installButton: document.querySelector("#installButton"),
  typeButtons: [...document.querySelectorAll(".type-button")],
  listTitle: document.querySelector("#listTitle"),
  sortSelect: document.querySelector("#sortSelect"),
  noteToc: document.querySelector("#noteToc"),
  noteList: document.querySelector("#noteList"),
  noteCardTemplate: document.querySelector("#noteCardTemplate"),
  writeViewButton: document.querySelector("#writeViewButton"),
  timelineViewButton: document.querySelector("#timelineViewButton"),
  editorCard: document.querySelector(".editor-card"),
  editorForm: document.querySelector("#editorForm"),
  timelineView: document.querySelector("#timelineView"),
  saveState: document.querySelector("#saveState"),
  pinButton: document.querySelector("#pinButton"),
  deleteButton: document.querySelector("#deleteButton"),
  noteTitle: document.querySelector("#noteTitle"),
  noteType: document.querySelector("#noteType"),
  noteDate: document.querySelector("#noteDate"),
  notePerson: document.querySelector("#notePerson"),
  noteSource: document.querySelector("#noteSource"),
  noteTags: document.querySelector("#noteTags"),
  noteBody: document.querySelector("#noteBody"),
  noteImageInput: document.querySelector("#noteImageInput"),
  noteImageGrid: document.querySelector("#noteImageGrid"),
  pageDecoration: document.querySelector("#pageDecoration"),
  pageThemeButtons: [...document.querySelectorAll(".page-theme-option")],
  memoCalendarPicker: document.querySelector("#memoCalendarPicker"),
  memoCalendarTitle: document.querySelector("#memoCalendarTitle"),
  memoCalendarPreview: document.querySelector("#memoCalendarPreview"),
  memoCalendarDecor: document.querySelector("#memoCalendarDecor"),
  calendarModeButtons: [...document.querySelectorAll(".calendar-mode-button")],
  moduleForms: [...document.querySelectorAll("[data-module-form]")],
  focusGallery: document.querySelector("#focusGallery"),
  portraitGrid: document.querySelector("#portraitGrid"),
  milestoneStrip: document.querySelector("#milestoneStrip"),
  academyMosaic: document.querySelector("#academyMosaic"),
  colorPageStrip: document.querySelector("#colorPageStrip"),
  practiceCounterForm: document.querySelector("#practiceCounterForm"),
  practiceSummary: document.querySelector("#practiceSummary"),
  practiceCounterGrid: document.querySelector("#practiceCounterGrid"),
  pptNoteForm: document.querySelector("#pptNoteForm"),
  pptNoteList: document.querySelector("#pptNoteList")
};

function prepareStaticImages() {
  document.querySelectorAll("img").forEach((image, index) => {
    prepareImage(image, { eager: index === 0 });
  });
}

function prepareImage(image, options = {}) {
  if (!image) return image;
  const eager = Boolean(options.eager);
  image.decoding = "async";
  image.loading = eager ? "eager" : "lazy";
  image.fetchPriority = eager ? "high" : "low";
  return image;
}

init();

function init() {
  prepareStaticImages();
  setupInstallPrompt();
  setupNotebookPager();

  els.todayLine.textContent = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());

  state.activeId = state.notes[0]?.id ?? createNote({ silent: true }).id;
  bindEvents();
  render();
  registerServiceWorker();
  updateInstallButton();
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    scheduleIndexRender();
  });

  els.newNoteButton.addEventListener("click", createAndOpenNote);
  els.editorNewNoteButton?.addEventListener("click", createAndOpenNote);

  els.exportButton.addEventListener("click", exportNotes);
  els.installButton?.addEventListener("click", installApp);
  els.tocJumpButton?.addEventListener("click", () => {
    scrollToNotebookPage(els.noteToc);
  });

  els.pageThemeButtons.forEach((button) => {
    button.addEventListener("click", () => updatePageTheme(button.dataset.pageTheme));
  });

  els.calendarModeButtons.forEach((button) => {
    button.addEventListener("click", () => updateMemoCalendarMode(button.dataset.calendarMode));
  });

  els.noteImageInput.addEventListener("change", addNoteImages);

  els.moduleForms.forEach((form) => {
    form.addEventListener("submit", addModuleItem);
    form.elements.image?.addEventListener("change", () => {
      const file = form.elements.image.files[0];
      if (!file) return;
      setModuleFormStatus(form, `已选择：${file.name}`, "ready");
      if (form.dataset.autoSubmitAfterFile === "true") {
        delete form.dataset.autoSubmitAfterFile;
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
      }
    });
  });
  els.practiceCounterForm?.addEventListener("submit", addPracticeCounter);
  els.pptNoteForm?.addEventListener("submit", addPptNote);

  els.typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openFilter(button.dataset.filter);
    });
  });

  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    scheduleIndexRender();
  });

  els.writeViewButton.addEventListener("click", () => setView("write"));
  els.timelineViewButton.addEventListener("click", () => setView("timeline"));

  bindPageTurn();

  [els.noteTitle, els.noteType, els.noteDate, els.notePerson, els.noteSource, els.noteTags, els.noteBody].forEach((input) => {
    input.addEventListener("input", updateActiveNote);
    input.addEventListener("change", updateActiveNote);
  });

  els.pinButton.addEventListener("click", () => {
    const note = getActiveNote();
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = Date.now();
    scheduleSave();
    render();
  });

  els.deleteButton.addEventListener("click", () => {
    const note = getActiveNote();
    if (!note) return;
    const ok = confirm(`删除「${note.title || "未命名笔记"}」？`);
    if (!ok) return;
    state.notes = state.notes.filter((item) => item.id !== note.id);
    if (!state.notes.length) {
      createNote({ silent: true });
    }
    state.activeId = state.notes[0].id;
    scheduleSave();
    render();
  });
}

function createAndOpenNote() {
  const note = createNote();
  selectNote(note.id);
  scrollToEditor();
}

function setupNotebookPager() {
  if (!els.appShell) return;

  const pageSelectors = [
    ".journey-cover",
    ".note-toc-feature",
    ".teaching-page",
    ".message-page",
    ".notebook-overview-page",
    ".portrait-pages",
    ".event-pages",
    ".academy-gallery",
    ".color-pages",
    ".practice-counter-page",
    ".ppt-organizer-page",
    ".notebook-index-page",
    ".editor-card",
    ".back-cover"
  ];

  notebookPager.pages = pageSelectors
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);

  notebookPager.pages.forEach((page, index) => {
    page.classList.add("notebook-page");
    page.dataset.notebookPage = String(index + 1);
  });

  promoteNotebookPages();

  notebookPager.footerControls = notebookPager.pages.map((page, index) => {
    const controls = createNotebookPageFooter(index);
    page.append(controls.root);
    return controls;
  });

  els.appShell.addEventListener("scroll", scheduleNotebookPagerUpdate, { passive: true });
  els.appShell.addEventListener("wheel", handleNotebookWheel, { passive: false });
  els.appShell.addEventListener("touchstart", handleNotebookTouchStart, { passive: true });
  els.appShell.addEventListener("touchmove", handleNotebookTouchMove, { passive: false });
  els.appShell.addEventListener("touchend", handleNotebookTouchEnd, { passive: false });
  document.addEventListener("keydown", handleNotebookKeys);

  updateNotebookPager();
}

function promoteNotebookPages() {
  if (!els.appShell) return;
  notebookPager.pages.forEach((page) => els.appShell.append(page));
}

function createNotebookPageFooter(index) {
  const controls = document.createElement("nav");
  controls.className = "notebook-page-footer";
  controls.setAttribute("aria-label", "翻页");

  const prevButton = createNotebookPageButton("prev");
  const tocButton = createNotebookPageButton("toc");
  const nextButton = createNotebookPageButton("next");
  const status = document.createElement("span");
  status.className = "notebook-page-status";
  status.setAttribute("aria-live", "polite");

  prevButton.addEventListener("click", () => goToNotebookPage(index - 1));
  tocButton.addEventListener("click", () => goToNotebookPage(getNotebookTocIndex()));
  nextButton.addEventListener("click", () => goToNotebookPage(index + 1));

  controls.append(prevButton, tocButton, nextButton, status);
  return { root: controls, prevButton, tocButton, nextButton, status };
}

function createNotebookPageButton(direction) {
  const button = document.createElement("button");
  const isPrevious = direction === "prev";
  const isToc = direction === "toc";
  button.type = "button";
  button.className = `notebook-page-button ${direction}`;
  button.textContent = isToc ? "目" : isPrevious ? "<" : ">";
  button.title = isToc ? "回到目录" : isPrevious ? "上一页" : "下一页";
  button.setAttribute("aria-label", isToc ? "回到目录" : isPrevious ? "上一页" : "下一页");
  return button;
}

function getNotebookTocIndex() {
  const index = notebookPager.pages.findIndex((page) => page.classList.contains("note-toc-feature"));
  return index >= 0 ? index : 0;
}

function scheduleNotebookPagerUpdate() {
  if (notebookPager.scrollFrame) return;
  notebookPager.scrollFrame = requestAnimationFrame(() => {
    notebookPager.scrollFrame = null;
    updateNotebookPager();
  });
}

function updateNotebookPager() {
  if (!els.appShell || !notebookPager.pages.length) return;
  const width = Math.max(1, els.appShell.clientWidth);
  notebookPager.currentIndex = clamp(Math.round(els.appShell.scrollLeft / width), 0, notebookPager.pages.length - 1);

  if (notebookPager.prevButton) {
    notebookPager.prevButton.disabled = notebookPager.currentIndex === 0;
  }
  if (notebookPager.nextButton) {
    notebookPager.nextButton.disabled = notebookPager.currentIndex === notebookPager.pages.length - 1;
  }
  if (notebookPager.status) {
    notebookPager.status.textContent = `${notebookPager.currentIndex + 1} / ${notebookPager.pages.length}`;
  }
  notebookPager.footerControls.forEach((controls, index) => {
    controls.root.classList.toggle("is-current", index === notebookPager.currentIndex);
    controls.root.classList.toggle("is-toc-page", index === getNotebookTocIndex());
    controls.prevButton.disabled = index === 0;
    controls.tocButton.disabled = index === getNotebookTocIndex();
    controls.nextButton.disabled = index === notebookPager.pages.length - 1;
    controls.status.textContent = `${index + 1} / ${notebookPager.pages.length}`;
  });
  updateTocPageActiveState();
}

function goToNotebookPage(index, options = {}) {
  if (!els.appShell || !notebookPager.pages.length) return;
  const nextIndex = clamp(index, 0, notebookPager.pages.length - 1);
  const page = notebookPager.pages[nextIndex];
  if (!page) return;

  const isCoverTurn = notebookPager.currentIndex === 0 || nextIndex === 0;
  const shouldAnimate = !options.instant && options.animate !== false && isCoverTurn && nextIndex !== notebookPager.currentIndex;
  if (shouldAnimate) {
    animateNotebookPageTurn(notebookPager.currentIndex, nextIndex, options);
    return;
  }

  moveNotebookToPage(page, {
    behavior: options.instant ? "auto" : "smooth",
    resetScroll: options.resetScroll !== false
  });
  notebookPager.currentIndex = nextIndex;
  updateNotebookPager();
}

function moveNotebookToPage(page, options = {}) {
  const previousBehavior = els.appShell.style.scrollBehavior;
  if (options.behavior === "auto") {
    els.appShell.style.scrollBehavior = "auto";
  }
  els.appShell.scrollTo({ left: page.offsetLeft, behavior: options.behavior || "smooth" });
  if (options.resetScroll !== false) {
    page.scrollTo({ top: 0, behavior: "auto" });
  }
  if (options.behavior === "auto") {
    requestAnimationFrame(() => {
      els.appShell.style.scrollBehavior = previousBehavior;
    });
  }
}

function animateNotebookPageTurn(currentIndex, nextIndex, options = {}) {
  const currentPage = notebookPager.pages[currentIndex];
  const nextPage = notebookPager.pages[nextIndex];
  if (!currentPage || !nextPage) return;

  clearTimeout(notebookPager.turnTimer);
  clearTimeout(notebookPager.turnSwapTimer);
  els.appShell.querySelector(".page-turn-ghost")?.remove();

  const direction = nextIndex > currentIndex ? "next" : "prev";
  const ghost = currentPage.cloneNode(true);
  ghost.classList.add("page-turn-ghost", `turn-${direction}`);
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.left = `${els.appShell.scrollLeft}px`;
  els.appShell.append(ghost);
  ghost.scrollTop = currentPage.scrollTop;

  els.appShell.classList.add("book-turning", `book-turning-${direction}`);
  requestAnimationFrame(() => {
    ghost.classList.add("is-turning");
  });

  notebookPager.turnSwapTimer = window.setTimeout(() => {
    moveNotebookToPage(nextPage, {
      behavior: "auto",
      resetScroll: options.resetScroll !== false
    });
    notebookPager.currentIndex = nextIndex;
    updateNotebookPager();
  }, 180);

  notebookPager.turnTimer = window.setTimeout(() => {
    ghost.remove();
    els.appShell.classList.remove("book-turning", `book-turning-${direction}`);
  }, 760);
}

function scrollToNotebookPage(target, options = {}) {
  const element = typeof target === "string" ? document.querySelector(target) : target;
  const page = element?.closest?.(".notebook-page");
  const index = notebookPager.pages.indexOf(page);
  if (index < 0) return false;
  goToNotebookPage(index, options);
  return true;
}

function handleNotebookWheel(event) {
  if (!notebookPager.pages.length || event.defaultPrevented) return;
  const deltaY = event.deltaY;
  if (!deltaY || Math.abs(event.deltaX) > Math.abs(deltaY)) return;

  const page = notebookPager.pages[notebookPager.currentIndex];
  if (!page) return;

  const nestedScroller = findScrollableAncestor(event.target, page);
  if (nestedScroller && canScrollInDirection(nestedScroller, deltaY)) return;
  if (canScrollInDirection(page, deltaY)) return;

  event.preventDefault();
  const now = Date.now();
  if (now < notebookPager.wheelUntil) return;
  notebookPager.wheelUntil = now + 520;
  goToNotebookPage(notebookPager.currentIndex + (deltaY > 0 ? 1 : -1));
}

function handleNotebookTouchStart(event) {
  if (isNotebookSwipeExcluded(event.target)) {
    notebookPager.touchStart = null;
    notebookPager.touchHandled = false;
    return;
  }
  const touch = event.touches[0];
  if (!touch) return;
  notebookPager.touchStart = {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  };
  notebookPager.touchHandled = false;
}

function handleNotebookTouchMove(event) {
  if (!notebookPager.touchStart) return;
  if (notebookPager.touchHandled) {
    event.preventDefault();
    return;
  }
  const touch = event.touches[0];
  if (!touch) return;
  const dx = touch.clientX - notebookPager.touchStart.x;
  const dy = touch.clientY - notebookPager.touchStart.y;
  if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.18) {
    notebookPager.touchHandled = true;
    event.preventDefault();
  }
}

function handleNotebookTouchEnd(event) {
  if (!notebookPager.touchStart) return;
  const touch = event.changedTouches[0];
  if (!touch) {
    notebookPager.touchStart = null;
    notebookPager.touchHandled = false;
    return;
  }
  const dx = touch.clientX - notebookPager.touchStart.x;
  const dy = touch.clientY - notebookPager.touchStart.y;
  const elapsed = Date.now() - notebookPager.touchStart.time;
  notebookPager.touchStart = null;

  if (Math.abs(dx) < 68 || Math.abs(dx) < Math.abs(dy) * 1.18 || elapsed > 900) {
    notebookPager.touchHandled = false;
    return;
  }

  event.preventDefault();
  notebookPager.touchHandled = false;
  goToNotebookPage(notebookPager.currentIndex + (dx < 0 ? 1 : -1));
}

function isNotebookSwipeExcluded(target) {
  const element = target instanceof Element ? target : null;
  return Boolean(
    element?.closest(
      ".editor-card, .photo-film, .event-strip, .page-strip, .page-theme-picker, .note-toc-list, input, textarea, select, button"
    )
  );
}

function handleNotebookKeys(event) {
  if (isEditableTarget(event.target)) return;
  if (event.key === "ArrowRight" || event.key === "PageDown") {
    event.preventDefault();
    goToNotebookPage(notebookPager.currentIndex + 1);
  } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    goToNotebookPage(notebookPager.currentIndex - 1);
  } else if (event.key === "Home") {
    event.preventDefault();
    goToNotebookPage(0);
  } else if (event.key === "End") {
    event.preventDefault();
    goToNotebookPage(notebookPager.pages.length - 1);
  }
}

function findScrollableAncestor(target, stopAt) {
  let element = target instanceof Element ? target : null;
  while (element && element !== stopAt) {
    const style = window.getComputedStyle(element);
    if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 2) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

function canScrollInDirection(element, deltaY) {
  if (!element || element.scrollHeight <= element.clientHeight + 2) return false;
  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 2;
  }
  return element.scrollTop > 2;
}

function isEditableTarget(target) {
  const element = target instanceof Element ? target : null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function bindPageTurn() {
  if (!els.editorCard) return;

  let touchStart = null;

  els.editorCard.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    },
    { passive: true }
  );

  els.editorCard.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      if (!touch) {
        touchStart = null;
        return;
      }

      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      const elapsed = Date.now() - touchStart.time;
      touchStart = null;

      if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.25 || elapsed > 900) return;
      event.preventDefault();
      turnToRelativeNote(dx < 0 ? 1 : -1);
    },
    { passive: false }
  );
}

function turnToRelativeNote(direction) {
  const notes = getFilteredNotes();
  if (notes.length < 2) return;

  const activeIndex = Math.max(0, notes.findIndex((note) => note.id === state.activeId));
  const nextIndex = (activeIndex + direction + notes.length) % notes.length;
  const nextNote = notes[nextIndex];
  if (!nextNote) return;

  const animationClass = direction > 0 ? "page-turn-next" : "page-turn-prev";
  els.editorCard?.classList.remove("page-turn-next", "page-turn-prev");
  requestAnimationFrame(() => {
    els.editorCard?.classList.add(animationClass);
  });

  window.setTimeout(() => {
    selectNote(nextNote.id);
  }, 90);

  window.setTimeout(() => {
    els.editorCard?.classList.remove(animationClass);
  }, 520);
}

function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) {
      const merged = mergeSeedNotes(saved);
      if (JSON.stringify(merged) !== JSON.stringify(saved)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (error) {
    console.warn("Failed to load saved notes", error);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedNotes));
  return seedNotes;
}

function loadTeachingQuotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEACHING_STORAGE_KEY));
    if (Array.isArray(saved)) {
      return saved
        .map((quote) => ({
          id: quote.id || crypto.randomUUID(),
          text: String(quote.text || "").trim(),
          createdAt: quote.createdAt || Date.now()
        }))
        .filter((quote) => quote.text);
    }
  } catch (error) {
    console.warn("Failed to load teaching quotes", error);
  }
  localStorage.setItem(TEACHING_STORAGE_KEY, JSON.stringify(seedTeachingQuotes));
  return seedTeachingQuotes.map((quote) => ({ ...quote }));
}

function saveTeachingQuotes() {
  localStorage.setItem(TEACHING_STORAGE_KEY, JSON.stringify(state.teachingQuotes));
}

function cloneDefaultModules() {
  return Object.fromEntries(Object.entries(defaultModules).map(([key, items]) => [key, items.map((item) => ({ ...item }))]));
}

function loadModules() {
  try {
    const saved = JSON.parse(localStorage.getItem(MODULE_STORAGE_KEY));
    if (saved && typeof saved === "object") {
      return normalizeModules(saved);
    }
  } catch (error) {
    console.warn("Failed to load editable modules", error);
  }
  const modules = cloneDefaultModules();
  localStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(modules));
  return modules;
}

function normalizeModules(saved) {
  const modules = cloneDefaultModules();
  Object.keys(modules).forEach((key) => {
    if (!Array.isArray(saved[key])) return;
    if (key === "milestones") {
      modules[key] = saved[key]
        .map((item, index) => ({
          id: item.id || crypto.randomUUID(),
          title: String(item.title || "").trim(),
          subtitle: String(item.subtitle || "").trim(),
          body: String(item.body || "").trim(),
          tone: item.tone || ["red", "blue", "gold", "green"][index % 4]
        }))
        .filter((item) => item.title || item.body);
      return;
    }
    if (key === "practiceCounters") {
      modules[key] = saved[key]
        .map((item) => ({
          id: item.id || crypto.randomUUID(),
          title: String(item.title || "").trim(),
          subtitle: String(item.subtitle || "").trim(),
          count: Math.max(0, Number(item.count) || 0),
          target: Math.max(1, Number(item.target) || 100000),
          step: Math.max(1, Number(item.step) || 108),
          updatedAt: item.updatedAt || Date.now()
        }))
        .filter((item) => item.title);
      return;
    }
    if (key === "pptNotes") {
      modules[key] = saved[key]
        .map((item) => ({
          id: item.id || crypto.randomUUID(),
          title: String(item.title || "").trim(),
          subtitle: String(item.subtitle || "").trim(),
          body: String(item.body || "").trim(),
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || item.createdAt || Date.now()
        }))
        .filter((item) => item.title || item.body);
      return;
    }
    modules[key] = saved[key]
      .map((item) => ({
        id: item.id || crypto.randomUUID(),
        image: String(item.image || ""),
        title: String(item.title || "").trim(),
        subtitle: String(item.subtitle || "").trim(),
        layout: item.layout || "",
        feature: Boolean(item.feature)
      }))
      .filter((item) => item.image);
  });
  return modules;
}

function saveModules() {
  try {
    localStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(state.modules));
    return true;
  } catch (error) {
    console.warn("Failed to save editable modules", error);
    alert("保存失败。若刚添加了图片，请换一张较小的图片再试。");
    return false;
  }
}

function mergeSeedNotes(saved) {
  const normalizedSaved = saved.map((note) => ({
    ...note,
    person: sanitizePersonName(note.person),
    pageTheme: normalizePageTheme(note.pageTheme),
    calendarMode: note.calendarMode || "gregorian",
    images: Array.isArray(note.images) ? note.images : []
  }));
  const existing = new Set(normalizedSaved.map((note) => `${note.title}|${note.source}`));
  const additions = seedNotes
    .filter((note) => !existing.has(`${note.title}|${note.source}`))
    .map((note) => ({
      ...note,
      id: crypto.randomUUID(),
      tags: [...note.tags],
      images: Array.isArray(note.images) ? note.images : []
    }));
  return [...additions, ...normalizedSaved];
}

function sanitizePersonName(person) {
  const value = String(person || "").trim();
  return value === "晋美彭措法王" ? "" : value;
}

function createNote(options = {}) {
  const now = Date.now();
  const note = {
    id: crypto.randomUUID(),
    type: options.type || (state.filter !== "all" ? state.filter : "diary"),
    title: "",
    person: sanitizePersonName(options.person ?? getActiveNote()?.person ?? ""),
    date: new Date().toISOString().slice(0, 10),
    source: "",
    tags: [],
    body: "",
    images: [],
    pageTheme: "sky",
    calendarMode: "gregorian",
    pinned: false,
    createdAt: now,
    updatedAt: now
  };
  state.notes.unshift(note);
  if (!options.silent) {
    scheduleSave();
  }
  return note;
}

function openFilter(filter) {
  state.filter = filter;

  if (filter === "memo") {
    const memoNote = getActiveNote()?.type === "memo" ? getActiveNote() : state.notes.find((note) => note.type === "memo");
    const note = memoNote || createNote({ type: "memo" });
    state.activeId = note.id;
    setView("write");
    render();
    scrollToEditor();
    return;
  }

  if (filter === "timeline") {
    setView("timeline");
    render();
    scrollToEditor();
    return;
  }

  setView("write");
  render();
}

function scrollToEditor() {
  scrollToNotebookPage(els.editorCard);
}

function selectNote(id) {
  state.activeId = id;
  setView("write");
  render();
}

function setView(view) {
  state.view = view;
  els.writeViewButton.classList.toggle("active", view === "write");
  els.timelineViewButton.classList.toggle("active", view === "timeline");
  els.editorForm.classList.toggle("hidden", view !== "write");
  els.timelineView.classList.toggle("hidden", view !== "timeline");
  renderMemoCalendar(getActiveNote());
  renderTimeline();
}

function updateActiveNote() {
  const note = getActiveNote();
  if (!note) return;
  note.title = els.noteTitle.value;
  note.type = els.noteType.value;
  note.date = els.noteDate.value;
  note.person = els.notePerson.value.trim();
  note.source = els.noteSource.value.trim();
  note.tags = parseTags(els.noteTags.value);
  note.body = els.noteBody.value;
  note.images = Array.isArray(note.images) ? note.images : [];
  note.pageTheme = normalizePageTheme(note.pageTheme);
  note.calendarMode = note.calendarMode || "gregorian";
  note.updatedAt = Date.now();
  scheduleSave();
  scheduleNoteRender(note);
}

function scheduleIndexRender() {
  scheduleRender(() => {
    renderToc();
    renderList();
    renderTimeline();
  });
}

function scheduleNoteRender(note = getActiveNote()) {
  scheduleRender(() => {
    renderMemoCalendar(note);
    renderToc();
    renderList();
    renderStats();
    renderFocus();
    renderTimeline();
  });
}

function scheduleRender(callback) {
  if (state.renderTimer) {
    cancelAnimationFrame(state.renderTimer);
  }
  state.renderTimer = requestAnimationFrame(() => {
    state.renderTimer = null;
    callback();
  });
}

function scheduleSave() {
  els.saveState.textContent = "保存中";
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
      els.saveState.textContent = "已保存";
    } catch (error) {
      console.warn("Failed to save notes", error);
      els.saveState.textContent = "图片过大，保存失败";
    }
  }, 180);
}

function render() {
  els.typeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });

  const titles = {
    all: "ཚང་མ། 全部笔记",
    diary: "ཉིན་ཐོ། 日记",
    reading: "ཀློག་ཐོ། 读书笔记",
    memo: "དྲན་ཐོ། 备忘录",
    timeline: "གདམས་ངག 教言摘录"
  };
  els.listTitle.textContent = titles[state.filter];

  renderEditor();
  renderToc();
  renderList();
  renderStats();
  renderFocus();
  renderModules();
  renderTeachingQuotes();
  setView(state.view);
}

function renderEditor() {
  const note = getActiveNote();
  if (!note) return;
  els.noteTitle.value = note.title;
  els.noteType.value = note.type;
  els.noteDate.value = note.date;
  els.notePerson.value = note.person;
  els.noteSource.value = note.source;
  els.noteTags.value = note.tags.join(", ");
  els.noteBody.value = note.body;
  els.pinButton.classList.toggle("active", note.pinned);
  renderPageTheme(note.pageTheme || "sky");
  renderMemoCalendar(note);
  renderNoteImages(note);
  renderPageDecoration(note);
}

function renderPageDecoration(note) {
  if (!note || !els.pageDecoration) return;
  const seed = hashString(`${note.id}-${note.createdAt || ""}`);
  const decor = pageDecorations[seed % pageDecorations.length];
  const side = Math.floor(seed / pageDecorations.length) % 2 === 0 ? "left" : "right";

  els.pageDecoration.className = `page-decoration ${decor.kind} ${side}`;
  els.pageDecoration.style.backgroundImage = `url("${decor.image}")`;
  els.pageDecoration.style.backgroundPosition = decor.position;
  els.pageDecoration.style.backgroundSize = decor.size;
}

function hashString(value) {
  return [...String(value || "decor")].reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

async function addNoteImages(event) {
  const note = getActiveNote();
  if (!note) return;
  const files = [...event.target.files].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;

  els.saveState.textContent = "读取图片...";
  note.images = Array.isArray(note.images) ? note.images : [];

  try {
    const images = [];
    for (const file of files) {
      images.push({
        id: crypto.randomUUID(),
        src: await readImageFile(file),
        caption: file.name.replace(/\.[^.]+$/, "")
      });
    }
    note.images.push(...images);
    note.updatedAt = Date.now();
    scheduleSave();
    renderNoteImages(note);
    renderToc();
    renderList();
  } catch (error) {
    console.warn("Failed to add note image", error);
    alert("图片读取失败，请换一张再试。");
  } finally {
    event.target.value = "";
  }
}

function renderNoteImages(note) {
  els.noteImageGrid.replaceChildren();
  note.images = Array.isArray(note.images) ? note.images : [];

  if (!note.images.length) {
    const empty = document.createElement("p");
    empty.className = "note-image-empty";
    empty.textContent = "འདྲ་པར་མེད། 还没有插入图片";
    els.noteImageGrid.append(empty);
    return;
  }

  note.images.forEach((imageItem) => {
    const figure = document.createElement("figure");
    figure.className = "note-image-card";

    const image = document.createElement("img");
    image.src = imageItem.src;
    prepareImage(image);
    image.alt = imageItem.caption || "笔记图片";

    const caption = document.createElement("input");
    caption.type = "text";
    caption.value = imageItem.caption || "";
    caption.placeholder = "འགྲེལ་བ། 图片说明";
    caption.addEventListener("input", () => {
      imageItem.caption = caption.value;
      note.updatedAt = Date.now();
      scheduleSave();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "note-image-delete";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => {
      note.images = note.images.filter((item) => item.id !== imageItem.id);
      note.updatedAt = Date.now();
      scheduleSave();
      renderNoteImages(note);
      renderToc();
      renderList();
    });

    figure.append(image, caption, deleteButton);
    els.noteImageGrid.append(figure);
  });
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(String(reader.result));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      });
      image.addEventListener("error", () => resolve(String(reader.result)));
      image.src = String(reader.result);
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function updatePageTheme(theme) {
  const note = getActiveNote();
  if (!note) return;
  const selectedTheme = normalizePageTheme(theme);
  note.pageTheme = selectedTheme;
  note.updatedAt = Date.now();
  renderPageTheme(selectedTheme);
  scheduleSave();
}

function renderPageTheme(theme) {
  const selectedTheme = normalizePageTheme(theme);
  els.editorForm.classList.remove(...pageThemeClassNames);
  els.editorForm.classList.add(`page-${selectedTheme}`);
  els.pageThemeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.pageTheme === selectedTheme);
  });
}

function normalizePageTheme(theme) {
  return pageThemes.has(theme) ? theme : "sky";
}

function updateMemoCalendarMode(mode) {
  const note = getActiveNote();
  if (!note) return;
  note.calendarMode = mode === "tibetan" ? "tibetan" : "gregorian";
  note.updatedAt = Date.now();
  renderMemoCalendar(note);
  scheduleSave();
}

function renderMemoCalendar(note) {
  const isMemo = note?.type === "memo";
  const showCalendar = isMemo && state.view === "write";
  els.memoCalendarPicker.classList.toggle("hidden", !showCalendar);
  els.memoCalendarPreview.classList.toggle("hidden", !showCalendar);

  if (!isMemo) {
    els.noteBody.placeholder = "ཟིན་བྲིས། 记录传记片段、读书摘录、今日感想或待办。";
    return;
  }

  if (!showCalendar) return;

  const mode = note.calendarMode === "tibetan" ? "tibetan" : "gregorian";
  const date = getCalendarDate(note.date);
  els.memoCalendarTitle.textContent = mode === "tibetan" ? "བོད་ཟླ། 藏历日历" : "སྤྱི་ལོ། 公历日历";
  els.memoCalendarPreview.classList.toggle("tibetan", mode === "tibetan");
  els.calendarModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.calendarMode === mode);
  });

  els.noteBody.placeholder =
    mode === "tibetan"
      ? "དྲན་ཐོ། 记录藏历日课、法会、备忘事项。"
      : "དྲན་ཐོ། 记录公历日程、待办、提醒事项。";

  els.memoCalendarPreview.replaceChildren(createCalendarHead(mode, date), createCalendarGrid(mode, date));
}

function createCalendarHead(mode, date) {
  const head = document.createElement("div");
  head.className = "memo-calendar-head";

  const titleWrap = document.createElement("div");
  const kicker = document.createElement("span");
  kicker.textContent = mode === "tibetan" ? "TIBETAN CALENDAR" : "GREGORIAN CALENDAR";
  const title = document.createElement("strong");
  title.textContent =
    mode === "tibetan"
      ? `${date.getFullYear()} · བོད་ཟླའི་དྲན་ཐོ།`
      : new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(date);
  titleWrap.append(kicker, title);

  const small = document.createElement("small");
  small.textContent = mode === "tibetan" ? "ཚེས་གྲངས། 点击初一至三十调动日期" : "གཟའ་འཁོར། 点击日期同步备忘";

  const controls = document.createElement("div");
  controls.className = "memo-calendar-controls";
  controls.append(
    createCalendarControl("‹", "上一月", () => shiftMemoDate(-1)),
    createCalendarControl("今", "回到今天", () => setMemoDate(new Date())),
    createCalendarControl("›", "下一月", () => shiftMemoDate(1))
  );

  head.append(titleWrap, controls, small);
  return head;
}

function createCalendarGrid(mode, date) {
  return mode === "tibetan" ? createTibetanCalendarGrid(date) : createGregorianCalendarGrid(date);
}

function createGregorianCalendarGrid(date) {
  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  weekdays.forEach((weekday) => {
    const cell = document.createElement("div");
    cell.className = "calendar-weekday";
    cell.textContent = weekday;
    grid.append(cell);
  });

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  for (let index = 0; index < leadingBlanks; index += 1) {
    grid.append(createCalendarDay("", "", { empty: true }));
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dayDate = new Date(year, month, day);
    grid.append(
      createCalendarDay(String(day), `ཚེས་${day}`, {
        active: day === date.getDate(),
        onSelect: () => setMemoDate(dayDate)
      })
    );
  }

  return grid;
}

function createTibetanCalendarGrid(date) {
  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  const chineseDays = [
    "初一",
    "初二",
    "初三",
    "初四",
    "初五",
    "初六",
    "初七",
    "初八",
    "初九",
    "初十",
    "十一",
    "十二",
    "十三",
    "十四",
    "十五",
    "十六",
    "十七",
    "十八",
    "十九",
    "二十",
    "廿一",
    "廿二",
    "廿三",
    "廿四",
    "廿五",
    "廿六",
    "廿七",
    "廿八",
    "廿九",
    "三十"
  ];
  const tibetanNumbers = ["༡", "༢", "༣", "༤", "༥", "༦", "༧", "༨", "༩", "༡༠", "༡༡", "༡༢", "༡༣", "༡༤", "༡༥", "༡༦", "༡༧", "༡༨", "༡༩", "༢༠", "༢༡", "༢༢", "༢༣", "༢༤", "༢༥", "༢༦", "༢༧", "༢༨", "༢༩", "༣༠"];

  chineseDays.forEach((day, index) => {
    const dayNumber = index + 1;
    grid.append(
      createCalendarDay(day, `ཚེས་${tibetanNumbers[index]}`, {
        active: dayNumber === Math.min(date.getDate(), 30),
        onSelect: () => setMemoDateFromDay(dayNumber)
      })
    );
  });

  return grid;
}

function createCalendarDay(primary, secondary, options = {}) {
  const cell = document.createElement("div");
  cell.className = "calendar-day";
  cell.classList.toggle("empty", Boolean(options.empty));
  cell.classList.toggle("active", Boolean(options.active));

  if (!options.empty) {
    if (options.onSelect) {
      cell.classList.add("selectable");
      cell.tabIndex = 0;
      cell.setAttribute("role", "button");
      cell.addEventListener("click", options.onSelect);
      cell.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        options.onSelect();
      });
    }
    const strong = document.createElement("strong");
    strong.textContent = primary;
    const span = document.createElement("span");
    span.textContent = secondary;
    cell.append(strong, span);
  }

  return cell;
}

function createCalendarControl(label, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "memo-calendar-control";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function shiftMemoDate(monthDelta) {
  const note = getActiveNote();
  if (!note) return;
  const date = getCalendarDate(note.date);
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + monthDelta;
  const totalDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const nextDate = new Date(targetYear, targetMonth, Math.min(date.getDate(), totalDays));
  setMemoDate(nextDate);
}

function setMemoDateFromDay(dayNumber) {
  const note = getActiveNote();
  if (!note) return;
  const date = getCalendarDate(note.date);
  const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  setMemoDate(new Date(date.getFullYear(), date.getMonth(), Math.min(dayNumber, totalDays)));
}

function setMemoDate(date) {
  const note = getActiveNote();
  if (!note) return;
  note.date = formatDateInput(date);
  note.updatedAt = Date.now();
  els.noteDate.value = note.date;
  scheduleSave();
  scheduleNoteRender(note);
}

function getCalendarDate(value) {
  const fallback = new Date();
  const parsed = value ? new Date(`${value}T00:00:00`) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addTeachingQuote(event, sourceInput) {
  event?.preventDefault();
  const text = normalizeTeachingText(sourceInput?.value);
  if (!text) return;

  state.teachingQuotes.unshift({
    id: crypto.randomUUID(),
    text,
    createdAt: Date.now()
  });
  sourceInput.value = "";
  saveTeachingQuotes();
  renderTeachingQuotes();
}

function deleteTeachingQuote(id) {
  const quote = state.teachingQuotes.find((item) => item.id === id);
  if (!quote) return;
  const ok = confirm(`删除这条教言摘录？\n\n${quote.text}`);
  if (!ok) return;

  state.teachingQuotes = state.teachingQuotes.filter((item) => item.id !== id);
  saveTeachingQuotes();
  renderTeachingQuotes();
}

function normalizeTeachingText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/；/g, "；")
    .trim();
}

function renderTeachingQuotes() {
  if (state.view === "timeline") {
    renderTimeline();
  }
}

function addModuleItem(event) {
  event.preventDefault();
  submitModuleForm(event.currentTarget);
}

function submitModuleForm(form) {
  const moduleKey = form.dataset.moduleForm;
  if (!state.modules[moduleKey]) return;

  if (moduleKey === "milestones") {
    const title = form.elements.title.value.trim();
    const body = form.elements.body.value.trim();
    if (!title && !body) {
      setModuleFormStatus(form, "请先写标题或便签内容", "warn");
      return;
    }

    state.modules.milestones.push({
      id: crypto.randomUUID(),
      subtitle: form.elements.subtitle.value.trim() || "དྲན་ཐོ།",
      title: title || "未命名锚点",
      body,
      tone: ["red", "blue", "gold", "green"][state.modules.milestones.length % 4]
    });
    if (saveModules()) {
      renderModules();
      form.reset();
      setModuleFormStatus(form, "已加入锚点", "done");
    }
    return;
  }

  const file = form.elements.image?.files[0];
  if (!file) {
    setModuleFormStatus(form, "请先选择一张图片", "warn");
    if (form.elements.image) {
      form.dataset.autoSubmitAfterFile = "true";
      form.elements.image.click();
    }
    return;
  }

  setModuleFormStatus(form, "正在处理图片...", "loading");

  readImageFile(file)
    .then((image) => {
      const item = {
        id: crypto.randomUUID(),
        image,
        title: form.elements.title.value.trim() || "ཁ་བྱང་། 新图片",
        subtitle: form.elements.subtitle.value.trim() || "NEW"
      };
      state.modules[moduleKey].push(item);
      if (saveModules()) {
        renderModules();
        form.reset();
        setModuleFormStatus(form, "已加入", "done");
      } else {
        state.modules[moduleKey] = state.modules[moduleKey].filter((entry) => entry.id !== item.id);
        setModuleFormStatus(form, "保存失败，请换一张较小的图片", "warn");
      }
    })
    .catch((error) => {
      console.warn("Failed to add module image", error);
      setModuleFormStatus(form, "图片读取失败，请换一张再试", "warn");
      alert("图片读取失败，请换一张再试。");
    });
}

function setModuleFormStatus(form, message, tone = "") {
  let status = form.querySelector(".module-form-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "module-form-status";
    form.append(status);
  }
  status.textContent = message;
  status.dataset.tone = tone;
}

function renderModules() {
  renderFocusGalleryModule();
  renderPortraitModule();
  renderMilestoneModule();
  renderAcademyModule();
  renderColorPageModule();
  renderPracticeCounters();
  renderPptNotes();
}

function renderFocusGalleryModule() {
  renderEmptyModule(els.focusGallery, "འདྲ་པར་མེད། 暂无不离相册");
  state.modules.focusGallery.forEach((item, index) => {
    const figure = createImageFigure("photo-card", item, "focusGallery");
    figure.classList.toggle("large", item.feature || index === 0);
    els.focusGallery.append(figure);
  });
}

function renderPortraitModule() {
  renderEmptyModule(els.portraitGrid, "འདྲ་པར་མེད། 暂无影集");
  state.modules.portraits.forEach((item, index) => {
    const figure = createImageFigure("portrait-card", item, "portraits");
    figure.classList.toggle("feature", item.feature || index === 0);
    els.portraitGrid.append(figure);
  });
}

function renderAcademyModule() {
  renderEmptyModule(els.academyMosaic, "ཕ་ཡུལ་གྱི་པར་མེད། 暂无家乡风光");
  state.modules.academy.forEach((item) => {
    const figure = createImageFigure("academy-item", item, "academy");
    if (item.layout) figure.classList.add(item.layout);
    els.academyMosaic.append(figure);
  });
}

function renderColorPageModule() {
  renderEmptyModule(els.colorPageStrip, "ཚོན་ལྡན་ཤོག་ངོས་མེད། 暂无彩页");
  state.modules.colorPages.forEach((item) => {
    els.colorPageStrip.append(createImageFigure("insert-page", item, "colorPages"));
  });
}

function renderMilestoneModule() {
  renderEmptyModule(els.milestoneStrip, "ལོ་ཟླའི་གནད་མེད། 暂无岁月锚点");
  state.modules.milestones.forEach((item, index) => {
    els.milestoneStrip.append(createMilestoneCard(item, index));
  });
}

function renderPracticeCounters() {
  if (!els.practiceCounterGrid || !els.practiceSummary) return;
  els.practiceCounterGrid.replaceChildren();

  const total = state.modules.practiceCounters.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const target = state.modules.practiceCounters.reduce((sum, item) => sum + (Number(item.target) || 0), 0);
  els.practiceSummary.textContent = `总计 ${formatNumber(total)} / ${formatNumber(target)} · ${state.modules.practiceCounters.length} 项功课`;

  if (!state.modules.practiceCounters.length) {
    const empty = document.createElement("div");
    empty.className = "module-empty";
    empty.textContent = "暂无计数功课，可先添加一项。";
    els.practiceCounterGrid.append(empty);
    return;
  }

  state.modules.practiceCounters.forEach((item) => {
    els.practiceCounterGrid.append(createPracticeCounterCard(item));
  });
}

function createPracticeCounterCard(item) {
  const card = document.createElement("article");
  card.className = "practice-counter-card";

  const head = document.createElement("div");
  head.className = "practice-counter-head";
  const titleWrap = document.createElement("div");
  const subtitle = document.createElement("span");
  subtitle.textContent = item.subtitle || "སྔོན་འགྲོ།";
  const title = document.createElement("strong");
  title.textContent = item.title || "未命名功课";
  titleWrap.append(subtitle, title);
  const count = document.createElement("b");
  count.textContent = formatNumber(item.count);
  head.append(titleWrap, count);

  const progress = document.createElement("div");
  progress.className = "practice-progress";
  const bar = document.createElement("span");
  const percent = item.target ? Math.min(100, Math.round((item.count / item.target) * 100)) : 0;
  bar.style.width = `${percent}%`;
  progress.append(bar);

  const meta = document.createElement("p");
  meta.textContent = `目标 ${formatNumber(item.target)} · ${percent}% · 每次 +${formatNumber(item.step)}`;

  const actions = document.createElement("div");
  actions.className = "practice-counter-actions";
  actions.append(
    createActionButton(`+${item.step}`, () => updatePracticeCounter(item.id, item.step)),
    createActionButton("+1", () => updatePracticeCounter(item.id, 1)),
    createActionButton("-1", () => updatePracticeCounter(item.id, -1)),
    createActionButton("目标", () => editPracticeCounter(item.id)),
    createActionButton("清零", () => resetPracticeCounter(item.id), "danger"),
    createActionButton("删除", () => deleteModuleItem("practiceCounters", item.id), "danger")
  );

  card.append(head, progress, meta, actions);
  return card;
}

function addPracticeCounter(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.elements.title.value.trim();
  if (!title) return;

  state.modules.practiceCounters.push({
    id: crypto.randomUUID(),
    title,
    subtitle: "自定义",
    count: 0,
    target: Math.max(1, Number(form.elements.target.value) || 100000),
    step: Math.max(1, Number(form.elements.step.value) || 108),
    updatedAt: Date.now()
  });
  if (saveModules()) {
    form.reset();
    renderPracticeCounters();
  }
}

function updatePracticeCounter(id, delta) {
  const item = findModuleItem("practiceCounters", id);
  if (!item) return;
  item.count = Math.max(0, (Number(item.count) || 0) + delta);
  item.updatedAt = Date.now();
  if (saveModules()) renderPracticeCounters();
}

function editPracticeCounter(id) {
  const item = findModuleItem("practiceCounters", id);
  if (!item) return;
  const target = prompt("修改目标数量", String(item.target || 100000));
  if (target === null) return;
  const step = prompt("修改每次增加数量", String(item.step || 108));
  if (step === null) return;
  item.target = Math.max(1, Number(target) || item.target || 100000);
  item.step = Math.max(1, Number(step) || item.step || 108);
  item.updatedAt = Date.now();
  if (saveModules()) renderPracticeCounters();
}

function resetPracticeCounter(id) {
  const item = findModuleItem("practiceCounters", id);
  if (!item) return;
  const ok = confirm(`清零「${item.title}」的计数？`);
  if (!ok) return;
  item.count = 0;
  item.updatedAt = Date.now();
  if (saveModules()) renderPracticeCounters();
}

function renderPptNotes() {
  if (!els.pptNoteList) return;
  els.pptNoteList.replaceChildren();

  if (!state.modules.pptNotes.length) {
    const empty = document.createElement("div");
    empty.className = "module-empty";
    empty.textContent = "暂无课堂整理，可先加入一条。";
    els.pptNoteList.append(empty);
    return;
  }

  state.modules.pptNotes.forEach((item) => {
    els.pptNoteList.append(createPptNoteCard(item));
  });
}

function createPptNoteCard(item) {
  const article = document.createElement("article");
  article.className = "ppt-note-card";
  article.dataset.moduleKey = "pptNotes";
  article.dataset.moduleId = item.id;

  const head = document.createElement("div");
  head.className = "ppt-note-head";
  const title = document.createElement("h3");
  title.textContent = item.title || "未命名整理";
  const subtitle = document.createElement("span");
  subtitle.textContent = item.subtitle || "课堂笔记";
  head.append(title, subtitle);

  const body = document.createElement("p");
  body.textContent = item.body || " ";

  const actions = document.createElement("div");
  actions.className = "ppt-note-actions";
  actions.append(
    createActionButton("改字", () => editPptNote(item.id)),
    createActionButton("复制", () => copyPptNote(item.id)),
    createActionButton("删除", () => deleteModuleItem("pptNotes", item.id), "danger")
  );

  article.append(head, body, actions);
  return article;
}

function addPptNote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.elements.title.value.trim();
  const body = form.elements.body.value.trim();
  if (!title && !body) return;

  state.modules.pptNotes.unshift({
    id: crypto.randomUUID(),
    title: title || "未命名课堂整理",
    subtitle: form.elements.subtitle.value.trim(),
    body,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  if (saveModules()) {
    form.reset();
    renderPptNotes();
  }
}

function editPptNote(id) {
  const item = findModuleItem("pptNotes", id);
  if (!item) return;
  const title = prompt("修改课程 / 主题", item.title || "");
  if (title === null) return;
  const subtitle = prompt("修改课次 / 页码 / 日期", item.subtitle || "");
  if (subtitle === null) return;
  const body = prompt("修改PPT整理内容", item.body || "");
  if (body === null) return;
  item.title = title.trim() || item.title;
  item.subtitle = subtitle.trim();
  item.body = body.trim();
  item.updatedAt = Date.now();
  if (saveModules()) renderPptNotes();
}

function copyPptNote(id) {
  const item = findModuleItem("pptNotes", id);
  if (!item) return;
  const text = formatPptNoteForCopy(item);
  copyText(text);
}

function formatPptNoteForCopy(item) {
  const lines = String(item.body || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith("-") ? line : `- ${line}`));
  return [`# ${item.title || "课堂整理"}`, item.subtitle ? `## ${item.subtitle}` : "", ...lines].filter(Boolean).join("\n");
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => alert("已复制，可粘贴到 PPT 备注或大纲。")).catch(() => fallbackCopyText(text));
    return;
  }
  fallbackCopyText(text);
}

function fallbackCopyText(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  try {
    document.execCommand("copy");
    alert("已复制，可粘贴到 PPT 备注或大纲。");
  } catch (error) {
    prompt("复制下面内容到 PPT", text);
  }
  area.remove();
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value) || 0);
}

function renderEmptyModule(container, text) {
  container.replaceChildren();
  const moduleKey =
    container === els.focusGallery
      ? "focusGallery"
      : container === els.portraitGrid
      ? "portraits"
      : container === els.milestoneStrip
        ? "milestones"
        : container === els.academyMosaic
          ? "academy"
          : container === els.colorPageStrip
            ? "colorPages"
            : container === els.practiceCounterGrid
              ? "practiceCounters"
              : "pptNotes";
  if (state.modules[moduleKey]?.length) return;
  const empty = document.createElement("div");
  empty.className = "module-empty";
  empty.textContent = text;
  container.append(empty);
}

function createImageFigure(className, item, moduleKey) {
  const figure = document.createElement("figure");
  figure.className = className;
  figure.dataset.moduleKey = moduleKey;
  figure.dataset.moduleId = item.id;

  const image = document.createElement("img");
  image.src = item.image;
  prepareImage(image);
  image.alt = item.title || item.subtitle || "module image";

  const caption = document.createElement("figcaption");
  const subtitle = document.createElement("span");
  subtitle.textContent = item.subtitle || "";
  const title = document.createElement("strong");
  title.textContent = item.title || "未命名";
  caption.append(subtitle, title);

  figure.append(image, caption, createModuleActions(moduleKey, item.id));
  return figure;
}

function createMilestoneCard(item, index) {
  const article = document.createElement("article");
  article.className = `event-card milestone-note ${item.tone || ["red", "blue", "gold", "green"][index % 4]}`;

  const subtitle = document.createElement("span");
  subtitle.textContent = item.subtitle || "དྲན་ཐོ།";
  const title = document.createElement("h3");
  title.textContent = item.title || "未命名锚点";
  const body = document.createElement("p");
  body.textContent = item.body || " ";

  article.append(subtitle, title, body, createMilestoneActions(item.id));
  return article;
}

function createMilestoneActions(id) {
  const actions = document.createElement("div");
  actions.className = "module-actions milestone-actions";
  actions.append(
    createActionButton("改字", () => renameMilestoneItem(id)),
    createActionButton("删除", () => deleteModuleItem("milestones", id), "danger")
  );
  return actions;
}

function createModuleActions(moduleKey, id) {
  const actions = document.createElement("div");
  actions.className = "module-actions";
  actions.append(
    createActionButton("改字", () => renameModuleItem(moduleKey, id)),
    createActionButton("换图", () => replaceModuleImage(moduleKey, id)),
    createActionButton("删除", () => deleteModuleItem(moduleKey, id), "danger")
  );
  return actions;
}

function createActionButton(label, onClick, tone = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `module-action-button ${tone}`.trim();
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renameModuleItem(moduleKey, id) {
  if (moduleKey === "milestones") {
    renameMilestoneItem(id);
    return;
  }
  const item = findModuleItem(moduleKey, id);
  if (!item) return;
  const host = document.querySelector(`[data-module-key="${moduleKey}"][data-module-id="${id}"]`);
  if (!host) return;

  const existingEditor = host.querySelector(".module-inline-editor");
  if (existingEditor) {
    existingEditor.querySelector("input")?.focus();
    return;
  }

  const editor = document.createElement("form");
  editor.className = "module-inline-editor";

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.value = item.title || "";
  titleInput.placeholder = "标题";

  const subtitleInput = document.createElement("input");
  subtitleInput.type = "text";
  subtitleInput.value = item.subtitle || "";
  subtitleInput.placeholder = "小标题";

  const actions = document.createElement("div");
  actions.className = "module-inline-editor-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.textContent = "保存";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "cancel";
  cancelButton.textContent = "取消";
  cancelButton.addEventListener("click", () => editor.remove());

  actions.append(saveButton, cancelButton);
  editor.append(titleInput, subtitleInput, actions);
  editor.addEventListener("submit", (event) => {
    event.preventDefault();
    const previous = { title: item.title, subtitle: item.subtitle };
    item.title = titleInput.value.trim() || item.title;
    item.subtitle = subtitleInput.value.trim();
    if (saveModules()) {
      renderModules();
    } else {
      item.title = previous.title;
      item.subtitle = previous.subtitle;
    }
  });

  host.append(editor);
  titleInput.focus();
  titleInput.select();
}

function renameMilestoneItem(id) {
  const item = findModuleItem("milestones", id);
  if (!item) return;
  const subtitle = prompt("修改年份 / 锚点", item.subtitle || "");
  if (subtitle === null) return;
  const title = prompt("修改标题", item.title || "");
  if (title === null) return;
  const body = prompt("修改便签内容", item.body || "");
  if (body === null) return;

  item.subtitle = subtitle.trim() || item.subtitle;
  item.title = title.trim() || item.title;
  item.body = body.trim();
  saveModules();
  renderModules();
}

function replaceModuleImage(moduleKey, id) {
  const item = findModuleItem(moduleKey, id);
  if (!item) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    item.image = await readImageFile(file);
    saveModules();
    renderModules();
  });
  input.click();
}

function deleteModuleItem(moduleKey, id) {
  const item = findModuleItem(moduleKey, id);
  if (!item) return;
  const ok = confirm(`删除「${item.title || "这个条目"}」？`);
  if (!ok) return;
  state.modules[moduleKey] = state.modules[moduleKey].filter((entry) => entry.id !== id);
  saveModules();
  renderModules();
}

function findModuleItem(moduleKey, id) {
  return state.modules[moduleKey]?.find((item) => item.id === id);
}

function renderTeachingQuoteList(container, options = {}) {
  container.replaceChildren();

  if (!state.teachingQuotes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "还没有教言摘录，可以先添加一条。";
    container.append(empty);
    return;
  }

  state.teachingQuotes.forEach((quote) => {
    container.append(createTeachingQuoteCard(quote, options));
  });
}

function createTeachingQuoteCard(quote, options = {}) {
  const card = document.createElement("blockquote");
  card.className = "teaching-quote";

  const text = document.createElement("p");
  text.textContent = quote.text;
  card.append(text);

  if (options.editable) {
    const button = document.createElement("button");
    button.className = "teaching-delete-button";
    button.type = "button";
    button.textContent = "删除";
    button.addEventListener("click", () => deleteTeachingQuote(quote.id));
    card.append(button);
  }

  return card;
}

function createTeachingQuoteForm() {
  const form = document.createElement("form");
  form.className = "teaching-quote-form compact";
  const input = document.createElement("textarea");
  input.placeholder = "གདམས་ངག 请输入新的教言摘录";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "加入摘录";
  form.append(input, button);
  form.addEventListener("submit", (event) => addTeachingQuote(event, input));
  return form;
}

function renderToc() {
  if (!els.noteToc) return;

  const notes = getFilteredNotes();
  const pages = getNotebookPageCatalog();
  els.noteToc.replaceChildren();

  const head = document.createElement("div");
  head.className = "note-toc-head";
  const titleWrap = document.createElement("div");
  const eyebrow = document.createElement("span");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Auto Catalog";
  const title = document.createElement("strong");
  title.textContent = "目录";
  titleWrap.append(eyebrow, title);
  const count = document.createElement("span");
  count.className = "note-toc-count";
  count.textContent = `${pages.length} 页 · ${notes.length} 篇`;
  head.append(titleWrap, count);

  const pageSection = createTocSection("页面目录", `${pages.length} 页`);
  const pageList = pageSection.querySelector(".note-toc-list");
  pages.forEach((entry) => {
    pageList.append(createPageTocItem(entry));
  });

  const noteSection = createTocSection("笔记目录", `${notes.length} 篇`);
  const noteList = noteSection.querySelector(".note-toc-list");
  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "note-toc-empty";
    empty.textContent = "写下内容后，这里会自动生成笔记目录。";
    noteList.append(empty);
  } else {
    notes.forEach((note, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "note-toc-item";
      item.classList.toggle("active", note.id === state.activeId);
      item.addEventListener("click", () => {
        selectNote(note.id);
        scrollToEditor();
      });

      const order = document.createElement("span");
      order.className = "note-toc-order";
      order.textContent = String(index + 1).padStart(2, "0");

      const content = document.createElement("span");
      content.className = "note-toc-content";
      const itemTitle = document.createElement("strong");
      itemTitle.textContent = getNoteDisplayTitle(note);
      const meta = document.createElement("small");
      meta.textContent = `${note.date || "未定日期"} · ${typeLabels[note.type] || "笔记"}${note.images?.length ? ` · ${note.images.length} 图` : ""}`;
      content.append(itemTitle, meta);

      item.append(order, content);
      noteList.append(item);
    });
  }

  els.noteToc.append(head, pageSection, noteSection);
  updateTocPageActiveState();
}

function createTocSection(titleText, countText) {
  const section = document.createElement("section");
  section.className = "note-toc-section";

  const title = document.createElement("div");
  title.className = "note-toc-section-title";
  const strong = document.createElement("strong");
  strong.textContent = titleText;
  const count = document.createElement("span");
  count.textContent = countText;
  title.append(strong, count);

  const list = document.createElement("div");
  list.className = "note-toc-list";
  section.append(title, list);
  return section;
}

function createPageTocItem(entry) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "note-toc-item page-toc-item";
  item.dataset.tocPageIndex = String(entry.index);
  item.addEventListener("click", () => goToNotebookPage(entry.index));

  const order = document.createElement("span");
  order.className = "note-toc-order";
  order.textContent = String(entry.index + 1).padStart(2, "0");

  const content = document.createElement("span");
  content.className = "note-toc-content";
  const title = document.createElement("strong");
  title.textContent = entry.title;
  const meta = document.createElement("small");
  meta.textContent = entry.meta;
  content.append(title, meta);

  item.append(order, content);
  return item;
}

function getNotebookPageCatalog() {
  return notebookPager.pages.map((page, index) => ({
    index,
    title: getNotebookPageTitle(page, index),
    meta: getNotebookPageMeta(page, index)
  }));
}

function getNotebookPageTitle(page, index) {
  const fixedTitles = [
    ["journey-cover", "封面"],
    ["note-toc-feature", "目录"],
    ["teaching-page", "扉页一：莫舍己道"],
    ["message-page", "扉页二：叮咛"],
    ["notebook-overview-page", "不离"],
    ["portrait-pages", "法相庄严"],
    ["event-pages", "岁月锚点"],
    ["academy-gallery", "家乡风光"],
    ["color-pages", "彩页"],
    ["practice-counter-page", "五加行计数"],
    ["ppt-organizer-page", "PPT整理"],
    ["notebook-index-page", "笔记索引"],
    ["editor-card", "笔记编辑"],
    ["back-cover", "尾页"]
  ];
  const matched = fixedTitles.find(([className]) => page.classList.contains(className));
  if (matched) return matched[1];

  const label =
    page.getAttribute("aria-label") ||
    page.querySelector("[aria-label]")?.getAttribute("aria-label") ||
    page.querySelector(".section-head h2, h2, .flyleaf-kicker")?.textContent ||
    "";
  return normalizeTocText(label) || `第 ${index + 1} 页`;
}

function getNotebookPageMeta(page, index) {
  const label = normalizeTocText(page.getAttribute("aria-label"));
  return `${String(index + 1).padStart(2, "0")} / ${notebookPager.pages.length}${label ? ` · ${label}` : " · 固定页面"}`;
}

function normalizeTocText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function updateTocPageActiveState() {
  els.noteToc?.querySelectorAll("[data-toc-page-index]").forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.tocPageIndex) === notebookPager.currentIndex);
  });
}

function getNoteDisplayTitle(note) {
  const title = String(note.title || "").trim();
  if (title) return title;
  const body = String(note.body || "").replace(/\s+/g, " ").trim();
  if (body) return body.slice(0, 18);
  return "未命名笔记";
}

function renderList() {
  const notes = getFilteredNotes();
  els.noteList.replaceChildren();

  if (!notes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "没有匹配的笔记";
    els.noteList.append(empty);
    return;
  }

  notes.forEach((note) => {
    const fragment = els.noteCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".note-card");
    const button = fragment.querySelector(".note-card-button");
    const type = fragment.querySelector(".type-pill");
    const date = fragment.querySelector(".note-date");
    const title = fragment.querySelector("h3");
    const body = fragment.querySelector("p");
    const person = fragment.querySelector(".person-chip");
    const pin = fragment.querySelector(".pin-chip");

    card.classList.toggle("active", note.id === state.activeId);
    type.textContent = typeLabels[note.type];
    type.classList.add(note.type);
    date.textContent = displayDate(note.date);
    title.textContent = note.title || "未命名笔记";
    body.textContent = note.body || note.source || " ";
    person.textContent = note.person || "";
    pin.classList.toggle("hidden", !note.pinned);
    button.addEventListener("click", () => {
      selectNote(note.id);
      scrollToEditor();
    });
    els.noteList.append(fragment);
  });
}

function renderStats() {
  const people = new Set(state.notes.map((note) => note.person).filter(Boolean));
  const tags = new Set(state.notes.flatMap((note) => note.tags));
  els.totalCount.textContent = state.notes.length;
  els.personCount.textContent = people.size;
  els.tagCount.textContent = tags.size;
}

function renderFocus() {
  const note = getActiveNote();
  const person = sanitizePersonName(note?.person);
  const relatedNotes = person ? state.notes.filter((item) => sanitizePersonName(item.person) === person) : state.notes;
  const count = relatedNotes.length;
  const latest = [...relatedNotes].sort((a, b) => b.updatedAt - a.updatedAt)[0];

  els.focusPerson.setAttribute("aria-label", "不离");
  els.focusMeta.textContent = `ཟིན་བྲིས། ${count} 篇笔记${latest ? ` · 最近 ${displayDate(latest.date)}` : ""}`;
}

function renderTimeline() {
  if (state.view !== "timeline") return;
  els.timelineView.replaceChildren();
  const intro = document.createElement("div");
  intro.className = "teaching-manager-intro";
  intro.innerHTML = "<span>གདམས་ངག</span><strong>教言摘录彩页</strong><p>这里的内容会同步到上方彩页，可继续添加，也可删除不需要的条目。</p>";

  const form = createTeachingQuoteForm();
  const list = document.createElement("div");
  list.className = "teaching-quote-grid manager";
  renderTeachingQuoteList(list, { editable: true });

  els.timelineView.append(intro, form, list);
}

function getActiveNote() {
  return state.notes.find((note) => note.id === state.activeId);
}

function getFilteredNotes() {
  return state.notes
    .filter((note) => state.filter === "all" || note.type === state.filter)
    .filter((note) => {
      if (!state.query) return true;
      const haystack = [
        note.title,
        note.person,
        note.source,
        note.tags.join(" "),
        note.body,
        typeLabels[note.type]
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(state.query);
    })
    .sort(sortNotes);
}

function sortNotes(a, b) {
  if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
  if (state.sort === "dateDesc") return b.date.localeCompare(a.date);
  if (state.sort === "dateAsc") return a.date.localeCompare(b.date);
  if (state.sort === "title") return (a.title || "未命名笔记").localeCompare(b.title || "未命名笔记", "zh-CN");
  return b.updatedAt - a.updatedAt;
}

function parseTags(value) {
  return value
    .split(/[,，、\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function displayDate(value) {
  if (!value) return "无日期";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(parsed);
}

function exportNotes() {
  const data = {
    exportedAt: new Date().toISOString(),
    appName: "不离手账",
    notes: state.notes,
    teachingQuotes: state.teachingQuotes,
    modules: state.modules
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `不离手账-完整备份-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

function setupInstallPrompt() {
  if (setupInstallPrompt.done) return;
  setupInstallPrompt.done = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateInstallButton();
  });
}

function isInstalledApp() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function updateInstallButton() {
  if (!els.installButton) return;
  els.installButton.hidden = isInstalledApp();
}

async function installApp() {
  if (isInstalledApp()) {
    updateInstallButton();
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    updateInstallButton();
    return;
  }

  alert("安卓 Chrome：点右上角菜单，选择“添加到主屏幕”或“安装应用”。\n苹果 Safari：点分享按钮，选择“添加到主屏幕”。\n请使用 HTTPS 地址或 localhost 打开，file:// 页面不能安装。");
}
