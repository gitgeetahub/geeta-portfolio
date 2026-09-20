import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

const app = express();
console.log(
    'OpenRouter key:',
    process.env.OPENROUTER_API_KEY ? 'FOUND' : 'MISSING'
);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ===============================
// DATABASE
// ===============================

const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 160
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('Message', messageSchema);

// ===============================
// GEETA PORTFOLIO AI
// ===============================

const SYSTEM_INSTRUCTION = `
You are the AI assistant on Geeta Rani's personal portfolio website.

You are an AI, not a human.

Behave naturally and conversationally.

You can answer:
- normal questions
- greetings
- casual conversation
- jokes
- general questions
- questions about Geeta's portfolio

If someone asks whether you ate, slept, drank water, went somewhere,
or had another physical human experience, explain naturally that you are
an AI and do not have a physical body or human experiences.

Do NOT use canned responses.
Do NOT repeat the same introduction unnecessarily.
Answer the actual question the visitor asks.

For questions about Geeta, ONLY use the portfolio information below.
Never invent qualifications, projects, achievements, employers, dates,
marks, experience or personal information.

If the portfolio does not contain the answer, say that you don't have
that information.

Keep answers friendly, concise and professional.

PORTFOLIO INFORMATION:

Name: Guru Geeta Rani.

Education:
Third-year B.Tech Computer Science Engineering student
at Anurag University, Hyderabad.

CGPA:
8.35/10.

Experience:
Software Development Internship at SmartBridge.

SmartBridge project:
ShopEZ, a MERN e-commerce application using React, Node.js,
Express, MongoDB and JWT authentication.

Projects:
- Gen AI Curriculum Generator
- Smart Water Billing System
- Worker Attendance & Payment System

Skills:
Python, JavaScript, React.js, Node.js, Express.js, MongoDB,
Flask, SQLite, OpenAI API, Git and GitHub.

Contact:
Email: geetaaa.rani31@gmail.com
Phone: +91 9381178039

GitHub:
https://github.com/gitgeetahub
`;

// ===============================
// HEALTH CHECK
// ===============================

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        message: 'Portfolio backend is running.'
    });
});

// ===============================
// AI CHAT
// ===============================

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                error: 'Message is required.'
            });
        }

        const safeHistory = Array.isArray(history)
            ? history
                .slice(-12)
                .filter(
                    item =>
                        item &&
                        (item.role === 'user' || item.role === 'assistant') &&
                        typeof item.text === 'string'
                )
            : [];

        const messages = [
            {
                role: 'system',
                content: SYSTEM_INSTRUCTION
            },

            ...safeHistory.map(item => ({
                role: item.role,
                content: item.text.slice(0, 4000)
            })),

            {
                role: 'user',
                content: message.trim().slice(0, 4000)
            }
        ];

        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',

                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:5000',
                    'X-Title': 'Geeta Rani Portfolio'
                },

                body: JSON.stringify({
                    model: 'google/gemini-3.8-flash',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 400
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
    console.error('OpenRouter error:', data);

    return res.status(response.status).json({
        error: data?.error?.message || 'OpenRouter request failed.',
        details: data
    });
}

        const reply =
            data?.choices?.[0]?.message?.content ||
            'I could not generate a response right now.';

        res.json({ reply });

    } catch (error) {
        console.error('Chat error:', error);

        res.status(500).json({
            error: 'AI service is unavailable right now.'
        });
    }
});

// ===============================
// CONTACT FORM
// ===============================

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/messages', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim();
        const message = String(req.body.message || '').trim();

        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'Name, email and message are required.'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                error: 'Please enter a valid email address.'
            });
        }

        if (
            name.length > 80 ||
            email.length > 160 ||
            message.length > 2000
        ) {
            return res.status(400).json({
                error: 'One or more fields are too long.'
            });
        }

        const saved = await Message.create({
            name,
            email,
            message
        });

        // Optional email notification
        if (process.env.EMAIL_ENABLED === 'true') {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 465),
                secure: Number(process.env.SMTP_PORT || 465) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: process.env.OWNER_EMAIL,
                replyTo: email,
                subject: `New portfolio message from ${name}`,
                text:
                    `Name: ${name}\n` +
                    `Email: ${email}\n\n` +
                    `Message:\n${message}`
            });
        }

        res.status(201).json({
            success: true,
            id: saved._id
        });

    } catch (error) {
        console.error('Message error:', error);

        res.status(500).json({
            error: 'Could not save the message.'
        });
    }
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(`Portfolio backend running at http://localhost:${PORT}`);
});

// ===============================
// MONGODB
// ===============================

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected successfully.');
    })
    .catch(error => {
        console.error('MongoDB connection error:', error.message);
    });