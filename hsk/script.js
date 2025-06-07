let currentIndex = 0;  // 현재 단어 인덱스
let autoPlayRunning = true; // 자동재생 중인지 상태 관리 (기본값은 true)
let isPaused = false; // 일시정지 상태
let hsk_level = 1;

const segmentSize = 30; // 한 버튼 당 단어 개수
const totalWords = quizList.length; // 300개
const totalSegments = Math.ceil(totalWords / segmentSize);

const segmentationContainer = document.getElementById('words-segmentation');

function createSegmentButtons() {
  for (let i = 0; i < totalSegments; i++) {
    const btn = document.createElement('button');
    const startNum = i * segmentSize + 1;
    const endNum = Math.min((i + 1) * segmentSize, totalWords);
    btn.textContent = `${startNum} ~ ${endNum}`;
    btn.className = 'segment-button';
    btn.addEventListener('click', () => {
      currentIndex = i * segmentSize;  // 해당 구간 첫 단어 인덱스
      autoPlayRunning = false;          // 자동재생 중지
      speechSynthesis.cancel();         // 음성 중지
      autoPlayRunning = true;           // 자동재생 재개 허용
      autoPlay();
      updateSliderBackground(currentIndex + 1); // 슬라이더 배경 업데이트
      slider.value = currentIndex + 1;           // 슬라이더 위치 조정
      sliderValue.textContent = currentIndex + 1;
    });
    segmentationContainer.appendChild(btn);
  }
}

document.addEventListener('DOMContentLoaded', () => {
    // 데이터 세팅 코드
    const list = quizList;
    index = 0;
    const q = list[index];

    const level = document.getElementById("level");
    const pos = document.getElementById("pos");
    const number = document.getElementById("number");
    const word = document.getElementById("word");
    const meaning_ko = document.getElementById("meaning_ko");
    const pinyin = document.getElementById("pinyin");
    const zh = document.getElementById("zh");
    const zh_pinyin = document.getElementById("zh_pinyin");
    const ko = document.getElementById("ko");

    level.innerHTML = `HSK ${hsk_level}급`;
    pos.innerHTML = `${q.part_of_speech}`;
    number.innerHTML = `${q.no} / ${quizList.length}`;
    word.innerHTML = `${q.word}`;
    meaning_ko.innerHTML = `${q.meaning_ko}`;
    pinyin.innerHTML = `${q.pinyin}`;
    zh.innerHTML = `${q.zh}`;
    zh_pinyin.innerHTML = `${q.zh_pinyin}`;
    ko.innerHTML = `${q.ko}`;

    const slider = document.getElementById('wordSlider');
    slider.max = quizList.length;  // quizList 배열 길이에 맞춰 max 값 설정

    createSegmentButtons();
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

const slider = document.getElementById("wordSlider");
const sliderValue = document.getElementById("sliderValue");

// 슬라이더 값이 변할 때 (드래그 중) 현재 숫자 업데이트
slider.addEventListener("input", () => {
  sliderValue.textContent = slider.value;
});

// 슬라이더 조작 완료 시 해당 단어로 이동 + 자동재생 재시작
slider.addEventListener("change", async () => {
  const val = parseInt(slider.value, 10);
  currentIndex = val - 1;  // 1-based -> 0-based 인덱스 변환

  // 자동재생 중단 후
  autoPlayRunning = false;
  speechSynthesis.cancel();
  await delay(100);

  // 단어 화면 업데이트 + 음성 재생
  updateDisplay(currentIndex);
  await playWordAudio(quizList[currentIndex]);

  // 자동재생 재개
  autoPlayRunning = true;
  currentIndex++; 
  autoPlay();

  // 슬라이더 값도 동기화 (사실 이미 맞춰졌지만 안전하게)
  slider.value = val;
  sliderValue.textContent = val;
});

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

function highlightWordInSentence(words, sentence) {
  if (!sentence) return sentence;
  // 여러 단어를 모두 강조하도록 반복 적용
  let result = sentence;
  words.forEach(word => {
    if (!word) return;
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedWord, 'g');
    result = result.replace(regex, `<span class="highlight">${word}</span>`);
  });
  return result;
}

function updateDisplay(index) {
  const q = quizList[index];
  if (!q) return;

  // 핵심 단어를 배열로 분리하여 강조
  let highlightParts = [];
  const cleanWord = q.word.replace(/\([^)]*\)/g, '').trim();
  // word가 只有…才… 같이 붙어있으면 '只有', '才' 따로 넣기 (… 제외)
  if (cleanWord.includes('…')) {
    highlightParts = cleanWord.split('…').filter(s => s.trim() !== '');
  } else {
    highlightParts = [cleanWord];
  }
  let highlightPinyinParts = [];
  const cleanPinyin = q.pinyin.replace(/\([^)]*\)/g, '').trim();
  if (cleanPinyin.includes('…')) {
    highlightPinyinParts = cleanPinyin.split('…').filter(s => s.trim() !== '');
  } else {
    highlightPinyinParts = [cleanPinyin];
  }

  document.getElementById("pos").innerHTML = q.part_of_speech;
  document.getElementById("number").innerHTML = `${q.no} / ${quizList.length}`;
  document.getElementById("word").innerHTML = q.word;
  document.getElementById("meaning_ko").innerHTML = q.meaning_ko;
  document.getElementById("pinyin").innerHTML = q.pinyin;
  // 여기서 zh 예문 내 단어 강조
  const highlightedZh = highlightWordInSentence(highlightParts, q.zh);
  document.getElementById("zh").innerHTML = highlightedZh;
  // zh_pinyin 내 pinyin 단어 강조
  const highlightedZhPinyin = highlightWordInSentence(highlightPinyinParts, q.zh_pinyin);
  document.getElementById("zh_pinyin").innerHTML = highlightedZhPinyin;
  document.getElementById("ko").innerHTML = q.ko;
}

