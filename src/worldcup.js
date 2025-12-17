// 시크릿 월드컵 게임 로직

import { auth, db } from './firebase.js';
import { customAlert, customConfirm } from './ui-utils.js';

let currentWorldcup = null;
let currentUser = null;
let currentMatches = [];
let currentMatchIndex = 0;
let winners = [];

// 페이지 로드 시 초기화
auth.onAuthStateChanged(user => {
    if (!user) {
        location.href = 'login.html';
    } else {
        currentUser = user;
        loadWorldcup();
    }
});

// 월드컵 로드
async function loadWorldcup() {
    try {
        const doc = await db.collection('worldcup').doc('current').get();
        if (!doc.exists) {
            customAlert('아직 월드컵이 등록되지 않았습니다.');
            return;
        }

        currentWorldcup = doc.data();
        document.getElementById('worldcup-title').textContent = currentWorldcup.title || '시크릿 월드컵';
    } catch (error) {
        console.error('Load error:', error);
        customAlert('월드컵 로드 중 오류가 발생했습니다.');
    }
}

// 게임 시작
window.startGame = function () {
    if (!currentWorldcup || !currentWorldcup.choices) {
        customAlert('월드컵 데이터를 불러올 수 없습니다.');
        return;
    }

    // 랜덤 셔플
    const shuffled = shuffleArray([...currentWorldcup.choices]);

    // 초기 매치 생성
    createMatches(shuffled);
    currentMatchIndex = 0;
    winners = [];

    // 화면 전환
    document.getElementById('game-start').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('vs-screen').style.display = 'block';

    // 첫 매치 표시
    showCurrentMatch();
};

// 매치 생성
function createMatches(choices) {
    currentMatches = [];
    for (let i = 0; i < choices.length; i += 2) {
        currentMatches.push([choices[i], choices[i + 1]]);
    }
}

// 현재 매치 표시
function showCurrentMatch() {
    if (currentMatchIndex >= currentMatches.length) {
        // 라운드 종료
        nextRound();
        return;
    }

    const match = currentMatches[currentMatchIndex];

    // 라운드 정보
    const totalChoices = currentMatches.length * 2;
    document.getElementById('round-name').textContent = getRoundName(totalChoices);
    document.getElementById('match-count').textContent = `${currentMatchIndex + 1} / ${currentMatches.length}`;

    // 선택지 표시
    document.getElementById('choice-emoji-0').textContent = match[0].emoji;
    document.getElementById('choice-name-0').textContent = match[0].name;
    document.getElementById('choice-emoji-1').textContent = match[1].emoji;
    document.getElementById('choice-name-1').textContent = match[1].name;
}

// 선택
window.selectChoice = function (index) {
    const winner = currentMatches[currentMatchIndex][index];
    winners.push(winner);
    currentMatchIndex++;
    showCurrentMatch();
};

// 다음 라운드
function nextRound() {
    if (winners.length === 1) {
        // 게임 종료
        showResult(winners[0]);
    } else {
        // 다음 라운드 시작
        createMatches(winners);
        currentMatchIndex = 0;
        winners = [];
        showCurrentMatch();
    }
}

// 라운드 이름
function getRoundName(totalChoices) {
    if (totalChoices >= 32) return '32강';
    if (totalChoices >= 16) return '16강';
    if (totalChoices >= 8) return '8강';
    if (totalChoices === 4) return '준결승';
    if (totalChoices === 2) return '결승';
    return '대결';
}

// 결과 표시
async function showResult(winner) {
    // 화면 전환
    document.getElementById('vs-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';

    // 우승자 표시
    document.getElementById('winner-emoji').textContent = winner.emoji;
    document.getElementById('winner-name').textContent = winner.name;

    // 결과 저장
    await saveResult(winner);

    // 가족 통계 로드
    await loadFamilyStats();
}

// 결과 저장
async function saveResult(winner) {
    try {
        const userName = sessionStorage.getItem('user_name') || currentUser.email.split('@')[0];

        await db.collection('worldcup_results').doc(currentUser.uid).set({
            userId: currentUser.uid,
            userName: userName,
            winner: winner.id,
            winnerName: winner.name,
            winnerEmoji: winner.emoji,
            playedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Save result error:', error);
    }
}

// 가족 통계 로드
async function loadFamilyStats() {
    try {
        const results = await db.collection('worldcup_results').get();
        const statsList = document.getElementById('family-stats-list');
        statsList.innerHTML = '';

        if (results.empty) {
            statsList.innerHTML = '<div style="text-align:center; color:#999;">아직 결과가 없습니다.</div>';
            return;
        }

        results.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <span>${data.userName}</span>
                <span>${data.winnerEmoji} ${data.winnerName}</span>
            `;
            statsList.appendChild(div);
        });
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// 랜덤 셔플
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
