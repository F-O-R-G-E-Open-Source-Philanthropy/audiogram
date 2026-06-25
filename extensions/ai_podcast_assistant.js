/**
 * @name AI Podcast Assistant
 * @description Generates timestamps, chapters, and viral soundbites from transcripts using Gemini AI.
 * @developer Audiogram Pro Team
 * @version 1.0.0
 */

const EXT_ID = 'ai_podcast_assistant';
const GEMINI_KEY_STORAGE = 'audiogram_ext_gemini_key';

let modalElement = null;
let fabElement = null;
let currentTab = 'chapters';
let apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
let transcriptText = '';
let isGenerating = false;
let generatedData = { chapters: '', soundbites: '' };

const icons = {
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    loader: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
};

const renderUI = () => {
    if (!modalElement) return;

    const hasEpisode = window.AudiogramAPI && window.AudiogramAPI.state && window.AudiogramAPI.state.selectedEpisode;
    const missingDataWarning = !hasEpisode && !transcriptText ? `<div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-xs mb-4">⚠️ You must select an episode in Audiogram Pro or paste a transcript in the Data tab first.</div>` : '';

    modalElement.innerHTML = `
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div class="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                <!-- Header -->
                <div class="p-4 border-b border-white/5 bg-zinc-950/50 flex justify-between items-center shrink-0 relative">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    <div class="flex items-center space-x-3 mt-1">
                        <div class="text-indigo-400">${icons.sparkles}</div>
                        <h2 class="text-lg font-bold text-white tracking-wide">AI Podcast Assistant</h2>
                    </div>
                    <button id="ai-ext-close" class="text-zinc-500 hover:text-white transition-colors p-1">${icons.x}</button>
                </div>

                <!-- Settings / API Key -->
                <div class="px-6 py-4 bg-zinc-950 border-b border-white/5 shrink-0 flex items-center space-x-3">
                    <input type="password" id="ai-ext-key" placeholder="Enter Gemini API Key..." class="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono shadow-inner" value="${apiKey}" />
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] uppercase font-bold tracking-widest text-indigo-400 hover:text-indigo-300 whitespace-nowrap">Get Free Key</a>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-white/5 bg-zinc-950/50 shrink-0">
                    <button data-tab="chapters" class="ai-tab-btn flex-1 p-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${currentTab === 'chapters' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-zinc-500 hover:text-zinc-300'}">Chapters</button>
                    <button data-tab="soundbites" class="ai-tab-btn flex-1 p-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${currentTab === 'soundbites' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-zinc-500 hover:text-zinc-300'}">Sound Bites</button>
                    <button data-tab="transcript" class="ai-tab-btn flex-1 p-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${currentTab === 'transcript' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-zinc-500 hover:text-zinc-300'}">Transcript Data</button>
                </div>

                <!-- Content Area -->
                <div class="p-6 overflow-y-auto flex-1 custom-scrollbar bg-zinc-900 relative">
                    ${missingDataWarning}
                    
                    ${currentTab === 'chapters' ? `
                        <div class="flex justify-between items-center mb-3">
                            <p class="text-xs text-zinc-400">Generate formatted YouTube chapters.</p>
                            ${generatedData.chapters ? `<button id="ai-ext-copy" class="text-[10px] flex items-center font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors">${icons.copy} <span class="ml-2">Copy</span></button>` : ''}
                        </div>
                        <textarea readonly class="w-full h-48 bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none resize-none shadow-inner" placeholder="00:00:00 - Intro\n00:02:15 - Deep Dive...">${generatedData.chapters}</textarea>
                        <button id="ai-ext-generate" class="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] flex items-center justify-center uppercase tracking-widest text-xs" ${isGenerating || (!transcriptText && !hasEpisode) ? 'disabled' : ''}>
                            ${isGenerating ? icons.loader : icons.sparkles}
                            <span class="ml-2">${isGenerating ? 'Generating Chapters...' : 'Generate Chapters'}</span>
                        </button>
                    ` : ''}

                    ${currentTab === 'soundbites' ? `
                        <div class="flex justify-between items-center mb-3">
                            <p class="text-xs text-zinc-400">Find highly engaging 30-45s clips for TikTok/Reels.</p>
                            ${generatedData.soundbites ? `<button id="ai-ext-copy" class="text-[10px] flex items-center font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors">${icons.copy} <span class="ml-2">Copy</span></button>` : ''}
                        </div>
                        <textarea readonly class="w-full h-48 bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none resize-none shadow-inner" placeholder="1. Title: The Secret Strategy\nTime: 00:15:20 - 00:16:05\n...">${generatedData.soundbites}</textarea>
                        <button id="ai-ext-generate" class="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] flex items-center justify-center uppercase tracking-widest text-xs" ${isGenerating || (!transcriptText && !hasEpisode) ? 'disabled' : ''}>
                            ${isGenerating ? icons.loader : icons.sparkles}
                            <span class="ml-2">${isGenerating ? 'Analyzing Soundbites...' : 'Find Viral Soundbites'}</span>
                        </button>
                    ` : ''}

                    ${currentTab === 'transcript' ? `
                        <div class="space-y-4 h-full flex flex-col">
                            <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start space-x-3 shrink-0">
                                <div class="text-indigo-400 mt-0.5">${icons.sparkles}</div>
                                <div>
                                    <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-1">Save API Usage</h4>
                                    <p class="text-[11px] text-zinc-400 leading-relaxed">Paste your episode transcript here. If you leave this blank, the AI will attempt to transcribe the audio directly, which uses significantly more API tokens.</p>
                                </div>
                            </div>
                            <textarea id="ai-ext-transcript" class="flex-1 w-full bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none shadow-inner transition-colors" placeholder="Paste full transcript text here...">${transcriptText}</textarea>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    attachListeners();
};

