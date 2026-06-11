/* ============================================================================
 * 不离手账 · app.js  —— 代码结构导航（仅注释，便于长期维护）
 * 完整架构与维护说明见仓库内《代码审核报告.md》。
 *
 * 本文件历史上是「核心实现 + 多层追加补丁」累积而成，按出现顺序大致分为：
 *   ① 核心层（约 1–4860 行）
 *        常量 / 种子数据 / state / DOM 引用 els / 事件绑定 bindEvents /
 *        翻页器 notebookPager / 笔记增删改查 / 供灯 / 壁纸 / 课堂(ppt) / 导出 / PWA
 *   ② 补丁层一（约 4865–5375 行）「分类空白页模板 2026-06-08」(IIFE)
 *        包裹 createNote / renderEditor，并在其后顶层重新声明壁纸上传函数
 *        （覆盖核心层旧版；旧版死代码已删除）
 *   ③ 补丁层二（约 5376–5775 行）「Buli Complete Logic Fix」(IIFE)
 *        重写 笔记索引 / 编辑器增强 / 课堂整理，暴露 window.BuliEnhance
 *   ④ 补丁层三（约 5776–6520 行）「功课·一生账本」
 *        计数台账 logPracticeSession / 总览 / 时间线 / 加行预设 / 备份恢复
 *   ⑤ 补丁层四（约 6520 行至末尾）笔记年份筛选 + 数据管家 DataSteward
 *
 * ⚠ 维护提醒：补丁层多处以「重新赋值/重新声明」覆盖核心函数，对加载顺序敏感。
 *   新增功能时请勿再往文件末尾“追加补丁覆盖”，应直接修改对应核心函数，
 *   或新增独立、互不覆盖的函数；改动后务必在真机(安卓 Chrome / iOS Safari)实测。
 * ========================================================================== */

const STORAGE_KEY = "jigmeyPhuntsokNotebook.v5";
const TEACHING_STORAGE_KEY = "jigmeyPhuntsokTeachings.v1";
const MODULE_STORAGE_KEY = "jigmeyPhuntsokModules.v1";
const OFFERING_LAMP_STORAGE_KEY = "buliOfferingLamp.v1";
const OFFERING_LAMP_COUNT_STORAGE_KEY = "buliOfferingLampCount.v1";
const OFFERING_BUDDHA_WALL_STORAGE_KEY = "buliOfferingBuddhaWall.v1";
const BLOOM_GARDEN_PHOTOS_STORAGE_KEY = "buliBloomGardenPhotos.v1";
const PAGE_WALLPAPER_STORAGE_KEY = "buliPageWallpapers.v2";
const PPT_DEFAULT_PROJECT_ID = "ppt-project-default";
const TEACHING_DEFAULT_TEACHER = "晋美彭措法王";
const PPT_NOTE_STATUS_OPTIONS = [
  { id: "capture", label: "速记", action: "标为整理中" },
  { id: "organizing", label: "整理中", action: "标为待复习" },
  { id: "review", label: "待复习", action: "标为完成" },
  { id: "done", label: "已完成", action: "重新整理" }
];
const PPT_NOTE_STATUS_IDS = new Set(PPT_NOTE_STATUS_OPTIONS.map((item) => item.id));
const PPT_NOTE_TEMPLATES = {
  outline: {
    label: "提纲",
    body: "主题：\n出处 / 教材：\n核心教言：\n\n一、背景\n-\n\n二、要点\n-\n\n三、可落实的行动\n-\n\n待确认：\n-"
  },
  cornell: {
    label: "康奈尔",
    body: "线索 / 提问：\n-\n\n笔记区：\n-\n\n课后总结：\n-"
  },
  review: {
    label: "复习",
    body: "今日三条收获：\n1. \n2. \n3. \n\n待复习问题：\n-\n\n下一步：\n-"
  },
  slides: {
    label: "课件",
    body: "可整理成课件：\n封面标题：\n\n三页大纲：\n1. \n2. \n3. \n\n引用原文：\n-\n\n结尾提醒：\n-"
  }
};
const NOTE_BODY_TEMPLATES = {
  daily: {
    label: "日记提纲",
    body: "今日所见：\n-\n\n心里想记住的一句：\n-\n\n可以落实的一件小事：\n-"
  },
  reading: {
    label: "读书摘录",
    body: "书名 / 讲记：\n页码 / 章节：\n\n摘录：\n「」\n\n我的理解：\n-\n\n待复习：\n-"
  },
  teaching: {
    label: "教言整理",
    body: "教言原文：\n「」\n\n人物 / 来源：\n\n关键词：\n-\n\n落到修行：\n-"
  }
};

let deferredInstallPrompt = null;

const typeLabels = {
  diary: "ཉིན་ཐོ། 日记",
  reading: "ཀློག་ཐོ། 读书",
  memo: "དྲན་ཐོ། 备忘",
  timeline: "གདམས་ངག 教言"
};

const seedNotes = [];
const OFFERING_DEFAULT_BUDDHA_IMAGES = ["assets/offering-buddha-bg.jpg"];

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
  teacher: TEACHING_DEFAULT_TEACHER,
  createdAt: Date.now() - index
}));

const defaultModules = {
  focusGallery: [
    {
      id: "focus-gallery-1",
      image: "assets/larung-real-panorama.jpg",
      title: "夜色山谷",
      subtitle: "喇荣",
      feature: true
    },
    {
      id: "focus-gallery-2",
      image: "assets/larung-real-lights.jpg",
      title: "灯火红屋",
      subtitle: "灯火"
    },
    {
      id: "focus-gallery-3",
      image: "assets/larung-real-snow.jpg",
      title: "雪落山坡",
      subtitle: "雪景"
    }
  ],
  portraits: [
    {
      id: "portrait-1",
      image: "assets/fawang-portrait-seat.jpg",
      title: "ཡིད་བཞིན་ནོར་བུ། 法王如意宝",
      subtitle: "如意宝",
      feature: true
    },
    {
      id: "portrait-2",
      image: "assets/fawang-langlang-mountain.jpg",
      title: "ལྷ་རི། 朗朗神山",
      subtitle: "朗朗神山"
    },
    {
      id: "portrait-3",
      image: "assets/fawang-radiance.jpg",
      title: "འོད་གསལ། 光明留影",
      subtitle: "加持"
    }
  ],
  academy: [
    {
      id: "academy-1",
      image: "assets/larung-real-stairs-night.jpg",
      title: "བླ་རུང་། 夜色阶梯",
      subtitle: "喇荣",
      layout: "tall"
    },
    {
      id: "academy-2",
      image: "assets/larung-real-temple-mist.jpg",
      title: "སྨུག་པ། 晨雾寺院",
      subtitle: "晨雾"
    },
    {
      id: "academy-3",
      image: "assets/larung-real-red-valley.jpg",
      title: "རི་ཁྲོད། 红色山谷",
      subtitle: "山谷"
    },
    {
      id: "academy-4",
      image: "assets/larung-real-snow.jpg",
      title: "ཁ་བ། 雪景红屋",
      subtitle: "雪景",
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
      title: "ན་བཟའ། 红衣",
      subtitle: "红衣"
    },
    {
      id: "color-2",
      image: "assets/color-page-yogurt.jpg",
      title: "ཞོ། 酸奶",
      subtitle: "酸奶"
    },
    {
      id: "color-3",
      image: "assets/color-page-bodhisattva.jpg",
      title: "འཇམ་དཔལ། 文殊静修",
      subtitle: "文殊静修"
    },
    {
      id: "color-4",
      image: "assets/color-page-new-york.jpg",
      title: "དབང་བསྐུར། 灌顶",
      subtitle: "灌顶"
    },
    {
      id: "color-5",
      image: "assets/color-page-confidence.jpg",
      title: "དད་པ། 信心所依",
      subtitle: "信心所依"
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
  pptProjects: [
    {
      id: PPT_DEFAULT_PROJECT_ID,
      title: "课堂笔记",
      subtitle: "默认项目",
      createdAt: Date.now()
    }
  ],
  pptNotes: [
    {
      id: "ppt-note-template",
      title: "课堂笔记整理模板",
      subtitle: "第 1 课 / 重点页",
      projectId: PPT_DEFAULT_PROJECT_ID,
      projectIds: [PPT_DEFAULT_PROJECT_ID],
      status: "organizing",
      tags: ["模板"],
      reviewDate: "",
      body: "主题：\n核心教言：\n可整理成课件的三条要点：\n待复习问题：",
      createdAt: Date.now(),
      attachment: null
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

const PLAIN_PAGE_THEME = "plain";

const PPT_ATTACHMENT_ACCEPT =
  [
    ".ppt",
    ".pptx",
    ".doc",
    ".docx",
    ".pdf",
    ".txt",
    ".md",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    "image/*",
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/msword",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ].join(",");

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

let pageWallpapers = loadPageWallpapers();

const state = {
  notes: loadNotes(),
  teachingQuotes: loadTeachingQuotes(),
  modules: loadModules(),
  pageWallpapers,
  activeId: null,
  filter: "all",
  query: "",
  sort: "updated",
  view: "write",
  pptProjectFilter: "all",
  pptStatusFilter: "all",
  pptQuery: "",
  pptSort: "updatedDesc",
  teachingTeacherFilter: "all",
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
  bloomGarden: document.querySelector("#bloomGarden"),
  bloomGardenButton: document.querySelector("#bloomGardenButton"),
  bloomPhotoInputs: [...document.querySelectorAll("[data-bloom-photo-input]")],
  bloomTeacherPhoto: document.querySelector("#bloomTeacherPhoto"),
  bloomSelfPhoto: document.querySelector("#bloomSelfPhoto"),
  searchInput: document.querySelector("#searchInput"),
  tocJumpButton: document.querySelector("#tocJumpButton"),
  newNoteButton: document.querySelector("#newNoteButton"),
  indexNewNoteButton: document.querySelector("#indexNewNoteButton"),
  indexOpenEditorButton: document.querySelector("#indexOpenEditorButton"),
  editorNewNoteButton: document.querySelector("#editorNewNoteButton"),
  exportButton: document.querySelector("#exportButton"),
  installButton: document.querySelector("#installButton"),
  typeButtons: [...document.querySelectorAll(".type-button")],
  listTitle: document.querySelector("#listTitle"),
  indexResultCount: document.querySelector("#indexResultCount"),
  indexInsightTotal: document.querySelector("#indexInsightTotal"),
  indexInsightPinned: document.querySelector("#indexInsightPinned"),
  indexInsightTagged: document.querySelector("#indexInsightTagged"),
  indexInsightRecent: document.querySelector("#indexInsightRecent"),
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
  editorPaperMeta: document.querySelector("#editorPaperMeta"),
  noteWordCount: document.querySelector("#noteWordCount"),
  noteTemplateButtons: [...document.querySelectorAll("[data-note-template]")],
  editorPrevNoteButton: document.querySelector("#editorPrevNoteButton"),
  editorNextNoteButton: document.querySelector("#editorNextNoteButton"),
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
  pageThemePicker: document.querySelector("#pageThemePicker"),
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
  offeringLampScene: document.querySelector("#offeringLampScene"),
  offeringLampButton: document.querySelector("#offeringLampButton"),
  offeringLampAction: document.querySelector("#offeringLampAction"),
  offeringLampStatus: document.querySelector("#offeringLampStatus"),
  offeringLampMeta: document.querySelector("#offeringLampMeta"),
  offeringBuddhaWall: document.querySelector("#offeringBuddhaWall"),
  offeringBuddhaInput: document.querySelector("#offeringBuddhaInput"),
  offeringBuddhaReset: document.querySelector("#offeringBuddhaReset"),
  pptProjectForm: document.querySelector("#pptProjectForm"),
  pptProjectTabs: document.querySelector("#pptProjectTabs"),
  pptNoteForm: document.querySelector("#pptNoteForm"),
  pptProjectSelect: document.querySelector("#pptNoteForm select[name='projectId']"),
  pptSearchInput: document.querySelector("#pptSearchInput"),
  pptStatusFilter: document.querySelector("#pptStatusFilter"),
  pptSortSelect: document.querySelector("#pptSortSelect"),
  pptOrganizerSummary: document.querySelector("#pptOrganizerSummary"),
  pptTemplateButtons: [...document.querySelectorAll("[data-ppt-template]")],
  pptExportButton: document.querySelector("#pptExportButton"),
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

/* ============================================================================
 * Buli 图片存储层 (IndexedDB)  —  根治“图片塞进 localStorage 超出 ~5MB 配额
 * 导致添加壁纸/供灯佛像/笔记配图静默保存失败”的问题。
 *
 * 原理：透明拦截 localStorage 的 setItem/getItem。
 *   - setItem：把 JSON 里体积较大的 data: 图片外置到 IndexedDB（容量大几百倍），
 *     localStorage 里只留一个极小的令牌 "idb::img::<hash>-<len>"。
 *   - getItem：把令牌还原成原始 data: 图片（从启动时预载的内存缓存读取，同步返回）。
 * 渲染代码完全无需改动；启动时自动把已有的 base64 迁移进 IndexedDB，当场释放空间。
 * 若设备不支持 IndexedDB（极少数），自动退回原行为，绝不报错。
 * ==========================================================================*/
const BuliImageLayer = (function () {
  // —— crypto.randomUUID 兼容垫片：老安卓 WebView 缺失会导致添加计数/笔记崩溃 ——
  try {
    if (typeof crypto !== "undefined" && crypto && typeof crypto.randomUUID !== "function") {
      crypto.randomUUID = function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          var r = (Math.random() * 16) | 0;
          var v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };
    }
  } catch (e) { /* ignore */ }

  var DB_NAME = "buli-image-store";
  var STORE = "images";
  var TOKEN_PREFIX = "idb::img::";
  var MIN_INLINE = 514; // 含两个引号；约 512 字符以上的 data: 才外置，极小内联图保持原样

  var cache = new Map();        // token -> dataURL
  var urlToToken = new Map();   // dataURL -> token
  var db = null;
  var available = false;
  var nativeGet = null;
  var nativeSet = null;

  function openDb() {
    return new Promise(function (resolve) {
      try {
        if (typeof indexedDB === "undefined" || !indexedDB) { resolve(false); return; }
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () {
          var d = req.result;
          if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
        };
        req.onsuccess = function () { db = req.result; available = true; resolve(true); };
        req.onerror = function () { resolve(false); };
        req.onblocked = function () { resolve(false); };
      } catch (e) { resolve(false); }
    });
  }

  var pending = [];
  function idbPut(token, dataUrl) {
    if (!db) return Promise.resolve();
    var p = new Promise(function (resolve) {
      try {
        var tx = db.transaction(STORE, "readwrite");
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
        tx.onabort = function () { resolve(); };
        tx.objectStore(STORE).put(dataUrl, token);
      } catch (e) { resolve(); }
    });
    pending.push(p);
    p.then(function () {
      var i = pending.indexOf(p);
      if (i >= 0) pending.splice(i, 1);
    });
    return p;
  }

  // 等待所有挂起的 IndexedDB 写入提交完成（供保存后调用，确保照片真正落盘）
  function flush() {
    if (!pending.length) return Promise.resolve();
    return Promise.all(pending.slice()).then(function () {}, function () {});
  }

  function loadAll() {
    return new Promise(function (resolve) {
      if (!db) { resolve(); return; }
      try {
        var tx = db.transaction(STORE, "readonly");
        var store = tx.objectStore(STORE);
        var req = store.openCursor();
        req.onsuccess = function () {
          var cur = req.result;
          if (cur) {
            var token = String(cur.key);
            var val = cur.value;
            if (typeof val === "string") {
              cache.set(token, val);
              urlToToken.set(val, token);
            }
            cur.continue();
          } else {
            resolve();
          }
        };
        req.onerror = function () { resolve(); };
      } catch (e) { resolve(); }
    });
  }

  // 稳定的 53-bit 哈希（cyrb53），输出 base36，使同一图片始终映射到同一令牌
  function hash53(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    var num = 4294967296 * (2097151 & h2) + (h1 >>> 0);
    return num.toString(36);
  }

  function tokenFor(dataUrl) {
    if (urlToToken.has(dataUrl)) return urlToToken.get(dataUrl);
    var token = TOKEN_PREFIX + hash53(dataUrl) + "-" + dataUrl.length;
    cache.set(token, dataUrl);
    urlToToken.set(dataUrl, token);
    idbPut(token, dataUrl);
    return token;
  }

  // 把 JSON 字符串里较大的 data: 图片替换成令牌
  function tokenizeJson(str) {
    if (!available || typeof str !== "string" || str.indexOf("data:") === -1) return str;
    return str.replace(/"data:[^"\\]+"/g, function (m) {
      if (m.length < MIN_INLINE) return m;
      var url = m.slice(1, -1);
      return JSON.stringify(tokenFor(url));
    });
  }

  // 把 JSON 字符串里的令牌还原成原始 data: 图片
  function resolveJson(str) {
    if (typeof str !== "string" || str.indexOf(TOKEN_PREFIX) === -1) return str;
    return str.replace(/"idb::img::[0-9a-z]+-[0-9]+"/g, function (m) {
      var token = m.slice(1, -1);
      var url = cache.get(token);
      return url ? JSON.stringify(url) : m;
    });
  }

  function installOverride() {
    try {
      var ls = window.localStorage;
      if (!ls) return;
      nativeGet = ls.getItem.bind(ls);
      nativeSet = ls.setItem.bind(ls);
      ls.setItem = function (key, value) {
        var v = value;
        if (typeof v === "string") {
          try { v = tokenizeJson(v); } catch (e) { v = value; }
        }
        return nativeSet(key, v);
      };
      ls.getItem = function (key) {
        var raw = nativeGet(key);
        if (typeof raw === "string") {
          try { return resolveJson(raw); } catch (e) { return raw; }
        }
        return raw;
      };
    } catch (e) { /* 拦截失败则保持原生行为，应用仍可用 */ }
  }

  // 启动时把已有的 base64 一次性迁入 IndexedDB，立即给 localStorage 腾出空间
  function migrateExisting() {
    if (!available || !nativeGet || !nativeSet) return;
    try {
      var keys = [];
      for (var i = 0; i < window.localStorage.length; i++) {
        keys.push(window.localStorage.key(i));
      }
      keys.forEach(function (k) {
        if (k == null) return;
        var raw = nativeGet(k);
        if (typeof raw === "string" && raw.indexOf("data:") !== -1) {
          var tokenized = tokenizeJson(raw);
          if (tokenized !== raw) {
            try { nativeSet(k, tokenized); } catch (e) { /* ignore */ }
          }
        }
      });
    } catch (e) { /* ignore */ }
  }

  function boot() {
    return openDb().then(function () {
      return loadAll();
    }).then(function () {
      installOverride();
      migrateExisting();
    }).catch(function () {
      // 兜底：即便出错也安装拦截（此时为透明直通），不阻塞应用启动
      try { installOverride(); } catch (e) { /* ignore */ }
    });
  }

  return { boot: boot, flush: flush };
})();

BuliImageLayer.boot().then(init).catch(function () {
  try { init(); } catch (err) { console.error(err); }
});

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
  setupNoteYearFilter();
  setupDataSteward();
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
  els.indexNewNoteButton?.addEventListener("click", createAndOpenNote);
  els.indexOpenEditorButton?.addEventListener("click", scrollToEditor);
  els.editorNewNoteButton?.addEventListener("click", createAndOpenNote);
  // 笔记翻页箭头：用事件委托绑定，按钮即使被重新渲染/替换也始终有效
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest("#editorPrevNoteButton")) {
      turnToRelativeNote(-1);
    } else if (target.closest("#editorNextNoteButton")) {
      turnToRelativeNote(1);
    }
  });
  els.noteTemplateButtons.forEach((button) => {
    button.addEventListener("click", () => applyNoteTemplate(button.dataset.noteTemplate));
  });

  els.exportButton?.addEventListener("click", exportNotes);
  els.installButton?.addEventListener("click", installApp);
  els.bloomGardenButton?.addEventListener("click", bloomGardenFlowers);
  els.bloomPhotoInputs.forEach((input) => {
    input.addEventListener("change", updateBloomGardenPhoto);
  });
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
  els.offeringLampButton?.addEventListener("click", lightOfferingLamp);
  els.offeringLampAction?.addEventListener("click", lightOfferingLamp);
  els.offeringBuddhaInput?.addEventListener("change", addOfferingBuddhaImages);
  els.offeringBuddhaReset?.addEventListener("click", changeOfferingBuddhaWall);
  els.pptProjectForm?.addEventListener("submit", addPptProject);
  els.pptNoteForm?.addEventListener("submit", addPptNote);
  els.pptSearchInput?.addEventListener("input", (event) => {
    state.pptQuery = event.target.value.trim().toLowerCase();
    renderPptNotes();
  });
  els.pptStatusFilter?.addEventListener("change", (event) => {
    state.pptStatusFilter = event.target.value || "all";
    renderPptNotes();
  });
  els.pptSortSelect?.addEventListener("change", (event) => {
    state.pptSort = event.target.value || "updatedDesc";
    renderPptNotes();
  });
  els.pptTemplateButtons.forEach((button) => {
    button.addEventListener("click", () => applyPptTemplate(button.dataset.pptTemplate));
  });
  els.pptExportButton?.addEventListener("click", exportPptNotes);

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
    ".offering-lamp-page",
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
    // 滚动安全网：无论样式表如何，强制每页可竖向滚动（含 iOS 惯性滚动），
    // 防止任何补丁层 CSS 覆盖导致“无法下拉页面”。
    page.style.overflowY = "auto";
    page.style.webkitOverflowScrolling = "touch";
  });

  promoteNotebookPages();

  notebookPager.footerControls = notebookPager.pages.map((page, index) => {
    const controls = createNotebookPageFooter(index);
    page.append(controls.root);
    return controls;
  });
  notebookPager.pages.forEach((page, index) => {
    page.addEventListener("scroll", () => updateNotebookPageFooterOffset(index), { passive: true });
    updateNotebookPageFooterOffset(index);
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
  button.textContent = isToc ? "☰" : isPrevious ? "‹" : "›";
  button.title = isToc ? "回到目录" : isPrevious ? "上一页" : "下一页";
  button.setAttribute("aria-label", isToc ? "回到目录" : isPrevious ? "上一页" : "下一页");
  return button;
}

function getNotebookTocIndex() {
  const index = notebookPager.pages.findIndex((page) => page.classList.contains("note-toc-feature"));
  return index >= 0 ? index : 0;
}

function updateNotebookPageFooterOffset(index) {
  const page = notebookPager.pages[index];
  const controls = notebookPager.footerControls[index];
  if (!page || !controls?.root) return;
  controls.root.style.setProperty("--notebook-page-scroll-y", `${page.scrollTop}px`);
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
    notebookPager.status.textContent = String(notebookPager.currentIndex + 1);
    notebookPager.status.setAttribute("aria-label", `第 ${notebookPager.currentIndex + 1} 页，共 ${notebookPager.pages.length} 页`);
    notebookPager.status.title = `第 ${notebookPager.currentIndex + 1} 页，共 ${notebookPager.pages.length} 页`;
  }
  notebookPager.footerControls.forEach((controls, index) => {
    updateNotebookPageFooterOffset(index);
    controls.root.classList.toggle("is-current", index === notebookPager.currentIndex);
    controls.root.classList.toggle("is-toc-page", index === getNotebookTocIndex());
    controls.prevButton.disabled = index === 0;
    controls.tocButton.disabled = index === getNotebookTocIndex();
    controls.nextButton.disabled = index === notebookPager.pages.length - 1;
    controls.status.textContent = String(index + 1);
    controls.status.setAttribute("aria-label", `第 ${index + 1} 页，共 ${notebookPager.pages.length} 页`);
    controls.status.title = `第 ${index + 1} 页，共 ${notebookPager.pages.length} 页`;
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
      ".offering-lamp-page, .offering-lamp-scene, .offering-lamp-panel, .editor-card, .photo-film, .event-strip, .page-strip, .page-theme-picker, .note-toc-list, input, textarea, select, button"
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

function getNoteTurnList() {
  // 翻页箭头与“第 x / y 篇”指示共用的笔记顺序
  let notes = getFilteredNotes();
  if (notes.length < 2) notes = state.notes; // 当前筛选下不足两篇时回退到全部笔记，保证箭头可用
  return notes;
}

function turnToRelativeNote(direction) {
  const notes = getNoteTurnList();
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
          teacher: normalizeTeacherLabel(quote.teacher || quote.person || TEACHING_DEFAULT_TEACHER),
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

function normalizeTeacherLabel(value) {
  return String(value || "").trim() || TEACHING_DEFAULT_TEACHER;
}

function saveTeachingQuotes() {
  localStorage.setItem(TEACHING_STORAGE_KEY, JSON.stringify(state.teachingQuotes));
}

function cloneDefaultModules() {
  return Object.fromEntries(
    Object.entries(defaultModules).map(([key, items]) => [
      key,
      items.map((item) =>
        Object.fromEntries(
          Object.entries(item).map(([field, value]) => [
            field,
            Array.isArray(value) ? [...value] : value && typeof value === "object" ? { ...value } : value
          ])
        )
      )
    ])
  );
}

function removeVisibleEnglish(value) {
  return String(value || "")
    .replace(/\bLARUNG GAR\b/g, "喇荣")
    .replace(/\bYISHIN NORBU\b/g, "如意宝")
    .replace(/\bLANG LANG\b/g, "朗朗神山")
    .replace(/\bNAPA VALLEY\s*·\s*酸奶\b/g, "酸奶")
    .replace(/\bNEW YORK\s*·\s*灌顶\b/g, "灌顶")
    .replace(/\bBOULDER\s*·\s*红衣\b/g, "红衣")
    .replace(/\bWASHINGTON\s*·\s*文殊静修\b/g, "文殊静修")
    .replace(/\bHALIFAX\s*·\s*信心所依\b/g, "信心所依")
    .replace(/\bNAPA VALLEY\b/g, "酸奶")
    .replace(/\bNEW YORK\b/g, "灌顶")
    .replace(/\bBOULDER\b/g, "红衣")
    .replace(/\bWASHINGTON\b/g, "文殊静修")
    .replace(/\bHALIFAX\b/g, "信心所依")
    .replace(/\bBLESSING\b/g, "加持")
    .replace(/\bLIGHTS\b/g, "灯火")
    .replace(/\bLARUNG\b/g, "喇荣")
    .replace(/\bVALLEY\b/g, "山谷")
    .replace(/\bMIST\b/g, "晨雾")
    .replace(/\bSNOW\b/g, "雪景")
    .replace(/\bPPT\b/g, "课件")
    .replace(/\bWORD\b/gi, "文档")
    .replace(/\bPDF\b/g, "文档")
    .replace(/\bNEW\b/g, "新图")
    .trim();
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
  const pptProjectIds = new Set((modules.pptProjects || []).map((project) => project.id));
  modules.pptNotes = (modules.pptNotes || []).map((note) => ({
    ...note,
    projectIds: normalizePptNoteProjectIds(note, pptProjectIds),
    projectId: normalizePptNoteProjectIds(note, pptProjectIds)[0],
    status: normalizePptStatus(note.status),
    tags: normalizePptTags(note.tags),
    reviewDate: normalizePptReviewDate(note.reviewDate)
  }));
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
          title: removeVisibleEnglish(item.title),
          subtitle: removeVisibleEnglish(item.subtitle),
          body: removeVisibleEnglish(item.body),
          tone: item.tone || ["red", "blue", "gold", "green"][index % 4]
        }))
        .filter((item) => item.title || item.body);
      return;
    }
    if (key === "practiceCounters") {
      modules[key] = saved[key]
        .map((item) => ({
          id: item.id || crypto.randomUUID(),
          title: removeVisibleEnglish(item.title),
          subtitle: removeVisibleEnglish(item.subtitle),
          count: Math.max(0, Number(item.count) || 0),
          target: Math.max(1, Number(item.target) || 100000),
          step: Math.max(1, Number(item.step) || 108),
          updatedAt: item.updatedAt || Date.now()
        }))
        .filter((item) => item.title);
      return;
    }
    if (key === "pptProjects") {
      const projects = saved[key].map(normalizePptProject).filter(Boolean);
      modules[key] = ensureDefaultPptProject(projects);
      return;
    }
    if (key === "pptNotes") {
      modules[key] = saved[key]
        .map((item) => {
          const pptProjectIds = new Set(ensureDefaultPptProject(modules.pptProjects).map((project) => project.id));
          const projectIds = normalizePptNoteProjectIds(item, pptProjectIds);
          return {
            id: item.id || crypto.randomUUID(),
            title: removeVisibleEnglish(item.title),
            subtitle: removeVisibleEnglish(item.subtitle),
            projectId: projectIds[0],
            projectIds,
            status: normalizePptStatus(item.status),
            tags: normalizePptTags(item.tags),
            reviewDate: normalizePptReviewDate(item.reviewDate),
            body: removeVisibleEnglish(item.body),
            attachment: normalizePptAttachment(item.attachment),
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || item.createdAt || Date.now()
          };
        })
        .filter((item) => item.title || item.body || item.attachment);
      return;
    }
    modules[key] = saved[key]
      .map((item) => ({
        id: item.id || crypto.randomUUID(),
        image: String(item.image || ""),
        title: removeVisibleEnglish(item.title),
        subtitle: removeVisibleEnglish(item.subtitle),
        layout: item.layout || "",
        feature: Boolean(item.feature)
      }))
      .filter((item) => item.image);
  });
  return modules;
}

