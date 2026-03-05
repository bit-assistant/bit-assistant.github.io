const landing = document.getElementById('landing');
const chatContainer = document.getElementById('chat-container');
const bottomBar = document.getElementById('bottom-bar');
const messages = document.getElementById('messages');
const modelSelect = document.getElementById('model-select');
const shareCorner = document.getElementById('share-corner');
const shareBtn = document.getElementById('share-link');

let currentUuid = null;

function updateImage() { document.getElementById('model-img').src = modelSelect.value; }
function scrollToEnd() { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }

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
    if (!text.trim()) return;
    
    const selectedModel = modelSelect.value;

    landing.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    bottomBar.classList.remove('hidden');
    messages.innerHTML += `<div class="user-msg">${text}</div>`;
    setTimeout(scrollToEnd, 50);

    const tempId = 'ai-' + Date.now();
    messages.innerHTML += `
        <div id="${tempId}" class="flex items-start space-x-3 w-full">
            <img src="${selectedModel}" class="w-10 h-10 rounded-full flex-shrink-0 shadow-md">
            <div class="ai-msg flex items-center min-h-[40px]"><div class="dot-flashing"></div></div>
        </div>`;
    setTimeout(scrollToEnd, 50);

    try {
        let formData = `prompt=${encodeURIComponent(text)}&model=${encodeURIComponent(selectedModel)}`;
        if (currentUuid) formData += `&uuid=${encodeURIComponent(currentUuid)}`;
        
        const response = await fetch('https://94.140.114.86/qwe123e1/chat.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        const data = await response.json();
        if (data.uuid) currentUuid = data.uuid;
        
        const bubble = document.getElementById(tempId).querySelector('.ai-msg');
        if (data.response) {
            bubble.innerHTML = `<div class="markdown-body text-sm w-full">${marked.parse(data.response)}</div>`;
            attachCopyButtons(bubble);
            shareCorner.style.display = 'block';
        }
    } catch (e) { console.error(e); }
    setTimeout(scrollToEnd, 100);
}

document.getElementById('user-input').onkeypress = (e) => { if (e.key === 'Enter') { sendMessage(e.target.value); e.target.value = ''; } };
document.getElementById('sticky-input').onkeypress = (e) => { if (e.key === 'Enter') { sendMessage(e.target.value); e.target.value = ''; } };
shareBtn.onclick = shareConversation;

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('id');
    
    if (shareId) {
        // Find elements inside the listener to ensure they exist
        const messagesDiv = document.getElementById('messages');
        const landingDiv = document.getElementById('landing');
        const chatContainerDiv = document.getElementById('chat-container');
        const bottomBarDiv = document.getElementById('bottom-bar');

        try {
            const response = await fetch(`https://94.140.114.86/qwe123e1/shares/${shareId}.json`);
            if (!response.ok) throw new Error("File not found on backend");
            
            const data = await response.json();
            
            if (data.html) {
                // Set the UUID so the conversation can continue
                currentUuid = data.uuid;

                // 1. Swap visibility
                landingDiv.classList.add('hidden');
                chatContainerDiv.classList.remove('hidden');
                bottomBarDiv.classList.remove('hidden');

                // 2. Populate the HTML
                messagesDiv.innerHTML = data.html;

                // 3. Re-run UI enhancements
                attachCopyButtons(messagesDiv);
                document.getElementById('share-corner').style.display = 'block';
                
                // 4. Force scroll to bottom after a tiny delay
                setTimeout(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                }, 100);
            }
        } catch (e) { 
            console.error("Shared chat load failed:", e);
            alert("Could not load the shared conversation.");
        }
    }
});

async function shareConversation() {
    if (!messages.innerHTML.trim()) return;
    const originalText = shareBtn.innerHTML;
    shareBtn.innerText = "SAVING...";
    const base64Html = btoa(unescape(encodeURIComponent(messages.innerHTML)));
    try {
        const response = await fetch('https://94.140.114.86/qwe123e1/save_share.php', {
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
