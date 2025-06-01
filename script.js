
        let index = 0;
        let isPlaying = false;
        let timer = null;
        let shuffledList = [];

    window.onload = () => {
        document.getElementById("toggleBtn").textContent = "▶ 재생";
        generateWordList();
        showQuiz();

        // 병음 숨기기 체크 시 즉시 반영
        document.getElementById("hidePinyin").addEventListener("change", () => {
          const pinyinEl = document.getElementById("pinyin");
          if (pinyinEl) {
            const hide = document.getElementById("hidePinyin").checked;
            pinyinEl.style.display = hide ? "none" : "block";
          }
        });
      };

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
        utter.onend = () => { spoken++; speakOnce(); };
        speechSynthesis.speak(utter);
      };
      speakOnce();
    }

    function showQuiz() {
      const list = shuffledList.length ? shuffledList : quizList;
      if (index >= list.length) index = 0;
      const q = list[index];
      const orderMode = document.getElementById("orderMode").value;

      const quizContainer = document.getElementById("quiz-container");
      const index_card =  document.getElementById("index-card");
      const word = document.getElementById("word");
      const pinyin = document.getElementById("pinyin");
      const meaning_ko = document.getElementById("meaning_ko");
      const question = document.getElementById("question");
      const sentence = document.getElementById("sentence");
      const zh_pinyin = document.getElementById("zh_pinyin");

      index_card.innerHTML = `${index + 1}/${list.length}`
      word.innerHTML= `${q.word}/${q.word_traditional}`
      pinyin.innerHTML = `${q.pinyin} (${q.part_of_speech})`
      meaning_ko.innerHTML =`${q.meaning_ko}`
      question.innerHTML =`${q.ko}`
      sentence.innerHTML = `${q.zh}`
      zh_pinyin.innerHTML = `${q.zh_pinyin}`

      question.classList.remove("visible");
      sentence.classList.remove("visible");
      speechSynthesis.cancel();

      const voiceMode = document.getElementById("voiceMode").value;
      const koRepeat = parseInt(document.getElementById("koRepeat").value);
      const zhRepeat = parseInt(document.getElementById("zhRepeat").value);

      setTimeout(() => {
        if (orderMode === "koFirst") {
          question.classList.add("visible");
          if (isPlaying && (voiceMode === "ko" || voiceMode === "both")) {
            speakMultiple(q.ko, 'ko-KR', koRepeat, () => {
              sentence.classList.add("visible");
              if (isPlaying && (voiceMode === "zh" || voiceMode === "both")) {
                speakMultiple(q.zh, 'zh-CN', zhRepeat, afterSpeech);
              } else afterSpeech();
            });
          } else {
            sentence.classList.add("visible");
            afterSpeech();
          }
        } else {
          sentence.classList.add("visible");
          if (isPlaying && (voiceMode === "zh" || voiceMode === "both")) {
            speakMultiple(q.zh, 'zh-CN', zhRepeat, () => {
              question.classList.add("visible");
              if (isPlaying && (voiceMode === "ko" || voiceMode === "both")) {
                speakMultiple(q.ko, 'ko-KR', koRepeat, afterSpeech);
              } else afterSpeech();
            });
          } else {
            question.classList.add("visible");
            afterSpeech();
          }
        }
      }, 300);
      generateWordList();
      const hidePinyin = document.getElementById("hidePinyin").checked;
      const pinyinEl = document.getElementById("pinyin");
      if (pinyinEl) {
        pinyinEl.style.display = hidePinyin ? "none" : "block";
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
