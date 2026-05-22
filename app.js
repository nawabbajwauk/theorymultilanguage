const state = {
  lang: localStorage.getItem("theory-lang") || "en",
  mode: "mock",
  questions: [],
  current: 0,
  answers: {},
  flagged: {},
  timerId: null,
  secondsLeft: 57 * 60,
  finishArmed: false,
};

const els = {
  languageSelect: document.querySelector("#languageSelect"),
  topicGrid: document.querySelector("#topicGrid"),
  startMock: document.querySelector("#startMock"),
  startPractice: document.querySelector("#startPractice"),
  installApp: document.querySelector("#installApp"),
  freeAccessForm: document.querySelector("#freeAccessForm"),
  learnerName: document.querySelector("#learnerName"),
  learnerContact: document.querySelector("#learnerContact"),
  learnerGoal: document.querySelector("#learnerGoal"),
  formStatus: document.querySelector("#formStatus"),
  exportRecords: document.querySelector("#exportRecords"),
  resetProgress: document.querySelector("#resetProgress"),
  roadSignsGrid: document.querySelector("#roadSignsGrid"),
  theoryList: document.querySelector("#theoryList"),
  hazardGrid: document.querySelector("#hazardGrid"),
  startHazards: document.querySelector("#startHazards"),
  stopVoice: document.querySelector("#stopVoice"),
  voiceStatus: document.querySelector("#voiceStatus"),
  examPanel: document.querySelector("#examPanel"),
  beginExam: document.querySelector("#beginExam"),
  cancelExam: document.querySelector("#cancelExam"),
  quizShell: document.querySelector("#quizShell"),
  results: document.querySelector("#results"),
  modeLabel: document.querySelector("#modeLabel"),
  questionCounter: document.querySelector("#questionCounter"),
  timer: document.querySelector("#timer"),
  answeredCount: document.querySelector("#answeredCount"),
  unansweredCount: document.querySelector("#unansweredCount"),
  flaggedCount: document.querySelector("#flaggedCount"),
  progressBar: document.querySelector("#progressBar"),
  categoryLabel: document.querySelector("#categoryLabel"),
  speakQuestion: document.querySelector("#speakQuestion"),
  flagQuestion: document.querySelector("#flagQuestion"),
  questionText: document.querySelector("#questionText"),
  options: document.querySelector("#options"),
  instantFeedback: document.querySelector("#instantFeedback"),
  prevQuestion: document.querySelector("#prevQuestion"),
  nextQuestion: document.querySelector("#nextQuestion"),
  finishQuiz: document.querySelector("#finishQuiz"),
  questionNav: document.querySelector("#questionNav"),
  scoreTitle: document.querySelector("#scoreTitle"),
  scoreText: document.querySelector("#scoreText"),
  reviewAnswers: document.querySelector("#reviewAnswers"),
  tryAgain: document.querySelector("#tryAgain"),
  reviewList: document.querySelector("#reviewList"),
};

const savedProgress = JSON.parse(localStorage.getItem("theory-progress") || "{}");
let deferredInstallPrompt = null;

function text(key, values = {}) {
  let value = UI_TEXT[state.lang][key] || UI_TEXT.en[key] || key;
  Object.entries(values).forEach(([name, replacement]) => {
    value = value.replace(`{${name}}`, replacement);
  });
  return value;
}

function localise(item) {
  return item[state.lang] || item.en;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function prepareQuestion(question) {
  const shuffledOptions = shuffle(question.options.map((option, index) => ({ option, was: index })));
  return {
    ...question,
    displayOptions: shuffledOptions.map((item) => item.option),
    displayCorrect: shuffledOptions.findIndex((item) => item.was === question.correct),
  };
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = text(node.dataset.i18n);
  });
  document.querySelectorAll("option[data-i18n]").forEach((node) => {
    node.textContent = text(node.dataset.i18n);
  });
  els.voiceStatus.textContent = "";
  els.languageSelect.value = state.lang;
  renderStudy();
  renderTopics();
  if (!els.quizShell.classList.contains("hidden")) renderQuestion();
  if (!els.results.classList.contains("hidden")) renderResults(false);
}

function getLocalRecords() {
  return JSON.parse(localStorage.getItem("free-access-records") || "[]");
}

function saveLocalRecord(record) {
  const records = getLocalRecords();
  records.push(record);
  localStorage.setItem("free-access-records", JSON.stringify(records));
}

