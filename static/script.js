const sideItems = document.querySelectorAll(".side-item");

const basicPanel = document.getElementById("basicPanel");
const ragPanel = document.getElementById("ragPanel");

const pageTitle = document.getElementById("pageTitle");
const clearBtn = document.getElementById("clearBtn");

const basicMessages = document.getElementById("basicMessages");
const ragMessages = document.getElementById("ragMessages");

const basicForm = document.getElementById("basicForm");
const ragForm = document.getElementById("ragForm");

const basicInput = document.getElementById("basicInput");
const ragInput = document.getElementById("ragInput");

let basicHistory = [];


/* TAB SWITCHING */

sideItems.forEach(item => {

    item.addEventListener("click", () => {

        sideItems.forEach(btn => {
            btn.classList.remove("active");
        });

        item.classList.add("active");

        const tab = item.dataset.tab;

        if (tab === "basic") {

            basicPanel.classList.add("active-panel");
            ragPanel.classList.remove("active-panel");

            pageTitle.textContent = "Basic Chat";

        } else {

            ragPanel.classList.add("active-panel");
            basicPanel.classList.remove("active-panel");

            pageTitle.textContent = "Knowledge Chat";
        }

    });

});


/* MESSAGE */

function addMessage(container, role, text) {

    const message = document.createElement("div");

    message.className = `message ${role}`;

    const label = role === "user" ? "YOU" : "GROQ";

    message.innerHTML = `
        <div class="message-label">${label}</div>
        <div class="message-body"></div>
    `;

    message.querySelector(".message-body").textContent = text;

    container.appendChild(message);

    container.scrollTop = container.scrollHeight;

}


/* LOADING */

function addLoading(container) {

    const message = document.createElement("div");

    message.className = "message assistant loading";

    message.innerHTML = `
        <div class="message-label">GROQ</div>
        <div class="message-body">Thinking...</div>
    `;

    container.appendChild(message);

    container.scrollTop = container.scrollHeight;

    return message;
}


/* BASIC CHAT */

basicForm.addEventListener("submit", async event => {

    event.preventDefault();

    const text = basicInput.value.trim();

    if (!text) return;

    addMessage(basicMessages, "user", text);

    basicHistory.push({
        role: "user",
        content: text
    });

    basicInput.value = "";
    autoResize(basicInput);

    const loading = addLoading(basicMessages);

    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                messages: basicHistory
            })

        });

        const data = await response.json();

        loading.remove();

        if (!response.ok) {
            throw new Error(data.error || "Request failed");
        }

        addMessage(
            basicMessages,
            "assistant",
            data.reply
        );

        basicHistory.push({
            role: "assistant",
            content: data.reply
        });

    } catch (error) {

        loading.remove();

        addMessage(
            basicMessages,
            "assistant",
            "Error: " + error.message
        );

    }

});


/* RAG CHAT */

ragForm.addEventListener("submit", async event => {

    event.preventDefault();

    const question = ragInput.value.trim();

    if (!question) return;

    addMessage(
        ragMessages,
        "user",
        question
    );

    ragInput.value = "";

    autoResize(ragInput);

    const loading = addLoading(ragMessages);

    try {

        const response = await fetch("/api/rag", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question: question
            })

        });

        const data = await response.json();

        loading.remove();

        if (!response.ok) {
            throw new Error(data.error || "Request failed");
        }

        addMessage(
            ragMessages,
            "assistant",
            data.reply
        );

    } catch (error) {

        loading.remove();

        addMessage(
            ragMessages,
            "assistant",
            "Error: " + error.message
        );

    }

});


/* CLEAR */

clearBtn.addEventListener("click", () => {

    basicMessages.innerHTML = "";
    ragMessages.innerHTML = "";

    basicHistory = [];

});


/* TEXTAREA AUTO RESIZE */

function autoResize(textarea) {

    textarea.style.height = "auto";

    textarea.style.height =
        Math.min(textarea.scrollHeight, 130) + "px";

}


basicInput.addEventListener("input", () => {
    autoResize(basicInput);
});

ragInput.addEventListener("input", () => {
    autoResize(ragInput);
});


/* ENTER TO SEND */

[basicInput, ragInput].forEach(input => {

    input.addEventListener("keydown", event => {

        if (event.key === "Enter" && !event.shiftKey) {

            event.preventDefault();

            input.closest("form").requestSubmit();

        }

    });

});