function normalizePptProject(item) {
  if (!item || typeof item !== "object") return null;
  const title = removeVisibleEnglish(item.title);
  if (!title) return null;
  return {
    id: item.id || crypto.randomUUID(),
    title,
    subtitle: removeVisibleEnglish(item.subtitle),
    archived: Boolean(item.archived),
    createdAt: item.createdAt || Date.now(),
    updatedAt: item.updatedAt || item.createdAt || Date.now()
  };
}

function ensureDefaultPptProject(projects = []) {
  const normalized = projects.filter(Boolean);
  const hasDefault = normalized.some((project) => project.id === PPT_DEFAULT_PROJECT_ID);
  if (!hasDefault) {
    normalized.unshift({
      id: PPT_DEFAULT_PROJECT_ID,
      title: "课堂笔记",
      subtitle: "默认项目",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  return normalized;
}

function normalizePptAttachment(value) {
  if (!value || typeof value !== "object") return null;
  const dataUrl = String(value.dataUrl || "");
  const name = String(value.name || "").trim();
  if (!dataUrl || !name) return null;
  return {
    name,
    type: String(value.type || "application/octet-stream"),
    size: Math.max(0, Number(value.size) || 0),
    dataUrl
  };
}

function normalizePptStatus(value) {
  const status = String(value || "").trim();
  return PPT_NOTE_STATUS_IDS.has(status) ? status : "organizing";
}

function getPptStatusOption(status) {
  const normalized = normalizePptStatus(status);
  return PPT_NOTE_STATUS_OPTIONS.find((item) => item.id === normalized) || PPT_NOTE_STATUS_OPTIONS[1];
}

function getNextPptStatus(status) {
  const normalized = normalizePptStatus(status);
  const index = PPT_NOTE_STATUS_OPTIONS.findIndex((item) => item.id === normalized);
  return PPT_NOTE_STATUS_OPTIONS[(index + 1) % PPT_NOTE_STATUS_OPTIONS.length].id;
}

function normalizePptTags(value) {
  const tags = Array.isArray(value) ? value : parseTags(String(value || ""));
  return [...new Set(tags.map((tag) => String(tag || "").trim()).filter(Boolean))].slice(0, 12);
}

function normalizePptReviewDate(value) {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function isPptReviewDue(item) {
  const reviewDate = normalizePptReviewDate(item?.reviewDate);
  return Boolean(reviewDate) && normalizePptStatus(item?.status) !== "done" && reviewDate <= new Date().toISOString().slice(0, 10);
}

function saveModules() {
  try {
    localStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(state.modules));
    return true;
  } catch (error) {
    console.warn("Failed to save editable modules", error);
    alert("保存失败。若刚添加了图片或附件，请换一个较小的文件再试。");
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
    pageTheme: PLAIN_PAGE_THEME,
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
  renderEditorStatus(note);
  scheduleSave();
  scheduleNoteRender(note);
}

function scheduleIndexRender() {
  scheduleRender(() => {
    renderToc();
    renderList();
    renderIndexSummary();
    renderTimeline();
  });
}

function scheduleNoteRender(note = getActiveNote()) {
  scheduleRender(() => {
    renderMemoCalendar(note);
    renderToc();
    renderList();
    renderIndexSummary();
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
  if (window.BuliEnhance) window.BuliEnhance.afterRender();
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
  renderIndexSummary();
  renderStats();
  renderFocus();
  renderModules();
  renderOfferingLamp();
  renderBloomGardenPhotos();
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
  renderEditorStatus(note);
  renderPageTheme(note.pageTheme || PLAIN_PAGE_THEME);
  renderMemoCalendar(note);
  renderNoteImages(note);
  renderPageDecoration(note);
}

function renderEditorStatus(note = getActiveNote()) {
  if (!note) return;
  const pieces = [
    typeLabels[note.type] || "笔记",
    displayDate(note.date),
    note.person,
    note.source
  ].filter(Boolean);
  const turnList = getNoteTurnList();
  const turnPosition = turnList.findIndex((item) => item.id === note.id);
  if (turnPosition >= 0) {
    pieces.push(`第 ${turnPosition + 1} / ${turnList.length} 篇`);
  }
  if (els.editorPaperMeta) els.editorPaperMeta.textContent = pieces.join(" · ");
  if (els.noteWordCount) {
    const textCount = Array.from(String(note.body || "").replace(/\s/g, "")).length;
    const tagText = note.tags?.length ? `${note.tags.length} 标签` : "未加标签";
    const imageText = note.images?.length ? `${note.images.length} 图` : "无图片";
    els.noteWordCount.textContent = `${textCount} 字 · ${tagText} · ${imageText}`;
  }

  const hasSiblings = turnList.length > 1;
  const prevButton = document.querySelector("#editorPrevNoteButton") || els.editorPrevNoteButton;
  const nextButton = document.querySelector("#editorNextNoteButton") || els.editorNextNoteButton;
  if (prevButton) prevButton.disabled = !hasSiblings;
  if (nextButton) nextButton.disabled = !hasSiblings;
}

function applyNoteTemplate(templateId) {
  const template = NOTE_BODY_TEMPLATES[templateId];
  const note = getActiveNote();
  if (!template || !note || !els.noteBody) return;

  const start = els.noteBody.selectionStart ?? els.noteBody.value.length;
  const end = els.noteBody.selectionEnd ?? els.noteBody.value.length;
  const current = els.noteBody.value;
  const prefix = current.slice(0, start);
  const suffix = current.slice(end);
  const needsBeforeBreak = prefix && !prefix.endsWith("\n") ? "\n\n" : "";
  const needsAfterBreak = suffix && !suffix.startsWith("\n") ? "\n\n" : "";
  const inserted = `${needsBeforeBreak}${template.body}${needsAfterBreak}`;

  els.noteBody.value = `${prefix}${inserted}${suffix}`;
  const nextCursor = prefix.length + inserted.length;
  els.noteBody.setSelectionRange(nextCursor, nextCursor);
  els.noteBody.focus();
  updateActiveNote();
  els.saveState.textContent = `已插入「${template.label}」`;
}

function renderPageDecoration(note) {
  if (!note || !els.pageDecoration) return;
  if (note.type === "memo") {
    els.pageDecoration.className = "page-decoration hidden";
    els.pageDecoration.style.backgroundImage = "";
    return;
  }
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

function readBloomPortraitFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const maxSide = 640;
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
        context.globalCompositeOperation = "source-atop";
        context.fillStyle = "rgba(255, 236, 178, 0.08)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = "source-over";

        const data = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = data.data;
        const cx = canvas.width * 0.5;
        const cy = canvas.height * 0.46;
        const rx = canvas.width * 0.53;
        const ry = canvas.height * 0.66;
        for (let y = 0; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            const dx = (x - cx) / rx;
            const dy = (y - cy) / ry;
            const distance = dx * dx + dy * dy;
            const fade = Math.max(0, Math.min(1, (1.2 - distance) / 0.42));
            const bottomSeat = Math.max(0, Math.min(1, (y / canvas.height - 0.55) / 0.32));
            const alphaMask = Math.max(0.18 * bottomSeat, fade);
            const index = (y * canvas.width + x) * 4 + 3;
            pixels[index] = Math.round(pixels[index] * alphaMask);
          }
        }
        context.putImageData(data, 0, 0);
        const webp = canvas.toDataURL("image/webp", 0.8);
        resolve(webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png"));
      });
      image.addEventListener("error", () => resolve(String(reader.result)));
      image.src = String(reader.result);
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function loadPageWallpapers() {
  try {
    const saved = JSON.parse(localStorage.getItem(PAGE_WALLPAPER_STORAGE_KEY));
    if (Array.isArray(saved)) {
      return saved.map(normalizePageWallpaper).filter(Boolean);
    }
  } catch (error) {
    console.warn("Failed to load page wallpapers", error);
  }
  try {
    localStorage.setItem(PAGE_WALLPAPER_STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.warn("Failed to initialize page wallpapers", error);
  }
  return [];
}

function normalizePageWallpaper(value) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || "").trim();
  const title = String(value.title || "").trim();
  const image = String(value.image || "").trim();
  if (!id || !image) return null;
  return {
    id,
    title: title || "自定义壁纸",
    image
  };
}

function savePageWallpapers() {
  try {
    localStorage.setItem(PAGE_WALLPAPER_STORAGE_KEY, JSON.stringify(pageWallpapers));
    state.pageWallpapers = pageWallpapers;
    return true;
  } catch (error) {
    console.warn("Failed to save page wallpapers", error);
    alert("壁纸保存失败，请删减几张壁纸或换一张较小的图片。");
    return false;
  }
}

function getPageWallpaper(id) {
  return pageWallpapers.find((wallpaper) => wallpaper.id === id) || null;
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
  const wallpaper = getPageWallpaper(selectedTheme);
  els.editorForm.classList.remove(...pageThemeClassNames, "page-wallpaper", "page-plain");
  if (wallpaper) {
    els.editorForm.classList.add("page-wallpaper");
    els.editorForm.style.setProperty("--page-wallpaper-image", `url("${wallpaper.image}")`);
  } else {
    els.editorForm.classList.add("page-plain");
    els.editorForm.style.removeProperty("--page-wallpaper-image");
  }
  renderPageWallpaperPicker(selectedTheme);
}

function normalizePageTheme(theme) {
  if (theme === PLAIN_PAGE_THEME) return PLAIN_PAGE_THEME;
  return getPageWallpaper(theme) ? theme : pageWallpapers[0]?.id || PLAIN_PAGE_THEME;
}

function renderPageWallpaperPicker(selectedTheme = normalizePageTheme(getActiveNote()?.pageTheme)) {
  if (!els.pageThemePicker) return;
  els.pageThemePicker.replaceChildren();
  const normalizedTheme = normalizePageTheme(selectedTheme);
  els.pageThemeButtons = [];

  const plainOption = createPageWallpaperOption(
    {
      id: PLAIN_PAGE_THEME,
      title: "素纸",
      image: ""
    },
    normalizedTheme
  );
  els.pageThemePicker.append(plainOption);

  pageWallpapers.forEach((wallpaper) => {
    els.pageThemePicker.append(createPageWallpaperOption(wallpaper, normalizedTheme));
  });
  els.pageThemePicker.append(createAddPageWallpaperOption());
}

function createPageWallpaperOption(wallpaper, selectedTheme) {
  const card = document.createElement("div");
  card.className = "page-theme-option";
  card.classList.toggle("active", wallpaper.id === selectedTheme);
  card.classList.toggle("page-theme-plain", wallpaper.id === PLAIN_PAGE_THEME);
  card.dataset.pageTheme = wallpaper.id;

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "page-theme-select";
  selectButton.addEventListener("click", () => updatePageTheme(wallpaper.id));

  if (wallpaper.image) {
    const image = document.createElement("img");
    image.src = wallpaper.image;
    image.alt = `${wallpaper.title}空白页预览`;
    prepareImage(image);
    selectButton.append(image);
  }

  const title = document.createElement("span");
  title.textContent = wallpaper.title;
  selectButton.append(title);
  card.append(selectButton);

  if (wallpaper.id !== PLAIN_PAGE_THEME) {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "page-theme-delete";
    deleteButton.textContent = "删";
    deleteButton.setAttribute("aria-label", `删除${wallpaper.title}`);
    deleteButton.addEventListener("click", () => deletePageWallpaper(wallpaper.id));
    card.append(deleteButton);
  }

  return card;
}

/* 注：createAddPageWallpaperOption / addPageWallpapers 的旧版实现已在此删除。
   这两个函数在本文件后段“空白页壁纸上传修复补丁”中被重新声明并覆盖（JS 函数声明提升：
   后声明者生效），旧版属于永远执行不到的死代码。有效版本带有图片压缩与
   crypto.randomUUID 兼容回退，请见后段实现。删除旧版不改变任何运行行为。 */

function deletePageWallpaper(id) {
  const wallpaper = getPageWallpaper(id);
  if (!wallpaper) return;
  const ok = confirm(`删除「${wallpaper.title}」这张空白页壁纸？`);
  if (!ok) return;
  pageWallpapers = pageWallpapers.filter((item) => item.id !== id);
  const fallbackTheme = pageWallpapers[0]?.id || PLAIN_PAGE_THEME;
  state.notes.forEach((note) => {
    if (note.pageTheme === id) {
      note.pageTheme = fallbackTheme;
      note.updatedAt = Date.now();
    }
  });
  if (savePageWallpapers()) {
    scheduleSave();
    renderPageTheme(getActiveNote()?.pageTheme || fallbackTheme);
  }
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
  kicker.textContent = mode === "tibetan" ? "藏历日历" : "公历日历";
  const title = document.createElement("strong");
  title.textContent =
    mode === "tibetan"
      ? `${date.getFullYear()} · ${getTibetanMonthLabel(date)}`
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

function getTibetanMonthLabel(date) {
  const tibetanMonths = ["༡", "༢", "༣", "༤", "༥", "༦", "༧", "༨", "༩", "༡༠", "༡༡", "༡༢"];
  const chineseMonths = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const index = Math.max(0, Math.min(11, date.getMonth()));
  return `བོད་ཟླ་${tibetanMonths[index]} · 藏历${chineseMonths[index]}`;
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

function addTeachingQuote(event, sourceInput, teacherInput) {
  event?.preventDefault();
  const text = normalizeTeachingText(sourceInput?.value);
  if (!text) return;
  const teacher = normalizeTeacherLabel(teacherInput?.value);

  state.teachingQuotes.unshift({
    id: crypto.randomUUID(),
    text,
    teacher,
    createdAt: Date.now()
  });
  sourceInput.value = "";
  if (teacherInput) teacherInput.value = teacher;
  state.teachingTeacherFilter = teacher;
  saveTeachingQuotes();
  renderTeachingQuotes();
}

function deleteTeachingQuote(id) {
  const quote = state.teachingQuotes.find((item) => item.id === id);
  if (!quote) return;
  const ok = confirm(`删除这条教言摘录？\n\n${quote.text}`);
  if (!ok) return;

  state.teachingQuotes = state.teachingQuotes.filter((item) => item.id !== id);
  if (state.teachingTeacherFilter !== "all" && !state.teachingQuotes.some((item) => item.teacher === state.teachingTeacherFilter)) {
    state.teachingTeacherFilter = "all";
  }
  saveTeachingQuotes();
  renderTeachingQuotes();
}

function editTeachingQuoteTeacher(id) {
  const quote = state.teachingQuotes.find((item) => item.id === id);
  if (!quote) return;
  const teacher = prompt("修改人物 / 上师标签", quote.teacher || TEACHING_DEFAULT_TEACHER);
  if (teacher === null) return;
  quote.teacher = normalizeTeacherLabel(teacher);
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
        subtitle: form.elements.subtitle.value.trim() || "新图"
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
  renderPptProjectManager();
  renderPptNotes();
}

function renderFocusGalleryModule() {
  if (!els.focusGallery) return;
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

  const counters = state.modules.practiceCounters;
  counters.forEach(ensurePracticeLedgerFields);

  const todaySum = counters.reduce((sum, item) => sum + practiceTodayTotal(item), 0);
  els.practiceSummary.textContent = counters.length
    ? `共 ${counters.length} 门功课 · 今日合计 +${formatNumber(todaySum)}`
    : "尚未添加功课";

  els.practiceCounterGrid.append(buildPracticeOverview());

  if (!counters.length) {
    const empty = document.createElement("div");
    empty.className = "module-empty";
    empty.textContent = "暂无计数功课，可在下方添加一项，或用「加行·五十万预设」一键建立四加行。";
    els.practiceCounterGrid.append(empty);
    return;
  }

  counters.forEach((item) => {
    els.practiceCounterGrid.append(createPracticeCounterCard(item));
  });
  els.practiceCounterGrid.append(buildPracticeTimeline());
}

function createPracticeCounterCard(item) {
  ensurePracticeLedgerFields(item);
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
  const numericCount = Number(item.count) || 0;
  const numericTarget = Number(item.target) || 0;
  const unit = item.unit || "遍";
  const complete = numericTarget > 0 && numericCount >= numericTarget;
  if (complete) card.classList.add("is-complete");

  const countWrap = document.createElement("div");
  countWrap.className = "practice-counter-total";
  const count = document.createElement("b");
  count.textContent = formatNumber(item.count);
  const countUnit = document.createElement("small");
  countUnit.textContent = `${unit} · 一生累计`;
  countWrap.append(count, countUnit);
  head.append(titleWrap, countWrap);
  if (complete) {
    const badge = document.createElement("span");
    badge.className = "practice-complete-badge";
    badge.textContent = "已圆满 ✓";
    head.append(badge);
  }

  const progress = document.createElement("div");
  progress.className = "practice-progress";
  const bar = document.createElement("span");
  const percent = numericTarget ? Math.min(100, Math.round((numericCount / numericTarget) * 100)) : 0;
  bar.style.width = `${percent}%`;
  progress.append(bar);

  const today = practiceTodayTotal(item);
  const meta = document.createElement("p");
  const milestoneText = complete ? `已圆满（目标 ${formatNumber(item.target)}），仍可继续增长` : `目标 ${formatNumber(item.target)} · ${percent}%`;
  meta.textContent = `${milestoneText} · 今日 +${formatNumber(today)}`;

  const bigStep = (Number(item.step) || 108) * 10;
  const actions = document.createElement("div");
  actions.className = "practice-counter-actions";
  const manualInput = document.createElement("input");
  manualInput.className = "practice-counter-manual";
  manualInput.type = "number";
  manualInput.inputMode = "numeric";
  manualInput.placeholder = "自定义数量";
  manualInput.title = "输入正数增加，负数减少";
  manualInput.setAttribute("aria-label", "自定义本次功课数量");
  manualInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    customPracticeCounterDelta(item.id, manualInput.value);
    manualInput.value = "";
  });
  const targetEditor = createPracticeTargetEditor(item);
  const targetButton = createActionButton("目标·单位", () => {
    const shouldOpen = targetEditor.classList.contains("hidden");
    targetEditor.classList.toggle("hidden", !shouldOpen);
    if (shouldOpen) targetEditor.querySelector("input[name='target']")?.focus();
  });
  actions.append(
    createActionButton(`−${formatNumber(item.step)}`, () => updatePracticeCounter(item.id, -item.step)),
    createActionButton(`+${formatNumber(item.step)}`, () => updatePracticeCounter(item.id, item.step), "buli-quick-add"),
    createActionButton(`+${formatNumber(bigStep)}`, () => updatePracticeCounter(item.id, bigStep), "buli-quick-add"),
    manualInput,
    createActionButton("记一笔", () => {
      customPracticeCounterDelta(item.id, manualInput.value);
      manualInput.value = "";
    }, "buli-quick-add"),
    targetButton,
    createActionButton("清零", () => resetPracticeCounter(item.id), "danger"),
    createActionButton("删除", () => deleteModuleItem("practiceCounters", item.id), "danger")
  );

  card.append(head, progress, meta, actions, targetEditor, buildPracticeRecords(item));
  return card;
}

function createPracticeTargetEditor(item) {
  const form = document.createElement("form");
  form.className = "practice-target-editor hidden";

  const targetInput = document.createElement("input");
  targetInput.name = "target";
  targetInput.type = "number";
  targetInput.min = "1";
  targetInput.step = "1";
  targetInput.inputMode = "numeric";
  targetInput.placeholder = "目标数量";
  targetInput.value = String(item.target || 100000);
  targetInput.setAttribute("aria-label", "目标数量");

  const stepInput = document.createElement("input");
  stepInput.name = "step";
  stepInput.type = "number";
  stepInput.min = "1";
  stepInput.step = "1";
  stepInput.inputMode = "numeric";
  stepInput.placeholder = "每次增加";
  stepInput.value = String(item.step || 108);
  stepInput.setAttribute("aria-label", "每次增加数量");

  const unitInput = document.createElement("select");
  unitInput.name = "unit";
  unitInput.className = "practice-unit-select";
  unitInput.setAttribute("aria-label", "计数单位");
  ["遍", "个", "座", "次", "字", "小时"].forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    unitInput.append(opt);
  });
  unitInput.value = item.unit || "遍";

  const actions = document.createElement("div");
  actions.className = "practice-target-editor-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "module-action-button";
  saveButton.textContent = "保存";
  const cancelButton = createActionButton("取消", () => form.classList.add("hidden"));
  actions.append(saveButton, cancelButton);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    savePracticeCounterTarget(item.id, targetInput.value, stepInput.value, unitInput.value);
  });

  form.append(targetInput, stepInput, unitInput, actions);
  return form;
}

