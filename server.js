const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Set up storage engine for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Ensure 'uploads' directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Store uploaded file info in memory (for demo purposes)
const fileDataStore = {};

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    const { limit, password } = req.body;
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Store file information
    fileDataStore[req.file.filename] = { limit: parseInt(limit, 10), password: password };

    // Return file name, limit, and password to the client
    res.json({ success: true, fileName: req.file.filename, limit: parseInt(limit, 10) });
});

// Handle file download with password protection
app.get('/download', (req, res) => {
    const { file, pass } = req.query;

    // Check if file exists in the memory store
    const fileInfo = fileDataStore[file];
    const filePath = path.join(__dirname, 'uploads', file);

    // Validate password and file existence
    if (fileInfo && pass === fileInfo.password && fs.existsSync(filePath)) {
        // Serve the file for download
        res.download(filePath, file, (err) => {
            if (err) {
                console.error("Download error:", err);
                res.status(500).json({ success: false, message: 'Error downloading the file' });
            }
        });
    } else {
        res.status(403).json({ success: false, message: 'Incorrect password or file not found' });
    }
});

// Serve the sending page on root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'send.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
