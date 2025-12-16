import './firebase.js?v=202512161523';
import { customAlert, customConfirm } from './ui-utils.js?v=202512161523';

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */
const COLLECTION_NAME = 'wishes';
const PAGE_LIMIT = 10;

/* -------------------------------------------------------------------------- */
/*                                    State                                   */
/* -------------------------------------------------------------------------- */
let state = {
    wishes: [],
    lastDoc: null,
    filterCat: 'all',
    hasMore: false,
    userCache: {} // rudimentary cache for user display names if needed
};

/* -------------------------------------------------------------------------- */
/*                               Initialization                               */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initUI();
});

function initAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadWishes(true);
        } else {
            // Redirect or show login
            // For now, just clear list
            document.getElementById('wish-list').innerHTML = '<div class="text-center p-4">로그인이 필요합니다.</div>';
        }
    });
}

function initUI() {
    // FAB
    document.getElementById('fab-add').addEventListener('click', openModal);

    // Modal Close
    document.getElementById('modal-close').addEventListener('click', closeModal);

    // Modal Category Logic (New Wrapper)
    const catWrappers = document.querySelectorAll('.cat-option-wrapper');
    catWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', () => {
            catWrappers.forEach(w => w.classList.remove('selected'));
            wrapper.classList.add('selected');
        });
    });

    // Save Button
    document.getElementById('btn-save-wish').addEventListener('click', handleSave);

    // Filter Tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            state.filterCat = e.target.dataset.cat;
            loadWishes(true);
        });
    });

    // Load More
    document.getElementById('btn-load-more').addEventListener('click', () => loadWishes(false));
}

/* -------------------------------------------------------------------------- */
/*                                 Data Logic                                 */
/* -------------------------------------------------------------------------- */

async function loadWishes(isReset = false) {
    const listEl = document.getElementById('wish-list');
    const btnLoadMore = document.getElementById('btn-load-more');

    if (isReset) {
        state.wishes = [];
        state.lastDoc = null;
        state.hasMore = false;
        listEl.innerHTML = '<div class="text-center p-4" style="color:#94a3b8;">로딩중...</div>';
    }

    try {
        let query = firebase.firestore().collection(COLLECTION_NAME);

        // Sorting Strategy:
        // Firestore requires composite indexes for equality filter + range sort.
        // To avoid this error/requirement for dynamic categories:
        // 1. If filtering by category, DO NOT sort by createdAt on server.
        // 2. If 'all', sort by createdAt desc.
        // 3. Client-side sorting (sortWishes) handles the final display order.

        if (state.filterCat !== 'all') {
            query = query.where('category', '==', state.filterCat);
            // No orderBy('createdAt') here to avoid index error
        } else {
            query = query.orderBy('createdAt', 'desc');
        }

        if (!isReset && state.lastDoc) {
            query = query.startAfter(state.lastDoc);
        }

        // Fetch LIMIT + 1 to check if there's a next page
        query = query.limit(PAGE_LIMIT + 1);

        const snapshot = await query.get();

        if (snapshot.empty) {
            if (isReset) listEl.innerHTML = '<div class="text-center p-4" style="color:#94a3b8;">등록된 위시가 없습니다.</div>';
            btnLoadMore.classList.add('hidden');
            return;
        }

        // Check if we have more than limit
        const hasNextPage = snapshot.docs.length > PAGE_LIMIT;

        // If hasNextPage, we slice off the extra one. If not, we take all.
        const docsToRender = hasNextPage ? snapshot.docs.slice(0, PAGE_LIMIT) : snapshot.docs;

        // Update lastDoc to the last RENDERED document! 
        // So the next fetch starts after this one (which will be the extra one we dropped, or null if end)
        state.lastDoc = docsToRender[docsToRender.length - 1];

        if (hasNextPage) {
            btnLoadMore.classList.remove('hidden');
        } else {
            btnLoadMore.classList.add('hidden');
        }

        const newItems = docsToRender.map(doc => ({ id: doc.id, ...doc.data() }));

        if (isReset) {
            state.wishes = newItems;
        } else {
            state.wishes = [...state.wishes, ...newItems];
        }

        renderList();

    } catch (error) {
        console.error("Error loading wishes:", error);
        listEl.innerHTML = '<div class="text-center mt-4">불러오기 실패</div>';
    }
}

