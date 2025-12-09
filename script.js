// Variáveis
let timerInterval;
let seconds = 0;
let isRunning = false;
let studySessions = []; // Array principal de dados

// Elementos
const subjectInput = document.getElementById('subjectInput');
const timerDisplay = document.getElementById('timerDisplay');
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnFinish = document.getElementById('btnFinish');
const dueReviewsList = document.getElementById('dueReviewsList');
const futureReviewsList = document.getElementById('futureReviewsList');
const btnClearAll = document.getElementById('btnClearAll');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderReviews();
});

// --- Lógica do Cronômetro ---

function formatTime(sec) {
    const hrs = Math.floor(sec / 3600);
    const min = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimer() {
    seconds++;
    timerDisplay.textContent = formatTime(seconds);
}

btnStart.addEventListener('click', () => {
    if (!subjectInput.value.trim()) {
        alert("Por favor, digite o nome da matéria antes de iniciar.");
        return;
    }
    
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnFinish.disabled = false;
        subjectInput.disabled = true; // Trava o input enquanto estuda
    }
});

btnPause.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    btnStart.disabled = false;
    btnStart.innerHTML = '<i class="fas fa-play"></i> Continuar';
    btnPause.disabled = true;
});

btnFinish.addEventListener('click', () => {
    clearInterval(timerInterval);
    saveSession();
    resetUI();
});

function resetUI() {
    isRunning = false;
    seconds = 0;
    timerDisplay.textContent = "00:00:00";
    subjectInput.value = "";
    subjectInput.disabled = false;
    btnStart.innerHTML = '<i class="fas fa-play"></i> Iniciar';
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnFinish.disabled = true;
}

// --- Lógica de Repetição Espaçada ---

function saveSession() {
    const subject = subjectInput.value.trim();
    const duration = formatTime(seconds);
    const today = new Date();
    
    // Criação das datas de revisão (1, 7, 30 dias)
    const intervals = [1, 7, 30];
    const reviews = intervals.map(days => {
        const reviewDate = new Date(today);
        reviewDate.setDate(today.getDate() + days);
        return {
            date: reviewDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
            completed: false,
            interval: days
        };
    });

    const newSession = {
        id: Date.now(),
        subject: subject,
        studyDate: today.toISOString().split('T')[0],
        duration: duration,
        reviews: reviews
    };

    studySessions.push(newSession);
    saveData();
    renderReviews();
    alert(`Estudo salvo! 3 revisões agendadas para: ${subject}`);
}

function renderReviews() {
    dueReviewsList.innerHTML = '';
    futureReviewsList.innerHTML = '';
    
    const todayStr = new Date().toISOString().split('T')[0];

    // Ordenar sessões por data mais antiga primeiro (se necessário)
    let dueCount = 0;
    studySessions.forEach(session => {
        session.reviews.forEach((review, index) => {
            if (review.completed) return; // Se já revisou, não mostra

            const isDue = review.date <= todayStr;
            
            // Cria elemento HTML
            const li = document.createElement('li');
            li.className = `review-item ${isDue ? (review.date < todayStr ? 'overdue' : 'today') : ''}`;
            
            const statusText = isDue 
                ? (review.date < todayStr ? '⚠️ Atrasado' : '📅 Para Hoje') 
                : `🗓️ ${formatDateBr(review.date)}`;

            li.innerHTML = `
                <div class="review-info">
                    <h4>${session.subject}</h4>
                    <span>Revisão de ${review.interval} dias • Estudado por: ${session.duration}</span>
                    <span style="font-weight:bold; margin-top:5px; color:${isDue ? '#d63031' : '#636e72'}">
                        ${statusText}
                    </span>
                </div>
            `;

            if (isDue) {
                // Botão de check apenas para revisões vencidas ou de hoje
                const btnCheck = document.createElement('button');
                btnCheck.className = 'check-btn';
                btnCheck.innerHTML = '<i class="fas fa-check"></i>';
                btnCheck.onclick = () => markAsDone(session.id, index);
                li.appendChild(btnCheck);
                
                dueReviewsList.appendChild(li);
                dueCount++;
            } else {
                futureReviewsList.appendChild(li);
            }
        });
    });

    // Controla a exibição da mensagem de "vazio"
    document.getElementById('emptyDue').style.display = dueCount === 0 ? 'block' : 'none';
}

function markAsDone(sessionId, reviewIndex) {
    const session = studySessions.find(s => s.id === sessionId);
    if (session) {
        session.reviews[reviewIndex].completed = true;
        saveData();
        renderReviews();
    }
}

// --- Armazenamento ---

function formatDateBr(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function saveData() {
    localStorage.setItem('studyApp_sessions', JSON.stringify(studySessions));
}

function loadData() {
    const data = localStorage.getItem('studyApp_sessions');
    if (data) {
        studySessions = JSON.parse(data);
    }
}

btnClearAll.addEventListener('click', () => {
    if(confirm('Tem certeza? Isso apagará todo o histórico de estudos.')) {
        localStorage.removeItem('studyApp_sessions');
        studySessions = [];
        renderReviews();
    }
});