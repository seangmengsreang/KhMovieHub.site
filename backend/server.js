const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Allow frontend (both localhost and production)
const corsOptions = {
    origin: process.env.CORS_ORIGIN || ['http://localhost:5000', 'https://khmoviehub.site'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'my-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================================
// API ROUTE - Get Firebase Config (PUBLIC)
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

// ============================================================
// AUTH ROUTES
// ============================================================
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    const storedPassword = (process.env.DASHBOARD_PASSWORD || '').trim();
    const trimmedPassword = (password || '').trim();
    
    if (!storedPassword) {
        return res.status(500).json({
            success: false,
            message: 'Server configuration error'
        });
    }
    
    if (trimmedPassword === storedPassword) {
        req.session.isAuthenticated = true;
        req.session.user = { role: 'admin' };
        
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Session error'
                });
            }
            res.json({
                success: true,
                message: 'Authentication successful',
                user: { role: 'admin' }
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
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
        res.clearCookie('connect.sid');
        res.json({
            success: true,
            message: 'Logged out'
        });
    });
});

// ============================================================
// CATCH-ALL - Serve dashboard
// ============================================================
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.sendFile(path.join(__dirname, '../frontend/dashboard-7x9k2p.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🛡️  KhMovieHub Admin Server');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔒 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log('═══════════════════════════════════════════════════');
    console.log(`🔑 Password: ${process.env.DASHBOARD_PASSWORD ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`🔥 Firebase: ${process.env.FIREBASE_API_KEY ? '✅ Set' : '❌ NOT SET'}`);
    console.log('═══════════════════════════════════════════════════');
});