function sortWishes(items) {
    return items.sort((a, b) => {
        const aDone = a.status === 'done';
        const bDone = b.status === 'done';

        if (aDone && !bDone) return 1;
        if (!aDone && bDone) return -1;

        if (aDone && bDone) {
            return b.createdAt - a.createdAt;
        }

        // Both Waiting
        const aDate = a.targetDate ? new Date(a.targetDate).getTime() : null;
        const bDate = b.targetDate ? new Date(b.targetDate).getTime() : null;

        if (aDate && bDate) {
            return aDate - bDate;
        }
        if (aDate && !bDate) return -1;
        if (!aDate && bDate) return 1;

        return b.createdAt - a.createdAt;
    });
}

async function handleSave() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const title = document.getElementById('input-title').value.trim();
    const memo = document.getElementById('input-memo').value.trim();
    const date = document.getElementById('input-date').value;

    // Updated selector
    const categoryWrapper = document.querySelector('.cat-option-wrapper.selected');
    const category = categoryWrapper ? categoryWrapper.dataset.value : '📌';

    if (!title) {
        await customAlert("제목을 입력해주세요.");
        return;
    }

    const newWish = {
        title,
        memo,
        category,
        targetDate: date || null,
        status: 'waiting',
        createdAt: Date.now(),
        createdBy: user.email,
        createdByName: getUserDisplayName(user),
        authorId: getUserIdFromEmail(user.email)
    };

    try {
        await firebase.firestore().collection(COLLECTION_NAME).add(newWish);
        closeModal();
        loadWishes(true);
    } catch (e) {
        console.error(e);
        await customAlert("저장 중 오류가 발생했습니다.");
    }
}

async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'done' ? 'waiting' : 'done';
    try {
        await firebase.firestore().collection(COLLECTION_NAME).doc(id).update({
            status: newStatus,
            updatedAt: Date.now()
        });
        const item = state.wishes.find(i => i.id === id);
        if (item) item.status = newStatus;
        renderList();
    } catch (e) {
        console.error(e);
        await customAlert("상태 변경 실패");
    }
}

async function deleteWish(id) {
    if (!await customConfirm("정말 삭제하시겠습니까?")) return;

    try {
        await firebase.firestore().collection(COLLECTION_NAME).doc(id).delete();
        state.wishes = state.wishes.filter(i => i.id !== id);
        renderList();
    } catch (e) {
        await customAlert("삭제 실패");
    }
}

/* -------------------------------------------------------------------------- */
/*                                 Render Helpers                             */
/* -------------------------------------------------------------------------- */