function replaceTilde(text) {
  if (!text) return text;
  return text.replace(/~/g, "무엇");
}
function removeParentheses(text) {
  if (!text) return text;
  // 정규식으로 괄호 안 내용까지 삭제
  return text.replace(/\([^)]*\)/g, '').trim();
}
// 한 단어 음성 재생 (음성 재생 끝나면 자동 종료)
async function playWordAudio(wordObj) {
  await speak(wordObj.word, "zh-CN");
  await delay(500);
  await speak(removeParentheses(replaceTilde(wordObj.meaning_ko)), "ko-KR");
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
    slider.value = currentIndex + 1;  // 슬라이더와 현재 인덱스 동기화
    sliderValue.textContent = currentIndex + 1;
    updateSliderBackground(slider.value);
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
      slider.value = currentIndex + 1;
      sliderValue.textContent = currentIndex + 1;
      updateSliderBackground(slider.value);
      await playManualWord(currentIndex);  // 해당 단어 재생
      autoPlayRunning = true;      // 자동재생 재개 허용
      currentIndex++;  // 현재 단어 인덱스 조정
      autoPlay();                  // 자동재생 다시 시작
      // 슬라이더 값 동기화
    }
  } else if (event.key === "ArrowLeft") {
    if (currentIndex > 0) {
      autoPlayRunning = false;
      speechSynthesis.cancel();
      await delay(100);
      currentIndex--;
      slider.value = currentIndex + 1;
      sliderValue.textContent = currentIndex + 1;
      updateSliderBackground(slider.value);
      await playManualWord(currentIndex);
      autoPlayRunning = true;
      currentIndex++;  // 현재 단어 인덱스 조정
      autoPlay();
      // 슬라이더 값 동기화
      slider.value = currentIndex;
      sliderValue.textContent = currentIndex;
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

function updateSliderBackground(value) {
  const slider = document.getElementById('wordSlider');
  const max = slider.max;
  const percent = ((value - 1) / (max - 1)) * 100; // 0~100%
  slider.style.setProperty('--percent', `${percent}%`);
}

// 슬라이더 값 변경 이벤트
document.getElementById('wordSlider').addEventListener('input', (e) => {
  updateSliderBackground(e.target.value);
  currentIndex = e.target.value - 1;
  playManualWord(currentIndex);
});

// 초기값 배경 설정
window.addEventListener('load', () => {
  const slider = document.getElementById('wordSlider');
  updateSliderBackground(slider.value);
});