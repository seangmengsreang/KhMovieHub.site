// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
    });
};

const getSessionUser = (req) => {
    if (req.session && req.session.isAuthenticated) {
        return {
            authenticated: true,
            user: req.session.user || { role: 'admin' }
        };
    }
    return {
        authenticated: false,
        user: null
    };
};

module.exports = {
    isAuthenticated,
    getSessionUser
};