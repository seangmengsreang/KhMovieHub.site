// backend/server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors({
    origin: [
        'http://localhost:5000', 
        'http://localhost:3000', 
        'https://khmoviehub.site',
        'https://khmoviehub-site-backend.onrender.com',
        'https://streamwave-kh.web.app',
        'https://khmoviehub.web.app'
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// SESSION
// ============================================================
app.use(session({
    secret: process.env.SESSION_SECRET || 'super-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    },
    name: 'khmoviehub_session'
}));

// ============================================================
// SERVE STATIC FILES
// ============================================================
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// ============================================================
// API ROUTES
// ============================================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        node: process.version
    });
});

// Firebase Config
app.get('/api/config/firebase', (req, res) => {
    console.log('🔥 Firebase config requested');
    const config = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };
    res.json({ success: true, config });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    const storedPassword = (process.env.DASHBOARD_PASSWORD || '').trim();
    
    if (!storedPassword) {
        return res.status(500).json({
            success: false,
            message: 'Server configuration error'
        });
    }
    
    if ((password || '').trim() === storedPassword) {
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Session error'
                });
            }
            req.session.isAuthenticated = true;
            req.session.user = { role: 'admin' };
            req.session.save(() => {
                res.json({
                    success: true,
                    message: 'Authentication successful',
                    user: { role: 'admin' }
                });
            });
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid password'
        });
    }
});

// Check Auth
app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.isAuthenticated === true) {
        res.json({
            authenticated: true,
            user: req.session.user || { role: 'admin' }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
        res.clearCookie('khmoviehub_session');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

// ============================================================
// CATCH-ALL - Serve Dashboard
// ============================================================
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    
    // Try dashboard first
    const dashboardPath = path.join(frontendPath, 'dashboard-7x9k2p.html');
    if (fs.existsSync(dashboardPath)) {
        return res.sendFile(dashboardPath);
    }
    
    // Fallback to index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🛡️  KhMovieHub Admin Server');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 URL: http://0.0.0.0:${PORT}`);
    console.log(`📂 Frontend: ${frontendPath}`);
    console.log('═══════════════════════════════════════════════════');
});