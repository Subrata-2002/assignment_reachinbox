# 🚀 AI-Powered Email Automation System

An intelligent email automation platform that integrates with Gmail and OpenAI to automatically classify incoming emails, organize inboxes, generate context-aware responses.

This project demonstrates how AI can be combined with real-world business processes to reduce manual effort while maintaining response quality and control.

---

## 📌 Overview

Managing emails manually becomes challenging as inbox volume grows. This application automates the email management lifecycle by:

* Authenticating users securely through Google OAuth2
* Fetching unread emails from Gmail
* Understanding email intent using OpenAI GPT
* Categorizing emails into predefined classes
* Automatically applying Gmail labels
* Generating professional contextual replies
* Supporting approval-based response workflows
* Sending thread-aware email replies

The system is designed to streamline customer communication, sales outreach, support requests, and business correspondence.

---

## ✨ Features

### 🔐 Secure Gmail Authentication

* Google OAuth2 authentication
* Offline access token support
* Secure credential management using environment variables
* Permission-based Gmail access

### 🤖 AI-Powered Email Classification

Emails are analyzed using OpenAI GPT and categorized into:

| Category         | Description                                       |
| ---------------- | ------------------------------------------------- |
| Interested       | User expresses interest or positive intent        |
| Not Interested   | User declines or shows no interest                |
| More Information | User requests additional details or clarification |

### 🏷️ Automated Email Organization

* Creates Gmail labels dynamically
* Applies labels automatically
* Marks processed emails as read
* Keeps inboxes organized without manual effort

### ✍️ Intelligent Reply Generation

Generates professional and context-aware responses based on email intent.

Examples include:

* Lead follow-up responses
* Product information replies
* Clarification emails
* Customer engagement messages

### 🔄 Thread-Aware Communication

Replies are sent within the original Gmail conversation thread to preserve context and improve communication flow.

---

## 🏗️ System Architecture

```text
                     ┌──────────────┐
                     │ Gmail Inbox  │
                     └──────┬───────┘
                            │
                            ▼
               ┌─────────────────────┐
               │ Gmail API Fetcher   │
               └─────────┬───────────┘
                         │
                         ▼
               ┌─────────────────────┐
               │ Email Parser        │
               └─────────┬───────────┘
                         │
                         ▼
               ┌─────────────────────┐
               │ OpenAI GPT Engine   │
               └─────────┬───────────┘
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼

 Interested      Not Interested      More Info

       └─────────────────┬─────────────────┘
                         ▼
               ┌─────────────────────┐
               │ Reply Generator     │
               └─────────┬───────────┘
                         ▼
               ┌─────────────────────┐
               │ Approval Workflow   │
               └─────────┬───────────┘
                         ▼
               ┌─────────────────────┐
               │ Gmail Sender API    │
               └─────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer          | Technology    |
| -------------- | ------------- |
| Runtime        | Node.js       |
| Framework      | Express.js    |
| Authentication | Google OAuth2 |
| Email Service  | Gmail API     |
| AI Model       | OpenAI GPT    |
| Configuration  | dotenv        |
| Development    | Nodemon       |

---

## 📂 Project Structure

```bash
assignment_reachinbox/
│
├── index.js              # Main application
├── checking.js           # GPT-powered implementation
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Gmail API Setup

### Step 1: Create Google Cloud Project

1. Open Google Cloud Console.
2. Create a new project.

### Step 2: Enable Gmail API

1. Navigate to APIs & Services.
2. Click "Enable APIs and Services".
3. Search for Gmail API.
4. Enable the API.

### Step 3: Create OAuth Credentials

1. Navigate to Credentials.
2. Click Create Credentials.
3. Select OAuth Client ID.
4. Choose Desktop Application.
5. Download credentials.

Save:

* CLIENT_ID
* CLIENT_SECRET

---

## 🔑 OpenAI Setup

1. Create an OpenAI account.
2. Generate a new API key.
3. Save the API key securely.

---

## 📦 Installation

### Clone Repository

```bash
git clone https://github.com/Subrata-2002/assignment_reachinbox.git

cd assignment_reachinbox
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
# Google OAuth Credentials
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Server Port
PORT=3000
```

---

## ▶️ Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server:

```bash
http://localhost:3000
```

---

## 🚀 Usage

### Step 1: Authenticate

Open:

```bash
http://localhost:3000/login
```

Authorize access to your Gmail account.

### Step 2: Automatic Processing

The application will:

* Retrieve unread emails
* Extract sender, subject, and content
* Classify email intent using GPT
* Create and apply Gmail labels
* Generate contextual responses
* Send thread-aware replies
* Mark emails as processed

### Step 3: Verify Results

Check Gmail:

* New labels appear automatically
* Emails are categorized
* Replies are available in Sent Mail

---

## 📊 Email Processing Flow

```text
User Login
    │
    ▼
Google OAuth2 Authentication
    │
    ▼
Fetch Unread Emails
    │
    ▼
Parse Email Content
    │
    ▼
GPT Classification
    │
    ▼
Apply Gmail Labels
    │
    ▼
Generate Reply Draft
    │
    ▼
Review & Approval
    │
    ▼
Send Email Response
    │
    ▼
Mark Email Processed
```

---

## 🔌 API Endpoints

| Endpoint        | Method | Description                |
| --------------- | ------ | -------------------------- |
| /               | GET    | Health check               |
| /login          | GET    | Start OAuth authentication |
| /oauth2callback | GET    | Gmail processing workflow  |


---

## 👨‍💻 Author

**Subrata**

GitHub: https://github.com/Subrata-2002

---

## 📜 License

This project is licensed under the MIT License.

Feel free to use, modify, and distribute this project for educational and commercial purposes.
