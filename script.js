// State
import { irregularVerbs } from './irregular_verbs.js';

// --- Web Version: AdMob & Capacitor Removed ---


const state = {
    currentTextbook: null,
    currentGrade: null,
    selectedUnits: [],
    quizQuestions: [],
    wrongQuestions: [],
    currentQuestionIndex: 0,


    score: 0,
    score: 0,
    quizType: 'normal', // 'normal' | 'irregular_past' | 'irregular_pp'
    irregularMode: null, // 'past' | 'pp'
    quizCompletionCount: 0 // Counter for AdMob logic
};

// Mascot Messages
const mascotMessages = {
    unitSelection: [
        "Welcome back!",
        "Let's study!",
        "Are you ready?",
        "Consistency is power!",
        "Let's do this!"
    ],
    quiz: [
        "Focus!",
        "You can do it!",
        "Don't panic!",
        "Fight!",
        "Good luck!"
    ],
    correct: [
        "Great!",
        "Excellent!",
        "Keep it up!",
        "Correct!",
        "Amazing!",
        "Perfect!"
    ],
    wrong: [
        "Don't worry!",
        "You'll get it next time!",
        "Nice try!",
        "Don't give up!",
        "Mistakes help you learn!"
    ],
    result: [
        "Good job!",
        "You did great!",
        "Great effort!",
        "Try again soon!",
        "See you next time!"
    ]
};

// Helper to update mascot
function updateMascot(category) {
    const container = document.getElementById('mascot-container');
    const bubble = document.getElementById('mascot-speech-bubble');
    if (!container || !bubble) return;

    // Visibility Logic
    if (category === 'hide') {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    bubble.classList.remove('hidden'); // Always show bubble

    // Message Logic
    const msgs = mascotMessages[category] || mascotMessages['quiz'];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    bubble.textContent = msg;
}

// Global User Vars (Hoister for init)
let users = ['Guest'];
let currentUser = 'Guest';

// DOM Elements
const screens = {
    setup: document.getElementById('setup-screen'),
    unitSelection: document.getElementById('unit-selection-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen')
};

// --- Initialization & Setup ---
// --- Initialization & Setup ---
// --- Initialization & Setup ---
function init() {
    console.log("Initializing App...");
    try {
        loadUsers();
        loadState();
        setupEventListeners();
        
        // Initialize AdMob - REMOVED for Web
        // initAdMob();

        console.log("App Initialized Successfully");
    } catch (e) {
        alert("エラーが発生しました: " + e.message);
        console.error(e);
    }
}

// Ensure init runs even if DOMContentLoaded has already fired (common with modules/WebViews)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already ready
    init();
}

// Variable to track last touch time to prevent ghost clicks
let lastTouchTime = 0;

function setupEventListeners() {
    // Helper to handle interaction (touch or click) robustly
    const handleInteraction = (callback) => (e) => {
        // console.log(`Event: ${e.type} on ${e.currentTarget.tagName}`);
        if (e.type === 'touchstart') {
            lastTouchTime = Date.now();
            // We do NOT preventDefault here to allow scrolling, etc. 
            // unless we are sure. But for buttons, usually safe if we want to stop click.
            // However, some Android browsers ignore preventDefault on passive listeners.
            // So we rely on the timestamp check in click.
            // e.preventDefault(); 
            try {
                callback();
            } catch (err) {
                console.error("Error in touch handler:", err);
                alert("Error: " + err.message);
            }
        } else if (e.type === 'click') {
            // If this click is likely a ghost click from the previous touch (within 500ms), ignore it
            if (Date.now() - lastTouchTime < 500) {
                // console.log("Ignoring ghost click");
                return;
            }
            try {
                callback();
            } catch (err) {
                console.error("Error in click handler:", err);
                alert("Error: " + err.message);
            }
        }
    };

    // Textbook Selection
    document.querySelectorAll('.textbook-btn').forEach(btn => {
        const action = () => selectTextbook(btn.dataset.textbook);
        btn.addEventListener('click', handleInteraction(action));
        btn.addEventListener('touchstart', handleInteraction(action), { passive: true });
        // passing passive: true is better for performance, and we don't call preventDefault anymore
    });

    // Grade Selection
    document.querySelectorAll('.grade-btn').forEach(btn => {
        const action = () => selectGrade(btn.dataset.grade);
        btn.addEventListener('click', handleInteraction(action));
        btn.addEventListener('touchstart', handleInteraction(action), { passive: true });
    });

    // Navigation
    document.getElementById('back-to-setup').addEventListener('click', () => {
        showScreen('setup');
    });

    document.getElementById('goto-unit-btn').addEventListener('click', () => {
        renderUnitSelection();
        showScreen('unitSelection');
    });

    // Removed duplicate listener for back-to-setup

    document.getElementById('start-choice-btn').addEventListener('click', () => startQuiz('choice'));
    document.getElementById('start-sort-btn').addEventListener('click', () => startQuiz('sort'));
    document.getElementById('quit-quiz-btn').addEventListener('click', () => {
        // Reset quiz state logic here if needed, or just go back
        showScreen('unitSelection');
    });
    document.getElementById('audio-btn').addEventListener('click', playCurrentWordAudio);
    
    // Reset Sort Button
    const resetBtn = document.getElementById('reset-sort-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
             if (typeof resetSort === 'function') resetSort();
        });
    }

    // Result
    document.getElementById('retry-btn').addEventListener('click', () => {
        if (state.lastQuizType) startQuiz(state.lastQuizType);
        else showScreen('unitSelection'); // Fallback
    });
    document.getElementById('back-to-units-btn').addEventListener('click', () => showScreen('unitSelection'));

    // --- Cycle 9: Footer & User Listeners ---
    document.getElementById('nav-calendar-btn').addEventListener('click', () => {
        renderCalendar(new Date());
        toggleModal('calendar-modal', true);
    });

    document.getElementById('close-calendar-modal').addEventListener('click', () => toggleModal('calendar-modal', false));
    window.addEventListener('click', (e) => {
        if (e.target.id === 'calendar-modal') toggleModal('calendar-modal', false);
    });

    document.getElementById('prev-month-btn').addEventListener('click', () => offsetCalendarMonth(-1));
    document.getElementById('next-month-btn').addEventListener('click', () => offsetCalendarMonth(1));

    document.getElementById('nav-user-btn').addEventListener('click', (e) => {
        // Toggle user menu
        const menu = document.getElementById('user-menu-popup');
        menu.classList.toggle('hidden');
        e.stopPropagation(); // prevent window click from closing immediately logic if implemented
    });

    // Close user menu if clicked outside
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.user-nav-container')) {
            document.getElementById('user-menu-popup').classList.add('hidden');
        }
    });

    document.getElementById('add-new-user-btn').addEventListener('click', addNewUser);

    document.getElementById('nav-stats-btn').addEventListener('click', () => {
        renderStats();
        showScreen('statsScreen');
    });

    // Usage Guide (Cycle 11)
    const usageBtn = document.getElementById('usage-guide-btn');
    if (usageBtn) {
        usageBtn.addEventListener('click', () => toggleModal('usage-modal', true));
    }
    const closeUsageBtn = document.getElementById('close-usage-btn');
    if (closeUsageBtn) {
        closeUsageBtn.addEventListener('click', () => toggleModal('usage-modal', false));
    }
    document.getElementById('back-from-stats').addEventListener('click', () => {
        // Return to unit selection usually? Or last screen. 
        // User asked for "Back" button.
        showScreen('unitSelection');
    });

    // Irregular Verb Buttons
    document.getElementById('challenge-past-btn').addEventListener('click', () => startIrregularQuiz('past'));
    document.getElementById('challenge-pp-btn').addEventListener('click', () => startIrregularQuiz('pp'));


    document.getElementById('stats-textbook-select').addEventListener('change', renderStats);
    document.getElementById('stats-grade-select').addEventListener('change', renderStats);

    // Reset Stats Button
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', resetStudyRecord);
    }

    // --- Print Feature Listeners ---
    document.getElementById('nav-print-btn').addEventListener('click', () => {
        toggleModal('print-modal', true);
    });
    document.getElementById('close-print-modal').addEventListener('click', () => {
        toggleModal('print-modal', false);
    });
    // New Explicit Close Button
    const closeMainBtn = document.getElementById('close-print-btn-main');
    if (closeMainBtn) {
        closeMainBtn.addEventListener('click', () => toggleModal('print-modal', false));
    }

    document.getElementById('print-past-btn').addEventListener('click', () => renderPrintContent('past'));
    document.getElementById('print-pp-btn').addEventListener('click', () => renderPrintContent('pp'));
    document.getElementById('print-unit-btn').addEventListener('click', () => renderPrintContent('unit'));

    // Mascot Interaction
    const mascotImg = document.getElementById('mascot-img');
    if (mascotImg) {
        mascotImg.addEventListener('click', () => {
            const bubble = document.getElementById('mascot-speech-bubble');
            const messages = ["がんばれ！", "Good luck!", "You can do it!", "Keep going!", "One more!"];
            const msg = messages[Math.floor(Math.random() * messages.length)];
            
            if (bubble) {
                bubble.textContent = msg;
                bubble.classList.remove('hidden');
                setTimeout(() => {
                    bubble.classList.add('hidden');
                }, 3000);
            }
        });
    }
    // Initial hiding handled by CSS/HTML default
}

