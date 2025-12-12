
/**
 * ui-utils.js
 * 
 * Shared utility for verifying "Secret Garden" style custom modals
 * Replaces native alert() and confirm()
 */

// Inject Modal HTML and CSS if not present
function ensureModalExists() {
    if (document.getElementById('common-custom-modal')) return;

    const modalHtml = `
    <div id="common-custom-modal" style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 9999;
        display: none; justify-content: center; align-items: center;
        font-family: 'Noto Sans KR', sans-serif;
    ">
        <div style="
            background: white; width: 85%; max-width: 320px; padding: 20px;
            border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            animation: commonPopUp 0.2s ease-out;
        ">
            <h3 style="
                margin: 0 0 10px 0; font-size: 1rem; color: #1e293b;
                border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;
            ">
                Secret Garden 내용 :
            </h3>
            <div id="common-modal-msg" style="
                font-size: 0.95rem; color: #333; line-height: 1.5; margin-bottom: 20px;
                word-break: break-all;
            "></div>
            <div id="common-modal-actions" style="display: flex; gap: 10px;">
                <!-- Buttons injected dynamically -->
            </div>
        </div>
    </div>
    <style>
        @keyframes commonPopUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    </style>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);
}

/**
 * Show a custom Alert (Single OK button)
 * @param {string} message 
 * @returns {Promise<void>}
 */
export function customAlert(message) {
    ensureModalExists();
    return new Promise((resolve) => {
        const modal = document.getElementById('common-custom-modal');
        const msgEl = document.getElementById('common-modal-msg');
        const actionsEl = document.getElementById('common-modal-actions');

        msgEl.innerHTML = message.replace(/\n/g, '<br>');

        // Render OK Button
        actionsEl.innerHTML = `
            <button id="common-btn-ok" style="
                flex: 1; padding: 10px; background: var(--color-primary, #6366f1);
                color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;
            ">확인</button>
        `;

        const okBtn = document.getElementById('common-btn-ok');

        const close = () => {
            modal.style.display = 'none';
            resolve();
        };

        okBtn.onclick = close;
        modal.style.display = 'flex';
    });
}

/**
 * Show a custom Confirm (Cancel / OK buttons)
 * @param {string} message 
 * @returns {Promise<boolean>}
 */
export function customConfirm(message) {
    ensureModalExists();
    return new Promise((resolve) => {
        const modal = document.getElementById('common-custom-modal');
        const msgEl = document.getElementById('common-modal-msg');
        const actionsEl = document.getElementById('common-modal-actions');

        msgEl.innerHTML = message.replace(/\n/g, '<br>');

        // Render Cancel/OK Buttons
        actionsEl.innerHTML = `
            <button id="common-btn-no" style="
                flex: 1; padding: 10px; background: #f1f5f9; border: none;
                border-radius: 8px; color: #64748b; font-weight: bold; cursor: pointer;
            ">취소</button>
            <button id="common-btn-yes" style="
                flex: 1; padding: 10px; background: var(--color-primary, #6366f1);
                color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;
            ">확인</button>
        `;

        const yesBtn = document.getElementById('common-btn-yes');
        const noBtn = document.getElementById('common-btn-no');

        yesBtn.onclick = () => { modal.style.display = 'none'; resolve(true); };
        noBtn.onclick = () => { modal.style.display = 'none'; resolve(false); };

        modal.style.display = 'flex';
    });
}
