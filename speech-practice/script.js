// HTML에 다음 요소가 있어야 합니다:
// <select id="language-select">...
// <button onclick="startScenario('restaurant')">🍜 식당</button>
// <button onclick="startScenario('airport')">✈️ 공항</button>
// <button onclick="startScenario('hospital')">🏥 병원</button>


const chatBox = document.getElementById("chat-box");
const startRecordBtn = document.getElementById("start-record");
const apiKeyInput = document.getElementById("api-key");
const languageSelect = document.getElementById("language-select");

let currentLang = 'zh';

const langConfig = {
  zh: {
    stt: 'zh-CN',
    tts: 'zh-CN',
    systemPrompt: `你是一个中文会话老师。用户会用中文和你对话。你要用自然的中文简洁回答，并以 JSON 格式输出三个字段：\n{
  "hanzi": "中文回答",
  "pinyin": "拼音",
  "translation": "中文的韩语翻译"
}\n请不要输出其他任何内容。每次都必须严格输出这个 JSON 结构。`
  },
  ja: {
    stt: 'ja-JP',
    tts: 'ja-JP',
    systemPrompt: `あなたは日本語会話の教師です。以下のルールに従ってください：
  
  1. ユーザーが日本語で話しかけます。あなたは日本語で返答してください。
  2. ユーザーの言葉を繰り返さず、新しい自然な返答をしてください。
  3. 返答は以下のJSON形式で出力してください（余計なテキストは一切含めないでください）：
  
  {
    "kanji": "あなたの返答（漢字）",
    "kana": "その返答のふりがな",
    "translation": "返答の韓国語訳"
  }
  
  必ずこのJSON形式のみを出力してください。他のテキスト、説明、装飾は不要です。`
  },  
  en: {
    stt: 'en-US',
    tts: 'en-US',
    systemPrompt: `You are an English conversation tutor. The user speaks English. Please reply naturally and briefly in English, and always return a JSON with three fields:\n{
  "sentence": "English response",
  "phonetic": "Phonetic transcription",
  "translation": "Korean translation"
}\nDo not include any other text.`
  },
  ko: {
    stt: 'ko-KR',
    tts: 'ko-KR',
    systemPrompt: `당신은 한국어 회화 선생님입니다. 사용자는 한국어로 질문하거나 말을 겁니다. 당신은 자연스럽고 짧게 한국어로 대답하고, 아래의 JSON 형식으로 세 가지 정보를 출력하세요:
  
  {
    "sentence": "한국어 답변",
    "pronunciation": "발음 또는 띄어쓰기 도움",
    "translation": "한국어 문장의 영어 번역"
  }
  
  반드시 이 JSON 형식만 출력하고 다른 말은 하지 마세요.`
  }
  
};

let messages = [
  { role: "system", content: langConfig[currentLang].systemPrompt }
];

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = langConfig[currentLang].stt;

languageSelect.addEventListener("change", () => {
  currentLang = languageSelect.value;
  recognition.lang = langConfig[currentLang].stt;
  messages = [{ role: "system", content: langConfig[currentLang].systemPrompt }];
});

startRecordBtn.addEventListener("click", () => {
  recognition.start();
  startRecordBtn.textContent = "🎤 듣는 중...";
});

recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  appendMessage("user", transcript);
  startRecordBtn.textContent = "🎙️ 말하기";

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert("API 키를 입력하세요.");
    return;
  }

  messages.push({ role: "user", content: transcript });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();
    messages.push({ role: "assistant", content: reply });
    appendMessage("bot", reply);
  } catch (error) {
    console.error("❌ GPT 통신 오류:", error);
    appendMessage("bot", "❌ 오류가 발생했습니다: " + error.message);
  }
};

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  if (sender === "bot") {
    try {
      const json = JSON.parse(text);
      let spokenText = '';
      let output = `<strong>🔊 GPT 응답</strong>`;
      
      if (currentLang === 'zh') {
        output += `<br><span><strong>[한자]</strong> ${json.hanzi}</span><br>`;
        output += `<span><strong>[병음]</strong> ${json.pinyin}</span><br>`;
        output += `<span><strong>[해석]</strong> ${json.translation}</span>`;
        spokenText = json.hanzi;
      } else if (currentLang === 'ja') {
        output += `<br><span><strong>[漢字]</strong> ${json.kanji}</span><br>`;
        output += `<span><strong>[ふりがな]</strong> ${json.kana}</span><br>`;
        output += `<span><strong>[訳]</strong> ${json.translation}</span>`;
        spokenText = json.kanji;
      } else if (currentLang === 'en') {
        output += `<br><span><strong>[English]</strong> ${json.sentence}</span><br>`;
        output += `<span><strong>[Phonetic]</strong> ${json.phonetic}</span><br>`;
        output += `<span><strong>[Korean]</strong> ${json.translation}</span>`;
        spokenText = json.sentence;
      }else if (currentLang === 'ko') {
        output += `<br><span><strong>[문장]</strong> ${json.sentence}</span><br>`;
        output += `<span><strong>[발음]</strong> ${json.pronunciation}</span><br>`;
        output += `<span><strong>[영어 번역]</strong> ${json.translation}</span>`;
        spokenText = json.sentence;
      }
      
      output += `<br><button class="speaker-button" data-text="${spokenText}">🔈 다시 듣기</button>`;
      msg.innerHTML = output;
      
      const btn = msg.querySelector(".speaker-button");
      if (btn) {
        btn.addEventListener("click", () => speak(btn.dataset.text));
        speak(btn.dataset.text); // 자동으로 읽기
      }
      
    } catch (e) {
      console.warn("⚠️ JSON 파싱 실패:", e);
      msg.innerHTML = text.replace(/\n/g, "<br>");
    }
  } else {
    msg.textContent = text;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

let availableVoices = [];

async function loadVoices() {
    return new Promise(resolve => {
      const synth = window.speechSynthesis;
      const checkVoices = () => {
        const voices = synth.getVoices();
        if (voices.length !== 0) {
          availableVoices = voices;
          resolve();
        } else {
          setTimeout(checkVoices, 200); // 100 → 200ms로 여유
        }
      };
      checkVoices();
    });
  }


  async function speak(text) {
    if (!text) return;
  
    await loadVoices(); // ✅ 반드시 기다려야 함
  
    const utterance = new SpeechSynthesisUtterance(text);
  
    // 언어 설정
    utterance.lang = langConfig[currentLang].tts;
  
    // 음성 목록에서 언어에 맞는 voice 찾기
    const voice = availableVoices.find(v =>
      v.lang === langConfig[currentLang].tts &&
      (v.name.includes("Yuna") || v.name.includes("Nara") || v.name.includes("Korean") || true)
    );
  
    if (voice) {
      utterance.voice = voice;
    } else {
      console.warn("⚠️ 지정된 음성을 찾지 못했습니다. 기본 음성 사용 중");
    }
  
    speechSynthesis.speak(utterance);
  }
  
  
  

async function startScenario(type) {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert("API 키를 먼저 입력하세요.");
    return;
  }

  let introPrompt = "";
  if (currentLang === 'zh') {
    if (type === "restaurant") introPrompt = "我们现在在一家中国餐馆。你是服务员，我是客人。请你先开口，引导我点菜。";
    else if (type === "airport") introPrompt = "我们现在在机场办理登机手续。你是柜台工作人员，我是乘客。请你先开口开始对话。";
    else if (type === "hospital") introPrompt = "我感觉不太舒服。你是医生，我是病人。请你先开始问诊。";
  } else if (currentLang === 'ja') {
    if (type === "restaurant") introPrompt = "ここは日本のレストランです。あなたは店員、私は客です。まず話しかけてください。";
    else if (type === "airport") introPrompt = "ここは空港のチェックインカウンターです。あなたは係員、私は乗客です。会話を始めてください。";
    else if (type === "hospital") introPrompt = "私は体調が悪いです。あなたは医者、私は患者です。まず診察を始めてください。";
  } else if (currentLang === 'en') {
    if (type === "restaurant") introPrompt = "We are at a restaurant. You are the waiter, and I am the customer. Please start the conversation and guide me to order.";
    else if (type === "airport") introPrompt = "We are at the airport check-in counter. You are the staff, I am the passenger. Please start the conversation.";
    else if (type === "hospital") introPrompt = "I feel sick. You are the doctor, and I am the patient. Please begin the consultation.";
  }else if (currentLang === 'ko') {
    if (type === "restaurant") introPrompt = "여기는 한식당입니다. 당신은 직원이고, 나는 손님입니다. 먼저 말을 걸어 음식을 주문하게 도와주세요.";
    else if (type === "airport") introPrompt = "여기는 공항 체크인 카운터입니다. 당신은 직원이고, 나는 승객입니다. 대화를 시작해주세요.";
    else if (type === "hospital") introPrompt = "제가 몸이 안 좋아요. 당신은 의사이고, 저는 환자입니다. 먼저 진료를 시작해주세요.";
  }

  messages = [
    { role: "system", content: langConfig[currentLang].systemPrompt },
    { role: "user", content: introPrompt }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();
    messages.push({ role: "assistant", content: reply });
    appendMessage("bot", reply);
  } catch (error) {
    console.error("❌ GPT 시작 오류:", error);
    appendMessage("bot", "❌ GPT 시작 오류: " + error.message);
  }
}
