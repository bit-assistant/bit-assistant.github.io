const landing = document.getElementById('landing');
const chatContainer = document.getElementById('chat-container');
const bottomBar = document.getElementById('bottom-bar');
const messages = document.getElementById('messages');
const modelSelect = document.getElementById('model-select');
const sidebarContainer = document.getElementById('sidebar-container');
const shareBtn = document.getElementById('share-link');
const userInput = document.getElementById('user-input');
const stickyInput = document.getElementById('sticky-input');

let currentUuid = null;
let isGenerating = false;
let furiousTimer = null; // Variable to store the timeout

function updateImage() { 
    document.getElementById('model-img').src = modelSelect.value; 
}

function scrollToEnd() { 
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); 
}

function attachCopyButtons(container) {
    container.querySelectorAll('pre').forEach((block) => {
        if (block.querySelector('.copy-btn')) return;
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerText = 'Copy';
        button.onclick = () => {
            const code = block.querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                button.innerText = 'Copied!';
                setTimeout(() => button.innerText = 'Copy', 2000);
            });
        };
        block.appendChild(button);
    });
}

async function sendMessage(text) {
    if (!text.trim() || isGenerating) return;
    
    isGenerating = true;
    const selectedModel = modelSelect.value;

    landing.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    bottomBar.classList.remove('hidden');
    sidebarContainer.classList.remove('hidden'); 
    
    stickyInput.focus();
    
    messages.innerHTML += `<div class="user-msg">${text}</div>`;
    setTimeout(scrollToEnd, 50);

    const tempId = 'ai-' + Date.now();
    messages.innerHTML += `
        <div id="${tempId}" class="flex items-start space-x-3 w-full">
            <img src="${selectedModel}" class="avatar-img w-10 h-10 rounded-full flex-shrink-0 shadow-md transition-all duration-300">
            <div class="ai-msg flex items-center min-h-[40px]"><div class="dot-flashing"></div></div>
        </div>`;
    setTimeout(scrollToEnd, 50);

    try {
        let formData = `prompt=${encodeURIComponent(text)}&model=${encodeURIComponent(selectedModel)}`;
        if (currentUuid) formData += `&uuid=${encodeURIComponent(currentUuid)}`;
        
        const response = await fetch('https://bit-assistant.webhop.me/qwe123e1/chat.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        const data = await response.json();
        if (data.uuid) currentUuid = data.uuid;
        
        const messageRow = document.getElementById(tempId);
        const bubble = messageRow.querySelector('.ai-msg');
        const avatar = messageRow.querySelector('.avatar-img');

        if (data.response) {
            let cleanResponse = data.response;

            if (cleanResponse.includes('[F]')) {
                cleanResponse = cleanResponse.replace('[F]', '').trim();
                
                const furiousImg = selectedModel.includes('model1') 
                    ? 'https://i.postimg.cc/QVyJZ0N7/model1-f.png' 
                    : 'https://i.postimg.cc/Z0MxzVYj/model2-f.png';

                // Clear any existing timer to prevent premature reset
                if (furiousTimer) clearTimeout(furiousTimer);

                avatar.src = furiousImg;
                avatar.classList.add('furious-mode');
                
                furiousTimer = setTimeout(() => {
                    avatar.src = selectedModel;
                    avatar.classList.remove('furious-mode');
                    furiousTimer = null;
                }, 3000);
            }

            bubble.innerHTML = `<div class="markdown-body text-sm w-full">${marked.parse(cleanResponse)}</div>`;
            attachCopyButtons(bubble);
        }
    } catch (e) { 
        console.error(e); 
    } finally {
        isGenerating = false;
        stickyInput.focus();
        setTimeout(scrollToEnd, 100);
    }
}

userInput.onkeypress = (e) => { if (e.key === 'Enter') { if(isGenerating) return; sendMessage(e.target.value); e.target.value = ''; } };
stickyInput.onkeypress = (e) => { if (e.key === 'Enter') { if(isGenerating) return; sendMessage(e.target.value); e.target.value = ''; } };
shareBtn.onclick = shareConversation;

window.addEventListener('DOMContentLoaded', async () => {
    userInput.focus();
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('id');
    if (shareId) {
        try {
            const response = await fetch(`https://bit-assistant.webhop.me/qwe123e1/shares/${shareId}.json`);
            const data = await response.json();
            if (data.html) {
                currentUuid = data.uuid;
                landing.classList.add('hidden');
                chatContainer.classList.remove('hidden');
                bottomBar.classList.remove('hidden');
                sidebarContainer.classList.remove('hidden'); 
                messages.innerHTML = data.html;
                attachCopyButtons(messages);
                stickyInput.focus();
                setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100);
            }
        } catch (e) { console.error(e); }
    }
});

async function shareConversation() {
    if (!messages.innerHTML.trim()) return;
    const originalText = shareBtn.innerHTML;
    shareBtn.innerText = "SAVING...";
    const base64Html = btoa(unescape(encodeURIComponent(messages.innerHTML)));
    try {
        const response = await fetch('https://bit-assistant.webhop.me/qwe123e1/save_share.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `content=${encodeURIComponent(base64Html)}&uuid=${encodeURIComponent(currentUuid)}`
        });
        const data = await response.json();
        if (data.url) {
            const fullUrl = window.location.origin + window.location.pathname + "?id=" + data.url;
            await navigator.clipboard.writeText(fullUrl);
            shareBtn.innerText = "LINK COPIED!";
            setTimeout(() => { shareBtn.innerHTML = originalText; }, 3000);
        }
    } catch (e) { shareBtn.innerText = "SAVE ERROR"; }
}
