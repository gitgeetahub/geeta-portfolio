# Geeta Portfolio — Full Stack Version

This project keeps the original portfolio design and adds:

- Geeta's uploaded profile photo
- Real Gemini AI chatbot instead of keyword/predefined replies
- Natural AI behavior (for example, it can explain that it cannot eat because it is an AI)
- Backend with Node.js + Express
- MongoDB storage for contact messages
- Optional email notification for new contact messages

## 1. Requirements

Install Node.js 18+ (Node.js 22 is fine).

Create a MongoDB Atlas database and get its connection string.
Create a Gemini API key in Google AI Studio.

## 2. Backend setup

Open a terminal in `backend`:

```powershell
npm install
```

Copy `.env.example` to `.env` and fill in:

```env
GEMINI_API_KEY=your_key
MONGODB_URI=your_mongodb_connection_string
```

Start the backend:

```powershell
npm start
```

You should see:

```text
Portfolio backend running at http://localhost:5000
MongoDB connected successfully.
```

## 3. Open the frontend

Open `frontend/index.html` in VS Code with Live Server, or serve the frontend through any static web server.

The chatbot and contact form call `http://localhost:5000` while developing locally.

## 4. Optional email notifications

The contact form always saves messages to MongoDB. To also receive an email when someone submits the form, set:

```env
EMAIL_ENABLED=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_gmail_app_password
OWNER_EMAIL=geetaaa.rani31@gmail.com
```

For Gmail, use an App Password rather than your normal Gmail password.

## 5. Important security rule

Never put `GEMINI_API_KEY` in the frontend HTML or JavaScript and never commit `.env` to GitHub.
