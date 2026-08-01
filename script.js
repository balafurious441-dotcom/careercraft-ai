const chatArea = document.getElementById("chatArea");
const messagesList = document.getElementById("messagesList");
const userInput = document.getElementById("userInput");
const welcomeContainer = document.getElementById("welcomeContainer");
const sidebar = document.getElementById("sidebar");
const historyList = document.getElementById("historyList");
const micBtn = document.getElementById("micBtn");
const themeBtn = document.getElementById("themeBtn");
const profileModal = document.getElementById("profileModal");
const statCount = document.getElementById("statCount");

let promptCounter = 0;

// 1. Theme Switcher
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains("dark-mode")) {
        body.classList.remove("dark-mode");
        body.classList.add("light-mode");
        themeBtn.innerHTML = `<i class="fa-solid fa-moon"></i>`;
    } else {
        body.classList.remove("light-mode");
        body.classList.add("dark-mode");
        themeBtn.innerHTML = `<i class="fa-solid fa-sun"></i>`;
    }
}

// 2. Profile Modal
function toggleProfileModal() {
    profileModal.classList.toggle("active");
}

// 3. Export Chat as TXT
function exportChat() {
    const messages = messagesList.innerText;
    if (!messages.trim()) {
        alert("No chat history to export!");
        return;
    }
    const blob = new Blob([messages], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CareerCraft_Chat_Export.txt";
    a.click();
    URL.revokeObjectURL(url);
}

// 4. Audio API Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSendSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playReceiveSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// 5. Speech Recognition
let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        stopListening();
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => stopListening();
}

function toggleVoiceInput() {
    if (!recognition) {
        alert("Speech Recognition not supported in this browser!");
        return;
    }
    if (micBtn.classList.contains("listening")) {
        stopListening();
    } else {
        micBtn.classList.add("listening");
        recognition.start();
    }
}

function stopListening() {
    micBtn.classList.remove("listening");
    if (recognition) recognition.stop();
}

// 6. Sidebar Navigation & History
function toggleSidebar() {
    sidebar.classList.toggle("hidden");
}

function startNewChat() {
    messagesList.innerHTML = "";
    if (welcomeContainer) welcomeContainer.style.display = "block";
}

function addToHistory(text) {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerText = text;
    item.onclick = () => {
        startNewChat();
        sendQuickPrompt(text);
    };
    historyList.appendChild(item);
}

// 7. Chat Engine
function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

function sendQuickPrompt(promptText) {
    userInput.value = promptText;
    sendMessage();
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    playSendSound();
    if (welcomeContainer) welcomeContainer.style.display = "none";

    appendMessage(text, "user-msg");
    addToHistory(text);
    userInput.value = "";

    // Increment prompt count stat
    promptCounter++;
    statCount.innerText = promptCounter;

    const typingId = appendTypingIndicator();

    try {
        const response = await fetch("https://careercraft-ai-tfzx.onrender.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json();

        if (response.ok) {
            updateMessage(typingId, data.reply);
            playReceiveSound();
        } else {
            updateMessage(typingId, `Error: ${data.detail}`);
        }
    } catch (error) {
        updateMessage(typingId, "Connection Error! Ensure backend server is live.");
    }
}

function appendMessage(text, className) {
    const msgDiv = document.createElement("div");
    const uniqueId = "msg-" + Date.now();
    msgDiv.id = uniqueId;
    msgDiv.className = `msg ${className} animate-in`;

    if (className === "ai-msg") {
        msgDiv.innerHTML = formatMarkdown(text);
    } else {
        msgDiv.innerText = text;
    }

    messagesList.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return uniqueId;
}

function appendTypingIndicator() {
    const msgDiv = document.createElement("div");
    const uniqueId = "msg-" + Date.now();
    msgDiv.id = uniqueId;
    msgDiv.className = `msg ai-msg animate-in`;
    msgDiv.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
    messagesList.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return uniqueId;
}

function updateMessage(id, newText) {
    const msgElement = document.getElementById(id);
    if (msgElement) {
        msgElement.innerHTML = formatMarkdown(newText);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// Markdown & Copy Code
function formatMarkdown(text) {
    if (typeof marked !== 'undefined') {
        let rawHtml = marked.parse(text);
        return rawHtml.replace(/<pre><code>/g, `<div class="code-block-wrapper"><button class="copy-btn" onclick="copyCode(this)">Copy</button><pre><code>`).replace(/<\/code><\/pre>/g, `</code></pre></div>`);
    }
    return text;
}

function copyCode(btn) {
    const code = btn.nextElementSibling.innerText;
    navigator.clipboard.writeText(code);
    btn.innerText = "Copied!";
    setTimeout(() => btn.innerText = "Copy", 2000);
}
