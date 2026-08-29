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

// CORS - Allow frontend
app.use(cors({
    origin: [
        'http://localhost:5000', 
        'http://localhost:3000', 
        'https://khmoviehub.site',
        'https://khmoviehub-site-backend.onrender.com',
        'https://streamwave-kh.web.app',
        'https://streamwave-kh.firebaseapp.com',
        '*'
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// SESSION CONFIGURATION
// ============================================================
app.use(session({
    secret: process.env.SESSION_SECRET || 'my-super-secret-key-change-this',
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
// Check multiple possible frontend locations
const possiblePaths = [
    path.join(__dirname, 'frontend'),
    path.join(__dirname, '../frontend'),
    path.join(__dirname, 'public'),
    path.join(__dirname, '../public'),
    __dirname // fallback
];

let frontendPath = null;
for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        frontendPath = p;
        console.log(`📂 Found frontend at: ${p}`);
        break;
    }
}

if (frontendPath) {
    app.use(express.static(frontendPath));
    console.log(`✅ Serving static files from: ${frontendPath}`);
} else {
    console.log('⚠️ No frontend directory found, creating fallback');
    // Create a simple fallback
    app.get('/', (req, res) => {
        res.json({
            name: 'KhMovieHub API',
            status: 'running',
            endpoints: {
                health: '/api/health',
                config: '/api/config/firebase',
                auth: '/api/auth'
            }
        });
    });
}

// ============================================================
// API ROUTES
// ============================================================

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'KhMovieHub API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        endpoints: {
            health: '/api/health',
            config: '/api/config/firebase',
            auth: {
                login: '/api/auth/login (POST)',
                check: '/api/auth/check (GET)',
                logout: '/api/auth/logout (POST)'
            }
        }
    });
});

// FIREBASE CONFIG (Public)
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
    
    // Check for missing config
    const missing = Object.keys(config).filter(key => !config[key]);
    if (missing.length > 0) {
        console.warn('⚠️ Missing Firebase config keys:', missing.join(', '));
    }
    
    res.json({
        success: true,
        config: config,
        timestamp: new Date().toISOString()
    });
});

// LOGIN
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

// CHECK AUTH
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
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version,
        environment: process.env.NODE_ENV || 'production'
    });
});

// ============================================================
// CATCH-ALL - Serve Dashboard or index.html
// ============================================================
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    
    if (frontendPath) {
        // Try dashboard first
        const dashboardPath = path.join(frontendPath, 'dashboard-7x9k2p.html');
        if (fs.existsSync(dashboardPath)) {
            return res.sendFile(dashboardPath);
        }
        
        // Try index.html
        const indexPath = path.join(frontendPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    
    // Fallback response
    res.status(404).json({
        success: false,
        message: 'Page not found',
        path: req.url
    });
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
    console.log(`🔒 Auth endpoint: /api/auth/login`);
    console.log(`📊 Health: /api/health`);
    console.log(`🔥 Config: /api/config/firebase`);
    console.log('═══════════════════════════════════════════════════');
    console.log(`🔑 Password: ${process.env.DASHBOARD_PASSWORD ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`🔥 Firebase: ${process.env.FIREBASE_API_KEY ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`📂 Frontend path: ${frontendPath || 'Not found'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log('═══════════════════════════════════════════════════');
});