// --- Navigation Logic ---
function showScreen(screenName) {
    const screensMap = {
        setup: document.getElementById('setup-screen'),
        unitSelection: document.getElementById('unit-selection-screen'),
        quiz: document.getElementById('quiz-screen'),
        result: document.getElementById('result-screen'),
        statsScreen: document.getElementById('stats-screen') // New
    };

    // Mascot Visibility & Message
    if (screenName === 'setup') {
        updateMascot('hide');
    } else if (screenName === 'unitSelection') {
        updateMascot('unitSelection');
    } else if (screenName === 'quiz') {
        updateMascot('quiz');
    } else if (screenName === 'result') {
        updateMascot('result');
    } else if (screenName === 'statsScreen') {
        updateMascot('hide');
    }

    Object.values(screensMap).forEach(s => {
        if (s) {
            s.classList.remove('active');
            s.classList.add('hidden');
        }
    });

    if (screensMap[screenName]) {
        screensMap[screenName].classList.remove('hidden');
        screensMap[screenName].classList.add('active');
    }
}

function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

// --- User Management ---


function loadUsers() {
    const storedUsers = localStorage.getItem('sakusaku_users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    } else {
        users = ['Guest'];
        localStorage.setItem('sakusaku_users', JSON.stringify(users));
    }

    const storedCurrent = localStorage.getItem('sakusaku_current_user');
    if (storedCurrent && users.includes(storedCurrent)) {
        currentUser = storedCurrent;
    } else {
        currentUser = 'Guest';
        localStorage.setItem('sakusaku_current_user', currentUser);
    }

    updateUserUI();
    renderUserList();
}

function updateUserUI() {
    document.getElementById('current-user-name').textContent = currentUser;
}

function renderUserList() {
    const list = document.getElementById('user-list');
    list.innerHTML = '';
    users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u;
        if (u === currentUser) li.classList.add('current');

        // Click to switch
        li.addEventListener('click', (e) => {
            // If long press triggered, don't switch
            if (li.dataset.longPressTriggered === 'true') {
                li.dataset.longPressTriggered = 'false';
                return;
            }
            switchUser(u);
        });

        // Long Press Logic for Deletion
        let pressTimer;
        const startPress = () => {
            if (u === 'Guest') return; // Guest is protected
            pressTimer = setTimeout(() => {
                li.dataset.longPressTriggered = 'true';
                if (confirm(`${u} さんのアカウントを削除しますか？`)) {
                    deleteUser(u);
                }
            }, 1000); // 1 second
        };

        const cancelPress = () => {
            if (pressTimer) clearTimeout(pressTimer);
        };

        li.addEventListener('mousedown', startPress);
        li.addEventListener('touchstart', startPress);
        li.addEventListener('mouseup', cancelPress);
        li.addEventListener('mouseleave', cancelPress);
        li.addEventListener('touchend', cancelPress);
        li.addEventListener('touchmove', cancelPress); // Cancel if scrolling

        list.appendChild(li);
    });
}

function deleteUser(userName) {
    if (userName === 'Guest') return; // Double check

    // Remove from array
    users = users.filter(user => user !== userName);
    saveUsers();

    // If deleted user was active, switch to Guest
    if (currentUser === userName) {
        switchUser('Guest');
    } else {
        renderUserList(); // Just re-render list
    }
}

function switchUser(name) {
    currentUser = name;
    localStorage.setItem('sakusaku_current_user', currentUser);
    updateUserUI();
    renderUserList();
    document.getElementById('user-menu-popup').classList.add('hidden');

    // Reload State for this user
    loadState();
    // Maybe go back to setup?
    showScreen('setup');
    alert(`${currentUser} さんに切り替えました。`);
}

function addNewUser() {
    const name = prompt("新しいユーザー名を入力してください:");
    if (name && name.trim()) {
        if (users.includes(name)) {
            alert("その名前は既に存在します。");
            return;
        }
        users.push(name);
        localStorage.setItem('sakusaku_users', JSON.stringify(users));
        switchUser(name);
    }
}

// --- Selection Logic ---
// ... (Previous Selection Logic is fine, just need to ensure saveState uses currentUser)

// --- Persistence Overrides ---
function saveState() {
    if (!currentUser) return;
    const dataToSave = {
        currentTextbook: state.currentTextbook,
        currentGrade: state.currentGrade,
        selectedUnits: state.selectedUnits
    };
    localStorage.setItem(`sakusaku_state_${currentUser}`, JSON.stringify(dataToSave));
}

function loadState() {
    // Reset defaults first
    state.currentTextbook = null;
    state.currentGrade = null;
    state.selectedUnits = [];

    // Reset UI
    document.querySelectorAll('.textbook-btn, .grade-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('grade-selection').classList.add('hidden');
    updateGotoButton();

    if (!currentUser) loadUsers(); // Ensure users loaded

    const saved = localStorage.getItem(`sakusaku_state_${currentUser}`);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);

            // Restore context
            if (parsed.currentTextbook) selectTextbook(parsed.currentTextbook);
            if (parsed.currentGrade) selectGrade(parsed.currentGrade);

            // Restore selections
            state.selectedUnits = parsed.selectedUnits || [];

            // Refreshes checkboxes if on unit screen, but we might be on setup
            // We'll rely on renderUnitSelection called by user navigation
        } catch (e) {
            console.error("Failed to load user state", e);
        }
    }
}

// --- Activity & Progress Tracking ---
function saveActivityCount(count) {
    if (!currentUser) return;
    const key = `sakusaku_activity_${currentUser}`;
    // Fix: Use local time instead of UTC to avoid date shift
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    let data = JSON.parse(localStorage.getItem(key) || '{}');

    data[today] = (data[today] || 0) + count;
    localStorage.setItem(key, JSON.stringify(data));
}