function addPracticeCounter(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.elements.title.value.trim();
  if (!title) return;

  const unitField = form.elements.unit;
  const unit = (unitField && String(unitField.value || "").trim()) || "遍";
  state.modules.practiceCounters.push({
    id: crypto.randomUUID(),
    title,
    subtitle: "自定义",
    unit,
    count: 0,
    target: Math.max(1, Number(form.elements.target.value) || 100000),
    step: Math.max(1, Number(form.elements.step.value) || 108),
    sessions: [],
    createdAt: Date.now(),
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
  ensurePracticeLedgerFields(item);
  const before = Number(item.count) || 0;
  const after = Math.max(0, before + delta); // 无上限:圆满后仍可继续增长
  const actual = after - before;
  item.count = after;
  item.updatedAt = Date.now();
  if (actual !== 0) logPracticeSession(item, actual);
  if (saveModules()) renderPracticeCounters();
}

function customPracticeCounterDelta(id, rawValue) {
  const item = findModuleItem("practiceCounters", id);
  if (!item) return;
  const value = rawValue ?? prompt("输入本次增减数量，正数增加，负数减少", String(item.step || 108));
  if (value === null) return;
  const normalizedValue = String(value).trim();
  const delta = Number(normalizedValue);
  if (!Number.isFinite(delta) || delta === 0) {
    alert("请输入有效数字，例如 108 或 -21。");
    return;
  }
  updatePracticeCounter(id, Math.trunc(delta));
}

function savePracticeCounterTarget(id, targetValue, stepValue, unitValue) {
  const item = findModuleItem("practiceCounters", id);
  if (!item) return;
  const target = Number(String(targetValue || "").trim());
  const step = Number(String(stepValue || "").trim());
  if (!Number.isFinite(target) || target < 1 || !Number.isFinite(step) || step < 1) {
    alert("请输入有效数字，目标数量和每次增加数量都需要大于 0。");
    return;
  }
  item.target = Math.trunc(target);
  item.step = Math.trunc(step);
  const unit = String(unitValue || "").trim();
  if (unit) item.unit = unit;
  item.updatedAt = Date.now();
  if (saveModules()) renderPracticeCounters();
}

function resetPracticeCounter(id) {
  const item = findModuleItem("practiceCounters", id);
  if (!item) return;
  const ok = confirm(`确定清零「${item.title}」吗？\n这会把一生累计与全部记录都归零，且不可恢复（建议先导出备份）。`);
  if (!ok) return;
  ensurePracticeLedgerFields(item);
  item.count = 0;
  item.sessions = [];
  item.updatedAt = Date.now();
  if (saveModules()) renderPracticeCounters();
}

function renderOfferingLamp() {
  if (!els.offeringLampScene) return;
  const count = getOfferingLampCount();
  els.offeringLampScene.classList.remove("is-lit");
  els.offeringLampButton?.classList.remove("just-lit");
  if (els.offeringLampStatus) {
    els.offeringLampStatus.textContent = "愿除垢暗，愿智如炬。";
  }
  if (els.offeringLampMeta) {
    els.offeringLampMeta.textContent = count ? `供灯累计：${count}次` : "轻触供灯，点亮灯火。";
  }
  if (els.offeringLampAction) {
    els.offeringLampAction.textContent = "供灯";
  }
  renderOfferingBuddhaWall();
}

function lightOfferingLamp() {
  const now = Date.now();
  const count = getOfferingLampCount() + 1;
  localStorage.setItem(OFFERING_LAMP_STORAGE_KEY, String(now));
  localStorage.setItem(OFFERING_LAMP_COUNT_STORAGE_KEY, String(count));
  els.offeringLampScene?.classList.add("is-lit");
  els.offeringLampScene?.classList.remove("is-offering-pulse");
  els.offeringLampButton?.classList.remove("just-lit");
  els.offeringLampAction?.classList.remove("is-offering-press");
  window.requestAnimationFrame(() => {
    els.offeringLampScene?.classList.add("is-offering-pulse");
    els.offeringLampButton?.classList.add("just-lit");
    els.offeringLampAction?.classList.add("is-offering-press");
  });
  window.setTimeout(() => {
    els.offeringLampScene?.classList.remove("is-offering-pulse");
    els.offeringLampAction?.classList.remove("is-offering-press");
  }, 920);
  if (els.offeringLampStatus) {
    els.offeringLampStatus.textContent = "灯火已明，愿做众生心中的光";
  }
  if (els.offeringLampMeta) {
    els.offeringLampMeta.textContent = `供灯累计：${count}次`;
  }
  if (els.offeringLampAction) {
    els.offeringLampAction.textContent = "再次供灯";
  }
}

function getOfferingLampCount() {
  const saved = Math.max(0, Number(localStorage.getItem(OFFERING_LAMP_COUNT_STORAGE_KEY)) || 0);
  if (saved) return saved;
  const legacyLitAt = Number(localStorage.getItem(OFFERING_LAMP_STORAGE_KEY)) || 0;
  return legacyLitAt > 0 ? 1 : 0;
}

function loadOfferingBuddhaImages() {
  try {
    const saved = JSON.parse(localStorage.getItem(OFFERING_BUDDHA_WALL_STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) {
      return saved.filter(Boolean).map(String);
    }
  } catch (error) {
    console.warn("Failed to load offering Buddha wall", error);
  }
  return [...OFFERING_DEFAULT_BUDDHA_IMAGES];
}

function saveOfferingBuddhaImages(images) {
  try {
    localStorage.setItem(OFFERING_BUDDHA_WALL_STORAGE_KEY, JSON.stringify(images));
    return true;
  } catch (error) {
    console.warn("Failed to save offering Buddha wall", error);
    alert("佛像图片保存失败，请减少图片数量或换一张较小的图片。");
    return false;
  }
}

function renderOfferingBuddhaWall() {
  if (!els.offeringBuddhaWall) return;
  const images = loadOfferingBuddhaImages();
  els.offeringBuddhaWall.replaceChildren();
  images.forEach((src, index) => {
    const figure = document.createElement("figure");
    figure.className = "offering-buddha-photo";
    const image = document.createElement("img");
    image.src = src;
    image.alt = `供灯佛像 ${index + 1}`;
    image.loading = "lazy";
    image.decoding = "async";
    figure.append(image);
    els.offeringBuddhaWall.append(figure);
  });
}

async function addOfferingBuddhaImages(event) {
  const input = event.currentTarget;
  await saveOfferingBuddhaFiles(input.files, { replace: false });
  input.value = "";
}

function changeOfferingBuddhaWall() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.style.position = "fixed";
  input.style.top = "0";
  input.style.left = "0";
  input.style.width = "1px";
  input.style.height = "1px";
  input.style.opacity = "0";
  input.style.zIndex = "-1";
  document.body.append(input);
  input.addEventListener(
    "change",
    async (event) => {
      await saveOfferingBuddhaFiles(event.currentTarget.files, { replace: true });
      input.remove();
    },
    { once: true }
  );
  window.setTimeout(() => input.remove(), 10000);
  input.click();
}

async function saveOfferingBuddhaFiles(fileList, options = {}) {
  const files = [...(fileList || [])];
  if (!files.length) return;
  try {
    const current = options.replace ? [] : loadOfferingBuddhaImages();
    const added = [];
    for (const file of files.slice(0, 8)) {
      added.push(await readImageFile(file));
    }
    if (saveOfferingBuddhaImages([...current, ...added].slice(-12))) {
      renderOfferingBuddhaWall();
      try { await BuliImageLayer.flush(); } catch (e) { /* ignore */ }
    }
  } catch (error) {
    console.warn("Failed to add offering Buddha images", error);
    alert("佛像图片读取失败，请换一张图片再试。");
  }
}

function renderPptProjectManager() {
  const projects = getPptProjects();
  const activeExists = state.pptProjectFilter === "all" || projects.some((project) => project.id === state.pptProjectFilter);
  if (!activeExists) state.pptProjectFilter = "all";
  renderPptProjectSelect();
  renderPptProjectTabs();
  renderPptStatusFilter();
  renderPptSortSelect();
}

function getPptProjects() {
  state.modules.pptProjects = ensureDefaultPptProject(state.modules.pptProjects || []);
  return state.modules.pptProjects;
}

function getPptProject(id) {
  return getPptProjects().find((project) => project.id === id) || getPptProjects()[0];
}

function getPptProjectTitle(id) {
  return getPptProject(id)?.title || "课堂笔记";
}

function normalizePptNoteProjectIds(item, allowedIds = new Set(getPptProjects().map((project) => project.id))) {
  const rawIds = Array.isArray(item?.projectIds) ? item.projectIds : [item?.projectId];
  const ids = [...new Set(rawIds.map((id) => String(id || "")).filter((id) => allowedIds.has(id)))];
  return ids.length ? ids : [PPT_DEFAULT_PROJECT_ID];
}

function getPptNoteProjectIds(item) {
  return normalizePptNoteProjectIds(item);
}

function syncPptNoteProjects(item, projectIds) {
  const allowedIds = new Set(getPptProjects().map((project) => project.id));
  const normalized = normalizePptNoteProjectIds({ projectIds }, allowedIds);
  item.projectIds = normalized;
  item.projectId = normalized[0];
}

function getPptNoteProjectTitles(item) {
  return getPptNoteProjectIds(item).map((id) => getPptProjectTitle(id));
}

function getPptProjectButtonLabel(item) {
  return getPptNoteProjectTitles(item).join(" / ");
}

function getSelectedPptProjectIds(select) {
  return [...(select?.selectedOptions || [])].map((option) => option.value);
}

function renderPptProjectSelect() {
  if (!els.pptProjectSelect) return;
  const current = getSelectedPptProjectIds(els.pptProjectSelect);
  const selectedIds = new Set(
    state.pptProjectFilter === "all" ? (current.length ? current : [PPT_DEFAULT_PROJECT_ID]) : [state.pptProjectFilter]
  );
  els.pptProjectSelect.multiple = true;
  els.pptProjectSelect.size = Math.min(4, Math.max(2, getPptProjects().length));
  els.pptProjectSelect.replaceChildren();
  getPptProjects().forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.title;
    option.selected = selectedIds.has(project.id);
    els.pptProjectSelect.append(option);
  });
  if (![...els.pptProjectSelect.selectedOptions].length) {
    els.pptProjectSelect.value = PPT_DEFAULT_PROJECT_ID;
  }
}

function renderPptProjectTabs() {
  if (!els.pptProjectTabs) return;
  els.pptProjectTabs.replaceChildren();

  const counts = getPptProjectCounts();
  const projects = getPptProjects();
  const activeProjects = projects.filter((project) => !project.archived);
  const archivedProjects = projects.filter((project) => project.archived);

  // 若当前正查看某个已归档项目，自动展开归档区，避免“选中却看不见”
  if (archivedProjects.some((project) => project.id === state.pptProjectFilter)) {
    state.pptShowArchived = true;
  }

  els.pptProjectTabs.append(createPptProjectFilterChip({ id: "all", title: "全部项目", count: getPptAllScopeNotes().length }));
  activeProjects.forEach((project) => {
    els.pptProjectTabs.append(createPptProjectFilterChip({ ...project, count: counts.get(project.id) || 0 }));
  });

  if (archivedProjects.length) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "ppt-archived-toggle";
    toggle.textContent = `${state.pptShowArchived ? "▾" : "▸"} 已归档 ${archivedProjects.length} 个项目`;
    toggle.addEventListener("click", () => {
      state.pptShowArchived = !state.pptShowArchived;
      renderPptProjectManager();
    });
    els.pptProjectTabs.append(toggle);

    if (state.pptShowArchived) {
      archivedProjects.forEach((project) => {
        const chip = createPptProjectFilterChip({ ...project, count: counts.get(project.id) || 0 });
        chip.classList.add("archived");
        els.pptProjectTabs.append(chip);
      });
    }
  }
}

function togglePptProjectArchive(projectId) {
  const project = getPptProjects().find((item) => item.id === projectId);
  if (!project || project.id === PPT_DEFAULT_PROJECT_ID) return;
  project.archived = !project.archived;
  project.updatedAt = Date.now();
  if (project.archived && state.pptProjectFilter === project.id) {
    state.pptShowArchived = true; // 归档后仍能看到当前选中的项目
  }
  saveModules();
  renderPptProjectManager();
  renderPptNotes();
}

function getPptArchivedProjectIds() {
  return new Set(getPptProjects().filter((project) => project.archived).map((project) => project.id));
}

// “全部项目”视野：不包含只属于已归档项目的课（点开归档项目本身仍可看全）
function getPptAllScopeNotes() {
  const notes = state.modules.pptNotes || [];
  const archivedIds = getPptArchivedProjectIds();
  if (!archivedIds.size) return notes;
  return notes.filter((note) => {
    const ids = getPptNoteProjectIds(note);
    if (!ids.length) return true;
    return ids.some((projectId) => !archivedIds.has(projectId));
  });
}