function renderList() {
    const listEl = document.getElementById('wish-list');
    listEl.innerHTML = '';

    const sorted = sortWishes([...state.wishes]);
    const currentUser = firebase.auth().currentUser;

    sorted.forEach(item => {
        const isDone = item.status === 'done';
        const card = document.createElement('div');
        card.className = `wish-card ${isDone ? 'done' : ''}`;

        // Date Logic
        let dateBadge = '';
        if (!isDone && item.targetDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(item.targetDate);
            target.setHours(0, 0, 0, 0);

            const diffTime = target - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let badgeClass = 'date-badge';
            let badgeText = '';

            if (diffDays < 0) {
                badgeClass += ' urgent';
                badgeText = `지난 일정 (${Math.abs(diffDays)}일 전)`;
            } else if (diffDays === 0) {
                badgeClass += ' today';
                badgeText = '오늘';
            } else if (diffDays <= 3) {
                badgeClass += ' urgent';
                badgeText = `D-${diffDays}`;
            } else {
                badgeClass += ' future';
                badgeText = `${target.getMonth() + 1}/${target.getDate()}까지`;
            }

            dateBadge = `<div class="wish-date-area"><span class="${badgeClass}">${badgeText}</span></div>`;
        }

        // Date Formatting (YY.MM.DD)
        const dateObj = new Date(item.createdAt);
        const yy = String(dateObj.getFullYear()).slice(-2);
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const createdDateStr = `${yy}.${mm}.${dd}`;

        // Author Logic (Right Side)
        const authorId = item.authorId || 'default';
        const authorName = item.createdByName || '가족';

        // Permissions
        const isAdmin = currentUser && currentUser.email.includes('kukky');
        const isAuthor = currentUser && item.createdBy === currentUser.email;
        const canEdit = isAdmin || isAuthor;

        let deleteBtn = '';
        if (canEdit) {
            deleteBtn = `<button class="delete-btn">🗑️ 삭제</button>`;
        }



        // Check Button (Conditional or Disabled style)
        let checkBtnHTML = '';
        if (canEdit) {
            checkBtnHTML = `
            <button class="check-btn-square" title="완료 여부"></button>`;
        } else {
            // Read-only view for others (optional: show status without button)
            checkBtnHTML = isDone
                ? `<div class="status-badge done">완료됨</div>`
                : `<div class="status-badge waiting">진행중</div>`;
        }

        card.innerHTML = `
            <!-- Left: Main Content -->
            <div class="wish-main">
                <div class="wish-icon-area">${item.category}</div>
                <div class="wish-text-area">
                    <div class="wish-title">${escapeHtml(item.title)}</div>
                    ${item.memo ? `<div class="wish-memo">${escapeHtml(item.memo)}</div>` : ''}
                </div>
            </div>

            <!-- Right: Author & Date -->
            <div class="wish-author">
                <div class="wish-avatar" title="${authorName}" 
                    style="background-image: url('../assets/images/avatar_${authorId}.png');"></div>
                <div class="wish-author-name" style="font-size:0.7rem; color:#94a3b8;">${createdDateStr}</div>
            </div>

            <!-- Bottom: Actions -->
            <div class="wish-actions">
                <div class="wish-btn-group">
                    ${checkBtnHTML}
                    ${dateBadge}
                </div>
                ${deleteBtn}
            </div>
        `;

        if (canEdit) {
            const checkBtn = card.querySelector('.check-btn-square');
            if (checkBtn) {
                checkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleStatus(item.id, item.status);
                });
            }

            const delBtn = card.querySelector('.delete-btn');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteWish(item.id);
                });
            }
        }

        listEl.appendChild(card);
    });
}

function openModal() {
    document.getElementById('input-title').value = '';
    document.getElementById('input-memo').value = '';
    document.getElementById('input-date').value = '';

    // Reset category
    document.querySelectorAll('.cat-option-wrapper').forEach(o => o.classList.remove('selected'));
    const firstOption = document.querySelector('.cat-option-wrapper[data-value="🎒"]');
    if (firstOption) firstOption.classList.add('selected');

    document.getElementById('wish-modal').classList.remove('hidden');
    document.getElementById('input-title').focus();
}

function closeModal() {
    document.getElementById('wish-modal').classList.add('hidden');
}

/* -------------------------------------------------------------------------- */
/*                                  Utils                                     */
/* -------------------------------------------------------------------------- */
function getUserDisplayName(user) {
    const stored = sessionStorage.getItem('user_name');
    if (stored && stored !== 'null') return stored;
    return user.email.split('@')[0];
}

function getUserIdFromEmail(email) {
    if (!email) return 'default';
    const clean = email.toLowerCase();
    if (clean.includes('kukky')) return 'kukky';
    if (clean.includes('soony')) return 'soony';
    if (clean.includes('joowon')) return 'joowon';
    if (clean.includes('raim')) return 'raim';
    return 'default';
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