function saveProgress(unitIndex, mode, wordEn) {
    if (!currentUser || !state.currentTextbook || !state.currentGrade) return;

    const key = `sakusaku_progress_${currentUser}`;
    let data = JSON.parse(localStorage.getItem(key) || '{}');
    const unitKey = `${state.currentTextbook}_${state.currentGrade}_${unitIndex}`;

    // Ensure structure
    if (!data[unitKey]) data[unitKey] = { choice: [], sort: [], tried_choice: [], tried_sort: [] };

    // Support migration for existing data without tried_ arrays
    if (!data[unitKey].tried_choice) data[unitKey].tried_choice = [];
    if (!data[unitKey].tried_sort) data[unitKey].tried_sort = [];

    const modeKey = (mode === 'choice') ? 'choice' : 'sort';

    // Add to Cleared List
    if (!data[unitKey][modeKey].includes(wordEn)) {
        data[unitKey][modeKey].push(wordEn);
    }

    // Add to Tried List (Implicit)
    const triedKey = `tried_${modeKey}`;
    if (!data[unitKey][triedKey].includes(wordEn)) {
        data[unitKey][triedKey].push(wordEn);
    }

    localStorage.setItem(key, JSON.stringify(data));
}

function saveAttempt(unitIndex, mode, wordEn) {
    if (!currentUser || !state.currentTextbook || !state.currentGrade) return;

    const key = `sakusaku_progress_${currentUser}`;
    let data = JSON.parse(localStorage.getItem(key) || '{}');
    const unitKey = `${state.currentTextbook}_${state.currentGrade}_${unitIndex}`;

    if (!data[unitKey]) data[unitKey] = { choice: [], sort: [], tried_choice: [], tried_sort: [] };
    if (!data[unitKey].tried_choice) data[unitKey].tried_choice = [];
    if (!data[unitKey].tried_sort) data[unitKey].tried_sort = [];

    const modeKey = (mode === 'choice') ? 'choice' : 'sort';
    const triedKey = `tried_${modeKey}`;

    if (!data[unitKey][triedKey].includes(wordEn)) {
        data[unitKey][triedKey].push(wordEn);
        localStorage.setItem(key, JSON.stringify(data));
    }
}

function saveAttemptCount(unitIndex, wordEn) {
    if (!currentUser || !state.currentTextbook || !state.currentGrade) return;

    // Key for attempts: sakusaku_attempts_USERNAME
    const key = `sakusaku_attempts_${currentUser}`;
    let data = JSON.parse(localStorage.getItem(key) || '{}');
    
    // Unique key for the word instance: TEXTBOOK_GRADE_UNIT_WORD
    const wordKey = `${state.currentTextbook}_${state.currentGrade}_${unitIndex}_${wordEn}`;
    
    data[wordKey] = (data[wordKey] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(data));
}

function getAttemptCount(unitIndex, wordEn) {
     if (!currentUser || !state.currentTextbook || !state.currentGrade) return 0;
     
     const key = `sakusaku_attempts_${currentUser}`;
     const data = JSON.parse(localStorage.getItem(key) || '{}');
     const wordKey = `${state.currentTextbook}_${state.currentGrade}_${unitIndex}_${wordEn}`;
     
     return data[wordKey] || 0;
}

// --- Calendar Logic ---
let calendarDate = new Date();

function offsetCalendarMonth(offset) {
    calendarDate.setDate(1); // Fix: Set to 1st to prevent month skip on 31st
    calendarDate.setMonth(calendarDate.getMonth() + offset);
    renderCalendar(calendarDate);
}

function renderCalendar(date) {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('calendar-month-label');
    if (!grid || !label) return;

    grid.innerHTML = '';

    const year = date.getFullYear();
    const month = date.getMonth();
    label.textContent = `${year}年 ${month + 1}月`;

    // Get activity data
    const key = `sakusaku_activity_${currentUser}`;
    const activity = JSON.parse(localStorage.getItem(key) || '{}');
    
    // Fix: Use local time for todayStr
    const now = new Date();
    const tYear = now.getFullYear();
    const tMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const tDay = now.getDate().toString().padStart(2, '0');
    const todayStr = `${tYear}-${tMonth}-${tDay}`;

    // Days calc
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun

    const days = ['日', '月', '火', '水', '木', '金', '土'];
    days.forEach(d => {
        const div = document.createElement('div');
        div.className = 'calendar-cell calendar-header';
        div.textContent = d;
        grid.appendChild(div);
    });

    // Empties
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-cell';
        grid.appendChild(div);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const div = document.createElement('div');
        div.className = 'calendar-cell';

        const dStr = d.toString().padStart(2, '0');
        const mStr = (month + 1).toString().padStart(2, '0');
        const fullDate = `${year}-${mStr}-${dStr}`;

        div.innerHTML = `<div class="calendar-day-num">${d}</div>`;

        if (activity[fullDate]) {
            div.innerHTML += `<div class="calendar-count">${activity[fullDate]}</div>`;
            div.style.backgroundColor = '#e8f5e9'; // Light green
        }

        if (fullDate === todayStr) {
            div.classList.add('calendar-today');
        }

        grid.appendChild(div);
    }
}

// --- Stats Logic ---
function renderStats() {
    try {
        console.log("renderStats called");
        const textbookSelect = document.getElementById('stats-textbook-select');
        const gradeSelect = document.getElementById('stats-grade-select');

        let textbook = textbookSelect.value;
        let grade = gradeSelect.value;

        // If not set in select (e.g. empty?), fallback to state or defaults
        if (!textbook) textbook = state.currentTextbook || 'new_crown';
        if (!grade) grade = state.currentGrade || '1';

        console.log(`Stats for: ${textbook} ${grade}`);

        // Update selectors to match what we are showing
        textbookSelect.value = textbook;
        gradeSelect.value = grade;

        const container = document.getElementById('stats-content');
        if (!container) {
            console.error("stats-content container not found");
            return;
        }
        container.innerHTML = '';

        if (typeof vocabularyData === 'undefined') {
            container.innerHTML = '<p>データが見つかりません (vocabularyData missing)</p>';
            return;
        }

        if (!vocabularyData[textbook]) {
            container.innerHTML = `<p>データがありません (Textbook: ${textbook} not found)</p>`;
            return;
        }

        if (!vocabularyData[textbook][grade]) {
            container.innerHTML = `<p>データがありません (Grade: ${grade} not found)</p>`;
            return;
        }

        // Get Progress Data
        const key = `sakusaku_progress_${currentUser}`;
        let progressData;
        try {
            progressData = JSON.parse(localStorage.getItem(key) || '{}');
        } catch (e) {
            console.error("Error parsing progress data", e);
            progressData = {};
        }

        const units = vocabularyData[textbook][grade];

        units.forEach((unit, idx) => {
            const card = document.createElement('div');
            card.className = 'stats-card';

            const unitKey = `${textbook}_${grade}_${idx}`;
            const unitProgress = progressData[unitKey] || { choice: [], sort: [] };

            // Calculate %
            const totalWords = unit.words ? unit.words.length : 0;
            const choiceCount = (unitProgress.choice && Array.isArray(unitProgress.choice)) ? unitProgress.choice.length : 0;
            const sortCount = (unitProgress.sort && Array.isArray(unitProgress.sort)) ? unitProgress.sort.length : 0;

            const choicePct = totalWords > 0 ? (choiceCount / totalWords * 100).toFixed(0) : 0;
            const sortPct = totalWords > 0 ? (sortCount / totalWords * 100).toFixed(0) : 0;

            card.innerHTML = `
                <div class="stats-unit-title">${unit.unit}</div>
                
                <div class="progress-row">
                    <div class="progress-label">三択</div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${choicePct}%"></div>
                    </div>
                    <div class="progress-text">${choicePct}%</div>
                </div>
                
                <div class="progress-row">
                    <div class="progress-label">並べ替え</div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill sort" style="width: ${sortPct}%"></div>
                    </div>
                    <div class="progress-text">${sortPct}%</div>
                </div>
            `;

            container.appendChild(card);
        });

         // --- Render Irregular Verb Stats ---
        const irregCard = document.createElement('div');
        irregCard.className = 'stats-card';
        irregCard.style.marginTop = '1rem';
        irregCard.style.border = '2px solid var(--accent-color)';

        const irregKey = `sakusaku_irregular_progress_${currentUser}`;
        const irregData = JSON.parse(localStorage.getItem(irregKey) || '{ "past": [], "pp": [] }');
        
        const totalIrreg = irregularVerbs.length;
        const pastCount = (irregData.past || []).length;
        const ppCount = (irregData.pp || []).length;
        
        const pastPct = (pastCount / totalIrreg * 100).toFixed(0);
        const ppPct = (ppCount / totalIrreg * 100).toFixed(0);

        irregCard.innerHTML = `
            <div class="stats-unit-title" style="color: var(--accent-color);">不規則動詞 (Irregular Verbs)</div>
            
            <div class="progress-row">
                <div class="progress-label">過去形</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill sort" style="width: ${pastPct}%"></div>
                </div>
                <div class="progress-text">${pastPct}%</div>
            </div>
            
             <div class="progress-row">
                <div class="progress-label">過去分詞</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill sort" style="width: ${ppPct}%"></div>
                </div>
                <div class="progress-text">${ppPct}%</div>
            </div>
        `;
        container.appendChild(irregCard);


        console.log("renderStats completed");
    } catch (e) {
        console.error("Error in renderStats:", e);
        const container = document.getElementById('stats-content');
        if (container) container.innerHTML = `<p>エラーが発生しました: ${e.message}</p>`;
        alert("学習記録の表示中にエラーが発生しました。\n" + e.message);
    }
}