function getPptProjectCounts() {
  const counts = new Map();
  const projectIds = new Set(getPptProjects().map((project) => project.id));
  state.modules.pptNotes.forEach((note) => {
    getPptNoteProjectIds(note)
      .filter((projectId) => projectIds.has(projectId))
      .forEach((projectId) => {
        counts.set(projectId, (counts.get(projectId) || 0) + 1);
      });
  });
  return counts;
}

function getPptProjectScopedNotes() {
  const notes = state.modules.pptNotes || [];
  if (state.pptProjectFilter === "all") return getPptAllScopeNotes();
  return notes.filter((note) => getPptNoteProjectIds(note).includes(state.pptProjectFilter));
}

function renderPptStatusFilter() {
  if (!els.pptStatusFilter) return;
  const scopedNotes = getPptProjectScopedNotes();
  const counts = new Map(PPT_NOTE_STATUS_OPTIONS.map((status) => [status.id, 0]));
  scopedNotes.forEach((note) => {
    const status = normalizePptStatus(note.status);
    counts.set(status, (counts.get(status) || 0) + 1);
  });
  const activeExists = state.pptStatusFilter === "all" || PPT_NOTE_STATUS_IDS.has(state.pptStatusFilter);
  if (!activeExists) state.pptStatusFilter = "all";

  els.pptStatusFilter.replaceChildren();
  els.pptStatusFilter.append(createOption("all", `全部状态 (${scopedNotes.length})`, state.pptStatusFilter === "all"));
  PPT_NOTE_STATUS_OPTIONS.forEach((status) => {
    els.pptStatusFilter.append(
      createOption(status.id, `${status.label} (${counts.get(status.id) || 0})`, state.pptStatusFilter === status.id)
    );
  });
}

function renderPptSortSelect() {
  if (!els.pptSortSelect) return;
  els.pptSortSelect.value = state.pptSort;
}

function createOption(value, label, selected = false) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.selected = selected;
  return option;
}

function createPptProjectFilterChip(project) {
  const chip = document.createElement("div");
  chip.className = "ppt-project-chip";
  chip.classList.toggle("active", state.pptProjectFilter === project.id);

  const filter = document.createElement("button");
  filter.type = "button";
  filter.className = "ppt-project-filter";
  filter.addEventListener("click", () => {
    state.pptProjectFilter = project.id;
    renderPptProjectManager();
    renderPptNotes();
  });

  const title = document.createElement("strong");
  title.textContent = project.title;
  const count = document.createElement("span");
  count.textContent = `${project.count} 条`;
  filter.append(title, count);
  chip.append(filter);

  if (project.id !== "all") {
    chip.append(
      createPptProjectAction("改名", () => renamePptProject(project.id)),
      createPptProjectAction(project.archived ? "还原" : "归档", () => togglePptProjectArchive(project.id), project.id === PPT_DEFAULT_PROJECT_ID),
      createPptProjectAction("删", () => deletePptProject(project.id), project.id === PPT_DEFAULT_PROJECT_ID)
    );
  }

  return chip;
}

function createPptProjectAction(label, onClick, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ppt-project-action";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function addPptProject(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.elements.title.value.trim();
  if (!title) {
    setModuleFormStatus(form, "请先填写项目名称", "warn");
    return;
  }
  const project = {
    id: crypto.randomUUID(),
    title,
    subtitle: form.elements.subtitle.value.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  state.modules.pptProjects.push(project);
  state.pptProjectFilter = project.id;
  if (saveModules()) {
    form.reset();
    setModuleFormStatus(form, "项目已新增", "done");
    renderPptProjectManager();
    renderPptNotes();
  }
}

function renamePptProject(id) {
  const project = getPptProject(id);
  if (!project) return;
  const title = prompt("修改项目名称", project.title || "");
  if (title === null) return;
  const subtitle = prompt("修改项目说明", project.subtitle || "");
  if (subtitle === null) return;
  project.title = title.trim() || project.title;
  project.subtitle = subtitle.trim();
  project.updatedAt = Date.now();
  if (saveModules()) {
    renderPptProjectManager();
    renderPptNotes();
  }
}

function deletePptProject(id) {
  if (id === PPT_DEFAULT_PROJECT_ID) return;
  const project = getPptProject(id);
  if (!project) return;
  const count = state.modules.pptNotes.filter((note) => getPptNoteProjectIds(note).includes(id)).length;
  const ok = confirm(`删除项目「${project.title}」？其中 ${count} 条课堂笔记会归入默认项目。`);
  if (!ok) return;
  state.modules.pptProjects = getPptProjects().filter((item) => item.id !== id);
  state.modules.pptNotes.forEach((note) => {
    const remainingIds = getPptNoteProjectIds(note).filter((projectId) => projectId !== id);
    syncPptNoteProjects(note, remainingIds);
  });
  if (state.pptProjectFilter === id) state.pptProjectFilter = "all";
  if (saveModules()) {
    renderPptProjectManager();
    renderPptNotes();
  }
}

function getFilteredPptNotes() {
  return getPptProjectScopedNotes()
    .filter((note) => state.pptStatusFilter === "all" || normalizePptStatus(note.status) === state.pptStatusFilter)
    .filter((note) => {
      if (!state.pptQuery) return true;
      const haystack = [
        note.title,
        note.subtitle,
        getPptNoteProjectTitles(note).join(" "),
        getPptStatusOption(note.status).label,
        normalizePptTags(note.tags).join(" "),
        note.reviewDate,
        note.body,
        note.attachment?.name
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(state.pptQuery);
    })
    .sort(sortPptNotes);
}

function sortPptNotes(a, b) {
  if (state.pptSort === "reviewAsc") {
    const aDate = normalizePptReviewDate(a.reviewDate) || "9999-12-31";
    const bDate = normalizePptReviewDate(b.reviewDate) || "9999-12-31";
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
  }
  if (state.pptSort === "createdDesc") return (b.createdAt || 0) - (a.createdAt || 0);
  if (state.pptSort === "title") return (a.title || "未命名整理").localeCompare(b.title || "未命名整理", "zh-CN");
  return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
}

function renderPptNotes() {
  if (window.BuliEnhance) window.BuliEnhance.afterPpt();
  if (!els.pptNoteList) return;
  els.pptNoteList.replaceChildren();
  const scopedNotes = getPptProjectScopedNotes();
  const notes = getFilteredPptNotes();
  renderPptOrganizerSummary(scopedNotes, notes);

  if (!notes.length) {
    const empty = document.createElement("div");
    empty.className = "module-empty";
    empty.textContent = scopedNotes.length ? "没有符合筛选的课堂笔记。" : state.pptProjectFilter === "all" ? "暂无课堂整理，可先加入一条。" : "这个项目里还没有课堂笔记。";
    els.pptNoteList.append(empty);
    return;
  }

  notes.forEach((item) => {
    els.pptNoteList.append(createPptNoteCard(item));
  });
}

function renderPptOrganizerSummary(scopedNotes = [], filteredNotes = []) {
  if (!els.pptOrganizerSummary) return;
  els.pptOrganizerSummary.replaceChildren();
  const completed = scopedNotes.filter((note) => normalizePptStatus(note.status) === "done").length;
  const due = scopedNotes.filter(isPptReviewDue).length;
  const attachments = scopedNotes.filter((note) => normalizePptAttachment(note.attachment)).length;
  const visible = filteredNotes.length;
  const years = scopedNotes
    .map((note) => new Date(Number(note.createdAt) || Date.now()).getFullYear())
    .filter((year) => Number.isFinite(year) && year > 1970);
  const stats = [
    ["当前", visible],
    ["待复习", due],
    ["已完成", completed],
    ["有附件", attachments]
  ];
  if (years.length) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    stats.push(["年份", minYear === maxYear ? String(minYear) : `${minYear}–${maxYear}`]);
  }
  stats.forEach(([label, value]) => {
    const item = document.createElement("span");
    const count = document.createElement("strong");
    count.textContent = value;
    item.append(count, label);
    els.pptOrganizerSummary.append(item);
  });
}

function createPptNoteCard(item) {
  const article = document.createElement("article");
  article.className = "ppt-note-card";
  article.classList.add(`status-${normalizePptStatus(item.status)}`);
  article.dataset.moduleKey = "pptNotes";
  article.dataset.moduleId = item.id;

  const head = document.createElement("div");
  head.className = "ppt-note-head";
  const titleWrap = document.createElement("div");
  titleWrap.className = "ppt-note-title";
  const statusRow = document.createElement("div");
  statusRow.className = "ppt-note-status-row";
  const status = createPptStatusBadge(item);
  statusRow.append(status);
  if (isPptReviewDue(item)) {
    const due = document.createElement("span");
    due.className = "ppt-review-due";
    due.textContent = "今日复习";
    statusRow.append(due);
  }
  const title = document.createElement("h3");
  title.textContent = item.title || "未命名整理";
  titleWrap.append(statusRow, title);
  const meta = document.createElement("div");
  meta.className = "ppt-note-meta";
  const project = document.createElement("span");
  project.className = "ppt-note-project";
  project.textContent = getPptProjectButtonLabel(item);
  project.title = project.textContent;
  const subtitle = document.createElement("span");
  subtitle.textContent = item.subtitle || "课堂笔记";
  meta.append(project, subtitle);
  head.append(titleWrap, meta);

  const body = document.createElement("p");
  body.textContent = item.body || " ";
  const info = createPptNoteInfo(item);

  const attachment = createPptAttachmentLink(item.attachment);

  const actions = document.createElement("div");
  actions.className = "ppt-note-actions";
  actions.append(
    createActionButton("更改", () => editPptNote(item.id)),
    createActionButton(getPptStatusOption(item.status).action, () => cyclePptNoteStatus(item.id), "status"),
    createActionButton(getPptProjectButtonLabel(item), () => movePptNoteProject(item.id), "project"),
    createActionButton("复制", () => copyPptNote(item.id)),
    createActionButton(item.attachment ? "换附件" : "附件", () => replacePptAttachment(item.id)),
    createActionButton("删除", () => deleteModuleItem("pptNotes", item.id), "danger")
  );
  if (item.attachment) {
    actions.append(createActionButton("删附件", () => removePptAttachment(item.id), "danger"));
  }

  article.append(head, info, body);
  if (attachment) article.append(attachment);
  article.append(actions);
  return article;
}

function createPptStatusBadge(item) {
  const option = getPptStatusOption(item.status);
  const badge = document.createElement("span");
  badge.className = `ppt-note-status ${option.id}`;
  badge.textContent = option.label;
  return badge;
}

function createPptNoteInfo(item) {
  const info = document.createElement("div");
  info.className = "ppt-note-info";
  const reviewDate = normalizePptReviewDate(item.reviewDate);
  if (reviewDate) {
    const review = document.createElement("span");
    review.className = "ppt-note-review";
    review.textContent = `复习 ${displayDate(reviewDate)}`;
    info.append(review);
  }
  normalizePptTags(item.tags).forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "ppt-note-tag";
    chip.textContent = `#${tag}`;
    info.append(chip);
  });
  if (!info.childElementCount) {
    const empty = document.createElement("span");
    empty.className = "ppt-note-info-empty";
    empty.textContent = "未加标签";
    info.append(empty);
  }
  return info;
}

function createPptAttachmentLink(attachment) {
  const normalized = normalizePptAttachment(attachment);
  if (!normalized) return null;
  const link = document.createElement("a");
  link.className = "ppt-attachment-link";
  link.href = normalized.dataUrl;
  link.download = normalized.name;
  link.textContent = `附件：${normalized.name}${formatFileSize(normalized.size) ? ` (${formatFileSize(normalized.size)})` : ""}`;
  return link;
}

function formatFileSize(size) {
  if (!size) return "";
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} 兆`;
  if (size >= 1024) return `${Math.round(size / 1024)} 千字节`;
  return `${size} 字节`;
}

async function addPptNote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.elements.title.value.trim();
  const body = form.elements.body.value.trim();
  const selectedProjectIds = getSelectedPptProjectIds(form.elements.projectId);
  const projectIds = normalizePptNoteProjectIds({ projectIds: selectedProjectIds });
  const status = normalizePptStatus(form.elements.status?.value);
  const tags = normalizePptTags(form.elements.tags?.value);
  const reviewDate = normalizePptReviewDate(form.elements.reviewDate?.value);
  const file = form.elements.attachment?.files[0];
  const attachment = file ? await createPptAttachment(file) : null;
  if (file && !attachment) return;
  if (!title && !body && !attachment) return;

  state.modules.pptNotes.unshift({
    id: crypto.randomUUID(),
    title: title || attachment?.name?.replace(/\.(pptx?|PPTX?)$/, "") || "未命名课堂整理",
    subtitle: form.elements.subtitle.value.trim(),
    projectId: projectIds[0],
    projectIds,
    status,
    tags,
    reviewDate,
    body,
    attachment,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  if (saveModules()) {
    form.reset();
    renderPptProjectManager();
    renderPptNotes();
  }
}

function applyPptTemplate(templateId) {
  const template = PPT_NOTE_TEMPLATES[templateId];
  const form = els.pptNoteForm;
  const bodyInput = form?.elements.body;
  if (!template || !bodyInput) return;
  const current = bodyInput.value.trimEnd();
  bodyInput.value = current ? `${current}\n\n${template.body}` : template.body;
  bodyInput.focus();
  bodyInput.selectionStart = bodyInput.selectionEnd = bodyInput.value.length;
  setModuleFormStatus(form, `已插入「${template.label}」模板`, "done");
}

function exportPptNotes() {
  const notes = getFilteredPptNotes();
  if (!notes.length) {
    alert("当前筛选下没有可导出的课堂整理。");
    return;
  }
  const title = state.pptProjectFilter === "all" ? "全部课堂整理" : getPptProjectTitle(state.pptProjectFilter);
  const lines = [
    `# ${title}`,
    `导出时间：${new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`,
    ""
  ];
  notes.forEach((note, index) => {
    lines.push(`## ${index + 1}. ${note.title || "课堂整理"}`);
    if (note.subtitle) lines.push(note.subtitle);
    lines.push(`项目：${getPptProjectButtonLabel(note)}`);
    lines.push(`状态：${getPptStatusOption(note.status).label}`);
    const tags = normalizePptTags(note.tags);
    if (tags.length) lines.push(`标签：${tags.join("、")}`);
    if (normalizePptReviewDate(note.reviewDate)) lines.push(`复习：${displayDate(note.reviewDate)}`);
    if (note.attachment?.name) lines.push(`附件：${note.attachment.name}`);
    if (note.body) lines.push("", note.body.trim());
    lines.push("");
  });
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `课堂整理-${new Date().toISOString().slice(0, 10)}.md`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function editPptNote(id) {
  const item = findModuleItem("pptNotes", id);
  if (!item) return;
  const article = getPptNoteCardElement(id);
  if (!article) return;
  const existingEditor = article.querySelector('[data-ppt-editor="note"]');
  if (existingEditor) {
    existingEditor.querySelector("input, textarea")?.focus();
    return;
  }

  closePptInlineEditors(article);

  const editor = document.createElement("form");
  editor.className = "ppt-inline-editor";
  editor.dataset.pptEditor = "note";

  const titleInput = createPptInlineTextInput("课程 / 主题", item.title || "");
  const subtitleInput = createPptInlineTextInput("课次 / 页码 / 日期", item.subtitle || "");
  const statusSelect = createPptStatusSelect(normalizePptStatus(item.status));
  const tagsInput = createPptInlineTextInput("标签，用逗号分隔", normalizePptTags(item.tags).join(", "));
  const reviewDateInput = document.createElement("input");
  reviewDateInput.type = "date";
  reviewDateInput.value = normalizePptReviewDate(item.reviewDate);
  reviewDateInput.setAttribute("aria-label", "复习日期");
  const metaGrid = document.createElement("div");
  metaGrid.className = "ppt-inline-meta-grid";
  metaGrid.append(statusSelect, tagsInput, reviewDateInput);
  const bodyInput = document.createElement("textarea");
  bodyInput.placeholder = "课堂整理内容";
  bodyInput.value = item.body || "";

  const actions = createPptInlineEditorActions("保存更改", () => editor.remove());
  editor.append(titleInput, subtitleInput, metaGrid, bodyInput, actions);
  editor.addEventListener("submit", (event) => {
    event.preventDefault();
    item.title = titleInput.value.trim() || item.title;
    item.subtitle = subtitleInput.value.trim();
    item.status = normalizePptStatus(statusSelect.value);
    item.tags = normalizePptTags(tagsInput.value);
    item.reviewDate = normalizePptReviewDate(reviewDateInput.value);
    item.body = bodyInput.value.trim();
    item.updatedAt = Date.now();
    if (saveModules()) {
      renderPptProjectManager();
      renderPptNotes();
    }
  });

  article.append(editor);
  titleInput.focus();
}

function movePptNoteProject(id) {
  const item = findModuleItem("pptNotes", id);
  if (!item) return;
  const article = getPptNoteCardElement(id);
  if (!article) return;
  const existingEditor = article.querySelector('[data-ppt-editor="projects"]');
  if (existingEditor) {
    existingEditor.querySelector("input")?.focus();
    return;
  }

  closePptInlineEditors(article);

  const projects = getPptProjects();
  const selectedIds = new Set(getPptNoteProjectIds(item));
  const editor = document.createElement("form");
  editor.className = "ppt-inline-editor ppt-project-assignment";
  editor.dataset.pptEditor = "projects";

  const choices = document.createElement("div");
  choices.className = "ppt-project-choice-list";
  projects.forEach((project) => {
    const label = document.createElement("label");
    label.className = "ppt-project-choice";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = project.id;
    input.checked = selectedIds.has(project.id);

    const text = document.createElement("span");
    text.textContent = project.title;
    label.append(input, text);
    choices.append(label);
  });

  const actions = createPptInlineEditorActions("保存项目", () => editor.remove());
  editor.append(choices, actions);
  editor.addEventListener("submit", (event) => {
    event.preventDefault();
    const checkedIds = [...editor.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
    syncPptNoteProjects(item, checkedIds);
    item.updatedAt = Date.now();
    if (!saveModules()) return;
    renderPptProjectManager();
    renderPptNotes();
  });

  article.append(editor);
  editor.querySelector("input")?.focus();
}

function getPptNoteCardElement(id) {
  return document.querySelector(`[data-module-key="pptNotes"][data-module-id="${id}"]`);
}

function closePptInlineEditors(article) {
  article.querySelectorAll(".ppt-inline-editor").forEach((editor) => editor.remove());
}

function createPptInlineTextInput(placeholder, value) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.value = value;
  return input;
}

function createPptStatusSelect(selectedStatus = "organizing") {
  const select = document.createElement("select");
  select.setAttribute("aria-label", "整理状态");
  PPT_NOTE_STATUS_OPTIONS.forEach((status) => {
    select.append(createOption(status.id, status.label, status.id === normalizePptStatus(selectedStatus)));
  });
  return select;
}

function createPptInlineEditorActions(saveLabel, onCancel) {
  const actions = document.createElement("div");
  actions.className = "ppt-inline-editor-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.textContent = saveLabel;

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "cancel";
  cancelButton.textContent = "取消";
  cancelButton.addEventListener("click", onCancel);

  actions.append(saveButton, cancelButton);
  return actions;
}

async function createPptAttachment(file) {
  if (!isPptAttachmentFile(file)) {
    alert("请选择课件、文档、图片或文本附件。");
    return null;
  }
  if (file.size > 4 * 1024 * 1024) {
    const ok = confirm("这个附件较大，可能导致本地保存失败。是否继续添加？");
    if (!ok) return null;
  }
  try {
    const dataUrl = await readFileAsDataUrl(file);
    return normalizePptAttachment({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl
    });
  } catch (error) {
    console.warn("Failed to read classroom attachment", error);
    alert("附件读取失败，请换一个文件再试。");
    return null;
  }
}

function isPptAttachmentFile(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  const type = file.type || "";
  return (
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".pdf") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif") ||
    name.endsWith(".bmp") ||
    type.startsWith("image/") ||
    type.startsWith("text/") ||
    type === "application/pdf" ||
    type === "application/msword" ||
    file.type === "application/vnd.ms-powerpoint" ||
    file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function replacePptAttachment(id) {
  const item = findModuleItem("pptNotes", id);
  if (!item) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = PPT_ATTACHMENT_ACCEPT;
  input.style.position = "fixed";
  input.style.opacity = "0";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    const attachment = await createPptAttachment(file);
    if (!attachment) return;
    item.attachment = attachment;
    item.updatedAt = Date.now();
    if (saveModules()) renderPptNotes();
  });
  document.body.append(input);
  input.click();
}

function removePptAttachment(id) {
  const item = findModuleItem("pptNotes", id);
  if (!item?.attachment) return;
  const ok = confirm(`删除「${item.attachment.name}」这个附件？`);
  if (!ok) return;
  item.attachment = null;
  item.updatedAt = Date.now();
  if (saveModules()) renderPptNotes();
}

