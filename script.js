let index = 0;
let isPlaying = false;
let timer = null;
let shuffledList = [];

window.onload = () => {
  // 기본적으로 병음 표시 체크박스를 체크 상태로 설정
  document.getElementById("showPinyin").checked = true;

  // 병음 표시 체크 시 즉시 반영
  document.getElementById("showPinyin").addEventListener("change", () => {
    const pinyinEl = document.getElementById("pinyin");
    const zhPinyinEl = document.getElementById("zh_pinyin");  // zh_pinyin 엘리먼트도 추가
    if (pinyinEl && zhPinyinEl) {
      const show = document.getElementById("showPinyin").checked;
      pinyinEl.style.display = show ? "block" : "none";
      zhPinyinEl.style.display = show ? "block" : "none";  // zh_pinyin도 처리
    }
  });

  // 체크박스 상태에 따른 바로 반영
  document.getElementById("meaningCheck").addEventListener("change", toggleMeaningVisibility);
  document.getElementById("chineseCheck").addEventListener("change", toggleChineseVisibility);

  // 초기 설정 (병음 보이기)
  generateWordList();
  showQuiz();
};

function toggleMeaningVisibility() {
  const meaningCheck = document.getElementById("meaningCheck").checked;
  const meaning_ko = document.getElementById("meaning_ko");
  const question = document.getElementById("question");

  // 체크 시, question과 meaning_ko 숨기기 / 체크 풀면 보이기
  meaning_ko.style.display = meaningCheck ? "block" : "none";
  question.style.display = meaningCheck ? "block" : "none";
}

function toggleChineseVisibility() {
  const chineseCheck = document.getElementById("chineseCheck").checked;
  const sentence = document.getElementById("sentence");
  const word = document.getElementById("word");

  // 체크 시, sentence와 word 숨기기 / 체크 풀면 보이기
  sentence.style.display = chineseCheck ? "block" : "none";
  word.style.display = chineseCheck ? "block" : "none";
}

