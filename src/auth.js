// Auth Logic
// Note: firebase is loaded globally via CDN in HTML

// Login Function
async function login(email, password) {
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Save basic info to session (or local) storage for UI rendering
        sessionStorage.setItem('user_uid', user.uid);
        sessionStorage.setItem('user_email', user.email);

        return { success: true, user };
    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, message: error.message };
    }
}

// Helper to determine path to login based on current depth
function gotoLogin() {
    const path = window.location.pathname;
    if (path.includes('/mbti/') || path.includes('/fortune/') || path.includes('/preference/')) {
        window.location.href = '../login.html';
    } else {
        window.location.href = 'login.html';
    }
}

// Logout Function
async function logout() {
    try {
        await firebase.auth().signOut();
        sessionStorage.clear();
        gotoLogin();
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// Auth State Observer (Use this in protected pages)
function checkAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // Not logged in -> Redirect to login
            // Skip check if already on login page
            if (!window.location.pathname.includes('login.html')) {
                gotoLogin();
            }
        } else {
            // Logged in -> If on login page, go to dashboard
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        }
    });
}

// Export for module usage (if using bundler) or attach to window for vanity
window.AuthService = {
    login,
    logout,
    checkAuth
};