function cyclePptNoteStatus(id) {
  const item = findModuleItem("pptNotes", id);
  if (!item) return;
  item.status = getNextPptStatus(item.status);
  if (item.status === "review" && !normalizePptReviewDate(item.reviewDate)) {
    item.reviewDate = new Date().toISOString().slice(0, 10);
  }
  item.updatedAt = Date.now();
  if (saveModules()) {
    renderPptProjectManager();
    renderPptNotes();
  }
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
  const project = `项目：${getPptProjectButtonLabel(item)}`;
  const status = `状态：${getPptStatusOption(item.status).label}`;
  const tags = normalizePptTags(item.tags).length ? `标签：${normalizePptTags(item.tags).join("、")}` : "";
  const review = normalizePptReviewDate(item.reviewDate) ? `复习：${displayDate(item.reviewDate)}` : "";
  const attachment = item.attachment?.name ? `附件：${item.attachment.name}` : "";
  return [`# ${item.title || "课堂整理"}`, item.subtitle ? `## ${item.subtitle}` : "", project, status, tags, review, attachment, ...lines]
    .filter(Boolean)
    .join("\n");
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => alert("已复制，可粘贴到课件备注或大纲。")).catch(() => fallbackCopyText(text));
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
    alert("已复制，可粘贴到课件备注或大纲。");
  } catch (error) {
    prompt("复制下面内容到课件", text);
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
  button.title = label;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick(event);
  });
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
  const quotes = getFilteredTeachingQuotes();

  if (!state.teachingQuotes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "还没有教言摘录，可以先添加一条。";
    container.append(empty);
    return;
  }

  if (!quotes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "这个人物标签下还没有教言摘录。";
    container.append(empty);
    return;
  }

  quotes.forEach((quote) => {
    container.append(createTeachingQuoteCard(quote, options));
  });
}

function getFilteredTeachingQuotes() {
  if (state.teachingTeacherFilter === "all") return state.teachingQuotes;
  return state.teachingQuotes.filter((quote) => normalizeTeacherLabel(quote.teacher) === state.teachingTeacherFilter);
}

function getTeachingTeacherLabels() {
  return [...new Set(state.teachingQuotes.map((quote) => normalizeTeacherLabel(quote.teacher)))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function createTeachingTeacherTabs() {
  const tabs = document.createElement("div");
  tabs.className = "teaching-teacher-tabs";
  const labels = getTeachingTeacherLabels();
  if (state.teachingTeacherFilter !== "all" && !labels.includes(state.teachingTeacherFilter)) {
    state.teachingTeacherFilter = "all";
  }
  tabs.append(createTeachingTeacherChip("all", "全部人物", state.teachingQuotes.length));
  labels.forEach((label) => {
    const count = state.teachingQuotes.filter((quote) => normalizeTeacherLabel(quote.teacher) === label).length;
    tabs.append(createTeachingTeacherChip(label, label, count));
  });
  return tabs;
}

function createTeachingTeacherChip(value, label, count) {
  const chip = document.createElement("div");
  chip.className = "teaching-teacher-chip";
  chip.classList.toggle("active", state.teachingTeacherFilter === value);

  const filter = document.createElement("button");
  filter.type = "button";
  filter.className = "teaching-teacher-filter";
  filter.addEventListener("click", () => {
    state.teachingTeacherFilter = value;
    renderTeachingQuotes();
  });

  const title = document.createElement("strong");
  title.textContent = label;
  const total = document.createElement("span");
  total.textContent = `${count} 条`;
  filter.append(title, total);
  chip.append(filter);

  if (value !== "all") {
    const rename = document.createElement("button");
    rename.type = "button";
    rename.className = "teaching-teacher-action";
    rename.textContent = "改名";
    rename.addEventListener("click", () => renameTeachingTeacherLabel(value));
    chip.append(rename);
  }
  return chip;
}

function renameTeachingTeacherLabel(oldLabel) {
  const next = prompt("修改人物 / 上师标签", oldLabel);
  if (next === null) return;
  const normalized = normalizeTeacherLabel(next);
  state.teachingQuotes.forEach((quote) => {
    if (normalizeTeacherLabel(quote.teacher) === oldLabel) quote.teacher = normalized;
  });
  state.teachingTeacherFilter = normalized;
  saveTeachingQuotes();
  renderTeachingQuotes();
}

function createTeachingQuoteCard(quote, options = {}) {
  const card = document.createElement("blockquote");
  card.className = "teaching-quote";

  const teacher = document.createElement("span");
  teacher.className = "teaching-teacher-label";
  teacher.textContent = normalizeTeacherLabel(quote.teacher);
  const text = document.createElement("p");
  text.textContent = quote.text;
  card.append(teacher, text);

  if (options.editable) {
    const actions = document.createElement("div");
    actions.className = "teaching-quote-actions";
    const teacherButton = document.createElement("button");
    teacherButton.className = "teaching-delete-button secondary";
    teacherButton.type = "button";
    teacherButton.textContent = "改标签";
    teacherButton.addEventListener("click", () => editTeachingQuoteTeacher(quote.id));
    const deleteButton = document.createElement("button");
    deleteButton.className = "teaching-delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => deleteTeachingQuote(quote.id));
    actions.append(teacherButton, deleteButton);
    card.append(actions);
  }

  return card;
}

function createTeachingQuoteForm() {
  const form = document.createElement("form");
  form.className = "teaching-quote-form compact";
  const teacher = document.createElement("input");
  teacher.type = "text";
  teacher.placeholder = "人物 / 上师，如晋美彭措法王";
  teacher.value = state.teachingTeacherFilter !== "all" ? state.teachingTeacherFilter : TEACHING_DEFAULT_TEACHER;
  const input = document.createElement("textarea");
  input.placeholder = "གདམས་ངག 请输入新的教言摘录";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "加入摘录";
  form.append(teacher, input, button);
  form.addEventListener("submit", (event) => addTeachingQuote(event, input, teacher));
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
  eyebrow.textContent = "自动目录";
  const title = document.createElement("strong");
  title.textContent = "目录";
  titleWrap.append(eyebrow, title);
  const count = document.createElement("span");
  count.className = "note-toc-count";
  count.textContent = `${pages.length} 页 · ${notes.length} 篇`;
  head.append(titleWrap, count);

  const ledger = document.createElement("div");
  ledger.className = "note-toc-ledger";
  const allTags = new Set(state.notes.flatMap((note) => note.tags));
  [
    ["全部笔记", state.notes.length],
    ["置顶", state.notes.filter((note) => note.pinned).length],
    ["标签", allTags.size]
  ].forEach(([label, value]) => {
    const item = document.createElement("span");
    item.innerHTML = `<strong>${value}</strong><small>${label}</small>`;
    ledger.append(item);
  });

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
      meta.textContent = getNoteMetaLine(note);
      content.append(itemTitle, meta);

      item.append(order, content);
      noteList.append(item);
    });
  }

  els.noteToc.append(head, ledger, pageSection, noteSection);
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
    ["practice-counter-page", "功课计数"],
    ["offering-lamp-page", "供灯"],
    ["ppt-organizer-page", "课堂整理"],
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

const NOTE_LIST_RENDER_STEP = 60;
let noteListRenderLimit = NOTE_LIST_RENDER_STEP;
let noteListRenderSignature = "";

function renderList() {
  if (window.BuliEnhance) window.BuliEnhance.afterList();
  const notes = getFilteredNotes();
  els.noteList.replaceChildren();

  if (!notes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "没有匹配的笔记";
    els.noteList.append(empty);
    return;
  }

  // 一生尺度的性能保护：筛选条件变化时重置分页；默认只渲染最近一批
  const signature = [state.filter, state.query, state.sort, state.yearFilter || "all"].join("|");
  if (signature !== noteListRenderSignature) {
    noteListRenderSignature = signature;
    noteListRenderLimit = NOTE_LIST_RENDER_STEP;
  }
  const visibleNotes = notes.slice(0, noteListRenderLimit);

  visibleNotes.forEach((note) => {
    const fragment = els.noteCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".note-card");
    const button = fragment.querySelector(".note-card-button");
    const type = fragment.querySelector(".type-pill");
    const date = fragment.querySelector(".note-date");
    const title = fragment.querySelector("h3");
    const body = fragment.querySelector("p");
    const person = fragment.querySelector(".person-chip");
    const pin = fragment.querySelector(".pin-chip");
    const tags = fragment.querySelector(".note-card-tags");
    const pageMark = fragment.querySelector(".note-page-mark");
    const imageCount = fragment.querySelector(".note-image-count");

    card.classList.toggle("active", note.id === state.activeId);
    card.dataset.noteType = note.type;
    type.textContent = typeLabels[note.type];
    type.classList.add(note.type);
    date.textContent = displayDate(note.date);
    title.textContent = note.title || "未命名笔记";
    body.textContent = getNoteExcerpt(note);
    person.textContent = note.person || "";
    person.classList.toggle("hidden", !note.person);
    pin.classList.toggle("hidden", !note.pinned);
    pageMark.textContent = note.pinned ? "置顶" : displayDate(note.date).slice(0, 5);
    imageCount.textContent = note.images?.length ? `${note.images.length} 图` : note.source ? "来源" : "";
    imageCount.classList.toggle("hidden", !note.images?.length && !note.source);
    renderTagChips(tags, note.tags, 3);
    button.addEventListener("click", () => {
      selectNote(note.id);
      scrollToEditor();
    });
    els.noteList.append(fragment);
  });

  if (notes.length > visibleNotes.length) {
    const rest = notes.length - visibleNotes.length;
    const more = document.createElement("button");
    more.type = "button";
    more.className = "note-list-more";
    more.textContent = `显示更早的 ${Math.min(NOTE_LIST_RENDER_STEP, rest)} 篇（还有 ${rest} 篇）`;
    more.addEventListener("click", () => {
      noteListRenderLimit += NOTE_LIST_RENDER_STEP;
      renderList();
    });
    els.noteList.append(more);
  }
}

function renderTagChips(container, tags, limit = 4) {
  if (!container) return;
  container.replaceChildren();
  const visibleTags = (Array.isArray(tags) ? tags : []).filter(Boolean).slice(0, limit);
  container.classList.toggle("hidden", !visibleTags.length);
  visibleTags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.textContent = `#${tag}`;
    container.append(chip);
  });
}

function getNoteExcerpt(note) {
  const body = String(note.body || "").replace(/\s+/g, " ").trim();
  if (body) return body;
  if (note.source) return `来源：${note.source}`;
  if (note.tags?.length) return `标签：${note.tags.join("、")}`;
  return " ";
}

function getNoteMetaLine(note) {
  return [
    note.date || "未定日期",
    typeLabels[note.type] || "笔记",
    note.person,
    note.source,
    note.images?.length ? `${note.images.length} 图` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

function renderIndexSummary() {
  const notes = getFilteredNotes();
  const tags = new Set(state.notes.flatMap((note) => note.tags));
  const pinned = state.notes.filter((note) => note.pinned).length;
  const latest = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt)[0];

  if (els.indexResultCount) els.indexResultCount.textContent = `${notes.length} 篇`;
  if (els.indexInsightTotal) els.indexInsightTotal.textContent = state.notes.length;
  if (els.indexInsightPinned) els.indexInsightPinned.textContent = pinned;
  if (els.indexInsightTagged) els.indexInsightTagged.textContent = tags.size;
  if (els.indexInsightRecent) els.indexInsightRecent.textContent = latest ? displayDate(latest.date).replace(/\s+/g, "") : "无日期";
  try { refreshNoteYearOptions(); } catch (e) { /* ignore */ }
  try { renderDataSteward(); } catch (e) { /* ignore */ }
}

function renderStats() {
  const people = new Set(state.notes.map((note) => note.person).filter(Boolean));
  const tags = new Set(state.notes.flatMap((note) => note.tags));
  if (els.totalCount) els.totalCount.textContent = state.notes.length;
  if (els.personCount) els.personCount.textContent = people.size;
  if (els.tagCount) els.tagCount.textContent = tags.size;
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

function bloomGardenFlowers() {
  if (!els.bloomGarden) return;
  els.bloomGarden.classList.remove("is-blooming");
  void els.bloomGarden.offsetWidth;
  els.bloomGarden.classList.add("is-blooming");
}

function loadBloomGardenPhotos() {
  try {
    const saved = JSON.parse(localStorage.getItem(BLOOM_GARDEN_PHOTOS_STORAGE_KEY));
    if (saved && typeof saved === "object") {
      return {
        teacher: String(saved.teacher || ""),
        self: String(saved.self || "")
      };
    }
  } catch (error) {
    console.warn("Failed to load bloom garden photos", error);
  }
  return { teacher: "", self: "" };
}

function saveBloomGardenPhotos(photos) {
  try {
    localStorage.setItem(BLOOM_GARDEN_PHOTOS_STORAGE_KEY, JSON.stringify(photos));
    return true;
  } catch (error) {
    console.warn("Failed to save bloom garden photos", error);
    alert("照片保存失败，请换一张较小的图片。");
    return false;
  }
}

function renderBloomGardenPhotos() {
  const photos = loadBloomGardenPhotos();
  setBloomGardenPhotoElement(els.bloomTeacherPhoto, photos.teacher);
  setBloomGardenPhotoElement(els.bloomSelfPhoto, photos.self);
}

function getBloomGardenPhotoElement(key) {
  if (key === "teacher") return els.bloomTeacherPhoto;
  if (key === "self") return els.bloomSelfPhoto;
  return null;
}

function setBloomGardenPhotoElement(image, src) {
  if (!image) return;
  const hasPhoto = Boolean(src);
  image.classList.toggle("has-photo", hasPhoto);
  if (hasPhoto) {
    image.src = src;
  } else {
    image.removeAttribute("src");
  }
}

async function updateBloomGardenPhoto(event) {
  const input = event.currentTarget;
  const key = input.dataset.bloomPhotoInput;
  const file = input.files?.[0];
  if (!key || !file) return;
  const target = getBloomGardenPhotoElement(key);
  const seat = input.closest(".garden-photo-seat");
  let previewUrl = "";
  if (target && window.URL?.createObjectURL) {
    previewUrl = URL.createObjectURL(file);
    setBloomGardenPhotoElement(target, previewUrl);
  }
  seat?.classList.add("is-loading");
  try {
    const image = await readBloomPortraitFile(file);
    setBloomGardenPhotoElement(target, image);
    const photos = loadBloomGardenPhotos();
    photos[key] = image;
    if (saveBloomGardenPhotos(photos)) {
      bloomGardenFlowers();
      try { await BuliImageLayer.flush(); } catch (e) { /* ignore */ }
    }
  } catch (error) {
    console.warn("Failed to update bloom garden photo", error);
    alert("照片读取失败，请换一张图片再试。");
  } finally {
    seat?.classList.remove("is-loading");
    input.value = "";
    if (previewUrl) {
      setTimeout(() => URL.revokeObjectURL(previewUrl), 1200);
    }
  }
}

function renderTimeline() {
  if (state.view !== "timeline") return;
  els.timelineView.replaceChildren();
  const intro = document.createElement("div");
  intro.className = "teaching-manager-intro";
  intro.innerHTML = "<span>གདམས་ངག</span><strong>教言摘录彩页</strong><p>这里的内容会同步到上方彩页，可继续添加，也可删除不需要的条目。</p>";

  const form = createTeachingQuoteForm();
  const teacherTabs = createTeachingTeacherTabs();
  const list = document.createElement("div");
  list.className = "teaching-quote-grid manager";
  renderTeachingQuoteList(list, { editable: true });

  els.timelineView.append(intro, form, teacherTabs, list);
}

function getActiveNote() {
  return state.notes.find((note) => note.id === state.activeId);
}

function getFilteredNotes() {
  return state.notes
    .filter((note) => state.filter === "all" || note.type === state.filter)
    .filter((note) => (state.yearFilter || "all") === "all" || String(note.date || "").slice(0, 4) === state.yearFilter)
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

const BACKUP_STAMP_KEY = "buliLastBackup.v1";

function exportNotes() {
  const data = {
    exportedAt: new Date().toISOString(),
    appName: "不离手账",
    backupVersion: 2,
    counts: {
      notes: state.notes.length,
      teachingQuotes: state.teachingQuotes.length,
      pptNotes: state.modules.pptNotes?.length || 0,
      practiceCounters: state.modules.practiceCounters?.length || 0
    },
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
  try {
    localStorage.setItem(BACKUP_STAMP_KEY, new Date().toISOString());
  } catch (e) { /* ignore */ }
  try { renderDataSteward(); } catch (e) { /* ignore */ }
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

/* === 不离手账：分类空白页模板与编辑页排版优化补丁 2026-06-08 ===
   仅作用于笔记编辑页：根据“日记 / 读书笔记 / 备忘录 / 教言摘录”类型，显示对应空白页模板。
   不修改供灯、相册、首页、尾页、导出、保存、图片插入、翻页等功能。
*/
(() => {
  if (window.__buliNotebookTypeTemplatePatch) return;
  window.__buliNotebookTypeTemplatePatch = "2026-06-08-type-template-pages";

  if (typeof els === "undefined" || !els?.editorForm || !els?.noteType || !els?.noteBody) return;

  const TYPE_TEMPLATE_PAGES = {
    diary: {
      label: "日记",
      badge: "ཉིན་ཐོ། 日记",
      title: "日记空白页",
      subtitle: "记录今日所见、心绪觉察、感恩与明日愿望。",
      placeholder: "从今天的一件小事、一点心绪或一个愿望开始写。",
      sourcePlaceholder: "地点、缘起或今日关键词",
      body: [
        "日期：",
        "天气 / 地点：",
        "今日心绪：",
        "",
        "一、今日所见",
        "- ",
        "",
        "二、今日所感",
        "- ",
        "",
        "三、今日感恩",
        "1. ",
        "2. ",
        "3. ",
        "",
        "四、可以落实的一件小事",
        "- ",
        "",
        "明日一愿："
      ].join("\n"),
      sections: [
        { label: "所见所感", text: "今日所见：\n- \n\n今日所感：\n- " },
        { label: "三件感恩", text: "今日感恩：\n1. \n2. \n3. " },
        { label: "明日一愿", text: "明日一愿：\n- " }
      ]
    },
    reading: {
      label: "读书笔记",
      badge: "ཀློག་ཐོ། 读书",
      title: "读书摘录空白页",
      subtitle: "按书目信息、原文摘录、理解、待查问题分区整理。",
      placeholder: "摘录原文、页码和自己的理解，适合读书笔记与讲记整理。",
      sourcePlaceholder: "书名、讲记、课程或页码",
      body: [
        "书名 / 讲记：",
        "作者 / 讲者：",
        "章节 / 页码：",
        "阅读日期：",
        "",
        "一、原文摘录",
        "「」",
        "",
        "二、关键词",
        "- ",
        "",
        "三、我的理解",
        "- ",
        "",
        "四、可引用句",
        "- ",
        "",
        "五、待查 / 待复习",
        "- "
      ].join("\n"),
      sections: [
        { label: "书目信息", text: "书名 / 讲记：\n作者 / 讲者：\n章节 / 页码：\n阅读日期：" },
        { label: "原文摘录", text: "原文摘录：\n「」\n\n页码 / 章节：" },
        { label: "理解复盘", text: "我的理解：\n- \n\n可引用句：\n- \n\n待查 / 待复习：\n- " }
      ]
    },
    memo: {
      label: "备忘录",
      badge: "དྲན་ཐོ། 备忘",
      title: "备忘录空白页",
      subtitle: "突出待办、提醒、清单与完成回看，适合手机端快速记录。",
      placeholder: "写下待办、提醒、清单、灵感或当天需要完成的小事。",
      sourcePlaceholder: "事项来源、地点或提醒对象",
      body: [
        "备忘日期：",
        "重要程度：□ 今日必做  □ 本周完成  □ 以后处理",
        "提醒时间：",
        "",
        "一、重要事项",
        "☐ ",
        "☐ ",
        "☐ ",
        "",
        "二、补充说明",
        "- ",
        "",
        "三、完成后记录",
        "- "
      ].join("\n"),
      sections: [
        { label: "今日待办", text: "今日待办：\n☐ \n☐ \n☐ " },
        { label: "提醒事项", text: "提醒时间：\n提醒对象：\n事项：" },
        { label: "完成回看", text: "完成后记录：\n- \n\n下一步：\n- " }
      ]
    },
    timeline: {
      label: "教言摘录",
      badge: "གདམས་ངག 教言",
      title: "教言整理空白页",
      subtitle: "按原文、来源、关键词、要义与落实方式分区。",
      placeholder: "整理教言原文、出处、关键词和自己可以落实的一点。",
      sourcePlaceholder: "上师、讲记、开示、出处或章节",
      body: [
        "教言原文：",
        "「」",
        "",
        "上师 / 来源：",
        "时间 / 章节：",
        "",
        "一、关键词",
        "- ",
        "",
        "二、要义整理",
        "1. ",
        "2. ",
        "",
        "三、与我相关",
        "- ",
        "",
        "四、今日落实",
        "- ",
        "",
        "回向 / 发愿："
      ].join("\n"),
      sections: [
        { label: "教言原文", text: "教言原文：\n「」\n\n上师 / 来源：\n时间 / 章节：" },
        { label: "要义整理", text: "关键词：\n- \n\n要义整理：\n1. \n2. " },
        { label: "今日落实", text: "与我相关：\n- \n\n今日落实：\n- \n\n回向 / 发愿：" }
      ]
    }
  };

  const LEGACY_TEMPLATE_BODIES = Object.values(typeof NOTE_BODY_TEMPLATES === "object" ? NOTE_BODY_TEMPLATES : {})
    .map((item) => item?.body)
    .filter(Boolean);

  function normalizeTemplateText(value) {
    return String(value || "").replace(/\r\n/g, "\n").trim();
  }

  function getTypeTemplate(type) {
    return TYPE_TEMPLATE_PAGES[type] || TYPE_TEMPLATE_PAGES.diary;
  }

  function knownFullTemplates() {
    return [
      ...Object.values(TYPE_TEMPLATE_PAGES).map((item) => item.body),
      ...LEGACY_TEMPLATE_BODIES
    ].map(normalizeTemplateText);
  }

  function isBlankOrKnownTemplate(value) {
    const normalized = normalizeTemplateText(value);
    return !normalized || knownFullTemplates().includes(normalized);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function ensureTemplatePanel() {
    let panel = document.querySelector("#noteTypeTemplatePanel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "noteTypeTemplatePanel";
      panel.className = "note-type-template-panel";
      panel.setAttribute("aria-label", "分类空白页模板");
      const assist = els.editorForm.querySelector(".writing-assist");
      if (assist) {
        assist.insertAdjacentElement("afterend", panel);
      } else {
        els.noteBody.insertAdjacentElement("beforebegin", panel);
      }
    }
    return panel;
  }

  function insertTextAtCursor(text, label = "模板") {
    if (!els.noteBody) return;
    const start = els.noteBody.selectionStart ?? els.noteBody.value.length;
    const end = els.noteBody.selectionEnd ?? els.noteBody.value.length;
    const current = els.noteBody.value;
    const prefix = current.slice(0, start);
    const suffix = current.slice(end);
    const needsBeforeBreak = prefix && !prefix.endsWith("\n") ? "\n\n" : "";
    const needsAfterBreak = suffix && !suffix.startsWith("\n") ? "\n\n" : "";
    const inserted = `${needsBeforeBreak}${text}${needsAfterBreak}`;
    els.noteBody.value = `${prefix}${inserted}${suffix}`;
    const nextCursor = prefix.length + inserted.length;
    els.noteBody.setSelectionRange(nextCursor, nextCursor);
    els.noteBody.focus();
    updateActiveNote();
    if (els.saveState) els.saveState.textContent = `已插入「${label}」`;
  }

  function applyFullTypeTemplate(forceReplace = false) {
    const note = getActiveNote();
    if (!note) return;
    const template = getTypeTemplate(note.type || els.noteType.value);
    const current = els.noteBody.value;

    if (!forceReplace && !isBlankOrKnownTemplate(current)) {
      const ok = confirm("当前页面已有正文。是否把该模板插入到光标处？\n\n选择“确定”：插入模板，不覆盖原文。\n选择“取消”：保留原文，不插入。");
      if (!ok) return;
      insertTextAtCursor(template.body, template.label);
      return;
    }

    els.noteBody.value = template.body;
    note.body = template.body;
    note.type = els.noteType.value || note.type;
    note.updatedAt = Date.now();
    renderEditorStatus(note);
    scheduleSave();
    scheduleNoteRender(note);
    if (els.saveState) els.saveState.textContent = `已套用「${template.label}」模板`;
  }

  function renderTypeTemplateUI() {
    const note = getActiveNote();
    const activeType = note?.type || els.noteType.value || "diary";
    const template = getTypeTemplate(activeType);
    const panel = ensureTemplatePanel();

    els.editorForm.dataset.noteKind = activeType;
    els.noteBody.placeholder = template.placeholder;
    if (els.noteSource) els.noteSource.placeholder = template.sourcePlaceholder;

    const buttonBox = els.editorForm.querySelector(".writing-assist-buttons");
    if (buttonBox) {
      buttonBox.innerHTML = "";
      const fullButton = document.createElement("button");
      fullButton.type = "button";
      fullButton.className = "note-template-action primary";
      fullButton.textContent = `套用${template.label}模板`;
      fullButton.addEventListener("click", () => applyFullTypeTemplate(false));
      buttonBox.append(fullButton);

      template.sections.forEach((section) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "note-template-action";
        button.textContent = section.label;
        button.addEventListener("click", () => insertTextAtCursor(section.text, section.label));
        buttonBox.append(button);
      });
    }

    panel.innerHTML = `
      <div class="note-type-template-head">
        <span class="note-type-template-badge">${escapeHtml(template.badge)}</span>
        <div>
          <strong>${escapeHtml(template.title)}</strong>
          <small>${escapeHtml(template.subtitle)}</small>
        </div>
      </div>
      <div class="note-type-template-lines" aria-label="当前模板分区">
        ${template.sections.map((section) => `<span>${escapeHtml(section.label)}</span>`).join("")}
      </div>
    `;
  }

  function ensureActiveNoteTemplate() {
    const note = getActiveNote();
    if (!note) return;
    const template = getTypeTemplate(note.type);
    if (isBlankOrKnownTemplate(note.body)) {
      note.body = template.body;
      if (els.noteBody) els.noteBody.value = template.body;
      note.updatedAt = Date.now();
      renderEditorStatus(note);
      scheduleSave();
      scheduleNoteRender(note);
    }
  }

  const originalCreateNote = createNote;
  createNote = function patchedCreateNote(options = {}) {
    const note = originalCreateNote(options);
    const template = getTypeTemplate(note.type);
    if (!options.body && isBlankOrKnownTemplate(note.body)) {
      note.body = template.body;
      note.updatedAt = Date.now();
      if (state.activeId === note.id && els.noteBody) els.noteBody.value = note.body;
      if (!options.silent) scheduleSave();
    }
    return note;
  };

  const originalRenderEditor = renderEditor;
  renderEditor = function patchedRenderEditor(...args) {
    const result = originalRenderEditor.apply(this, args);
    renderTypeTemplateUI();
    return result;
  };

  els.noteType.addEventListener("change", () => {
    const note = getActiveNote();
    if (!note) return;
    const newType = els.noteType.value || "diary";
    const nextTemplate = getTypeTemplate(newType);
    note.type = newType;

    if (isBlankOrKnownTemplate(els.noteBody.value)) {
      els.noteBody.value = nextTemplate.body;
      note.body = nextTemplate.body;
      note.updatedAt = Date.now();
      renderEditorStatus(note);
      scheduleSave();
      scheduleNoteRender(note);
    }

    renderTypeTemplateUI();
  });

  ensureActiveNoteTemplate();
  renderTypeTemplateUI();
})();
/*
 * 空白页壁纸上传修复补丁
 * 作用：修复安卓端 / WebView 中“添加壁纸”点击不稳定、图片过大保存失败、部分机型 crypto.randomUUID 不兼容等问题。
 * 使用：复制到 app.js 最末尾；或者直接替换补丁包里的完整 app.js。
 */

function createNotebookSafeId(prefix = "id") {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
  } catch (error) {
    console.warn("crypto.randomUUID unavailable", error);
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getWallpaperUploadTitle(file) {
  const name = String(file?.name || "").replace(/\.[^.]+$/, "").trim();
  return name || "自定义壁纸";
}

function canvasToNotebookWallpaperDataUrl(image, width, height, quality = 0.72) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas is not supported");
  context.fillStyle = "#f8f1df";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function readWallpaperImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || "").startsWith("image/")) {
      reject(new Error("不是可用的图片文件"));
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const source = String(reader.result || "");
      if (!source) {
        reject(new Error("图片读取为空"));
        return;
      }

      const image = new Image();
      image.addEventListener("load", () => {
        try {
          const width = image.naturalWidth || image.width || 1;
          const height = image.naturalHeight || image.height || 1;
          const profiles = [
            { maxSide: 1280, quality: 0.74, maxLength: 760000 },
            { maxSide: 1080, quality: 0.72, maxLength: 640000 },
            { maxSide: 900, quality: 0.7, maxLength: 520000 },
            { maxSide: 760, quality: 0.68, maxLength: 420000 }
          ];
          let fallback = source;
          for (const profile of profiles) {
            const scale = Math.min(1, profile.maxSide / Math.max(width, height));
            const nextWidth = width * scale;
            const nextHeight = height * scale;
            const dataUrl = canvasToNotebookWallpaperDataUrl(image, nextWidth, nextHeight, profile.quality);
            fallback = dataUrl;
            if (dataUrl.length <= profile.maxLength) {
              resolve(dataUrl);
              return;
            }
          }
          resolve(fallback);
        } catch (error) {
          reject(error);
        }
      });
      image.addEventListener("error", () => {
        reject(new Error("图片格式暂不支持，请换 JPG、PNG 或 WebP 图片"));
      });
      image.src = source;
    });
    reader.addEventListener("error", () => reject(new Error("图片读取失败")));
    reader.readAsDataURL(file);
  });
}

