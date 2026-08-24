const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
    origin: ['https://khmoviehub.web.app', 'https://khmoviehub-site.onrender.com', 'http://localhost:5000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Serve FRONTEND files
app.use(express.static(path.join(__dirname, 'frontend')));

// ============================================================
// API ROUTES
// ============================================================

app.get('/api/config/firebase', (req, res) => {
    res.json({
        success: true,
        config: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        }
    });
});

app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    const storedPassword = (process.env.DASHBOARD_PASSWORD || '').trim();
    
    if (password === storedPassword) {
        req.session.isAuthenticated = true;
        req.session.user = { role: 'admin' };
        req.session.save(() => {
            res.json({
                success: true,
                message: 'Authentication successful'
            });
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid password'
        });
    }
});

app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.isAuthenticated === true) {
        res.json({
            authenticated: true,
            user: req.session.user || { role: 'admin' }
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({
            success: true,
            message: 'Logged out'
        });
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Catch-all - Serve frontend
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🛡️  KhMovieHub Server');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: /dashboard-7x9k2p.html`);
    console.log('═══════════════════════════════════════════════════');
});