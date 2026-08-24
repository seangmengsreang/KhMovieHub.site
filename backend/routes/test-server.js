const express = require('express');
const session = require('express-session');
const cors = require('cors');
const app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:5000' }));
app.use(express.json());
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    console.log('Login attempt:', password);
    
    if (password === 'V1_!mQ2#rL_khmoviehub_npro_9@xP4$kN8zT_2005') {
        req.session.isAuthenticated = true;
        req.session.save(() => {
            console.log('Session saved:', req.session.id);
            res.json({ success: true });
        });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/api/auth/check', (req, res) => {
    console.log('Session check:', req.session);
    res.json({ authenticated: !!req.session?.isAuthenticated });
});

app.listen(5000, () => console.log('Test server on http://localhost:5000'));