function registerFreeAccess(event) {
  const record = {
    name: els.learnerName.value.trim(),
    contact: els.learnerContact.value.trim(),
    goal: els.learnerGoal.value,
    language: state.lang,
    consent: document.querySelector("#learnerConsent").checked,
    createdAt: new Date().toISOString(),
  };

  if (!record.name || !record.contact || !record.consent) return;
  saveLocalRecord(record);
  els.formStatus.textContent = text("recordSaved");

  if (location.hostname === "127.0.0.1" || location.hostname === "localhost" || location.protocol === "file:") {
    event.preventDefault();
    els.freeAccessForm.reset();
  }
}

function exportLocalRecords() {
  const records = getLocalRecords();
  const header = ["name", "contact", "goal", "language", "consent", "createdAt"];
  const rows = records.map((record) => header.map((key) => `"${String(record[key] ?? "").replaceAll('"', '""')}"`).join(","));
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "free-access-records.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function installApp() {
  if (!deferredInstallPrompt) {
    els.formStatus.textContent = text("installUnavailable");
    return;
  }
  els.formStatus.textContent = text("installReady");
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
}

function voiceLang() {
  return { en: "en-GB", pa: "pa-IN", hi: "hi-IN" }[state.lang] || "en-GB";
}

function speak(textToRead) {
  if (!("speechSynthesis" in window)) {
    els.voiceStatus.textContent = text("voiceUnavailable");
    if (!els.quizShell.classList.contains("hidden")) els.instantFeedback.textContent = text("voiceUnavailable");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.lang = voiceLang();
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.onstart = () => {
    els.voiceStatus.textContent = text("voicePlaying");
  };
  utterance.onend = () => {
    els.voiceStatus.textContent = "";
  };
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  els.voiceStatus.textContent = "";
}

function renderStudy() {
  els.roadSignsGrid.innerHTML = ROAD_SIGNS.map((sign, index) => `
    <article class="sign-card">
      <div class="sign-icon ${sign.type}" aria-hidden="true"><span>${sign.symbol}</span></div>
      <div>
        <h4>${localise(sign.title)}</h4>
        <p><strong>${text("shape")}:</strong> ${localise(sign.shape)}</p>
        <p>${localise(sign.note)}</p>
        <button class="listen-button" type="button" data-sign="${index}">${text("listen")}</button>
      </div>
    </article>
  `).join("");

  els.theoryList.innerHTML = THEORY_GUIDES.map((guide, index) => `
    <article class="theory-card">
      <h4>${localise(guide.title)}</h4>
      <p>${localise(guide.body)}</p>
      <button class="listen-button" type="button" data-theory="${index}">${text("listen")}</button>
    </article>
  `).join("");

  els.hazardGrid.innerHTML = HAZARD_GUIDES.map((guide, index) => `
    <article class="hazard-card">
      <div class="hazard-scene" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <h4>${localise(guide.title)}</h4>
      <p>${localise(guide.body)}</p>
      <button class="listen-button" type="button" data-hazard="${index}">${text("listen")}</button>
    </article>
  `).join("");

  els.roadSignsGrid.querySelectorAll("[data-sign]").forEach((button) => {
    button.addEventListener("click", () => {
      const sign = ROAD_SIGNS[Number(button.dataset.sign)];
      speak(`${localise(sign.title)}. ${text("shape")}: ${localise(sign.shape)}. ${localise(sign.note)}`);
    });
  });

  els.theoryList.querySelectorAll("[data-theory]").forEach((button) => {
    button.addEventListener("click", () => {
      const guide = THEORY_GUIDES[Number(button.dataset.theory)];
      speak(`${localise(guide.title)}. ${localise(guide.body)}`);
    });
  });

  els.hazardGrid.querySelectorAll("[data-hazard]").forEach((button) => {
    button.addEventListener("click", () => {
      const guide = HAZARD_GUIDES[Number(button.dataset.hazard)];
      speak(`${localise(guide.title)}. ${localise(guide.body)}`);
    });
  });
}

function showExamPanel() {
  clearInterval(state.timerId);
  els.results.classList.add("hidden");
  els.reviewList.classList.add("hidden");
  els.quizShell.classList.add("hidden");
  els.examPanel.classList.remove("hidden");
  els.examPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTopics() {
  const counts = QUESTION_BANK.reduce((acc, question) => {
    acc[question.topic] = (acc[question.topic] || 0) + 1;
    return acc;
  }, {});

  els.topicGrid.innerHTML = Object.entries(TOPICS).map(([key, label]) => {
    const done = savedProgress[key] || 0;
    return `
      <button class="topic-card" type="button" data-topic="${key}">
        <strong>${localise(label)}</strong>
        <span>${text("topicCount", { count: counts[key] || 0 })} · ${done}%</span>
      </button>
    `;
  }).join("");

  els.topicGrid.querySelectorAll("[data-topic]").forEach((button) => {
    button.addEventListener("click", () => startQuiz("practice", button.dataset.topic));
  });
}

function startQuiz(mode, topic = null) {
  state.mode = mode;
  state.current = 0;
  state.answers = {};
  state.flagged = {};
  state.secondsLeft = mode === "mock" ? 57 * 60 : 0;
  state.finishArmed = false;

  const pool = topic ? QUESTION_BANK.filter((question) => question.topic === topic) : QUESTION_BANK;
  const size = mode === "mock" ? 50 : pool.length;
  state.questions = shuffle(pool).slice(0, size).map(prepareQuestion);

  els.results.classList.add("hidden");
  els.reviewList.classList.add("hidden");
  els.examPanel.classList.add("hidden");
  els.quizShell.classList.remove("hidden");
  renderQuestion();
  startTimer();
  els.quizShell.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startTimer() {
  clearInterval(state.timerId);
  if (state.mode !== "mock") {
    els.timer.textContent = text("practice");
    return;
  }
  renderTimer();
  state.timerId = setInterval(() => {
    state.secondsLeft -= 1;
    renderTimer();
    if (state.secondsLeft <= 0) finishQuiz();
  }, 1000);
}

function renderTimer() {
  const minutes = Math.floor(state.secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (state.secondsLeft % 60).toString().padStart(2, "0");
  els.timer.textContent = `${minutes}:${seconds}`;
}

function renderQuestion() {
  const question = state.questions[state.current];
  if (!question) return;

  els.modeLabel.textContent = state.mode === "mock" ? text("mock") : text("practice");
  els.questionCounter.textContent = text("questionOf", { n: state.current + 1, total: state.questions.length });
  els.progressBar.style.width = `${((state.current + 1) / state.questions.length) * 100}%`;
  els.categoryLabel.textContent = localise(TOPICS[question.topic]);
  els.questionText.textContent = localise(question.q);
  els.flagQuestion.classList.toggle("active", Boolean(state.flagged[question.id]));
  if (state.mode !== "mock") els.timer.textContent = text("practice");

  const selected = state.answers[question.id];
  const showFeedback = selected !== undefined && state.mode !== "mock";
  els.instantFeedback.textContent = "";
  els.options.innerHTML = question.displayOptions.map((option, index) => {
    const classes = ["option"];
    if (selected === index) classes.push("selected");
    if (showFeedback && index === question.displayCorrect) classes.push("correct");
    if (showFeedback && selected === index && index !== question.displayCorrect) classes.push("wrong");
    return `
      <button class="${classes.join(" ")}" type="button" data-option="${index}">
        <span class="letter">${String.fromCharCode(65 + index)}</span>
        <span>${localise(option)}</span>
      </button>
    `;
  }).join("");

  if (showFeedback) {
    const correctAnswer = localise(question.displayOptions[question.displayCorrect]);
    els.instantFeedback.textContent = selected === question.displayCorrect
      ? text("correct", { explanation: localise(question.explanation) })
      : text("wrong", { answer: correctAnswer, explanation: localise(question.explanation) });
  }

  els.options.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", () => selectAnswer(Number(button.dataset.option)));
  });

  els.prevQuestion.disabled = state.current === 0;
  els.nextQuestion.disabled = state.current === state.questions.length - 1;
  els.finishQuiz.textContent = text("finish");
  renderExamStatus();
  renderQuestionNav();
}

function speakCurrentQuestion() {
  const question = state.questions[state.current];
  if (!question) return;
  const options = question.displayOptions
    .map((option, index) => `${String.fromCharCode(65 + index)}. ${localise(option)}`)
    .join(". ");
  const selected = state.answers[question.id];
  const explanation = state.mode !== "mock" && selected !== undefined
    ? ` ${localise(question.explanation)}`
    : "";
  speak(`${localise(question.q)}. ${options}.${explanation}`);
}

function selectAnswer(index) {
  const question = state.questions[state.current];
  state.answers[question.id] = index;
  state.finishArmed = false;
  renderQuestion();
}

function moveQuestion(direction) {
  state.current = Math.max(0, Math.min(state.questions.length - 1, state.current + direction));
  state.finishArmed = false;
  renderQuestion();
}

function finishQuiz() {
  if (state.mode === "mock" && !state.finishArmed) {
    const unanswered = state.questions.length - Object.keys(state.answers).length;
    const flagged = Object.values(state.flagged).filter(Boolean).length;
    if (unanswered > 0 || flagged > 0) {
      state.finishArmed = true;
      els.instantFeedback.textContent = text("finishWarning", { unanswered, flagged });
      els.finishQuiz.textContent = text("finish");
      return;
    }
  }
  clearInterval(state.timerId);
  els.quizShell.classList.add("hidden");
  els.results.classList.remove("hidden");
  renderResults(false);
  els.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderExamStatus() {
  const answered = Object.keys(state.answers).length;
  const flagged = Object.values(state.flagged).filter(Boolean).length;
  els.answeredCount.textContent = answered;
  els.unansweredCount.textContent = state.questions.length - answered;
  els.flaggedCount.textContent = flagged;
}

function renderQuestionNav() {
  els.questionNav.innerHTML = state.questions.map((question, index) => {
    const classes = ["question-dot"];
    if (index === state.current) classes.push("current");
    if (state.answers[question.id] !== undefined) classes.push("answered");
    if (state.flagged[question.id]) classes.push("flagged");
    return `<button class="${classes.join(" ")}" type="button" data-jump="${index}" aria-label="Question ${index + 1}">${index + 1}</button>`;
  }).join("");

  els.questionNav.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      state.current = Number(button.dataset.jump);
      state.finishArmed = false;
      renderQuestion();
    });
  });
}

