const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
// 1. Load the hidden environment variables FIRST
require('dotenv').config();

const express = require('express');
// 2. Import Mongoose
const mongoose = require('mongoose');

// --- NEW IMPORTS ---
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = 3000;

// MIDDLEWARE: Parse incoming JSON & serve static files
app.use(express.json());
app.use(express.static('public'));

// 3. Connect to the Cloud Database
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB Atlas!'))
    .catch((error) => console.error('❌ MongoDB connection failed:', error));

// ==========================================
// MONGOOSE SCHEMAS & MODELS
// ==========================================

// --- User Schema ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// --- Counter Schema (for auto-incrementing Ticket IDs) ---
// This stores the last-used sequence number so every ticket
// gets a unique, human-readable ID like TKT-1001, TKT-1002, etc.
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },   // e.g. "ticketId"
    seq: { type: Number, default: 1000 }     // starts at 1000, first ticket = TKT-1001
});

const Counter = mongoose.model('Counter', counterSchema);

// Helper: atomically get the next ticket sequence number
async function getNextTicketId() {
    const counter = await Counter.findByIdAndUpdate(
        'ticketId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }     // create the counter doc if it doesn't exist
    );
    return `TKT-${counter.seq}`;
}

// --- Comment Sub-Schema ---
const commentSchema = new mongoose.Schema({
    author: {
        type: String,
        required: [true, 'A comment author name is required'],
        trim: true
    },
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true
    }
}, {
    timestamps: true     // each comment gets its own createdAt
});

// --- Ticket Schema ---
const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true       // TKT-1001, TKT-1002, …
    },
    title: {
        type: String,
        required: [true, 'A ticket title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'A ticket description is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['Open', 'Urgent', 'In Progress', 'Closed'],
        default: 'Open'
    },
    assignee: {
        type: String,
        default: null,
        trim: true
    },
    comments: [commentSchema]
}, {
    timestamps: true     // createdAt + updatedAt on every ticket
});

const Ticket = mongoose.model('Ticket', ticketSchema);

// ==========================================
// MIDDLEWARES (AUTH & RBAC)
// ==========================================

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains { id, role }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admins only' });
    }
};

// ==========================================
// API ENDPOINTS (AUTH)
// ==========================================

// Get Google Client ID (for conditional frontend rendering)
app.get('/api/auth/google-client-id', (req, res) => {
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_placeholder' });
});

// Standard Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'User'
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Standard Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Google OAuth
app.post('/api/auth/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await User.findOne({ email });
        if (!user) {
            // Generate dummy scrambled password for OAuth users
            const dummyPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
            user = await User.create({
                email,
                name,
                password: dummyPassword,
                role: 'User' // Default role
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        res.status(400).json({ message: 'Google auth failed', error: error.message });
    }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            // Return 200 to prevent email enumeration attacks
            return res.status(200).json({ message: 'If that email is registered, a password reset link was sent.' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail', // Configure based on your needs
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'ServiceDeskHQ Password Reset',
            text: `You are receiving this because you (or someone else) requested a password reset for your account.\n\n` +
                  `Please click on the following link, or paste it into your browser to complete the process:\n\n` +
                  `${resetUrl}\n\n` +
                  `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'If that email is registered, a password reset link was sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to process forgot password request', error: error.message });
    }
});

// Reset Password
app.post('/api/auth/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
});

// ==========================================
// API ENDPOINTS (CRUD OPERATIONS)
// ==========================================

// 1. READ — Fetch all tickets (newest first)
app.get('/api/tickets', async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
    }
});

// 2. CREATE — Generate a new ticket with auto-incremented ID
app.post('/api/tickets', async (req, res) => {
    try {
        const ticketId = await getNextTicketId();

        const newTicket = await Ticket.create({
            ticketId,
            title: req.body.title,
            description: req.body.description,
            status: req.body.status || 'Open'
        });

        res.status(201).json({
            message: 'Ticket created successfully!',
            ticket: newTicket
        });
    } catch (error) {
        res.status(400).json({ message: 'Failed to create ticket', error: error.message });
    }
});

// 3. UPDATE — Modify a ticket's status, assignee, or details
app.put('/api/tickets/:id', async (req, res) => {
    try {
        const updateFields = {};
        if (req.body.title !== undefined)       updateFields.title = req.body.title;
        if (req.body.description !== undefined) updateFields.description = req.body.description;
        if (req.body.status !== undefined)      updateFields.status = req.body.status;
        if (req.body.assignee !== undefined)     updateFields.assignee = req.body.assignee;

        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedTicket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({
            message: 'Ticket updated successfully!',
            ticket: updatedTicket
        });
    } catch (error) {
        res.status(400).json({ message: 'Failed to update ticket', error: error.message });
    }
});

// 4. DELETE — Remove a ticket permanently (PROTECTED: Admin Only)
app.delete('/api/tickets/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);

        if (!deletedTicket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({ message: 'Ticket deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete ticket', error: error.message });
    }
});

// 5. ADD COMMENT — Append an internal note/comment to a ticket
app.post('/api/tickets/:id/comments', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.comments.push({
            author: req.body.author,
            text: req.body.text
        });

        await ticket.save();

        res.status(201).json({
            message: 'Comment added successfully!',
            ticket
        });
    } catch (error) {
        res.status(400).json({ message: 'Failed to add comment', error: error.message });
    }
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================

app.listen(PORT, () => {
    console.log(`Server is successfully running on http://localhost:${PORT}`);
});