function resetStudyRecord() {
    if (!currentUser) return;
    if (confirm("記録をリセットしますか？")) {
        // Keys to remove
        const keysToRemove = [
            `sakusaku_progress_${currentUser}`,
            `sakusaku_activity_${currentUser}`,
            `sakusaku_attempts_${currentUser}`,
            `sakusaku_irregular_progress_${currentUser}`
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));

        alert("学習記録をリセットしました。");
        renderStats(); // Re-render to show empty state
        renderCalendar(new Date()); // Update calendar if it was cached/showing
    }
}

// --- Update Quiz Answer Check to Save Progress ---
// We need to inject logic into checkAnswerChoice and checkAnswerSort
// Since we are replacing the bottom of the file, we should overwrite them if possible
// or append modified versions. 
// Since replace_file_content replaces a block, let's redefine them here if the previous block included them.
// Wait, the previous block I replaced ended at line 676 (end of file).
// But checkAnswerChoice start at line 539. 
// So I need to include those functions in my replacement OR use multi_replace to target them specifically.
// The current replacement targets line 65-676... wait.
// My TargetContent in the previous tool call was based on lines 65-71, the event listeners.
// So I am replacing everything from setupEventListeners downwards!
// That's HUGE. `checkAnswerChoice` is part of that.
// I MUST ensure I include `checkAnswerChoice` and `checkAnswerSort` logic in this replacement or else I lose the quiz logic!

// ... REWRITING CHECK ANSWERS TO INCLUDE SAVING ...

function checkAnswerChoice(btn, selectedAnswer, question) {
    const feedbackArea = document.getElementById('feedback-area');
    const msg = document.getElementById('feedback-message');
    const expl = document.getElementById('feedback-explanation');
    const nextBtn = document.getElementById('next-question-btn');

    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

    if (selectedAnswer === question.answer) {
        btn.classList.add('correct');
        msg.textContent = '正解！ Correct!';
        msg.style.color = 'var(--primary-color)';
        state.score++;
        playAudio(true);

        // Save Progress
        saveActivityCount(1);
        saveProgress(question.correctWord.unitIndex, 'choice', question.correctWord.en);
        saveAttemptCount(question.correctWord.unitIndex, question.correctWord.en);
        
        updateMascot('correct');
    } else {
        btn.classList.add('wrong');
        document.querySelectorAll('.choice-btn').forEach(b => {
            if (b.textContent === question.answer) b.classList.add('correct');
        });
        msg.textContent = '残念... Wrong!';
        msg.style.color = 'var(--error-color)';
        
        // Add to wrong questions list for review
        // Ensure question has type 'choice'
        if (!question.type) question.type = 'choice'; 
        state.wrongQuestions.push(question);

        // Save activity count
        saveActivityCount(1);
        saveAttemptCount(question.correctWord.unitIndex, question.correctWord.en);
        
        updateMascot('wrong');
    }

    expl.textContent = `${question.correctWord.en} = ${question.correctWord.jp}`;
    feedbackArea.classList.remove('hidden');
    nextBtn.onclick = nextQuestion;
}

function checkAnswerSort(question) {
    const feedbackArea = document.getElementById('feedback-area');
    const msg = document.getElementById('feedback-message');
    const expl = document.getElementById('feedback-explanation');
    const nextBtn = document.getElementById('next-question-btn');
    const actionBtn = document.getElementById('sort-answer-btn');

    let constructed = '';
    const answerStr = question.answer;
    for (let i = 0; i < answerStr.length; i++) {
        if (answerStr[i] === ' ') constructed += ' ';
        else {
            const item = state.sortCurrentState[i];
            constructed += item ? item.char : '_';
        }
    }

    const isCorrect = constructed === question.answer;
    actionBtn.style.display = 'none';

    if (isCorrect) {
        msg.textContent = '正解！ Perfect!';
        msg.style.color = 'var(--primary-color)';
        state.score++;

        saveActivityCount(1);
        
        if (state.quizType.startsWith('irregular')) {
             saveIrregularProgress(state.irregularMode, question.correctWord.base);
             saveIrregularAttemptCount(state.irregularMode, question.correctWord.base);
        } else {
             saveProgress(question.correctWord.unitIndex, 'sort', question.correctWord.en);
             saveAttemptCount(question.correctWord.unitIndex, question.correctWord.en);
        }
        
        updateMascot('correct');
    } else {
        msg.textContent = `正解は: ${question.answer}`;
        msg.style.color = 'var(--error-color)';
        
        // Add to wrong questions list for review
        // Ensure question has type 'sort'
        if (!question.type) question.type = 'sort';
        state.wrongQuestions.push(question);

        saveActivityCount(1);
        
        if (state.quizType.startsWith('irregular')) {
             saveIrregularAttemptCount(state.irregularMode, question.correctWord.base);
        } else {
             saveAttemptCount(question.correctWord.unitIndex, question.correctWord.en);
        }
        
        updateMascot('wrong');
    }

    // Fix for Irregular Verbs (undefined en)
    let displayEn = question.correctWord.en;
    if (!displayEn) {
        displayEn = question.answer;
        if (question.correctWord.base) {
             displayEn += ` (${question.correctWord.base})`;
        }
    }

    expl.textContent = `${displayEn} = ${question.correctWord.jp}`;
    feedbackArea.classList.remove('hidden');
    nextBtn.onclick = nextQuestion;
}

