const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        
        console.log('🔐 Login attempt received');
        console.log('📝 Password length:', password ? password.length : 0);
        console.log('📝 Session ID before login:', req.session?.id);
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        const storedPassword = process.env.DASHBOARD_PASSWORD;
        
        if (!storedPassword) {
            console.error('❌ DASHBOARD_PASSWORD not set in environment');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        const isValid = password === storedPassword;
        console.log('✅ Password match:', isValid);

        if (isValid) {
            // Set session directly without regenerate first
            req.session.isAuthenticated = true;
            req.session.user = {
                role: 'admin',
                loginTime: new Date().toISOString()
            };
            
            // Save session explicitly
            req.session.save((err) => {
                if (err) {
                    console.error('❌ Session save error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Session save error'
                    });
                }
                
                console.log('✅ Login successful!');
                console.log('📝 Session ID:', req.session.id);
                console.log('📝 Session data:', req.session);
                
                return res.json({
                    success: true,
                    message: 'Authentication successful',
                    user: {
                        role: 'admin'
                    }
                });
            });
        } else {
            console.log('❌ Invalid password attempt');
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout endpoint
router.post('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
        res.clearCookie('admin_session');
        return res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

// Check authentication status
router.get('/check', (req, res) => {
    console.log('🔍 Session check');
    console.log('📝 Session ID:', req.session?.id);
    console.log('📝 Session data:', req.session);
    console.log('📝 isAuthenticated:', req.session?.isAuthenticated);
    
    if (req.session && req.session.isAuthenticated === true) {
        console.log('✅ User is authenticated');
        return res.json({
            authenticated: true,
            user: req.session.user || { role: 'admin' }
        });
    }
    console.log('❌ User is NOT authenticated');
    return res.json({
        authenticated: false
    });
});

// Protected test route
router.get('/protected', isAuthenticated, (req, res) => {
    res.json({
        success: true,
        message: 'You have access to protected content'
    });
});

module.exports = router;