function createAddPageWallpaperOption() {
  const card = document.createElement("div");
  card.className = "page-theme-option page-theme-add page-theme-upload-fixed";

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp,image/gif,image/*";
  input.multiple = true;
  input.id = createNotebookSafeId("page-wallpaper-input");
  input.addEventListener("change", addPageWallpapers);

  const label = document.createElement("label");
  label.className = "page-theme-select page-theme-add-button";
  label.htmlFor = input.id;
  label.setAttribute("role", "button");
  label.setAttribute("tabindex", "0");
  label.innerHTML = "<span>添加壁纸</span><small>从相册选择</small>";
  label.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });

  card.append(input, label);
  return card;
}

async function addPageWallpapers(event) {
  const input = event.currentTarget;
  const files = [...(input.files || [])].filter((file) => String(file.type || "").startsWith("image/"));
  if (!files.length) return;

  const previousWallpapers = Array.isArray(pageWallpapers) ? [...pageWallpapers] : [];
  const added = [];
  const skipped = [];

  try {
    for (const file of files.slice(0, 12)) {
      try {
        const image = await readWallpaperImageFile(file);
        added.push({
          id: createNotebookSafeId("wallpaper"),
          title: getWallpaperUploadTitle(file),
          image
        });
      } catch (error) {
        console.warn("Skipped wallpaper image", file?.name, error);
        skipped.push(file?.name || "未命名图片");
      }
    }

    if (!added.length) {
      alert("壁纸添加失败：图片格式可能不受支持，建议换 JPG、PNG 或 WebP 图片再试。");
      return;
    }

    pageWallpapers = [...previousWallpapers, ...added];
    state.pageWallpapers = pageWallpapers;

    if (!savePageWallpapers()) {
      pageWallpapers = previousWallpapers;
      state.pageWallpapers = pageWallpapers;
      renderPageWallpaperPicker(normalizePageTheme(getActiveNote()?.pageTheme));
      return;
    }

    const firstAdded = added[0];
    if (firstAdded) {
      updatePageTheme(firstAdded.id);
      renderPageTheme(firstAdded.id);
    } else {
      renderPageWallpaperPicker(normalizePageTheme(getActiveNote()?.pageTheme));
    }

    if (skipped.length) {
      alert(`已添加 ${added.length} 张壁纸；另有 ${skipped.length} 张图片格式不支持，未添加。`);
    }
  } catch (error) {
    pageWallpapers = previousWallpapers;
    state.pageWallpapers = pageWallpapers;
    console.warn("Failed to add page wallpapers", error);
    alert("壁纸读取失败，请换一张 JPG、PNG 或 WebP 图片再试。");
  } finally {
    input.value = "";
  }
}
/* === Buli Complete Logic Fix: note index, mature templates, classroom pages, offering buttons === */
(function buliCompleteLogicFix() {
  if (window.__BULI_COMPLETE_LOGIC_FIX_V1__) return;
  window.__BULI_COMPLETE_LOGIC_FIX_V1__ = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const today = () => new Date().toISOString().slice(0, 10);
  const safeText = (value) => String(value || "").trim();
  const id = () => (globalThis.crypto?.randomUUID?.() || `buli-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const NOTE_TEMPLATES_MATURE = {
    diary: {
      label: "日课日记",
      title: "日课日记",
      sourcePlaceholder: "地点 / 今日因缘",
      tags: ["日课", "反观", "感恩"],
      body: `日期：
天气：
地点：
今日心境：

一、今日所历
记录今天重要的人、事、因缘。

二、今日所感
记录内心触动、烦恼、欢喜、惭愧、感恩。

三、今日修持
□ 念诵
□ 闻法
□ 供灯
□ 放生
□ 忏悔
□ 回向
□ 其他：

四、今日反观
今天我在哪一处起了执著？
今天我有没有伤害众生？
今天我有没有生起一念善心？

五、今日感恩
-

六、明日一愿
愿我明日：
-`
    },
    reading: {
      label: "法本读书笔记",
      title: "法本读书笔记",
      sourcePlaceholder: "书名 / 法本 / 讲记",
      tags: ["法本", "读书", "待复习"],
      body: `书名 / 法本：
作者 / 译者：
章节 / 品名：
页码 / 位置：
阅读日期：

一、原文摘录
「」

二、关键词
#无常  #菩提心  #空性  #出离心

三、我的理解
这段文字主要说明：
-

四、与修行的关系
它提醒我：
它对治我：
它可以落实在：

五、疑问与待查
-

六、复习标记
□ 需要重读
□ 需要背诵
□ 需要请教
□ 已理解
□ 已落实`
    },
    memo: {
      label: "备忘录",
      title: "备忘录",
      sourcePlaceholder: "地点 / 相关事项",
      tags: ["备忘", "待办"],
      body: `事项标题：
日期：
提醒时间：
重要程度：普通 / 重要 / 紧急

一、待办事项
□ 
□ 
□ 

二、所需准备
-

三、相关联系人 / 地点
-

四、完成记录
-`
    },
    timeline: {
      label: "教言摘录",
      title: "教言摘录",
      sourcePlaceholder: "上师 / 来源 / 法本 / 开示",
      tags: ["教言", "闻思", "待落实"],
      body: `教言标题：
上师 / 来源：
法本 / 开示：
日期：

一、教言原文
「」

二、关键词
#菩提心  #无常  #依止上师

三、要义整理
这句教言的核心是：
-

四、对我的提醒
我应当反观：
-

五、落实方式
今天可以落实的一件事：
-

六、回向 / 发愿
愿以此闻思善根：
-`
    }
  };

  const CLASSROOM_TEMPLATES_MATURE = {
    index: {
      label: "索引",
      title: "闻思修学目录",
      hint: "自动汇集已保存的闻法、闻思、温习与法本整理。"
    },
    outline: {
      label: "提纲",
      title: "闻法提纲",
      status: "capture",
      tags: "闻法提纲, 待整理",
      body: `闻法主题：
法本 / 开示来源：
上师 / 法师：
日期：

一、本课主旨
-

二、前后文脉络
-

三、主要教言
1.
2.
3.

四、关键词 / 法义名相
-

五、我当下最受触动之处
-

六、待请教 / 待查阅
-`
    },
    cornell: {
      label: "闻思",
      title: "闻思整理",
      status: "organizing",
      tags: "闻思整理, 待复习",
      body: `闻法主题：
日期：

【线索 / 提问区】
- 本课最核心的问题是：
- 上师反复强调的是：
- 我还没有真正理解的是：

【闻法记录区】
1.
2.
3.

【关键词】
-

【思维整理】
这段法义对治的是：
我过去的执著点是：
可以如何落实到日常：

【总结】
用三句话总结今日闻思：
1.
2.
3.`
    },
    review: {
      label: "温习",
      title: "温习复习",
      status: "review",
      tags: "温习复习, 待背诵",
      body: `复习主题：
复习日期：

一、今日应熟记的教言 / 偈颂
-

二、必须理解的法义
1.
2.
3.

三、容易忘失 / 混淆之处
-

四、今日反观
我是否真正用在身语意中：
-

五、下一步
□ 重听开示
□ 背诵原文
□ 查阅法本
□ 请教师兄 / 法师
□ 落实一件善行`
    },
    slides: {
      label: "法本",
      title: "法本 / 开示整理",
      status: "organizing",
      tags: "法本整理, 共修分享",
      body: `整理标题：
适用场景：□ 自修  □ 共修  □ 分享  □ 汇报

一、主题标题
-

二、三段式结构
第一部分：
第二部分：
第三部分：

三、可引用原文 / 教言
「」

四、相关公案 / 譬喻
-

五、图片 / 法本资料
-

六、结尾回向 / 发愿
-`
    }
  };

  const legacyTemplatePhrases = [
    "今日所见", "心里想记住的一句", "书名 / 讲记", "摘录：", "教言原文", "落到修行",
    "线索 / 提问：", "笔记区：", "课后总结：", "可整理成课件", "今日三条收获"
  ];

  function isEmptyOrTemplateText(value) {
    const text = safeText(value);
    if (!text) return true;
    return legacyTemplatePhrases.some((phrase) => text.includes(phrase)) ||
      Object.values(NOTE_TEMPLATES_MATURE).some((tpl) => safeText(tpl.body) === text) ||
      Object.values(CLASSROOM_TEMPLATES_MATURE).some((tpl) => safeText(tpl.body) === text);
  }

  function setSaveMessage(message) {
    const target = $("#saveState");
    if (target) target.textContent = message;
  }

  function applyOrdinaryTemplate(type, options = {}) {
    const tpl = NOTE_TEMPLATES_MATURE[type] || NOTE_TEMPLATES_MATURE.diary;
    const note = typeof getActiveNote === "function" ? getActiveNote() : null;
    if (!note) return;
    const shouldReplace = options.force || isEmptyOrTemplateText(note.body) || isEmptyOrTemplateText($("#noteBody")?.value);
    note.type = type;
    if (!note.title && options.setTitle !== false) note.title = tpl.title;
    if (!note.source && $("#noteSource")) $("#noteSource").placeholder = tpl.sourcePlaceholder || "";
    if ((!Array.isArray(note.tags) || !note.tags.length) && Array.isArray(tpl.tags)) note.tags = [...tpl.tags];
    if (shouldReplace) note.body = tpl.body;
    note.updatedAt = Date.now();
    syncOrdinaryFields(note);
    if (typeof scheduleSave === "function") scheduleSave();
    if (typeof render === "function") render();
    renderEnhancedOrdinaryPanels();
  }

  function syncOrdinaryFields(note) {
    if (!note) return;
    const fields = {
      noteTitle: note.title || "",
      noteType: note.type || "diary",
      noteDate: note.date || today(),
      notePerson: note.person || "",
      noteSource: note.source || "",
      noteTags: Array.isArray(note.tags) ? note.tags.join(", ") : "",
      noteBody: note.body || ""
    };
    Object.entries(fields).forEach(([key, value]) => {
      const el = $(`#${key}`);
      if (!el) return;
      el.value = value;
    });
  }

  function createManagedNote(type) {
    const nextType = type || $("#noteType")?.value || (typeof getActiveNote === "function" ? getActiveNote()?.type : "") || "diary";
    const tpl = NOTE_TEMPLATES_MATURE[nextType] || NOTE_TEMPLATES_MATURE.diary;
    const note = typeof createNote === "function" ? createNote({ type: nextType }) : null;
    if (!note) return;
    note.type = nextType;
    note.title = tpl.title;
    note.date = today();
    note.source = "";
    note.tags = [...tpl.tags];
    note.body = tpl.body;
    note.updatedAt = Date.now();
    if (typeof selectNote === "function") selectNote(note.id);
    syncOrdinaryFields(note);
    if (typeof scheduleSave === "function") scheduleSave();
    if (typeof scrollToEditor === "function") scrollToEditor();
    if (typeof render === "function") render();
    setSaveMessage("已新建一页");
  }

  function saveCurrentOrdinaryNote() {
    if (typeof updateActiveNote === "function") updateActiveNote();
    try {
      if (typeof state !== "undefined" && Array.isArray(state.notes)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
      }
      setSaveMessage("已保存");
      renderAllEnhanced();
    } catch (error) {
      console.warn("Buli save note failed", error);
      setSaveMessage("保存失败");
      alert("保存失败。若刚添加了图片，请换较小图片后再试。");
    }
  }

  function deleteCurrentOrdinaryNote() {
    const note = typeof getActiveNote === "function" ? getActiveNote() : null;
    if (!note) return;
    if (!confirm(`确定删除「${note.title || "当前笔记"}」吗？删除后不可恢复。`)) return;
    if (typeof state !== "undefined" && Array.isArray(state.notes)) {
      state.notes = state.notes.filter((item) => item.id !== note.id);
      if (!state.notes.length && typeof createNote === "function") createNote({ silent: true, type: "diary" });
      state.activeId = state.notes[0]?.id;
      if (typeof scheduleSave === "function") scheduleSave();
      if (typeof render === "function") render();
      renderAllEnhanced();
    } else {
      $("#deleteButton")?.click();
    }
  }

  function returnToIndex() {
    if (typeof updateActiveNote === "function") updateActiveNote();
    const indexPage = $(".notebook-index-page") || $(".note-toc-feature");
    if (typeof scrollToNotebookPage === "function" && indexPage) {
      scrollToNotebookPage(indexPage);
    } else if (indexPage) {
      indexPage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function enhanceOrdinaryEditor() {
    const editor = $(".editor-card");
    const toolbar = $(".editor-toolbar", editor);
    const form = $("#editorForm");
    if (!editor || !toolbar || !form || editor.dataset.buliEnhanced === "true") return;
    editor.dataset.buliEnhanced = "true";
    editor.classList.add("buli-enhanced-editor");

    const returnBar = document.createElement("section");
    returnBar.className = "buli-editor-returnbar";
    returnBar.innerHTML = `
      <button type="button" class="buli-return-button" data-buli-note-back>‹ 返回索引</button>
      <div><strong>修行手账 · 笔记编辑</strong><span>新建内容另起一页，保存后自动进入目录</span></div>
    `;
    toolbar.before(returnBar);
    returnBar.querySelector("[data-buli-note-back]")?.addEventListener("click", returnToIndex);

    const actionBar = document.createElement("section");
    actionBar.className = "buli-editor-actionbar";
    actionBar.innerHTML = `
      <button type="button" class="primary" data-buli-note-new>＋ 新建</button>
      <button type="button" data-buli-note-save>保存</button>
      <button type="button" data-buli-note-edit>编辑</button>
      <button type="button" class="danger" data-buli-note-delete>删除</button>
    `;
    toolbar.after(actionBar);
    actionBar.querySelector("[data-buli-note-new]")?.addEventListener("click", () => createManagedNote($("#noteType")?.value || "diary"));
    actionBar.querySelector("[data-buli-note-save]")?.addEventListener("click", saveCurrentOrdinaryNote);
    actionBar.querySelector("[data-buli-note-edit]")?.addEventListener("click", () => $("#noteBody")?.focus());
    actionBar.querySelector("[data-buli-note-delete]")?.addEventListener("click", deleteCurrentOrdinaryNote);

    const typeTabs = document.createElement("nav");
    typeTabs.className = "buli-note-type-tabs";
    typeTabs.setAttribute("aria-label", "笔记分类页面");
    typeTabs.innerHTML = [
      ["diary", "日记"],
      ["reading", "读书"],
      ["memo", "备忘"],
      ["timeline", "教言"]
    ].map(([value, label]) => `<button type="button" data-buli-note-type="${value}">${label}</button>`).join("");
    actionBar.after(typeTabs);
    typeTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-buli-note-type]");
      if (!button) return;
      const type = button.dataset.buliNoteType;
      const select = $("#noteType");
      if (select) select.value = type;
      applyOrdinaryTemplate(type);
    });

    const panel = document.createElement("section");
    panel.className = "buli-current-template-panel";
    panel.id = "buliCurrentTemplatePanel";
    typeTabs.after(panel);

    $("#noteType")?.addEventListener("change", () => {
      const type = $("#noteType")?.value || "diary";
      applyOrdinaryTemplate(type);
    });

    ["#newNoteButton", "#indexNewNoteButton", "#editorNewNoteButton"].forEach((selector) => {
      const button = $(selector);
      if (!button || button.dataset.buliIntercepted === "true") return;
      button.dataset.buliIntercepted = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        createManagedNote($("#noteType")?.value || "diary");
      }, true);
    });
  }

  function renderEnhancedOrdinaryPanels() {
    const note = typeof getActiveNote === "function" ? getActiveNote() : null;
    const type = note?.type || $("#noteType")?.value || "diary";
    const tpl = NOTE_TEMPLATES_MATURE[type] || NOTE_TEMPLATES_MATURE.diary;
    $$("[data-buli-note-type]").forEach((button) => {
      button.classList.toggle("active", button.dataset.buliNoteType === type);
    });
    const panel = $("#buliCurrentTemplatePanel");
    if (panel) {
      panel.innerHTML = `
        <div class="buli-template-title"><span>${tpl.label}</span><strong>${type === "diary" ? "日课 · 反观 · 发愿" : type === "reading" ? "法本 · 摘录 · 落实" : type === "memo" ? "事项 · 提醒 · 完成" : "教言 · 要义 · 实修"}</strong></div>
        <p>${type === "diary" ? "适合记录一日因缘、心境、修持、反观与明日善愿。" : type === "reading" ? "适合法本、论典、开示的摘录、理解、疑问和复习。" : type === "memo" ? "适合快速记录待办事项、提醒时间、重要程度与完成情况。" : "适合保存上师教言、来源、关键词、要义整理与落实发愿。"}</p>
      `;
    }
  }

  function noteMatchesQuery(note, query) {
    if (!query) return true;
    return [note.title, note.source, note.person, note.body, ...(note.tags || [])].join(" ").toLowerCase().includes(query);
  }

  function noteIndexGroupLabel(note, mode) {
    if (mode === "diary") return getTimeGroup(note.date);
    if (mode === "reading") return safeText(note.source) || extractField(note.body, "书名 / 法本") || "未分类读书";
    if (mode === "timeline") return (note.tags || [])[0] || extractField(note.body, "关键词") || "未分类教言";
    if (mode === "memo") {
      const body = safeText(note.body);
      if (/已完成|完成记录[^\n]*\S/.test(body)) return "已完成";
      if (/紧急|重要/.test(body)) return "重要事项";
      return "今日待办";
    }
    return "最近记录";
  }

  function extractField(body, label) {
    const lines = String(body || "").split(/\n/);
    const line = lines.find((item) => item.includes(label));
    if (!line) return "";
    return line.split(/[：:]/).slice(1).join("：").trim();
  }

  function getTimeGroup(date) {
    const value = safeText(date);
    if (!value) return "无日期";
    const now = new Date();
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "更早";
    const diff = Math.floor((new Date(now.toISOString().slice(0, 10)) - d) / 86400000);
    if (diff <= 0) return "今日";
    if (diff <= 7) return "本周";
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return "本月";
    return "更早";
  }

  function enhanceUnifiedIndex() {
    const indexPage = $(".notebook-index-page");
    if (!indexPage || $("#buliUnifiedIndex")) return;
    const panel = document.createElement("section");
    panel.className = "buli-unified-index";
    panel.id = "buliUnifiedIndex";
    const command = $(".index-command-panel", indexPage);
    (command || $(".index-hero", indexPage) || indexPage).after(panel);
    panel.addEventListener("click", (event) => {
      const modeButton = event.target.closest("[data-buli-index-mode]");
      if (modeButton) {
        indexPage.dataset.buliIndexMode = modeButton.dataset.buliIndexMode;
        renderUnifiedIndex();
        return;
      }
      const card = event.target.closest("[data-buli-note-open]");
      if (card) {
        if (typeof selectNote === "function") selectNote(card.dataset.buliNoteOpen);
        if (typeof scrollToEditor === "function") scrollToEditor();
      }
    });
  }

  function renderUnifiedIndex() {
    const panel = $("#buliUnifiedIndex");
    if (!panel || typeof state === "undefined") return;
    const indexPage = $(".notebook-index-page");
    const mode = indexPage?.dataset.buliIndexMode || state.filter || "all";
    const query = safeText($("#searchInput")?.value || state.query).toLowerCase();
    const notes = [...(state.notes || [])]
      .filter((note) => mode === "all" || note.type === mode)
      .filter((note) => noteMatchesQuery(note, query))
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    const modeLabels = {
      all: "全部索引",
      diary: "日记目录",
      reading: "读书目录",
      memo: "备忘目录",
      timeline: "教言目录"
    };
    const groups = new Map();
    notes.forEach((note) => {
      const group = noteIndexGroupLabel(note, mode);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(note);
    });
    const tagged = notes.filter((note) => note.tags?.length).length;
    const withImages = notes.filter((note) => note.images?.length).length;
    const reviewLike = notes.filter((note) => /复习|背诵|待查|请教/.test([note.body, ...(note.tags || [])].join(" "))).length;

    panel.innerHTML = `
      <div class="buli-index-heading">
        <div><span>དཀར་ཆག ། 修行手账索引</span><strong>${modeLabels[mode] || "全部索引"}</strong></div>
        <small>日记按时间，读书按法本，教言按主题，备忘按状态，闻思按类型与复习状态。</small>
      </div>
      <nav class="buli-index-modes" aria-label="索引分类">
        ${[["all", "全部"], ["diary", "日记"], ["reading", "读书"], ["memo", "备忘"], ["timeline", "教言"]].map(([value, label]) => `<button type="button" class="${value === mode ? "active" : ""}" data-buli-index-mode="${value}">${label}</button>`).join("")}
      </nav>
      <div class="buli-index-stats">
        <span><strong>${notes.length}</strong>当前</span>
        <span><strong>${tagged}</strong>有标签</span>
        <span><strong>${reviewLike}</strong>待复习/背诵</span>
        <span><strong>${withImages}</strong>有图片</span>
      </div>
      <div class="buli-index-groups">
        ${notes.length ? [...groups.entries()].map(([group, items]) => `
          <section class="buli-index-group">
            <h3>▼ ${group} <small>${items.length} 条</small></h3>
            ${items.map((note, index) => `
              <article class="buli-index-card" data-buli-note-open="${note.id}">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <div><strong>${safeText(note.title) || "未命名笔记"}</strong><small>${typeLabels?.[note.type] || "笔记"} · ${safeText(note.date) || "无日期"}${note.source ? ` · ${note.source}` : ""}</small>${note.tags?.length ? `<em>${note.tags.slice(0, 4).map((tag) => `#${tag}`).join(" ")}</em>` : ""}</div>
                <b>›</b>
              </article>
            `).join("")}
          </section>
        `).join("") : `<p class="buli-empty-note">暂无匹配内容。点击“新建”开始记录。</p>`}
      </div>
    `;
  }

  function enhanceClassroom() {
    const page = $(".ppt-organizer-page");
    const form = $("#pptNoteForm");
    const commandbar = $(".ppt-note-commandbar", page);
    if (!page || !form || !commandbar || page.dataset.buliClassroomEnhanced === "true") return;
    page.dataset.buliClassroomEnhanced = "true";
    page.classList.add("buli-classroom-enhanced");
    page.dataset.buliClassroomMode = "index";

    if (typeof PPT_NOTE_TEMPLATES !== "undefined") {
      PPT_NOTE_TEMPLATES.outline = { label: "闻法提纲", body: CLASSROOM_TEMPLATES_MATURE.outline.body };
      PPT_NOTE_TEMPLATES.cornell = { label: "闻思整理", body: CLASSROOM_TEMPLATES_MATURE.cornell.body };
      PPT_NOTE_TEMPLATES.review = { label: "温习复习", body: CLASSROOM_TEMPLATES_MATURE.review.body };
      PPT_NOTE_TEMPLATES.slides = { label: "法本整理", body: CLASSROOM_TEMPLATES_MATURE.slides.body };
    }

    const shell = document.createElement("section");
    shell.className = "buli-classroom-shell";
    shell.innerHTML = `
      <div class="buli-classroom-top">
        <div><span>སློབ་ཁྲིད། 闻思修学</span><strong>课堂笔记系统</strong></div>
        <small>新建另起一页，保存后进入索引目录</small>
      </div>
      <nav class="buli-classroom-tabs" aria-label="课堂笔记页面">
        <button type="button" class="active" data-buli-classroom-mode="index">索引</button>
        <button type="button" data-buli-classroom-mode="outline">提纲</button>
        <button type="button" data-buli-classroom-mode="cornell">闻思</button>
        <button type="button" data-buli-classroom-mode="review">温习</button>
        <button type="button" data-buli-classroom-mode="slides">法本</button>
      </nav>
      <div class="buli-classroom-actions">
        <button type="button" class="primary" data-buli-classroom-new>＋ 新建</button>
        <button type="button" data-buli-classroom-save>保存</button>
        <button type="button" data-buli-classroom-edit>编辑</button>
        <button type="button" class="danger" data-buli-classroom-clear>清空草稿</button>
      </div>
      <section class="buli-classroom-index" id="buliClassroomIndex"></section>
      <section class="buli-classroom-current" id="buliClassroomCurrent"></section>
    `;
    commandbar.after(shell);

    shell.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-buli-classroom-mode]");
      if (tab) {
        switchClassroomMode(tab.dataset.buliClassroomMode);
        return;
      }
      const insertBtn = event.target.closest("[data-buli-template-insert]");
      if (insertBtn) {
        insertClassroomTemplate(insertBtn.dataset.buliTemplateInsert);
        return;
      }
      if (event.target.closest("[data-buli-classroom-new]")) {
        resetClassroomDraft(true);
        return;
      }
      if (event.target.closest("[data-buli-classroom-save]")) {
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        return;
      }
      if (event.target.closest("[data-buli-classroom-edit]")) {
        form.elements.body?.focus();
        return;
      }
      if (event.target.closest("[data-buli-classroom-clear]")) {
        if (confirm("清空当前课堂笔记草稿？已保存的笔记不会删除。")) resetClassroomDraft(false);
        return;
      }
      const open = event.target.closest("[data-buli-ppt-open]");
      if (open) {
        const card = document.querySelector(`[data-module-key="pptNotes"][data-module-id="${open.dataset.buliPptOpen}"]`);
        card?.scrollIntoView({ behavior: "smooth", block: "center" });
        card?.classList.add("buli-highlight");
        setTimeout(() => card?.classList.remove("buli-highlight"), 1200);
      }
    });

    form.elements.body?.classList.add("buli-classroom-body-input");
    renderClassroomPanels();
  }

  function switchClassroomMode(mode) {
    const page = $(".ppt-organizer-page");
    if (!page) return;
    page.dataset.buliClassroomMode = mode;
    $$("[data-buli-classroom-mode]").forEach((button) => button.classList.toggle("active", button.dataset.buliClassroomMode === mode));
    if (mode !== "index") applyClassroomTemplate(mode);
    renderClassroomPanels();
  }

  function applyClassroomTemplate(mode) {
    const form = $("#pptNoteForm");
    const tpl = CLASSROOM_TEMPLATES_MATURE[mode];
    if (!form || !tpl) return;
    if (!safeText(form.elements.title.value)) form.elements.title.value = tpl.title;
    if (form.elements.status && tpl.status) form.elements.status.value = tpl.status;
    if (form.elements.tags && !safeText(form.elements.tags.value)) form.elements.tags.value = tpl.tags || "";
    const body = form.elements.body;
    if (body && isEmptyOrTemplateText(body.value)) body.value = tpl.body;
    body?.focus();
  }

  function insertClassroomTemplate(mode) {
    const form = $("#pptNoteForm");
    const tpl = CLASSROOM_TEMPLATES_MATURE[mode];
    if (!form || !tpl) return;
    if (!safeText(form.elements.title?.value)) form.elements.title.value = tpl.title;
    if (form.elements.status && tpl.status) form.elements.status.value = tpl.status;
    if (form.elements.tags && !safeText(form.elements.tags.value)) form.elements.tags.value = tpl.tags || "";
    const body = form.elements.body;
    if (body) {
      if (isEmptyOrTemplateText(body.value)) {
        body.value = tpl.body;
      } else {
        body.value = body.value.replace(/\s+$/, "") + "\n\n" + tpl.body;
      }
      body.dispatchEvent(new Event("input", { bubbles: true }));
      body.focus();
    }
    try { form.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) { /* ignore */ }
  }

  function resetClassroomDraft(applyTemplate = true) {
    const form = $("#pptNoteForm");
    if (!form) return;
    const mode = $(".ppt-organizer-page")?.dataset.buliClassroomMode || "outline";
    form.reset();
    if (applyTemplate && mode !== "index") applyClassroomTemplate(mode);
    form.elements.title?.focus();
  }

  function renderClassroomPanels() {
    const page = $(".ppt-organizer-page");
    const index = $("#buliClassroomIndex");
    const current = $("#buliClassroomCurrent");
    if (!page || !index || !current || typeof state === "undefined") return;
    const mode = page.dataset.buliClassroomMode || "index";
    $$("[data-buli-classroom-mode]").forEach((button) => button.classList.toggle("active", button.dataset.buliClassroomMode === mode));
    const allNotes = [...(state.modules?.pptNotes || [])].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    const due = allNotes.filter((note) => typeof isPptReviewDue === "function" && isPptReviewDue(note)).length;
    const done = allNotes.filter((note) => note.status === "done").length;
    const attachments = allNotes.filter((note) => note.attachment).length;
    index.hidden = mode !== "index";
    current.hidden = mode === "index";

    if (mode === "index") {
      const groups = new Map();
      allNotes.forEach((note) => {
        const group = getTimeGroup(note.reviewDate || new Date(note.updatedAt || note.createdAt || Date.now()).toISOString().slice(0, 10));
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(note);
      });
      index.innerHTML = `
        <div class="buli-classroom-summary">
          <span><strong>${allNotes.length}</strong>全部</span>
          <span><strong>${due}</strong>待复习</span>
          <span><strong>${done}</strong>已圆满</span>
          <span><strong>${attachments}</strong>有附件</span>
        </div>
        <div class="buli-classroom-groups">
          ${allNotes.length ? [...groups.entries()].map(([group, items]) => `
            <section class="buli-classroom-group">
              <h3>▼ ${group} <small>${items.length} 条</small></h3>
              ${items.map((note, index) => `
                <article class="buli-classroom-card" data-buli-ppt-open="${note.id}">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <div><strong>${safeText(note.title) || "未命名课堂笔记"}</strong><small>${typeof getPptStatusOption === "function" ? getPptStatusOption(note.status).label : note.status || "整理中"} · ${safeText(note.subtitle) || "课堂笔记"}</small>${(note.tags || []).length ? `<em>${(note.tags || []).slice(0, 4).map((tag) => `#${tag}`).join(" ")}</em>` : ""}</div>
                  <b>›</b>
                </article>`).join("")}
            </section>`).join("") : `<p class="buli-empty-note">暂无课堂笔记。可点击“提纲 / 闻思 / 温习 / 法本”新建一页。</p>`}
        </div>
      `;
    } else {
      const tpl = CLASSROOM_TEMPLATES_MATURE[mode] || CLASSROOM_TEMPLATES_MATURE.outline;
      const hint = mode === "outline" ? "听闻开示时抓主旨、脉络、主要教言和待请教的问题。"
        : mode === "cornell" ? "康奈尔式：左栏记线索关键词，右栏记闻法内容，底部做思维总结与落实。"
        : mode === "review" ? "适合背诵、温习、查漏补缺与修持落实。"
        : "适合整理法本资料、共修分享、开示摘录与回向发愿。";
      const escapeHtml = (text) => String(text || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      current.innerHTML = `
        <div class="buli-current-template-panel">
          <div class="buli-current-template-head"><span>${tpl.label}</span><strong>${tpl.title}</strong></div>
          <p>${hint}</p>
          <pre class="buli-current-template-preview">${escapeHtml(tpl.body)}</pre>
          <div class="buli-current-template-actions">
            <button type="button" class="primary" data-buli-template-insert="${mode}">插入此模板到表单</button>
            <small>已保存 ${allNotes.length} 篇课堂笔记</small>
          </div>
        </div>
      `;
    }
  }

  // patchOfferingControls 已移除：该补丁会注入重复“添加佛像”按钮并造成图片被加两次，
  // 现由 bindEvents 中的 addOfferingBuddhaImages / changeOfferingBuddhaWall 直接处理。

  function patchNoteTemplateButtons() {
    if (typeof NOTE_BODY_TEMPLATES !== "undefined") {
      NOTE_BODY_TEMPLATES.daily = { label: "日课日记", body: NOTE_TEMPLATES_MATURE.diary.body };
      NOTE_BODY_TEMPLATES.reading = { label: "法本读书笔记", body: NOTE_TEMPLATES_MATURE.reading.body };
      NOTE_BODY_TEMPLATES.teaching = { label: "教言摘录", body: NOTE_TEMPLATES_MATURE.timeline.body };
    }
  }

  function renderAllEnhanced() {
    try {
      renderEnhancedOrdinaryPanels();
      renderUnifiedIndex();
      renderClassroomPanels();
    } catch (error) {
      console.warn("Buli enhanced render failed", error);
    }
  }

  function initEnhancements() {
    patchNoteTemplateButtons();
    enhanceOrdinaryEditor();
    enhanceUnifiedIndex();
    enhanceClassroom();
    // patchOfferingControls() 已停用：它会注入重复的“添加佛像”按钮、给文件输入挂第二个 change
    // 监听导致图片被添加两次，并以捕获阶段劫持“更改图像”。供灯按钮已由 bindEvents 正确绑定
    //（addOfferingBuddhaImages / changeOfferingBuddhaWall → saveOfferingBuddhaFiles → IndexedDB）。
    renderAllEnhanced();
  }

  // 增强渲染钩子：由核心 render / renderList / renderPptNotes 在各自开头调用，
  // 取代过去“重新包裹核心函数”(monkey-patch) 的做法。行为一致：增强渲染仍在核心
  // 渲染完成后通过 0 延时异步执行。
  window.BuliEnhance = {
    afterRender: function () { setTimeout(renderAllEnhanced, 0); },
    afterList: function () { setTimeout(renderUnifiedIndex, 0); },
    afterPpt: function () { setTimeout(renderClassroomPanels, 0); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEnhancements, { once: true });
  } else {
    setTimeout(initEnhancements, 0);
  }
})();