function startIrregularQuiz(mode) { // 'past' or 'pp'
    state.quizType = (mode === 'past') ? 'irregular_past' : 'irregular_pp';
    state.irregularMode = mode;
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.wrongQuestions = [];
    state.quizMode = 'sort'; // For resetSort logic

    // Show Reset Button
    document.getElementById('reset-sort-btn').classList.remove('hidden');

    // Get Progress
    const key = `sakusaku_irregular_progress_${currentUser}`;
    const progress = JSON.parse(localStorage.getItem(key) || '{ "past": [], "pp": [] }');
    const clearedList = progress[mode] || [];
    
    // Partition: Unseen > Cleared (We treat all seen as cleared for irregulars simplified? 
    // Wait, irregulars don't have separate "tried" list in current logic, only "cleared".
    // If not cleared, it's unseen OR wrong. 
    // Current logic just checks if in clearedList.
    
    const unseen = [];
    const cleared = [];
    
    irregularVerbs.forEach(v => {
        if (clearedList.includes(v.base)) cleared.push(v);
        else unseen.push(v);
    });

    // Sort cleared by attempts
    const attemptKey = `sakusaku_irregular_attempts_${currentUser}`;
    const attemptsData = JSON.parse(localStorage.getItem(attemptKey) || '{}');
    
    // Sort Cleared by Attempts (ASC), then Random
    const shuffledCleared = shuffleArray(cleared);
    shuffledCleared.sort((a, b) => {
        const countA = attemptsData[`${mode}_${a.base}`] || 0;
        const countB = attemptsData[`${mode}_${b.base}`] || 0;
        return countA - countB;
    });

    // Priority: Unseen (Random) > Cleared (Low Attempts)
    // Note: Irregular doesn't track "Wrong" separately in persistence yet (just not cleared).
    // So "Unseen" includes ones you might have failed before but didn't clear.
    // That satisfies "Not generated" > "Others".
    
    const candidates = [...shuffleArray(unseen), ...shuffledCleared];
    const selectedVerbs = candidates.slice(0, 10);

    if (selectedVerbs.length === 0) return;

    state.quizQuestions = selectedVerbs.map(verb => {
        const questionText = (mode === 'past') ? `${verb.base} の過去形は？` : `${verb.base} の過去分詞は？`;
        const answerText = (mode === 'past') ? verb.past : verb.pp;
        
        return createIrregularSortQuestion(verb, questionText, answerText);
    });

    showScreen('quiz');
    renderQuestion();
}

function createIrregularSortQuestion(verb, questionText, answerText) {
    // Mimic createType2Question structure
    const sortableRegex = /[a-zA-Z0-9']/;
    const shuffleableChars = [];
    for (let i = 0; i < answerText.length; i++) {
        const char = answerText[i];
        if (char !== ' ' && sortableRegex.test(char)) {
            shuffleableChars.push(char);
        }
    }

    return {
        type: 'sort',
        question: questionText,
        answer: answerText,
        correctWord: verb, // Contains base, past, pp, jp
        chars: shuffleArray(shuffleableChars)
    };
}

function saveIrregularProgress(mode, baseWord) {
    if (!currentUser) return;
    const key = `sakusaku_irregular_progress_${currentUser}`;
    const data = JSON.parse(localStorage.getItem(key) || '{ "past": [], "pp": [] }');
    
    if (!data[mode]) data[mode] = [];
    if (!data[mode].includes(baseWord)) {
        data[mode].push(baseWord);
        localStorage.setItem(key, JSON.stringify(data));
    }
}

function saveIrregularAttemptCount(mode, baseWord) {
    if (!currentUser) return;
    const key = `sakusaku_irregular_attempts_${currentUser}`;
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    const wordKey = `${mode}_${baseWord}`;
    
    data[wordKey] = (data[wordKey] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(data));
}


// --- Selection Logic ---
function selectTextbook(textbook) {


    console.log(`[Debug] selectTextbook called with: ${textbook}`);
    state.currentTextbook = textbook;

    // update UI for selection
    const buttons = document.querySelectorAll('.textbook-btn');
    buttons.forEach(b => b.classList.remove('selected'));

    const targetBtn = document.querySelector(`.textbook-btn[data-textbook="${textbook}"]`);
    if (targetBtn) {
        targetBtn.classList.add('selected');
        console.log(`[Debug] Selected class added to button for ${textbook}`);
    } else {
        alert(`Error: Button not found for ${textbook}`);
        console.error(`[Debug] Button not found for ${textbook}`);
    }

    // Show grade selection
    const gradeSelection = document.getElementById('grade-selection');
    if (gradeSelection) {
        gradeSelection.classList.remove('hidden');
        // alert("DEBUG: Grade selection should be visible now");
        console.log("[Debug] grade-selection block unhidden");
    } else {
        alert("Error: Grade selection element not found!");
        console.error("[Debug] grade-selection element not found!");
    }

    updateGotoButton();
    try {
        saveState();
        console.log("[Debug] State saved");
    } catch (e) {
        console.error("[Debug] Error saving state:", e);
        alert("Error saving state: " + e.message);
    }
}

function selectGrade(grade) {
    state.currentGrade = grade;

    document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`.grade-btn[data-grade="${grade}"]`).classList.add('selected');

    // Auto-nav removed in Cycle 4
    // renderUnitSelection();
    // showScreen('unitSelection');
    updateGotoButton();
    saveState();
}

function updateGotoButton() {
    const btn = document.getElementById('goto-unit-btn');
    if (state.currentTextbook && state.currentGrade) {
        btn.disabled = false;
    } else {
        btn.disabled = true;
    }
}

// --- Unit Selection Render ---
function renderUnitSelection() {
    const container = document.getElementById('units-container');
    container.innerHTML = '';

    const units = vocabularyData[state.currentTextbook][state.currentGrade];

    if (!units || units.length === 0) {
        container.innerHTML = '<p>データがありません</p>';
        return;
    }

    units.forEach((unitData, index) => {
        const id = `unit-${index}`;
        const label = document.createElement('label');
        label.className = 'unit-checkbox-label';

        // Compact structure: [Checkbox] [Lesson Name + (Page)]
        // We merged unitInfoDiv logic essentially. 
        // Just append checkbox then text node directly to label is simpler for flex.

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = index;

        if (state.selectedUnits && state.selectedUnits.includes(index)) {
            checkbox.checked = true;
        }

        checkbox.addEventListener('change', () => {
            updateStartButton();
            saveState();
        });

        label.appendChild(checkbox);

        // Wrap text in a span for better control if needed, or just text node
        const textSpan = document.createElement('span');
        textSpan.className = 'unit-text';
        textSpan.textContent = unitData.unit;

        if (unitData.pages) {
            const pageSpan = document.createElement('span');
            pageSpan.className = 'unit-pages';
            pageSpan.textContent = ` (${unitData.pages})`;
            textSpan.appendChild(pageSpan);
        }

        label.appendChild(textSpan);

        container.appendChild(label);
    });

    updateStartButton();
}

function updateStartButton() {
    const checkboxes = document.querySelectorAll('#units-container input:checked');
    const btnChoice = document.getElementById('start-choice-btn');
    const btnSort = document.getElementById('start-sort-btn');

    // Update state for saving
    state.selectedUnits = Array.from(checkboxes).map(cb => parseInt(cb.value));

    const count = checkboxes.length;
    const isDisabled = count === 0;

    btnChoice.disabled = isDisabled;
    btnSort.disabled = isDisabled;

    // Calculate total words
    let totalWords = 0;
    if (vocabularyData[state.currentTextbook] && vocabularyData[state.currentTextbook][state.currentGrade]) {
        state.selectedUnits.forEach(unitIndex => {
            const unit = vocabularyData[state.currentTextbook][state.currentGrade][unitIndex];
            if (unit) totalWords += unit.words.length;
        });
    }

    // Update Word Count Display
    const wordCountDisplay = document.getElementById('total-words-display');
    if (wordCountDisplay) {
        wordCountDisplay.textContent = `${totalWords} 単語`; // "xx Words"
    }

    // Buttons text (no suffix needed now)
    btnChoice.textContent = `三択に挑戦`;
    btnSort.textContent = `並べ替えに挑戦`;
}

// --- Persistence ---
// (Old saveState removed)

// (Old loadState removed)

