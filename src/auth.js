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

// Logout Function
async function logout() {
    try {
        await firebase.auth().signOut();
        sessionStorage.clear();
        window.location.href = '/public/login.html';
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// Auth State Observer (Use this in protected pages)
function checkAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // Not logged in -> Redirect to login
            const currentPath = window.location.pathname;
            if (!currentPath.includes('login.html')) {
                window.location.href = '/public/login.html';
            }
        } else {
            // Logged in -> If on login page, go to dashboard
            if (window.location.pathname.includes('login.html')) {
                window.location.href = '/public/dashboard.html';
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