function getScore() {
  return state.questions.reduce((score, question) => {
    return score + (state.answers[question.id] === question.displayCorrect ? 1 : 0);
  }, 0);
}

function renderResults(showReview) {
  const score = getScore();
  const total = state.questions.length;
  const needed = state.mode === "mock" ? 43 : Math.ceil(total * 0.86);
  const passed = score >= needed;

  els.scoreTitle.textContent = `${passed ? text("passed") : text("failed")} · ${score}/${total}`;
  els.scoreText.textContent = text("scoreLine", { score, total });

  if (state.mode === "practice") {
    const byTopic = state.questions[0]?.topic;
    if (byTopic && state.questions.every((question) => question.topic === byTopic)) {
      savedProgress[byTopic] = Math.round((score / total) * 100);
      localStorage.setItem("theory-progress", JSON.stringify(savedProgress));
      renderTopics();
    }
  }

  if (showReview) renderReview();
}

function renderReview() {
  els.reviewList.classList.remove("hidden");
  els.reviewList.innerHTML = state.questions.map((question, index) => {
    const selected = state.answers[question.id];
    const isCorrect = selected === question.displayCorrect;
    const chosen = selected === undefined ? text("unanswered") : localise(question.displayOptions[selected]);
    const answer = localise(question.displayOptions[question.displayCorrect]);
    return `
      <article class="review-item ${isCorrect ? "correct" : "wrong"}">
        <h3>${index + 1}. ${localise(question.q)}</h3>
        <p><strong>${localise(TOPICS[question.topic])}</strong></p>
        <p><strong>${text("yourAnswer")}:</strong> ${chosen}</p>
        <p><strong>${text("correctAnswer")}:</strong> ${answer}</p>
        <p>${localise(question.explanation)}</p>
      </article>
    `;
  }).join("");
}