// --- Quiz Logic ---
function startQuiz(quizType) { // 'choice' or 'sort'
    const selectedUnitsCols = Array.from(document.querySelectorAll('#units-container input:checked'))
        .map(input => parseInt(input.value));

    if (selectedUnitsCols.length === 0) return;

    state.quizMode = quizType; // 'choice' or 'sort'
    state.quizType = 'normal'; // Fix: Start normal quiz, explicitly reset this!

    // Show/Hide Reset Button
    const resetBtn = document.getElementById('reset-sort-btn');
    if (quizType === 'sort') {
        resetBtn.classList.remove('hidden');
    } else {
        resetBtn.classList.add('hidden');
    }

    // 1. Gather all candidate words
    const allWords = [];
    const unitsData = vocabularyData[state.currentTextbook][state.currentGrade];

    selectedUnitsCols.forEach(unitIndex => {
        const unitWords = unitsData[unitIndex].words.map(w => ({ ...w, unitIndex })); // add unitIndex to help finding distractors
        allWords.push(...unitWords);
    });

    if (allWords.length === 0) return;

    // 2. Select 10 questions (or all if < 10)
    const questionCount = Math.min(10, allWords.length);
    const shuffledWords = shuffleArray([...allWords]);

    // 3. Generate Question Objects
    // Cycle 12: Prioritization Logic
    // Order: New > Wrong (Tried but not cleared) > Cleared (Low Attempts > Random)

    // Load progress for sorting
    const key = `sakusaku_progress_${currentUser}`;
    const progress = JSON.parse(localStorage.getItem(key) || '{}');

    // Helper to get status
    const getStatus = (word) => {
        const unitKey = `${state.currentTextbook}_${state.currentGrade}_${word.unitIndex}`;
        const unitProg = progress[unitKey] || {};

        let isCleared = false;
        let isTried = false;

        if (quizType === 'choice') {
            isCleared = unitProg.choice && unitProg.choice.includes(word.en);
            isTried = unitProg.tried_choice && unitProg.tried_choice.includes(word.en);
        } else {
            isCleared = unitProg.sort && unitProg.sort.includes(word.en);
            isTried = unitProg.tried_sort && unitProg.tried_sort.includes(word.en);
        }

        if (!isTried) return 'new';
        if (isTried && !isCleared) return 'wrong';
        return 'cleared';
    };

    // Partition
    const newWords = [];
    const wrongWords = [];
    const clearedWords = [];

    shuffledWords.forEach(w => {
        const status = getStatus(w);
        if (status === 'new') newWords.push(w);
        else if (status === 'wrong') wrongWords.push(w);
        else clearedWords.push(w);
    });

    // Sort Cleared words by attempt count
    // Note: clearedWords are already shuffled from the main shuffle
    // We just need to sort them stably by count
    clearedWords.sort((a, b) => {
        const countA = getAttemptCount(a.unitIndex, a.en);
        const countB = getAttemptCount(b.unitIndex, b.en);
        return countA - countB;
    });

    // Concatenate candidates
    // Priority: New > Wrong > Cleared(by attempts)
    const candidates = [...newWords, ...wrongWords, ...clearedWords];

    const selectedWords = candidates.slice(0, questionCount);

    state.quizQuestions = selectedWords.map(word => generateQuestionDisplay(word, unitsData, quizType));
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.wrongQuestions = []; // Reset wrong questions
    // Store type if needed for retry
    state.lastQuizType = quizType;

    showScreen('quiz');
    renderQuestion();
}

function startReviewQuiz() {
    if (state.wrongQuestions.length === 0) return;

    // Setup review state
    state.quizQuestions = shuffleArray([...state.wrongQuestions]);
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.wrongQuestions = []; // Reset for the review session itself? 
    // Yes, if they get it wrong AGAIN, it should be added back for yet another review if we wanted endless mode.
    // For now, let's clear it and accumulate new wrongs from this session.

    // Mode? Keep last mode.
    // But questions object already has 'type'. 
    // generateQuestionDisplay created objects with fixed 'type' (choice or sort).
    // Review should likely keep the SAME type as before to practice exactly what they missed.
    // The objects in wrongQuestions are fully formed question objects.
    // We just need to re-render them.

    showScreen('quiz');
    renderQuestion();
}

function generateQuestionDisplay(targetWord, unitsData, forceType) {
    // If forceType is provided, use it. Otherwise random (fallback)
    let type = 0;
    if (forceType === 'choice') type = 0;
    else if (forceType === 'sort') type = 1;
    else type = Math.random() < 0.5 ? 0 : 1;

    if (type === 0) {
        return createType1Question(targetWord, unitsData);
    } else {
        return createType2Question(targetWord);
    }
}

// Type 1: English -> Japanese (3 choices)
function createType1Question(targetWord, unitsData) {
    const distractors = getDistractors(targetWord, unitsData);
    const options = shuffleArray([targetWord.jp, ...distractors]);

    return {
        type: 'choice',
        question: targetWord.en,
        answer: targetWord.jp,
        correctWord: targetWord,
        options: options
    };
}

function getDistractors(targetWord, unitsData) { // Simplified distractor logic
    // Try to get words from same or nearby units
    let candidates = [];

    // Helper to get JP list from simple unit words
    const mapToJp = (words) => words
        .filter(w => w.en !== targetWord.en) // exclude self
        .filter(w => w.jp !== targetWord.jp) // exclude words with SAME meaning (Cycle 2 fix)
        .map(w => w.jp);

    // Look in the same unit first
    if (unitsData[targetWord.unitIndex]) {
        const unitWords = unitsData[targetWord.unitIndex].words;
        candidates = mapToJp(unitWords);
    }

    // If need more, look at other units in same grade
    if (candidates.length < 2) {
        unitsData.forEach((u, idx) => {
            if (idx === targetWord.unitIndex) return; // already checked
            candidates.push(...mapToJp(u.words));
        });
    }

    // De-duplicate candidates themselves
    candidates = [...new Set(candidates)];

    // Shuffle and pick 2
    candidates = shuffleArray(candidates);

    // If absolutely no other words (very edge case), use dummy
    if (candidates.length === 0) candidates = ["(誤答候補なし1)", "(誤答候補なし2)"];
    if (candidates.length === 1) candidates.push("(誤答候補なし)");

    return candidates.slice(0, 2);
}

