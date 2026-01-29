/**
 * SkillSwap - Simple Rule-Based Chatbot
 * Handles user inquiries with predefined responses
 */

(function () {
    // Knowledge Base
    const KNOWLEDGE_BASE = {
        "what is skillswap": "SkillSwap is a peer-to-peer platform where students and enthusiasts can exchange skills. You can teach something you're good at and learn something new from others!",
        "how do i find a mentor": "Go to the 'Find Mentors' page. You can search by skill or category to find someone who matches your interests.",
        "what are coins": "Coins are our platform's currency. You start with 10 free coins. You use 1 coin to request mentorship and earn 5 coins when you complete a session as a mentor.",
        "how does redeem work": "Visit the 'Redeem' page! You can exchange your earned learning coins for real rewards like certificates, vouchers, or premium learning materials.",
        "how do i share experiences": "Head to the 'Experiences' page to see what others are sharing. You can post your own learning journey and tips to inspire the community.",
        "how does mentorship work": "1. Find a mentor. 2. Send a request (costs 1 coin). 3. Once they accept, you connect and learn. 4. After the session, the mentor earns 5 coins!",
        "hello": "Hi there! I'm the SkillSwap helper. How can I assist you today?",
        "hi": "Hello! Need help navigating SkillSwap? Ask me about coins, mentors, or rewards!",
        "thanks": "You're welcome! Happy learning! 🚀",
        "thank you": "Glad I could help! Is there anything else you'd like to know?",
        "bye": "Goodbye! See you around the community!",
        "login": "You can login using your email and password on the login page. If you're new, make sure to register first!",
        "register": "Click on 'Register' to create your account and get 10 free coins to start your journey."
    };

    const SUGGESTIONS = [
        "What is SkillSwap?",
        "How do I find a mentor?",
        "What are coins?",
        "How does redeem work?",
        "How does mentorship work?"
    ];

    // Create Chatbot UI Elements
    function createChatbotUI() {
        const container = document.createElement('div');
        container.className = 'chatbot-container';
        container.id = 'skillswap-chatbot';

        container.innerHTML = `
            <div class="chatbot-window" id="chat-window">
                <div class="chatbot-header">
                    <div class="bot-avatar">🤖</div>
                    <div>
                        <h4>SkillSwap Helper</h4>
                        <p>Online | Ready to help</p>
                    </div>
                </div>
                <div class="chatbot-messages" id="chat-messages">
                    <div class="chat-msg bot">
                        Hello! I'm your SkillSwap assistant. How can I help you today?
                    </div>
                </div>
                <div class="chatbot-suggestions" id="chat-suggestions"></div>
                <form class="chatbot-input" id="chat-form">
                    <input type="text" id="chat-input" placeholder="Type your question..." autocomplete="off">
                    <button type="submit">Send</button>
                </form>
            </div>
            <button class="chatbot-toggle" id="chat-toggle" title="Chat with us">
                <span>💬</span>
            </button>
        `;

        document.body.appendChild(container);

        // Populate Suggestions
        const suggestionsContainer = document.getElementById('chat-suggestions');
        SUGGESTIONS.forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = text;
            btn.type = 'button';
            btn.onclick = () => handleUserInput(text);
            suggestionsContainer.appendChild(btn);
        });

        // Event Listeners
        const toggleBtn = document.getElementById('chat-toggle');
        const chatWindow = document.getElementById('chat-window');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');

        toggleBtn.onclick = () => {
            chatWindow.classList.toggle('show');
            toggleBtn.classList.toggle('active');
            if (chatWindow.classList.contains('show')) {
                chatInput.focus();
                toggleBtn.innerHTML = '<span>✕</span>';
            } else {
                toggleBtn.innerHTML = '<span>💬</span>';
            }
        };

        chatForm.onsubmit = (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text) {
                handleUserInput(text);
                chatInput.value = '';
            }
        };
    }

    // Add Message to UI
    function addMessage(text, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}`;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Handle User Input
    function handleUserInput(input) {
        addMessage(input, 'user');

        // Bot thinking delay
        setTimeout(() => {
            const response = getBotResponse(input);
            addMessage(response, 'bot');
        }, 500);
    }

    // Keyword matching logic
    function getBotResponse(input) {
        const text = input.toLowerCase();

        // 1. Direct match
        if (KNOWLEDGE_BASE[text]) {
            return KNOWLEDGE_BASE[text];
        }

        // 2. Keyword match
        for (let key in KNOWLEDGE_BASE) {
            if (text.includes(key)) {
                return KNOWLEDGE_BASE[key];
            }
        }

        // 3. Fallback
        return "I'm not sure about that. Try asking about 'coins', 'mentorship', or 'how to find a mentor'. You can also try one of the suggestions above!";
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbotUI);
    } else {
        createChatbotUI();
    }
})();