const handleGenerate = async () => {
    if (!apiKey) {
        alert("Please enter a Gemini API Key.");
        return;
    }

    isGenerating = true;
    renderUI();

    try {
        let prompt = "";
        
        if (currentTab === 'chapters') {
            prompt = `Analyze the following podcast transcript and generate time-stamped chapters. Format strictly as:\nHH:MM:SS - HH:MM:SS Chapter Title\n\nOnly return the timecodes and titles. Do not use markdown code blocks.\n\nTranscript:\n${transcriptText}`;
        } else if (currentTab === 'soundbites') {
            prompt = `Analyze the following podcast transcript and identify the 3 most engaging, viral-worthy soundbites (30-45 seconds each). Format strictly as:\n\n1. Title: [Catchy Title]\nTime: HH:MM:SS - HH:MM:SS\nReason: [Why it's engaging]\nTranscript: [The exact quote]\n\nDo not use markdown code blocks.\n\nTranscript:\n${transcriptText}`;
        }

        if (!transcriptText && window.AudiogramAPI?.state?.selectedEpisode?.audioUrl) {
            prompt = "I have attached an audio file instead of a text transcript. " + prompt.replace(`Transcript:\n${transcriptText}`, "");
            // Note: Sending direct audio URLs to Gemini requires uploading via File API first in most cases, 
            // but we will instruct the standard text generation endpoint and rely on the user providing transcripts for now.
            if (!transcriptText) {
                alert("For web extensions, please paste the text transcript into the 'Transcript Data' tab first. Direct audio processing requires backend proxies.");
                isGenerating = false;
                renderUI();
                return;
            }
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Failed to generate.");
        }

        const data = await response.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (currentTab === 'chapters') generatedData.chapters = output;
        if (currentTab === 'soundbites') generatedData.soundbites = output;

    } catch (e) {
        alert("AI Error: " + e.message);
    } finally {
        isGenerating = false;
        renderUI();
    }
};

const attachListeners = () => {
    const closeBtn = document.getElementById('ai-ext-close');
    if (closeBtn) closeBtn.onclick = () => { modalElement.style.display = 'none'; };

    const keyInput = document.getElementById('ai-ext-key');
    if (keyInput) keyInput.onchange = (e) => {
        apiKey = e.target.value;
        localStorage.setItem(GEMINI_KEY_STORAGE, apiKey);
    };

    const transcriptInput = document.getElementById('ai-ext-transcript');
    if (transcriptInput) transcriptInput.onchange = (e) => {
        transcriptText = e.target.value;
    };

    const tabBtns = document.querySelectorAll('.ai-tab-btn');
    tabBtns.forEach(btn => {
        btn.onclick = (e) => {
            currentTab = e.target.getAttribute('data-tab');
            renderUI();
        };
    });

    const generateBtn = document.getElementById('ai-ext-generate');
    if (generateBtn) generateBtn.onclick = handleGenerate;

    const copyBtn = document.getElementById('ai-ext-copy');
    if (copyBtn) copyBtn.onclick = (e) => {
        const text = currentTab === 'chapters' ? generatedData.chapters : generatedData.soundbites;
        navigator.clipboard.writeText(text);
        copyBtn.innerHTML = `${icons.check} <span class="ml-2">Copied!</span>`;
        copyBtn.classList.add('text-emerald-400', 'bg-emerald-500/10');
        setTimeout(() => renderUI(), 2000);
    };
};

function init(api) {
    // 1. Create Floating Action Button
    fabElement = document.createElement('button');
    fabElement.id = 'ai-assistant-fab';
    fabElement.className = 'fixed bottom-24 lg:bottom-8 right-8 z-[90] bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center space-x-2 transition-transform hover:scale-105 active:scale-95 group font-bold tracking-widest text-[10px] uppercase';
    fabElement.innerHTML = `<span class="group-hover:rotate-12 transition-transform duration-300">${icons.sparkles}</span> <span>AI Assistant</span>`;
    
    fabElement.onclick = () => {
        modalElement.style.display = 'block';
        renderUI();
    };
    document.body.appendChild(fabElement);

    // 2. Create Modal Container
    modalElement = document.createElement('div');
    modalElement.id = 'ai-assistant-modal';
    modalElement.style.display = 'none';
    document.body.appendChild(modalElement);
}

function teardown(api) {
    if (fabElement) fabElement.remove();
    if (modalElement) modalElement.remove();
}

window.AudiogramAPI.register(EXT_ID, init, teardown);