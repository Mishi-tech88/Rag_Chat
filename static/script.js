"use strict";


/* =========================================================
   ELEMENTS
========================================================= */

const navItems = document.querySelectorAll(".nav-item");

const basicPanel = document.getElementById("basicPanel");
const ragPanel = document.getElementById("ragPanel");

const pageTitle = document.getElementById("pageTitle");

const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const basicMessages = document.getElementById("basicMessages");
const ragMessages = document.getElementById("ragMessages");

const basicForm = document.getElementById("basicForm");
const ragForm = document.getElementById("ragForm");

const basicInput = document.getElementById("basicInput");
const ragInput = document.getElementById("ragInput");

const basicCount = document.getElementById("basicCount");
const ragCount = document.getElementById("ragCount");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");


/* =========================================================
   BASIC CHAT HISTORY
========================================================= */

let basicHistory = [];


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const savedTheme = localStorage.getItem("groq-theme");

    if (savedTheme === "light") {

        document.body.classList.add("light");

        themeIcon.textContent = "☾";

    } else {

        document.body.classList.remove("light");

        themeIcon.textContent = "☀";
    }
}


themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("light");

    const isLight =
        document.body.classList.contains("light");

    localStorage.setItem(
        "groq-theme",
        isLight ? "light" : "dark"
    );

    themeIcon.textContent =
        isLight ? "☾" : "☀";

});


initializeTheme();


/* =========================================================
   TAB SWITCHING
========================================================= */

navItems.forEach(item => {

    item.addEventListener("click", () => {

        navItems.forEach(nav => {
            nav.classList.remove("active");
        });

        item.classList.add("active");

        const tab = item.dataset.tab;

        if (tab === "basic") {

            basicPanel.classList.add("active-panel");

            ragPanel.classList.remove("active-panel");

            pageTitle.textContent = "Basic Chat";

            setTimeout(() => {
                basicInput.focus();
            }, 100);

        } else {

            ragPanel.classList.add("active-panel");

            basicPanel.classList.remove("active-panel");

            pageTitle.textContent = "Knowledge Chat";

            setTimeout(() => {
                ragInput.focus();
            }, 100);
        }

    });

});


/* =========================================================
   EMPTY STATE
========================================================= */

function removeEmptyState(container) {

    const emptyState =
        container.querySelector(".empty-state");

    if (emptyState) {
        emptyState.remove();
    }
}


/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(
    container,
    role,
    text
) {

    removeEmptyState(container);

    const message =
        document.createElement("div");

    message.className =
        `message ${role}`;


    const label =
        role === "user"
            ? "YOU"
            : "GROQ";


    if (role === "assistant") {

        message.innerHTML = `

            <div class="message-label">
                ${label}
            </div>

            <div class="message-wrapper">

                <div class="message-body"></div>

                <button
                    class="copy-btn"
                    type="button"
                    title="Copy response"
                >
                    Copy
                </button>

            </div>
        `;

        message
            .querySelector(".message-body")
            .textContent = text;


        const copyButton =
            message.querySelector(".copy-btn");


        copyButton.addEventListener(
            "click",
            () => {

                copyText(text);

                copyButton.textContent =
                    "Copied";

                setTimeout(() => {

                    copyButton.textContent =
                        "Copy";

                }, 1500);

            }
        );

    } else {

        message.innerHTML = `

            <div class="message-body"></div>

        `;

        message
            .querySelector(".message-body")
            .textContent = text;
    }


    container.appendChild(message);

    scrollToBottom(container);
}


/* =========================================================
   LOADING
========================================================= */

