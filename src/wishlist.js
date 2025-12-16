import './firebase.js?v=202512161002';
import { customAlert, customConfirm } from './ui-utils.js?v=202512161002';

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

    // Category Selection in Modal
    const catOptions = document.querySelectorAll('.cat-option');
    catOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            catOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
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

        // Sorting Logic:
        // Ideally: Status (Waiting) -> Has Date (Asc) -> No Date (Desc) -> Done
        // Firestore sorting limitations make this complex.
        // Simplified Strategy for MVP:
        // 1. Client-side sorting for small datasets ( < 100 items usually for family).
        // 2. Fetch 'waiting' and 'done' separately or fetch all and sort details in memory.

        // Strategy: Filter by Category in Query if possible, then sort by CreatedAt Desc as default
        // Then manually sort in Client. Since it's a family app, data volume is low.
        // Let's fetch ALL non-done items first, then recent done items.
        // Actually, let's just fetch by created desc and sort client side for this scale.

        if (state.filterCat !== 'all') {
            query = query.where('category', '==', state.filterCat);
        }

        // Order by createdAt desc to get latest
        query = query.orderBy('createdAt', 'desc');

        if (!isReset && state.lastDoc) {
            query = query.startAfter(state.lastDoc);
        }

        query = query.limit(PAGE_LIMIT * 2); // Fetch more to handle client side sorting

        const snapshot = await query.get();

        if (snapshot.empty) {
            if (isReset) listEl.innerHTML = '<div class="text-center p-4" style="color:#94a3b8;">등록된 위시가 없습니다.</div>';
            btnLoadMore.classList.add('hidden');
            return;
        }

        state.lastDoc = snapshot.docs[snapshot.docs.length - 1];

        // Determine if there are potentially more
        if (snapshot.docs.length >= PAGE_LIMIT * 2) {
            btnLoadMore.classList.remove('hidden');
        } else {
            btnLoadMore.classList.add('hidden');
        }

        const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
    // 1. Waiting vs Done
    // 2. Waiting: Has Date (Asc) -> No Date (Desc by CreatedAt)
    // 3. Done: Desc by CreatedAt

    return items.sort((a, b) => {
        const aDone = a.status === 'done';
        const bDone = b.status === 'done';

        if (aDone && !bDone) return 1;
        if (!aDone && bDone) return -1;

        if (aDone && bDone) {
            return b.createdAt - a.createdAt;
        }

        // Both Waiting
        // Check Dates
        const aDate = a.targetDate ? new Date(a.targetDate).getTime() : null;
        const bDate = b.targetDate ? new Date(b.targetDate).getTime() : null;

        if (aDate && bDate) {
            return aDate - bDate; // Soonest date first
        }
        if (aDate && !bDate) return -1; // Date items first
        if (!aDate && bDate) return 1;

        // Both no date
        return b.createdAt - a.createdAt;
    });
}

async function handleSave() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const title = document.getElementById('input-title').value.trim();
    const memo = document.getElementById('input-memo').value.trim();
    const date = document.getElementById('input-date').value;
    const categoryEl = document.querySelector('.cat-option.selected');
    const category = categoryEl ? categoryEl.dataset.value : '📌';

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
        // Simple avatar check logic
        authorId: getUserIdFromEmail(user.email)
    };

    try {
        await firebase.firestore().collection(COLLECTION_NAME).add(newWish);
        closeModal();
        loadWishes(true); // refetch
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
        // Optimistic update
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
                badgeClass += ' urgent'; // Expired but urgent style
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

            dateBadge = `<span class="${badgeClass}">${badgeText}</span>`;
        }

        // Author Avatar Logic
        const authorId = item.authorId || 'default'; // kukky, soony, etc.
        const authorDisplay = `<div class="author-info">
            <div class="mini-avatar ${authorId}"></div>
            <span>${item.createdByName || '가족'}</span>
        </div>`;

        // Delete Button (Only for author or admin)
        const isAdmin = currentUser && currentUser.email.includes('kukky');
        const isAuthor = currentUser && item.createdBy === currentUser.email;
        let deleteBtn = '';
        if (isAdmin || isAuthor) {
            deleteBtn = `<button class="btn-delete" style="border:none; background:none; color:#cbd5e1; cursor:pointer; font-size:0.9rem;">🗑️</button>`;
        }

        card.innerHTML = `
            <div class="wish-top">
                <div style="display:flex;">
                    <span class="wish-category">${item.category}</span>
                    <div class="wish-content-wrapper">
                        <div class="wish-title">${escapeHtml(item.title)}</div>
                        ${item.memo ? `<div class="wish-memo">${escapeHtml(item.memo)}</div>` : ''}
                        ${dateBadge}
                    </div>
                </div>
                <button class="check-btn">✔</button>
            </div>
            <div class="wish-meta">
                ${authorDisplay}
                ${deleteBtn}
            </div>
        `;

        // Event Listeners
        card.querySelector('.check-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStatus(item.id, item.status);
        });

        if (deleteBtn) {
            card.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteWish(item.id);
            });
        }

        listEl.appendChild(card);
    });
}

function openModal() {
    document.getElementById('input-title').value = '';
    document.getElementById('input-memo').value = '';
    document.getElementById('input-date').value = '';

    // Reset category
    document.querySelectorAll('.cat-option').forEach(o => o.classList.remove('selected'));
    document.querySelector('.cat-option[data-value="🎒"]').classList.add('selected');

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