// Type 2: Japanese -> English Sorting ( _ _ _ )
function createType2Question(targetWord) {
    // Advanced Sort Logic: Split by space, then identifying chunks
    // 1. Split by spaces first to get words/tokens
    const tokens = targetWord.en.split(/\s+/);

    const chars = [];
    const fixedIndices = []; // Indices in the reconstructed string that are fixed

    // We need to reconstruct the full string mapping for slots
    // "make ~ of" -> ['make', '~', 'of']
    // constructed: "make~of" (if no spaces? wait, logic uses spaces in answerStr)
    // The original logic iterated over answerStr chars.

    // New Strategy:
    // 1. Identify "Sortable Chunks". A chunk is a word or part of word consisting of [a-zA-Z0-9'].
    // 2. Identify "Fixed Chunks". Anything else.
    // 3. However, the display uses char-by-char slots. 
    //    If we want to support "make" as one block, that's a different feature (word sorting vs char sorting).
    //    The user asked: "make ~ of ..." -> answer column has "_ _ _ _ ～ _ _ …".
    //    This implies CHARACTER sorting is still the base, but some characters are pre-filled.

    //    So, we iterate the target string char by char.
    //    If char is alphanumeric (or apostrophe), it is shuffled.
    //    If char is symbol ( ~, …, ?, !, etc), it is fixed.

    const shuffleableChars = [];

    // Adjust regex as needed. keeping ' for "don't" etc.
    // What about "-"? "e-mail". Should "-" be fixed? Probably yes.
    // What about "."? "Mr.". "." is fixed? Yes.

    const sortableRegex = /[a-zA-Z0-9']/;

    for (let i = 0; i < targetWord.en.length; i++) {
        const char = targetWord.en[i];
        if (char === ' ') continue; // Spaces handled by slot logic

        if (sortableRegex.test(char)) {
            shuffleableChars.push(char);
        } else {
            // This is a fixed char (e.g. ~, ., ?, …)
            // We don't add to shuffleable list.
            // But we need to know its position? 
            // The `renderQuestion` logic iterates `answerStr`. 
            // We can determine fixed status dynamically there if we use the same regex.
        }
    }

    return {
        type: 'sort',
        question: targetWord.jp,
        answer: targetWord.en,
        correctWord: targetWord,
        chars: shuffleArray(shuffleableChars) // Only sortable chars in the pool
    };
}

// --- Quiz Rendering ---
function renderQuestion() {
    const question = state.quizQuestions[state.currentQuestionIndex];
    const container = document.getElementById('question-container');
    const textEl = document.getElementById('question-text');
    const sortArea = document.getElementById('sorting-area');
    const optionsGrid = document.getElementById('answer-options');
    const feedbackArea = document.getElementById('feedback-area');
    const audioBtn = document.getElementById('audio-btn');

    // Update counter
    document.getElementById('question-counter').textContent =
        `Question ${state.currentQuestionIndex + 1} / ${state.quizQuestions.length}`;

    // Reset areas
    sortArea.innerHTML = '';
    optionsGrid.innerHTML = '';
    feedbackArea.classList.add('hidden');
    textEl.style.color = 'var(--text-color)';

    // Audio button visibility
    // audioBtn.classList.remove('hidden'); 
    // Cycle 12: Enable Audio
    audioBtn.classList.remove('hidden');
    audioBtn.onclick = playCurrentWordAudio;

    if (question.type === 'choice') {
        textEl.textContent = question.question; // English word
        sortArea.classList.add('hidden');

        question.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => checkAnswerChoice(btn, opt, question));
            optionsGrid.appendChild(btn);
        });

    } else if (question.type === 'sort') {
        textEl.textContent = question.question; // Japanese word
        sortArea.classList.remove('hidden');

        const answerStr = question.answer;
        // Re-initialize state based on new fixed logic
        state.sortCurrentState = new Array(answerStr.length).fill(null);

        const sortableRegex = /[a-zA-Z0-9']/;

        for (let i = 0; i < answerStr.length; i++) {
            const char = answerStr[i];
            const slot = document.createElement('div');

            if (char === ' ') {
                slot.style.width = '20px'; // Space
            } else {
                slot.className = 'sort-slot';
                slot.dataset.index = i;

                if (!sortableRegex.test(char)) {
                    // Fixed Character
                    slot.classList.add('fixed-slot');
                    slot.textContent = char;
                    state.sortCurrentState[i] = { char, id: 'fixed', fixed: true };
                } else {
                    // Sortable Slot
                    slot.addEventListener('click', () => returnCharToPool(i));
                }
            }
            sortArea.appendChild(slot);
        }

        renderSortButtons(question);

        const actionBtn = document.createElement('button');
        actionBtn.id = 'sort-answer-btn';
        actionBtn.className = 'primary-btn';
        actionBtn.textContent = '回答する';
        actionBtn.addEventListener('click', () => checkAnswerSort(question));
        optionsGrid.appendChild(actionBtn);
    }
}

// --- Sorting Logic Helpers ---
function renderSortButtons(question) {
    const existingContainer = document.querySelector('.sort-options-container');
    if (existingContainer) existingContainer.remove();

    const container = document.createElement('div');
    container.className = 'sort-options-container options-grid';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '10px';
    container.style.justifyContent = 'center';

    question.chars.forEach((char, idx) => {
        const btn = document.createElement('button');
        btn.className = 'letter-chip';
        btn.textContent = char;
        btn.dataset.charId = idx;

        if (isCharUsed(idx)) {
            btn.classList.add('used');
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => useChar(char, idx, question));
        }

        container.appendChild(btn);
    });

    const parent = document.getElementById('answer-options');
    const actionBtn = document.getElementById('sort-answer-btn');
    parent.insertBefore(container, actionBtn);
}

function isCharUsed(charId) {
    return state.sortCurrentState.some(item => item && item.id === charId && !item.fixed);
}

function useChar(char, charId, question) {
    const answerStr = question.answer;
    let emptyIndex = -1;

    for (let i = 0; i < answerStr.length; i++) {
        // Skip spaces and filled slots (including fixed ones)
        if (answerStr[i] !== ' ' && state.sortCurrentState[i] === null) {
            emptyIndex = i;
            break;
        }
    }

    if (emptyIndex !== -1) {
        state.sortCurrentState[emptyIndex] = { char, id: charId };
        updateSortSlots();
        renderSortButtons(question);
    }
}

function returnCharToPool(slotIndex) {
    const item = state.sortCurrentState[slotIndex];
    if (item && !item.fixed) {
        state.sortCurrentState[slotIndex] = null;
        updateSortSlots();
        const question = state.quizQuestions[state.currentQuestionIndex];
        renderSortButtons(question);
    }
}

function resetSort() {
    // Safety check just in case
    if (!state || !state.quizMode) return;
    
    if (state.quizMode !== 'sort') return;
    
    // Clear all non-fixed slots
    state.sortCurrentState = state.sortCurrentState.map(item => {
        if (item && item.fixed) return item;
        return null;
    });
    updateSortSlots();
    const question = state.quizQuestions[state.currentQuestionIndex];
    renderSortButtons(question);
}





function updateSortSlots() {
    const slots = document.querySelectorAll('.sort-slot');
    slots.forEach(slot => {
        const idx = parseInt(slot.dataset.index);
        const item = state.sortCurrentState[idx];
        // Don't overwrite fixed slots if we treat them as immutable text content in DOM
        // But our render logic sets textContent based on state, so it's fine.
        slot.textContent = item ? item.char : '';
    });
}




function nextQuestion() {
    state.currentQuestionIndex++;
    if (state.currentQuestionIndex < state.quizQuestions.length) {
        renderQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    showScreen('result');
    // Dynamic denominator
    const total = state.quizQuestions.length;
    // We update the entire HTML to avoid losing the ID reference for potential future selects, 
    // or just rely on this one update.
    const scoreDisplay = document.querySelector('.score-display');
    scoreDisplay.innerHTML = `<span id="score-count">${state.score}</span> / ${total}`;

    const msg = document.getElementById('score-message');
    const wrongSection = document.getElementById('wrong-answer-section');
    const wrongList = document.getElementById('wrong-questions-list');
    const startReviewBtn = document.getElementById('start-review-btn');

    // Message Logic
    if (state.score === total) {
        msg.textContent = "Great Job!! 満点！";
        wrongSection.classList.add('hidden'); // No wrong answers
        updateMascot('correct'); // Extra praise
    } else {
        if (state.score >= total * 0.8) msg.textContent = "Good!! あと少し！";
        else msg.textContent = "Fight!! 次はがんばろう！";

        // Show Review Section
        wrongSection.classList.remove('hidden');
        wrongList.innerHTML = '';

        state.wrongQuestions.forEach(q => {
            const li = document.createElement('li');
            // Show "English = Japanese"
            li.textContent = `${q.correctWord.en} = ${q.correctWord.jp}`;
            wrongList.appendChild(li);
        });

        startReviewBtn.onclick = startReviewQuiz;
    }

    // AdMob Logic: REMOVED for Web
    // checkAndShowAd();
}

// --- AdMob Logic ---
// (AD_CONFIG moved to top)

// --- AdMob Configuration ---
// (AD_CONFIG is at the top)

// --- AdMob Logic ---
// Removed for Web Version


// Helpers
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function playAudio(isCorrect) {
    // Placeholder for sound effects (correct/incorrect)
    // We could add beep sounds later if requested.
}

async function playCurrentWordAudio() {
    const question = state.quizQuestions[state.currentQuestionIndex];
    if (!question) return;

    // We want to pronounce the English word.
    // Type 1 (Choice): Question is English. 
    // Type 2 (Sort): Question is Japanese, Answer is English.

    let text;
    if (question.correctWord && question.correctWord.en) {
        text = question.correctWord.en;
    } else {
        // Fallback for irregular verbs (or Sort questions generally) where answer is the English text
        text = question.answer;
    }

    // Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Web Speech API not supported");
        alert("お使いのブラウザは音声読み上げに対応していません。");
    }
}