function addLoading(container) {

    removeEmptyState(container);

    const message =
        document.createElement("div");

    message.className =
        "message assistant loading";


    message.innerHTML = `

        <div class="message-label">
            GROQ
        </div>

        <div class="message-body">

            <div class="loading-dots">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;


    container.appendChild(message);

    scrollToBottom(container);

    return message;
}


/* =========================================================
   SCROLL
========================================================= */

function scrollToBottom(container) {

    requestAnimationFrame(() => {

        container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
        });

    });
}


/* =========================================================
   BASIC CHAT
========================================================= */

basicForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const text =
            basicInput.value.trim();


        if (!text) {
            return;
        }


        addMessage(
            basicMessages,
            "user",
            text
        );


        basicHistory.push({
            role: "user",
            content: text
        });


        basicInput.value = "";

        updateCounter(
            basicInput,
            basicCount
        );

        autoResize(basicInput);


        const loading =
            addLoading(basicMessages);


        try {

            const response =
                await fetch(
                    "/api/chat",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            messages:
                                basicHistory
                        })

                    }
                );


            const data =
                await response.json();


            loading.remove();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Request failed"
                );

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
                "Error: " +
                error.message
            );

        }

    }
);


/* =========================================================
   RAG CHAT
========================================================= */

ragForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const question =
            ragInput.value.trim();


        if (!question) {
            return;
        }


        addMessage(
            ragMessages,
            "user",
            question
        );


        ragInput.value = "";

        updateCounter(
            ragInput,
            ragCount
        );

        autoResize(ragInput);


        const loading =
            addLoading(ragMessages);


        try {

            const response =
                await fetch(
                    "/api/rag",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            question: question
                        })

                    }
                );


            const data =
                await response.json();


            loading.remove();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Request failed"
                );

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
                "Error: " +
                error.message
            );

        }

    }
);


/* =========================================================
   CLEAR CHAT
========================================================= */

function clearConversations() {

    basicMessages.innerHTML = "";
    ragMessages.innerHTML = "";

    basicHistory = [];

    showBasicEmptyState();
    showRagEmptyState();

    showToast(
        "Conversation cleared"
    );
}


clearBtn.addEventListener(
    "click",
    clearConversations
);


newChatBtn.addEventListener(
    "click",
    clearConversations
);


/* =========================================================
   RESTORE EMPTY STATES
========================================================= */

function showBasicEmptyState() {

    basicMessages.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ✦
            </div>

            <h3>
                How can I help you?
            </h3>

            <p>
                Start a conversation with your Groq-powered AI assistant.
            </p>

            <div class="suggestions">

                <button class="suggestion">
                    Explain machine learning
                </button>

                <button class="suggestion">
                    Write Python code
                </button>

                <button class="suggestion">
                    Help me debug code
                </button>

            </div>

        </div>

    `;
}


function showRagEmptyState() {

    ragMessages.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon purple-icon">
                ⌘
            </div>

            <h3>
                Ask your knowledge base
            </h3>

            <p>
                Your answers are generated using the connected knowledge document.
            </p>

            <div class="suggestions">

                <button class="suggestion">
                    What services do you provide?
                </button>

                <button class="suggestion">
                    Explain your AI services
                </button>

                <button class="suggestion">
                    What can you build?
                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   SUGGESTION BUTTONS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const suggestion =
            event.target.closest(
                ".suggestion"
            );


        if (!suggestion) {
            return;
        }


        const text =
            suggestion.textContent.trim();


        const ragActive =
            ragPanel.classList.contains(
                "active-panel"
            );


        if (ragActive) {

            ragInput.value = text;

            updateCounter(
                ragInput,
                ragCount
            );

            autoResize(ragInput);

            ragInput.focus();

        } else {

            basicInput.value = text;

            updateCounter(
                basicInput,
                basicCount
            );

            autoResize(basicInput);

            basicInput.focus();
        }

    }
);


/* =========================================================
   TEXTAREA AUTO RESIZE
========================================================= */

function autoResize(textarea) {

    textarea.style.height = "auto";

    textarea.style.height =
        Math.min(
            textarea.scrollHeight,
            140
        ) + "px";
}


basicInput.addEventListener(
    "input",
    () => {

        autoResize(basicInput);

        updateCounter(
            basicInput,
            basicCount
        );

    }
);


ragInput.addEventListener(
    "input",
    () => {

        autoResize(ragInput);

        updateCounter(
            ragInput,
            ragCount
        );

    }
);


/* =========================================================
   CHARACTER COUNTER
========================================================= */

function updateCounter(
    input,
    counter
) {

    counter.textContent =
        `${input.value.length} / 4000`;
}


/* =========================================================
   ENTER TO SEND
========================================================= */

[basicInput, ragInput].forEach(
    input => {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    input
                        .closest("form")
                        .requestSubmit();
                }

            }
        );

    }
);


/* =========================================================
   COPY
========================================================= */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

        showToast("Copied to clipboard");

    } catch {

        showToast(
            "Unable to copy"
        );

    }

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    toastText.textContent = message;

    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            1800
        );
}


/* =========================================================
   INITIALIZE
========================================================= */

updateCounter(
    basicInput,
    basicCount
);


updateCounter(
    ragInput,
    ragCount
);