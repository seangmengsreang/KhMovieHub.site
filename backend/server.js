const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS - Allow frontend
app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:3000', 'https://khmoviehub.site'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// SESSION CONFIGURATION - FIXED
// ============================================================
app.use(session({
    secret: process.env.SESSION_SECRET || 'my-super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        // ⚠️ FIX: Only use secure in production (HTTPS)
        secure: false,  // SET TO FALSE FOR LOCALHOST
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    },
    name: 'khmoviehub_session'
}));

// ============================================================
// SERVE STATIC FILES
// ============================================================
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================================
// API ROUTES
// ============================================================

// FIREBASE CONFIG (Public)
app.get('/api/config/firebase', (req, res) => {
    console.log('🔥 Firebase config requested');
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

// LOGIN - FIXED
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    console.log('🔐 Login attempt received');
    console.log('📝 Password provided:', password ? 'Yes' : 'No');
    
    const storedPassword = (process.env.DASHBOARD_PASSWORD || '').trim();
    console.log('🔑 Stored password exists:', storedPassword ? 'Yes' : 'No');
    
    if (!storedPassword) {
        console.error('❌ Password not set in .env');
        return res.status(500).json({
            success: false,
            message: 'Server configuration error'
        });
    }
    
    const trimmedPassword = (password || '').trim();
    const isValid = trimmedPassword === storedPassword;
    console.log('✅ Password match:', isValid);
    
    if (isValid) {
        // Regenerate session for security
        req.session.regenerate((err) => {
            if (err) {
                console.error('❌ Session regenerate error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Session error'
                });
            }
            
            // Set session
            req.session.isAuthenticated = true;
            req.session.user = { role: 'admin' };
            req.session.userId = 'admin_' + Date.now();
            
            // Save session
            req.session.save((err) => {
                if (err) {
                    console.error('❌ Session save error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Session error'
                    });
                }
                
                console.log('✅ Login successful!');
                console.log('📝 Session ID:', req.session.id);
                console.log('📝 Session data:', req.session);
                
                res.json({
                    success: true,
                    message: 'Authentication successful',
                    user: { role: 'admin' }
                });
            });
        });
    } else {
        console.log('❌ Invalid password');
        res.status(401).json({
            success: false,
            message: 'Invalid password'
        });
    }
});

// CHECK AUTH - FIXED
app.get('/api/auth/check', (req, res) => {
    console.log('🔍 Checking auth');
    console.log('📝 Session ID:', req.session?.id);
    console.log('📝 isAuthenticated:', req.session?.isAuthenticated);
    
    if (req.session && req.session.isAuthenticated === true) {
        console.log('✅ User is authenticated');
        res.json({
            authenticated: true,
            user: req.session.user || { role: 'admin' }
        });
    } else {
        console.log('❌ User is NOT authenticated');
        res.json({
            authenticated: false
        });
    }
});

// LOGOUT
app.post('/api/auth/logout', (req, res) => {
    console.log('🔓 Logout requested');
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Logout error:', err);
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

// HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
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
    res.sendFile(path.join(__dirname, '../frontend/dashboard-7x9k2p.html'));
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🛡️  KhMovieHub Admin Server');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard-7x9k2p.html`);
    console.log(`🔒 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log('═══════════════════════════════════════════════════');
    console.log(`🔑 Password: ${process.env.DASHBOARD_PASSWORD ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`🔥 Firebase: ${process.env.FIREBASE_API_KEY ? '✅ Set' : '❌ NOT SET'}`);
    console.log('═══════════════════════════════════════════════════');
});