function toggleSettings() {
  const panel = document.getElementById("settingsPanel");
  panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function shuffleNow() {
  shuffledList = shuffle([...quizList]);
  index = 0;
  clearTimeout(timer);
  speechSynthesis.cancel();
  generateWordList();
  showQuiz();
}
function speakMultiple(text, lang, count, callback) {
  let spoken = 0;
  const speakOnce = () => {
    if (spoken >= count) return callback();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 1.0;
    utter.onend = () => { spoken++; setTimeout(speakOnce, 300); }; 
    speechSynthesis.speak(utter);
  };
  speakOnce();
}
function showQuiz() {
  const list = shuffledList.length ? shuffledList : quizList;
  if (index >= list.length) index = 0;
  const q = list[index];

  const quizContainer = document.getElementById("quiz-container");
  const index_card = document.getElementById("index-card");
  const word = document.getElementById("word");
  const pinyin = document.getElementById("pinyin");
  const meaning_ko = document.getElementById("meaning_ko");
  const question = document.getElementById("question");
  const sentence = document.getElementById("sentence");
  const zh_pinyin = document.getElementById("zh_pinyin");

  index_card.innerHTML = `${index + 1}/${list.length}`;
  word.innerHTML = `${q.word}/${q.word_traditional}`;
  pinyin.innerHTML = `${q.pinyin} (${q.part_of_speech})`;
  meaning_ko.innerHTML = `${q.meaning_ko}`;
  question.innerHTML = `${q.ko}`;
  sentence.innerHTML = `${q.zh}`;
  zh_pinyin.innerHTML = `${q.zh_pinyin}`;

  question.classList.remove("visible");
  sentence.classList.remove("visible");
  speechSynthesis.cancel();

  const koRepeat = parseInt(document.getElementById("koRepeat").value);
  const zhRepeat = parseInt(document.getElementById("zhRepeat").value);

  // 음성 반복 횟수 설정
  const zhwordRepeat = parseInt(document.getElementById("zhwordRepeat").value); // 중국어 단어 반복 횟수
  const kowordRepeat = parseInt(document.getElementById("kowordRepeat").value); // 한국어 단어 뜻 반복 횟수

  setTimeout(() => {
    if (isPlaying) {
      const wordCheck = document.getElementById("wordCheck").checked;
      const sentenceCheck = document.getElementById("sentenceCheck").checked;

      // 단어 순서와 예문 순서 설정
      const wordOrder = document.querySelector('input[name="wordOrder"]:checked').id;
      const sentenceOrder = document.querySelector('input[name="sentenceOrder"]:checked').id;

      if (wordCheck) {
        if (wordOrder === "wordOrderZhFirst") {
          // 1. 중국어 단어 먼저 → 한국어 뜻
          speakMultiple(q.word, 'zh-CN', zhwordRepeat, () => {
            speakMultiple(q.meaning_ko, 'ko-KR', kowordRepeat, () => {
              if (sentenceCheck) {
                // 2. 예문과 뜻 읽기
                if (sentenceOrder === "sentenceOrderZhFirst") {
                  // 중국어 예문 먼저
                  sentence.classList.add("visible");
                  speakMultiple(q.zh, 'zh-CN', zhRepeat, () => {
                    question.classList.add("visible");
                    speakMultiple(q.ko, 'ko-KR', koRepeat, afterSpeech);
                  });
                } else {
                  // 한국어 예문 먼저
                  question.classList.add("visible");
                  speakMultiple(q.ko, 'ko-KR', koRepeat, () => {
                    sentence.classList.add("visible");
                    speakMultiple(q.zh, 'zh-CN', zhRepeat, afterSpeech);
                  });
                }
              } else {
                afterSpeech(); // 예문 체크가 안 되어 있으면 바로 종료
              }
            });
          });
        } else {
          // 2. 한국어 뜻 먼저 → 중국어 단어
          speakMultiple(q.meaning_ko, 'ko-KR', kowordRepeat, () => {
            speakMultiple(q.word, 'zh-CN', zhwordRepeat, () => {
              if (sentenceCheck) {
                // 예문과 뜻 읽기
                if (sentenceOrder === "sentenceOrderZhFirst") {
                  sentence.classList.add("visible");
                  speakMultiple(q.zh, 'zh-CN', zhRepeat, () => {
                    question.classList.add("visible");
                    speakMultiple(q.ko, 'ko-KR', koRepeat, afterSpeech);
                  });
                } else {
                  question.classList.add("visible");
                  speakMultiple(q.ko, 'ko-KR', koRepeat, () => {
                    sentence.classList.add("visible");
                    speakMultiple(q.zh, 'zh-CN', zhRepeat, afterSpeech);
                  });
                }
              } else {
                afterSpeech(); // 예문 체크가 안 되어 있으면 바로 종료
              }
            });
          });
        }
      } else if (sentenceCheck) {
        // 예문만 읽기
        if (sentenceOrder === "sentenceOrderZhFirst") {
          sentence.classList.add("visible");
          speakMultiple(q.zh, 'zh-CN', zhRepeat, () => {
            question.classList.add("visible");
            speakMultiple(q.ko, 'ko-KR', koRepeat, afterSpeech);
          });
        } else {
          question.classList.add("visible");
          speakMultiple(q.ko, 'ko-KR', koRepeat, () => {
            sentence.classList.add("visible");
            speakMultiple(q.zh, 'zh-CN', zhRepeat, afterSpeech);
          });
        }
      } else {
        afterSpeech(); // 아무 것도 체크되지 않으면 종료
      }
    }
  }, 300);

  generateWordList();

  const showPinyin = document.getElementById("showPinyin").checked;
  const pinyinEl = document.getElementById("pinyin");
  const zhPinyinEl = document.getElementById("zh_pinyin"); // zh_pinyin 엘리먼트 처리
  if (pinyinEl && zhPinyinEl) {
    pinyinEl.style.display = showPinyin ? "block" : "none";
    zhPinyinEl.style.display = showPinyin ? "block" : "none"; // zh_pinyin 보이기/숨기기 처리
  }
}

function afterSpeech() {
  updateProgressBar();
  if (document.getElementById("autoPlay").checked && isPlaying) {
    timer = setTimeout(() => {
      index++;
      showQuiz();
    }, 1000);
  }
}

function prevQuestion() {
  if (index > 0) index--;
  showQuiz();
}

function nextQuestion() {
  const list = shuffledList.length ? shuffledList : quizList;
  if (index < list.length - 1) index++;
  showQuiz();
}

function togglePlay() {
  isPlaying = !isPlaying;
  const btn = document.getElementById("toggleBtn");
  btn.textContent = isPlaying ? "⏸ 일시정지" : "▶ 재생";
  if (isPlaying) showQuiz();
  else {
    clearTimeout(timer);
    speechSynthesis.cancel();
  }
}

function updateProgressBar() {
  const list = shuffledList.length ? shuffledList : quizList;
  const progress = ((index + 1) / list.length) * 100;
  document.getElementById("progressBar").style.width = `${progress}%`;
}

function generateWordList() {
  const container = document.getElementById("wordList");
  container.innerHTML = '';
  const list = shuffledList.length ? shuffledList : quizList;
  list.forEach((q, idx) => {
    const div = document.createElement("div");
    div.classList.add("word-item");
    if (idx === index) div.classList.add("current-word-item");
    div.textContent = `${idx + 1}. ${q.word}`;
    div.onclick = () => { index = idx; showQuiz(); };
    container.appendChild(div);
  });
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert("링크가 복사되었습니다!");
  });
}