// --- Print Logic ---
// --- Print Logic ---
async function renderPrintContent(type) {
    console.log("renderPrintContent called with type:", type);
    try {
        let title = "";
        let data = [];
        let headers = [];
        let isTwoColumn = false;
        
        // Check Shuffle State
        const doShuffle = document.getElementById('print-shuffle-checkbox')?.checked || false;

        // Data Preparation
        if (type === "past" || type === "pp") {
            title = type === "past" ? "不規則動詞 (過去形) テスト" : "不規則動詞 (過去分詞) テスト";
            headers = ["No.", "原形", "回答欄"];
            isTwoColumn = true; // Enable 2-column mode for Irregular Verbs
            
            if (!irregularVerbs) {
                alert("エラー: 不規則動詞データが見つかりません。");
                return;
            }

            data = irregularVerbs.map((v, i) => ({
                no: i + 1,
                col1: v.base,
                answer: type === "past" ? v.past : v.pp
            }));
        } else if (type === "unit") {
            if (!state.currentTextbook || !state.currentGrade) {
                alert("教科書と学年を選択してください。");
                return;
            }
            if (state.selectedUnits.length === 0) {
                alert("単元を選択してください。");
                return;
            }

            title = `単語テスト (${state.currentTextbook === "new_crown" ? "New Crown" : "Here We Go"} 中${state.currentGrade})`;
            headers = ["No.", "意味", "英単語"];
            isTwoColumn = false; // Single column for units (definitions are long)

            if (!vocabularyData) {
                alert("エラー: 単語データ(vocabularyData)が見つかりません。");
                return;
            }

            let count = 1;
            state.selectedUnits.forEach(unitIndex => {
                 const unit = vocabularyData[state.currentTextbook][state.currentGrade][unitIndex];
                 if (unit && unit.words) {
                     unit.words.forEach(word => {
                         data.push({
                             no: count++,
                             col1: word.jp, // Japanese Meaning
                             answer: word.en // English Word
                         });
                     });
                 }
            });
        }

        if (data.length === 0) {
            alert("データがありません。");
            return;
        }

        // Apply Shuffle if requested
        if (doShuffle) {
            // Fisher-Yates Shuffle
            for (let i = data.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [data[i], data[j]] = [data[j], data[i]];
            }
            
            // Re-assign No. sequentially
            data.forEach((row, index) => {
                row.no = index + 1;
            });
        }

        // Styles for Print
        const style = `
            <style>
                body { font-family: sans-serif; padding: 20px; }
                .print-section { width: 100%; margin-bottom: 2rem; }
                .print-header { text-align: center; margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
                .print-title { font-size: 1.5rem; font-weight: bold; }
                .print-subtitle { font-size: 1rem; margin-top: 0.5rem; }
                .print-table { width: 100%; border-collapse: collapse; font-size: 11pt; } /* Slightly smaller font */
                .print-table th, .print-table td { border: 1px solid #333; padding: 6px; text-align: left; vertical-align: middle; }
                .print-table th { background-color: #f0f0f0; text-align: center; }
                .page-break { page-break-before: always; break-before: page; margin-top: 2rem; }
                td { page-break-inside: avoid; }
                /* Column Specifics */
                .col-no { width: 5%; text-align: center; }
                .col-base { width: 15%; }
                .col-ans { width: 25%; }
                .col-gap { width: 10%; border-top: none !important; border-bottom: none !important; border-left: none !important; border-right: none !important; }
            </style>
        `;

        // Generator Helper
        const createTable = (isAnswerKey) => {
            let tableHeaderHTML = "";
            let layoutClass = "";
            
            if (isTwoColumn) {
                tableHeaderHTML = `
                    <tr>
                        <th class="col-no">No.</th>
                        <th class="col-base">${headers[1]}</th>
                        <th class="col-ans">${headers[2]}</th>
                        <th class="col-gap" style="background: white; border: none;"></th> <!-- Gap -->
                        <th class="col-no">No.</th>
                        <th class="col-base">${headers[1]}</th>
                        <th class="col-ans">${headers[2]}</th>
                    </tr>
                `;
            } else {
                tableHeaderHTML = `
                    <tr>
                        <th style="width: 10%;">No.</th>
                        <th style="width: 40%;">${headers[1]}</th>
                        <th style="width: 50%;">${headers[2]}</th>
                    </tr>
                `;
            }

            let html = `
                <div class="${isAnswerKey ? "page-break" : "print-section"}">
                    <div class="print-header">
                        <div class="print-title">${title} ${isAnswerKey ? "【解答】" : "【問題】"}</div>
                        <div class="print-subtitle">日付: ______________   氏名: ______________   得点: _______ / ${data.length}</div>
                    </div>
                    <table class="print-table">
                        <thead>
                            ${tableHeaderHTML}
                        </thead>
                        <tbody>
            `;

            if (isTwoColumn) {
                // Two Column Loop
                for (let i = 0; i < data.length; i += 2) {
                    const row1 = data[i];
                    const row2 = data[i+1]; // May be undefined

                    html += `
                        <tr>
                            <td class="col-no" style="text-align: center;">${row1.no}</td>
                            <td class="col-base">${row1.col1}</td>
                            <td class="col-ans" style="color: ${isAnswerKey ? "red" : "black"}; font-weight: ${isAnswerKey ? "bold" : "normal"};">
                                ${isAnswerKey ? row1.answer : ""}
                            </td>
                            
                            <!-- Gap Column (Empty) -->
                            <td class="col-gap" style="border: none;"></td>

                            <!-- Second Column -->
                            ${row2 ? `
                                <td class="col-no" style="text-align: center;">${row2.no}</td>
                                <td class="col-base">${row2.col1}</td>
                                <td class="col-ans" style="color: ${isAnswerKey ? "red" : "black"}; font-weight: ${isAnswerKey ? "bold" : "normal"};">
                                    ${isAnswerKey ? row2.answer : ""}
                                </td>
                            ` : `
                                <td class="col-no"></td>
                                <td class="col-base"></td>
                                <td class="col-ans"></td>
                            `}
                        </tr>
                    `;
                }
            } else {
                // Single Column Loop
                data.forEach(row => {
                    html += `
                        <tr>
                            <td style="text-align: center;">${row.no}</td>
                            <td>${row.col1}</td>
                            <td style="color: ${isAnswerKey ? "red" : "black"}; font-weight: ${isAnswerKey ? "bold" : "normal"};">
                                ${isAnswerKey ? row.answer : ""}
                            </td>
                        </tr>
                    `;
                });
            }

            html += `
                        </tbody>
                    </table>
                </div>
            `;
            return html;
        };

        // Construct Full HTML
        let contentHtml = createTable(false) + createTable(true);
        let fullHtml = `<html><head>${style}</head><body>${contentHtml}</body></html>`;

        // Close modal
        toggleModal("print-modal", false);

        // Execute Print (Web Version)
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(fullHtml);
            printWindow.document.close(); // necessary for IE >= 10
            printWindow.focus(); // necessary for IE >= 10
            
            // Wait for content to load/render
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        } else {
            alert("ポップアップがブロックされました。印刷するにはポップアップを許可してください。");
        }

    } catch (e) {
        alert("印刷エラー: " + e.message);
        console.error(e);
    }
}

