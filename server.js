const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

// API Key dari environment variable
const TMATE_API_KEY = process.env.TMATE_API_KEY || 'tmk-914Hzkcw1fm57fD6wJTmyFUzB0';
const TMATE_SOCKET = '/tmp/tmate.sock';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper function to execute shell commands securely
const executeCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Command failed: ${command}\nError: ${stderr}`));
            } else {
                resolve(stdout.trim());
            }
        });
    });
};

// Route for serving the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for creating tmate sessions
app.post('/create-tmate',
    // Input validation
    body('sessionName').optional().isString().trim().escape(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const sessionName = req.body.sessionName || `zumyfree-${Date.now()}`;
        
        // Sanitize sessionName to prevent command injection (basic example)
        // For production, consider a more robust sanitization or whitelist approach
        const sanitizedSessionName = sessionName.replace(/[^a-zA-Z0-9-_]/g, '');

        // Modifikasi perintah untuk menggunakan socket
        const createSessionCmd = `tmate -S ${TMATE_SOCKET} -k ${TMATE_API_KEY} -n ${sanitizedSessionName} new-session -d`;

        console.log('Executing command:', createSessionCmd);

        try {
            await executeCommand(createSessionCmd);

            // Tunggu sebentar untuk memastikan sesi siap
            // Tambahkan perintah wait tmate-ready untuk memastikan sesi benar-benar siap
            await executeCommand(`tmate -S ${TMATE_SOCKET} wait tmate-ready`);

            // Ambil informasi koneksi
            const sshConn = await executeCommand(`tmate -S ${TMATE_SOCKET} display -p "#{tmate_ssh}"`);
            const webConn = await executeCommand(`tmate -S ${TMATE_SOCKET} display -p "#{tmate_web}"`);

            res.json({
                sessionName: sanitizedSessionName,
                sshLink: sshConn,
                webLink: webConn,
                apiKey: TMATE_API_KEY
            });
        } catch (error) {
            console.error('Error creating tmate session:', error.message);
            // Pass error to the error handling middleware
            next(new Error(`Failed to create tmate session: ${error.message}`));
        }
    }
);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Terjadi kesalahan pada server!',
        details: err.message
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