els.languageSelect.addEventListener("change", () => {
  state.lang = els.languageSelect.value;
  localStorage.setItem("theory-lang", state.lang);
  applyI18n();
});

els.startMock.addEventListener("click", showExamPanel);
els.installApp.addEventListener("click", installApp);
els.freeAccessForm.addEventListener("submit", registerFreeAccess);
els.exportRecords.addEventListener("click", exportLocalRecords);
els.beginExam.addEventListener("click", () => startQuiz("mock"));
els.cancelExam.addEventListener("click", () => els.examPanel.classList.add("hidden"));
els.startPractice.addEventListener("click", () => startQuiz("practice"));
els.startHazards.addEventListener("click", () => startQuiz("practice", "hazards"));
els.stopVoice.addEventListener("click", stopSpeaking);
els.prevQuestion.addEventListener("click", () => moveQuestion(-1));
els.nextQuestion.addEventListener("click", () => moveQuestion(1));
els.finishQuiz.addEventListener("click", finishQuiz);
els.tryAgain.addEventListener("click", () => startQuiz("mock"));
els.reviewAnswers.addEventListener("click", () => renderResults(true));
els.speakQuestion.addEventListener("click", speakCurrentQuestion);
els.flagQuestion.addEventListener("click", () => {
  const question = state.questions[state.current];
  state.flagged[question.id] = !state.flagged[question.id];
  state.finishArmed = false;
  renderQuestion();
});
els.resetProgress.addEventListener("click", () => {
  Object.keys(savedProgress).forEach((key) => delete savedProgress[key]);
  localStorage.setItem("theory-progress", "{}");
  renderTopics();
  els.resetProgress.textContent = text("resetDone");
  setTimeout(() => {
    els.resetProgress.textContent = text("reset");
  }, 1200);
});

applyI18n();

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js");
}
