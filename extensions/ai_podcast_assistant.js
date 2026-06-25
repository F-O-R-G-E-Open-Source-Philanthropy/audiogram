/**
 * @name AI Podcast Assistant
 * @description Generates timestamps, chapters, and viral soundbites from transcripts using Gemini AI.
 * @developer Audiogram Pro Team
 * @version 1.1.0
 */

const EXT_ID = 'ai_podcast_assistant';
const GEMINI_KEY_STORAGE = 'audiogram_ext_gemini_key';
const MODEL_NAME = 'gemini-1.5-flash'; // Configured for the fastest tier

let modalElement = null;
let fabElement = null;
let currentTab = 'transcript';
let apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
let isGenerating = false;

const icons = {
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    loader: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb7185" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
};

// --- DOM Construction (Built once, updated dynamically) ---
const buildModalUI = () => {
    modalElement.innerHTML = `
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-opacity">
            <div class="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden relative">
                
                <!-- Header -->
                <div class="p-4 border-b border-white/5 bg-zinc-950/80 flex justify-between items-center shrink-0 relative z-10">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    <div class="flex items-center space-x-3 mt-1">
                        <div class="text-indigo-400 bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">${icons.sparkles}</div>
                        <h2 class="text-lg font-bold text-white tracking-wide">AI Podcast Assistant</h2>
                    </div>
                    <button id="ai-close-btn" class="text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors p-2 rounded-lg">${icons.x}</button>
                </div>

                <!-- API Key Config Bar -->
                <div class="px-5 py-3 bg-zinc-950 border-b border-white/5 shrink-0 flex items-center space-x-3 justify-between">
                    <div class="flex-1 flex items-center space-x-3 relative">
                        <input type="password" id="ai-key-input" placeholder="Enter Gemini API Key..." value="${apiKey}" class="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono shadow-inner transition-colors" />
                        <button id="ai-validate-btn" class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-lg transition-colors flex items-center h-full">Verify</button>
                        <div id="ai-key-status" class="flex items-center space-x-2 text-xs font-medium"></div>
                    </div>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] uppercase font-bold tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors hidden sm:block">Get Free Key &rarr;</a>
                </div>

                <!-- Main Layout -->
                <div class="flex flex-1 overflow-hidden bg-zinc-950/50">
                    
                    <!-- Sidebar Tabs -->
                    <div class="w-48 border-r border-white/5 bg-zinc-950 flex flex-col p-3 space-y-2 shrink-0">
                        <button data-target="transcript" class="ai-tab-btn flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                            Transcript <div class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                        </button>
                        <button data-target="chapters" class="ai-tab-btn flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent">
                            Chapters <div id="dot-chapters" class="w-2 h-2 rounded-full bg-zinc-700"></div>
                        </button>
                        <button data-target="soundbites" class="ai-tab-btn flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent">
                            Soundbites <div id="dot-soundbites" class="w-2 h-2 rounded-full bg-zinc-700"></div>
                        </button>
                    </div>

                    <!-- Content Views -->
                    <div class="flex-1 relative flex flex-col p-5 overflow-hidden">
                        
                        <!-- Global Error Banner -->
                        <div id="ai-error-banner" class="hidden mb-4 bg-rose-950/50 border border-rose-500/30 rounded-xl p-3 flex items-start space-x-3 shrink-0">
                            <div class="mt-0.5">${icons.alert}</div>
                            <div class="flex-1">
                                <h4 class="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">API Error</h4>
                                <p id="ai-error-text" class="text-[11px] font-mono text-rose-300 leading-relaxed"></p>
                            </div>
                        </div>

                        <!-- TRANSCRIPT TAB -->
                        <div id="tab-transcript" class="ai-tab-content flex-1 flex flex-col h-full">
                            <div class="flex items-center justify-between mb-3 shrink-0">
                                <div>
                                    <h3 class="text-sm font-bold text-white">Source Transcript</h3>
                                    <p class="text-[11px] text-zinc-500 mt-1">Paste the full episode text here for analysis.</p>
                                </div>
                            </div>
                            <textarea id="ai-input-transcript" class="w-full flex-1 bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none shadow-inner custom-scrollbar" placeholder="Paste transcript text here..."></textarea>
                        </div>

                        <!-- CHAPTERS TAB -->
                        <div id="tab-chapters" class="ai-tab-content hidden flex-1 flex flex-col h-full">
                            <div class="flex items-center justify-between mb-3 shrink-0">
                                <div>
                                    <h3 class="text-sm font-bold text-white">Generated Chapters</h3>
                                    <p class="text-[11px] text-zinc-500 mt-1">Formatted perfectly for YouTube & Spotify descriptions.</p>
                                </div>
                                <button data-copy="ai-output-chapters" class="ai-copy-btn text-[10px] flex items-center font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/20">${icons.copy} <span class="ml-2">Copy</span></button>
                            </div>
                            <textarea id="ai-output-chapters" readonly class="w-full flex-1 bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none resize-none shadow-inner custom-scrollbar" placeholder="Waiting for analysis..."></textarea>
                        </div>

                        <!-- SOUNDBITES TAB -->
                        <div id="tab-soundbites" class="ai-tab-content hidden flex-1 flex flex-col h-full">
                            <div class="flex items-center justify-between mb-3 shrink-0">
                                <div>
                                    <h3 class="text-sm font-bold text-white">Viral Soundbites</h3>
                                    <p class="text-[11px] text-zinc-500 mt-1">High-retention 30-45s hooks extracted from the context.</p>
                                </div>
                                <button data-copy="ai-output-soundbites" class="ai-copy-btn text-[10px] flex items-center font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/20">${icons.copy} <span class="ml-2">Copy</span></button>
                            </div>
                            <textarea id="ai-output-soundbites" readonly class="w-full flex-1 bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none resize-none shadow-inner custom-scrollbar" placeholder="Waiting for analysis..."></textarea>
                        </div>

                    </div>
                </div>

                <!-- Master Action Footer -->
                <div class="p-4 bg-zinc-950/80 border-t border-white/5 shrink-0 flex items-center justify-between">
                    <p id="ai-progress-text" class="text-xs font-mono text-zinc-400"></p>
                    <button id="ai-master-analyze" class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center uppercase tracking-widest text-xs">
                        ${icons.sparkles} <span class="ml-2">Run Full Analysis</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    attachEventBindings();
};

// --- Logic & State Management ---

const switchTab = (tabId) => {
    currentTab = tabId;
    // Update Tab Buttons UI
    document.querySelectorAll('.ai-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-target') === tabId) {
            btn.className = "ai-tab-btn flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-indigo-500/10 text-indigo-400 border border-indigo-500/30";
        } else {
            btn.className = "ai-tab-btn flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent";
        }
    });

    // Update Content Visibility
    document.querySelectorAll('.ai-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
};

const validateConnection = async () => {
    const key = document.getElementById('ai-key-input').value.trim();
    if (!key) return alert("Please paste an API key first.");
    
    const btn = document.getElementById('ai-validate-btn');
    const status = document.getElementById('ai-key-status');
    
    btn.innerHTML = icons.loader;
    btn.disabled = true;
    status.innerHTML = '';

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with the exact word: OK" }] }] })
        });
        
        if (!res.ok) throw new Error("Invalid Key");
        
        apiKey = key;
        localStorage.setItem(GEMINI_KEY_STORAGE, apiKey);
        status.innerHTML = `<span class="text-emerald-400 flex items-center">${icons.check} <span class="ml-1">Connected</span></span>`;
    } catch (e) {
        status.innerHTML = `<span class="text-rose-400 flex items-center">${icons.alert} <span class="ml-1">Invalid Key</span></span>`;
    } finally {
        btn.innerHTML = 'Verify';
        btn.disabled = false;
    }
};

const showError = (msg) => {
    const banner = document.getElementById('ai-error-banner');
    const text = document.getElementById('ai-error-text');
    text.innerText = msg;
    banner.classList.remove('hidden');
};

const hideError = () => {
    document.getElementById('ai-error-banner').classList.add('hidden');
};

const runFullAnalysis = async () => {
    hideError();
    const transcript = document.getElementById('ai-input-transcript').value.trim();
    
    if (!apiKey) return showError("Please set and verify your Gemini API key first.");
    if (!transcript) {
        switchTab('transcript');
        return showError("Please paste the episode transcript into the text area before running analysis.");
    }

    const analyzeBtn = document.getElementById('ai-master-analyze');
    const progressText = document.getElementById('ai-progress-text');
    const chapDot = document.getElementById('dot-chapters');
    const sbDot = document.getElementById('dot-soundbites');

    isGenerating = true;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `${icons.loader} <span class="ml-2">Processing Data...</span>`;
    progressText.innerText = "Initiating concurrent AI calls...";
    
    chapDot.className = "w-2 h-2 rounded-full bg-indigo-500 animate-pulse";
    sbDot.className = "w-2 h-2 rounded-full bg-indigo-500 animate-pulse";

    // Build the Prompts
    const promptChapters = `Analyze the following podcast transcript and generate time-stamped chapters. Format strictly as:\nHH:MM:SS - HH:MM:SS Chapter Title\n\nOnly return the timecodes and titles. Do not use markdown code blocks.\n\nTranscript:\n${transcript}`;
    
    const promptSoundbites = `Analyze the following podcast transcript and identify the 3 most engaging, viral-worthy soundbites (30-45 seconds each). Format strictly as:\n\n1. Title: [Catchy Title]\nTime: HH:MM:SS - HH:MM:SS\nReason: [Why it's engaging]\nTranscript: [The exact quote]\n\nDo not use markdown code blocks.\n\nTranscript:\n${transcript}`;

    const apiCall = async (prompt) => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || `API Error HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No output generated.";
    };

    try {
        progressText.innerText = "Analyzing chapters and soundbites simultaneously...";
        
        // Run both heavy operations concurrently
        const [chaptersResult, soundbitesResult] = await Promise.all([
            apiCall(promptChapters),
            apiCall(promptSoundbites)
        ]);

        // Targeted DOM updates (preserves user state seamlessly)
        document.getElementById('ai-output-chapters').value = chaptersResult;
        document.getElementById('ai-output-soundbites').value = soundbitesResult;
        
        chapDot.className = "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
        sbDot.className = "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
        progressText.innerText = "Analysis Complete.";
        
        // Auto-switch to chapters to show results
        switchTab('chapters');

    } catch (e) {
        showError(`Analysis Failed: ${e.message}`);
        chapDot.className = "w-2 h-2 rounded-full bg-rose-500";
        sbDot.className = "w-2 h-2 rounded-full bg-rose-500";
        progressText.innerText = "Failed.";
    } finally {
        isGenerating = false;
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `${icons.sparkles} <span class="ml-2">Run Full Analysis</span>`;
    }
};

const attachEventBindings = () => {
    document.getElementById('ai-close-btn').onclick = () => {
        modalElement.classList.remove('opacity-100');
        modalElement.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => modalElement.style.display = 'none', 300);
    };

    document.querySelectorAll('.ai-tab-btn').forEach(btn => {
        btn.onclick = (e) => switchTab(e.currentTarget.getAttribute('data-target'));
    });

    document.getElementById('ai-key-input').onchange = (e) => {
        apiKey = e.target.value.trim();
        localStorage.setItem(GEMINI_KEY_STORAGE, apiKey);
    };

    document.getElementById('ai-validate-btn').onclick = validateConnection;
    document.getElementById('ai-master-analyze').onclick = runFullAnalysis;

    // Smart Copy Buttons
    document.querySelectorAll('.ai-copy-btn').forEach(btn => {
        btn.onclick = (e) => {
            const targetId = e.currentTarget.getAttribute('data-copy');
            const text = document.getElementById(targetId).value;
            if (!text) return;
            
            navigator.clipboard.writeText(text);
            const originalHTML = e.currentTarget.innerHTML;
            e.currentTarget.innerHTML = `${icons.check} <span class="ml-2">Copied!</span>`;
            e.currentTarget.classList.add('text-emerald-400', 'bg-emerald-500/10', 'border-emerald-500/20');
            
            setTimeout(() => {
                e.currentTarget.innerHTML = originalHTML;
                e.currentTarget.classList.remove('text-emerald-400', 'bg-emerald-500/10', 'border-emerald-500/20');
            }, 2000);
        };
    });
};

// --- Extension Lifecycle Registration ---

function init(api) {
    if (!fabElement) {
        fabElement = document.createElement('button');
        fabElement.id = 'ai-assistant-fab';
        fabElement.className = 'fixed bottom-24 lg:bottom-8 right-8 z-[90] bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center space-x-2 transition-transform hover:scale-105 active:scale-95 group font-bold tracking-widest text-[10px] uppercase';
        fabElement.innerHTML = `<span class="group-hover:rotate-12 transition-transform duration-300">${icons.sparkles}</span> <span>AI Assistant</span>`;
        
        fabElement.onclick = () => {
            if (!modalElement.innerHTML) buildModalUI();
            modalElement.style.display = 'block';
            // Slight delay to trigger opacity transition beautifully
            setTimeout(() => {
                modalElement.classList.remove('opacity-0', 'pointer-events-none');
                modalElement.classList.add('opacity-100');
            }, 10);
        };
        document.body.appendChild(fabElement);
    }

    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = 'ai-assistant-modal';
        modalElement.style.display = 'none';
        modalElement.className = 'opacity-0 pointer-events-none transition-opacity duration-300';
        document.body.appendChild(modalElement);
    }
}

function teardown(api) {
    if (fabElement) {
        fabElement.remove();
        fabElement = null;
    }
    if (modalElement) {
        modalElement.remove();
        modalElement = null;
    }
}

// Boot up
window.AudiogramAPI.register(EXT_ID, init, teardown);