/* ========================================================================== */
/* 功课·一生账本:记录 / 总览(各功课分开) / 合并时间线 / 加行预设 / 导入恢复  */
/* 在原有计数系统上扩展;count(一生累计)独立保留，无上限，圆满后仍可增长。      */
/* ========================================================================== */

function ensurePracticeLedgerFields(item) {
  if (!item) return item;
  if (!Array.isArray(item.sessions)) item.sessions = [];
  if (typeof item.unit !== "string" || !item.unit) item.unit = "遍";
  return item;
}

function logPracticeSession(item, delta) {
  ensurePracticeLedgerFields(item);
  item.sessions.push({ t: Date.now(), n: Math.trunc(delta) });
  if (item.sessions.length > 2000) item.sessions = item.sessions.slice(-2000);
}

function practiceDayKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function practiceTodayTotal(item) {
  ensurePracticeLedgerFields(item);
  const today = practiceDayKey(Date.now());
  return item.sessions.reduce((sum, s) => sum + (practiceDayKey(s.t) === today ? (Number(s.n) || 0) : 0), 0);
}

function buildPracticeOverview() {
  const section = document.createElement("section");
  section.className = "buli-practice-overview";

  const banner = document.createElement("div");
  banner.className = "buli-practice-banner";
  const bannerTitle = document.createElement("div");
  bannerTitle.className = "buli-practice-banner-title";
  const strongEl = document.createElement("strong");
  strongEl.textContent = "功课计数";
  bannerTitle.append(document.createTextNode("ཉམས་ལེན། "), strongEl);
  const bannerSub = document.createElement("div");
  bannerSub.className = "buli-practice-banner-sub";
  bannerSub.textContent = "一生功课总览 · 各自累计";
  banner.append(bannerTitle, bannerSub);
  section.append(banner);

  const tools = document.createElement("div");
  tools.className = "buli-practice-ledger-controls";
  const presetBtn = document.createElement("button");
  presetBtn.type = "button";
  presetBtn.className = "buli-ledger-button";
  presetBtn.textContent = "加行·五十万预设";
  presetBtn.addEventListener("click", addNgondroPresets);
  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.className = "buli-ledger-button ghost";
  exportBtn.textContent = "导出账本备份";
  exportBtn.addEventListener("click", () => { try { exportNotes(); } catch (e) { console.warn(e); } });
  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = "buli-ledger-button ghost";
  importBtn.textContent = "导入备份";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) importBackupFromFile(file);
    fileInput.value = "";
  });
  importBtn.addEventListener("click", () => fileInput.click());
  tools.append(presetBtn, exportBtn, importBtn, fileInput);
  section.append(tools);

  const counters = state.modules.practiceCounters;
  if (!counters.length) return section;

  const list = document.createElement("div");
  list.className = "buli-practice-overview-list";
  counters.forEach((item) => {
    ensurePracticeLedgerFields(item);
    const row = document.createElement("div");
    row.className = "buli-practice-overview-row";
    const name = document.createElement("span");
    name.className = "buli-practice-overview-name";
    name.textContent = item.title || "未命名功课";
    const right = document.createElement("span");
    right.className = "buli-practice-overview-right";
    const total = document.createElement("b");
    total.textContent = formatNumber(item.count);
    const unit = document.createElement("small");
    unit.textContent = item.unit || "遍";
    const numericCount = Number(item.count) || 0;
    const numericTarget = Number(item.target) || 0;
    const complete = numericTarget > 0 && numericCount >= numericTarget;
    const chip = document.createElement("em");
    if (complete) {
      chip.className = "buli-practice-chip is-complete";
      chip.textContent = "圆满 ✓";
    } else {
      const percent = numericTarget ? Math.min(100, Math.round((numericCount / numericTarget) * 100)) : 0;
      chip.className = "buli-practice-chip";
      chip.textContent = percent + "%";
    }
    right.append(total, unit, chip);
    row.append(name, right);
    list.append(row);
  });
  section.append(list);
  return section;
}

