let currentIndex = 0;  // 현재 단어 인덱스
let autoPlayRunning = true; // 자동재생 중인지 상태 관리 (기본값은 true)
let isPaused = false; // 일시정지 상태

document.addEventListener('DOMContentLoaded', () => {
    // 데이터 세팅 코드
    const list = quizList;
    index = 0;
    const q = list[index];

    const pos = document.getElementById("pos");
    const number = document.getElementById("number");
    const word = document.getElementById("word");
    const meaning_ko = document.getElementById("meaning_ko");
    const pinyin = document.getElementById("pinyin");
    const zh = document.getElementById("zh");
    const zh_pinyin = document.getElementById("zh_pinyin");
    const ko = document.getElementById("ko");

    pos.innerHTML = `${q.part_of_speech}`;
    number.innerHTML = `${q.no} / 300`;
    word.innerHTML = `${q.word}`;
    meaning_ko.innerHTML = `${q.meaning_ko}`;
    pinyin.innerHTML = `${q.pinyin}`;
    zh.innerHTML = `${q.zh}`;
    zh_pinyin.innerHTML = `${q.zh_pinyin}`;
    ko.innerHTML = `${q.ko}`;
  }

);

// 딜레이 함수 (ms 단위)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// 텍스트 음성 합성 재생 (Promise 반환)
function speak(text, lang) {
  return new Promise(resolve => {
    if (!text) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // 말하는 속도 (필요에 따라 조정)
    utterance.onend = () => resolve();
    speechSynthesis.speak(utterance);
  });
}



// 한 단어 재생 함수: 단어 → 뜻 → 문장 → 문장뜻 순서
async function playWordAudio(wordObj) {
  await speak(wordObj.word, "zh-CN");
  await delay(500);
  await speak(wordObj.meaning_ko, "ko-KR");
  await delay(500);
  await speak(wordObj.zh, "zh-CN");
  await delay(500);
  await speak(wordObj.ko, "ko-KR");
  await delay(1000);
}


function updateDisplay(index) {
  const q = quizList[index];
  if (!q) return;

  document.getElementById("pos").innerHTML = q.part_of_speech;
  document.getElementById("number").innerHTML = `${q.no} / 300`;
  document.getElementById("word").innerHTML = q.word;
  document.getElementById("meaning_ko").innerHTML = q.meaning_ko;
  document.getElementById("pinyin").innerHTML = q.pinyin;
  document.getElementById("zh").innerHTML = q.zh;
  document.getElementById("zh_pinyin").innerHTML = q.zh_pinyin;
  document.getElementById("ko").innerHTML = q.ko;
}

function replaceTilde(text) {
  if (!text) return text;
  return text.replace(/~/g, "뭐뭐");
}

// 한 단어 음성 재생 (음성 재생 끝나면 자동 종료)
async function playWordAudio(wordObj) {
  await speak(wordObj.word, "zh-CN");
  await delay(500);
  await speak(replaceTilde(wordObj.meaning_ko), "ko-KR");
  await delay(500);
  await speak(wordObj.zh, "zh-CN");
  await delay(500);
  await speak(wordObj.ko, "ko-KR");
  await delay(1000);
}

// 수동 재생용 함수 - 단어 하나만 재생
async function playManualWord(index) {
  speechSynthesis.cancel();
  await delay(100);
  updateDisplay(index);
  await playWordAudio(quizList[index]);
}

// 자동재생 함수
async function autoPlay() {
  autoPlayRunning = true;
  while (autoPlayRunning && currentIndex < quizList.length) {
    speechSynthesis.cancel();
    await delay(100);
    updateDisplay(currentIndex);
    await playWordAudio(quizList[currentIndex]);
    currentIndex++;  // 자동재생 때만 인덱스 증가
  }
  autoPlayRunning = false;
}

// 현재 인덱스 단어 화면과 음성 재생
async function playCurrentWord() {
  speechSynthesis.cancel(); // 이전 음성 중지
  await delay(100); 
  updateDisplay(currentIndex);
  await playWordAudio(quizList[currentIndex]);
}

document.addEventListener("keydown", async (event) => {
  if (event.key === "ArrowRight") {
    if (currentIndex < quizList.length - 1) {
      autoPlayRunning = false;     // 자동재생 멈춤
      speechSynthesis.cancel();    // 음성 중단
      await delay(100);
      currentIndex++;              // 인덱스 이동
      await playManualWord(currentIndex);  // 해당 단어 재생
      autoPlayRunning = true;      // 자동재생 재개 허용
      currentIndex++;  // 현재 단어 인덱스 조정
      autoPlay();                  // 자동재생 다시 시작
    }
  } else if (event.key === "ArrowLeft") {
    if (currentIndex > 0) {
      autoPlayRunning = false;
      speechSynthesis.cancel();
      await delay(100);
      currentIndex--;
      await playManualWord(currentIndex);
      autoPlayRunning = true;
      currentIndex++;  // 현재 단어 인덱스 조정
      autoPlay();
    }
  }
});

async function playCurrentWord() {
  speechSynthesis.cancel(); // 이전 음성 중지
  await delay(100); 
  updateDisplay(currentIndex);
  await playWordAudio(quizList[currentIndex]);
}

// 버튼 클릭시 자동 실행
document.getElementById("word").addEventListener("click", async () => {
  await autoPlay();;
});

// 버튼 이벤트 바인딩
document.getElementById("meaning_ko").addEventListener("click", () => {
  if (!isPaused) {
    speechSynthesis.pause();
    isPaused = true;
  }
});

document.getElementById("pinyin").addEventListener("click", () => {
  if (isPaused) {
    speechSynthesis.resume();
    isPaused = false;
  }
});