function buildPracticeRecords(item) {
  ensurePracticeLedgerFields(item);
  const wrap = document.createElement("div");
  wrap.className = "buli-practice-records";
  if (!item.sessions.length) {
    const none = document.createElement("p");
    none.className = "buli-practice-records-empty";
    none.textContent = "暂无记录，点 + 或「记一笔」即可开始记录。";
    wrap.append(none);
    return wrap;
  }
  const ordered = item.sessions.slice().reverse();
  const shortFmt = (s) => {
    const d = new Date(s.t);
    const sign = (Number(s.n) || 0) >= 0 ? "+" : "−";
    return (d.getMonth() + 1) + "/" + d.getDate() + " " + sign + formatNumber(Math.abs(Number(s.n) || 0));
  };
  const recent = document.createElement("p");
  recent.className = "buli-practice-records-recent";
  recent.textContent = "近期 " + ordered.slice(0, 3).map(shortFmt).join(" · ");
  wrap.append(recent);

  if (ordered.length > 3) {
    const details = document.createElement("details");
    details.className = "buli-practice-records-all";
    const summary = document.createElement("summary");
    summary.textContent = "全部记录（" + ordered.length + " 次）";
    details.append(summary);
    const ul = document.createElement("ul");
    ordered.forEach((s) => {
      const li = document.createElement("li");
      const sign = (Number(s.n) || 0) >= 0 ? "+" : "−";
      li.textContent = practiceDayKey(s.t) + "　" + sign + formatNumber(Math.abs(Number(s.n) || 0)) + " " + (item.unit || "遍");
      ul.append(li);
    });
    details.append(ul);
    wrap.append(details);
  }
  return wrap;
}

function buildPracticeTimeline() {
  const all = [];
  state.modules.practiceCounters.forEach((item) => {
    ensurePracticeLedgerFields(item);
    item.sessions.forEach((s) => all.push({ t: s.t, n: s.n, title: item.title, unit: item.unit || "遍" }));
  });
  const details = document.createElement("details");
  details.className = "buli-practice-timeline";
  const summary = document.createElement("summary");
  summary.textContent = "修行记录 · 全部（合并时间线）";
  details.append(summary);

  if (!all.length) {
    const none = document.createElement("p");
    none.className = "buli-practice-records-empty";
    none.textContent = "还没有记录。每次完成功课点 +，这里会按时间汇总各门功课。";
    details.append(none);
    return details;
  }
  all.sort((a, b) => b.t - a.t);
  const cap = 80;
  const list = document.createElement("ul");
  list.className = "buli-practice-timeline-list";
  all.slice(0, cap).forEach((s) => {
    const li = document.createElement("li");
    const dateEl = document.createElement("span");
    dateEl.className = "buli-tl-date";
    dateEl.textContent = practiceDayKey(s.t);
    const nameEl = document.createElement("span");
    nameEl.className = "buli-tl-name";
    nameEl.textContent = s.title || "";
    const amtEl = document.createElement("span");
    amtEl.className = "buli-tl-amt";
    const sign = (Number(s.n) || 0) >= 0 ? "+" : "−";
    amtEl.textContent = sign + formatNumber(Math.abs(Number(s.n) || 0)) + " " + s.unit;
    li.append(dateEl, nameEl, amtEl);
    list.append(li);
  });
  details.append(list);
  if (all.length > cap) {
    const more = document.createElement("p");
    more.className = "buli-practice-records-empty";
    more.textContent = "仅显示最近 " + cap + " 条；更早记录已保存，可用「导出账本备份」查看。";
    details.append(more);
  }
  return details;
}

function addNgondroPresets() {
  const presets = [
    { title: "皈依·大礼拜", subtitle: "སྐྱབས་འགྲོ།", unit: "个", step: 108, target: 100000 },
    { title: "金刚萨埵心咒", subtitle: "རྡོ་རྗེ་སེམས་དཔའ།", unit: "遍", step: 108, target: 100000 },
    { title: "曼茶罗供", subtitle: "མཎྜལ།", unit: "座", step: 108, target: 100000 },
    { title: "上师瑜伽·祈祷", subtitle: "བླ་མའི་རྣལ་འབྱོར།", unit: "遍", step: 108, target: 100000 }
  ];
  const existing = new Set(state.modules.practiceCounters.map((it) => it.title));
  const toAdd = presets.filter((p) => !existing.has(p.title));
  if (!toAdd.length) {
    alert("四加行功课已存在，无需重复添加。");
    return;
  }
  const ok = confirm("将添加 " + toAdd.length + " 门加行功课（各以十万为一圆满，可继续增长）：\n" + toAdd.map((p) => "· " + p.title).join("\n"));
  if (!ok) return;
  toAdd.forEach((p) => {
    state.modules.practiceCounters.push({
      id: crypto.randomUUID(),
      title: p.title,
      subtitle: p.subtitle,
      unit: p.unit,
      count: 0,
      target: p.target,
      step: p.step,
      sessions: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });
  if (saveModules()) renderPracticeCounters();
}

function setupPracticeLedgerControls() {
  const form = els.practiceCounterForm;
  if (!form || form.dataset.ledgerControls === "1") return;
  form.dataset.ledgerControls = "1";

  const row = document.createElement("div");
  row.className = "buli-practice-ledger-controls";

  const presetBtn = document.createElement("button");
  presetBtn.type = "button";
  presetBtn.className = "buli-ledger-button";
  presetBtn.textContent = "加行·五十万预设";
  presetBtn.addEventListener("click", addNgondroPresets);

  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.className = "buli-ledger-button ghost";
  exportBtn.textContent = "导出账本备份";
  exportBtn.addEventListener("click", () => { try { exportNotes(); } catch (e) { console.warn(e); } });

  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = "buli-ledger-button ghost";
  importBtn.textContent = "导入备份";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) importBackupFromFile(file);
    fileInput.value = "";
  });
  importBtn.addEventListener("click", () => fileInput.click());

  row.append(presetBtn, exportBtn, importBtn, fileInput);
  form.insertAdjacentElement("afterend", row);
}

function mergeBackupArrayById(targetArr, incomingArr) {
  // 一生安全合并：按 id 对齐；若双方都有 updatedAt，保留较新的一方，
  // 这样导入一份旧备份永远不会把后来写的内容“倒退”回旧版。
  const stats = { added: 0, updated: 0, kept: 0 };
  if (!Array.isArray(targetArr) || !Array.isArray(incomingArr)) return stats;
  const indexById = new Map();
  targetArr.forEach((x, i) => { if (x && x.id) indexById.set(x.id, i); });
  incomingArr.forEach((inc) => {
    if (!inc) return;
    if (inc.id && indexById.has(inc.id)) {
      const at = indexById.get(inc.id);
      const cur = targetArr[at];
      const curTime = Number(cur?.updatedAt ?? cur?.createdAt ?? 0);
      const incTime = Number(inc?.updatedAt ?? inc?.createdAt ?? 0);
      if (curTime && incTime && curTime >= incTime) {
        stats.kept++;
      } else {
        targetArr[at] = inc;
        stats.updated++;
      }
    } else {
      if (inc.id) indexById.set(inc.id, targetArr.length);
      targetArr.push(inc);
      stats.added++;
    }
  });
  return stats;
}

function importBackupFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(String(reader.result || ""));
    } catch (e) {
      alert("读取失败：这不是有效的备份文件。");
      return;
    }
    if (!data || typeof data !== "object" || (!data.modules && !data.notes)) {
      alert("这个文件看起来不是「不离手账」的备份。");
      return;
    }
    if (!confirm("导入会把备份里的功课、笔记等按条目合并进当前数据（不会删除你现有的内容）。继续吗？")) return;
    try {
      const total = { added: 0, updated: 0, kept: 0 };
      const tally = (s) => { total.added += s.added; total.updated += s.updated; total.kept += s.kept; };
      if (data.modules && typeof data.modules === "object") {
        Object.keys(data.modules).forEach((key) => {
          if (!Array.isArray(data.modules[key])) return;
          if (!Array.isArray(state.modules[key])) state.modules[key] = [];
          tally(mergeBackupArrayById(state.modules[key], data.modules[key]));
        });
        if (Array.isArray(state.modules.practiceCounters)) state.modules.practiceCounters.forEach(ensurePracticeLedgerFields);
        state.modules = normalizeModules(state.modules);
      }
      if (Array.isArray(data.notes)) tally(mergeBackupArrayById(state.notes, data.notes));
      if (Array.isArray(data.teachingQuotes)) tally(mergeBackupArrayById(state.teachingQuotes, data.teachingQuotes));

      saveModules();
      scheduleSave();
      if (typeof saveTeachingQuotes === "function") { try { saveTeachingQuotes(); } catch (e) {} }
      if (typeof render === "function") { try { render(); } catch (e) {} }
      if (typeof renderList === "function") { try { renderList(); } catch (e) {} }
      renderPracticeCounters();
      try { renderDataSteward(); } catch (e) {}
      alert(`导入完成：新增 ${total.added} 条 · 更新 ${total.updated} 条 · 保留更新版 ${total.kept} 条。\n（合并按时间取新，旧备份不会覆盖你后来写的内容。）`);
    } catch (e) {
      console.warn("import failed", e);
      alert("导入过程中出错，已尽量保留原有数据。");
    }
  };
  reader.onerror = () => alert("读取文件失败。");
  reader.readAsText(file);
}

/* ============================================================
   一生维度 · 手账长期使用增强
   1) 年份筛选器：几十年的笔记可按年快速跳转
   2) 一生数据管家：数据量 / 存储占用 / 持久保存 / 备份提醒
   ============================================================ */

let noteYearOptionsSignature = "";

function setupNoteYearFilter() {
  if (document.querySelector("#noteYearSelect")) return;
  const panel = document.querySelector(".index-command-panel");
  if (!panel) return;
  const select = document.createElement("select");
  select.id = "noteYearSelect";
  select.title = "按年份查看";
  select.setAttribute("aria-label", "按年份查看笔记");
  select.addEventListener("change", () => {
    state.yearFilter = select.value;
    scheduleIndexRender();
  });
  const anchor = els.indexOpenEditorButton && els.indexOpenEditorButton.parentElement === panel
    ? els.indexOpenEditorButton
    : null;
  if (anchor) panel.insertBefore(select, anchor);
  else panel.append(select);
  refreshNoteYearOptions();
}

function refreshNoteYearOptions() {
  const select = document.querySelector("#noteYearSelect");
  if (!select) return;
  const counts = new Map();
  state.notes.forEach((note) => {
    const year = String(note.date || "").slice(0, 4);
    if (/^\d{4}$/.test(year)) counts.set(year, (counts.get(year) || 0) + 1);
  });
  const years = [...counts.keys()].sort((a, b) => b.localeCompare(a));
  const signature = years.map((year) => `${year}:${counts.get(year)}`).join(",");
  const current = state.yearFilter || "all";
  if (signature === noteYearOptionsSignature && select.value === current) return;
  noteYearOptionsSignature = signature;

  select.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "全部年份";
  select.append(allOption);
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `${year} 年（${counts.get(year)} 篇）`;
    select.append(option);
  });
  if (current !== "all" && !counts.has(current)) {
    state.yearFilter = "all";
  }
  select.value = state.yearFilter || "all";
}

let stewardEstimateCache = { at: 0, text: "" };

function setupDataSteward() {
  if (document.querySelector("#buliDataSteward")) return;
  const insights = document.querySelector(".notebook-index-page .index-insights");
  if (!insights) return;

  const panel = document.createElement("section");
  panel.id = "buliDataSteward";
  panel.className = "buli-data-steward";
  panel.setAttribute("aria-label", "一生数据管家");

  const head = document.createElement("div");
  head.className = "steward-head";
  const title = document.createElement("strong");
  title.textContent = "一生数据管家";
  const hint = document.createElement("span");
  hint.id = "stewardHint";
  head.append(title, hint);

  const stats = document.createElement("p");
  stats.id = "stewardStats";

  const storageLine = document.createElement("p");
  storageLine.id = "stewardStorage";

  const actions = document.createElement("div");
  actions.className = "steward-actions";

  const backupBtn = document.createElement("button");
  backupBtn.type = "button";
  backupBtn.className = "buli-ledger-button";
  backupBtn.textContent = "完整备份（含图片）";
  backupBtn.addEventListener("click", () => { try { exportNotes(); } catch (e) { console.warn(e); } });

  const restoreBtn = document.createElement("button");
  restoreBtn.type = "button";
  restoreBtn.className = "buli-ledger-button ghost";
  restoreBtn.textContent = "恢复备份";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) importBackupFromFile(file);
    fileInput.value = "";
  });
  restoreBtn.addEventListener("click", () => fileInput.click());

  const persistBtn = document.createElement("button");
  persistBtn.type = "button";
  persistBtn.id = "stewardPersistBtn";
  persistBtn.className = "buli-ledger-button ghost";
  persistBtn.textContent = "开启持久保存";
  persistBtn.addEventListener("click", async () => {
    try {
      const granted = await navigator.storage?.persist?.();
      persistBtn.textContent = granted ? "已开启持久保存 ✓" : "持久保存未获允许";
      persistBtn.disabled = Boolean(granted);
    } catch (e) {
      persistBtn.textContent = "此设备不支持持久保存";
    }
  });

  actions.append(backupBtn, restoreBtn, persistBtn, fileInput);
  panel.append(head, stats, storageLine, actions);
  insights.insertAdjacentElement("afterend", panel);

  // 启动时悄悄申请持久保存（已安装到主屏幕的应用多半直接获批）
  try {
    navigator.storage?.persisted?.().then((persisted) => {
      if (persisted) {
        persistBtn.textContent = "已开启持久保存 ✓";
        persistBtn.disabled = true;
      } else {
        navigator.storage?.persist?.().then((granted) => {
          if (granted) {
            persistBtn.textContent = "已开启持久保存 ✓";
            persistBtn.disabled = true;
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  } catch (e) { /* ignore */ }

  renderDataSteward();
}

function renderDataSteward() {
  const stats = document.querySelector("#stewardStats");
  const hint = document.querySelector("#stewardHint");
  const storageLine = document.querySelector("#stewardStorage");
  if (!stats || !hint) return;

  const noteCount = state.notes.length;
  const imageCount = state.notes.reduce((sum, note) => sum + (note.images?.length || 0), 0);
  const pptCount = state.modules.pptNotes?.length || 0;
  const practiceCount = state.modules.practiceCounters?.length || 0;
  const teachingCount = state.teachingQuotes?.length || 0;
  stats.textContent = `笔记 ${noteCount} 篇 · 图片 ${imageCount} 张 · 课堂 ${pptCount} 课 · 功课 ${practiceCount} 项 · 教言 ${teachingCount} 条`;

  let stamp = "";
  try { stamp = localStorage.getItem(BACKUP_STAMP_KEY) || ""; } catch (e) { /* ignore */ }
  if (!stamp) {
    hint.textContent = "还没备份过 · 建议现在做一次完整备份";
    hint.dataset.tone = "warn";
  } else {
    const days = Math.floor((Date.now() - new Date(stamp).getTime()) / 86400000);
    if (Number.isFinite(days) && days > 30) {
      hint.textContent = `距上次备份已 ${days} 天 · 建议本月再备份一次`;
      hint.dataset.tone = "warn";
    } else if (Number.isFinite(days)) {
      hint.textContent = days <= 0 ? "今天已备份 ✓" : `上次备份：${days} 天前 ✓`;
      hint.dataset.tone = "ok";
    } else {
      hint.textContent = "";
      hint.dataset.tone = "ok";
    }
  }

  if (storageLine && navigator.storage?.estimate) {
    if (Date.now() - stewardEstimateCache.at > 60000) {
      stewardEstimateCache.at = Date.now();
      navigator.storage.estimate().then((est) => {
        const usedMb = est?.usage ? (est.usage / 1048576).toFixed(1) : null;
        const quotaMb = est?.quota ? Math.round(est.quota / 1048576) : null;
        stewardEstimateCache.text = usedMb
          ? `本机已用约 ${usedMb} MB${quotaMb ? ` / 可用约 ${quotaMb} MB` : ""}`
          : "";
        const line = document.querySelector("#stewardStorage");
        if (line) line.textContent = stewardEstimateCache.text;
      }).catch(() => {});
    } else {
      storageLine.textContent = stewardEstimateCache.text;
    }
  }
}
