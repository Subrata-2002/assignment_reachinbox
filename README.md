# assignment_reachinbox

This project is an email automation tool that interacts with Gmail to categorize unread emails and send automated replies. It uses the Google APIs and OAuth2 for authentication and authorization.

## Features
- Authenticates with Gmail using OAuth2.
- Get the unread emails.
- Categorizes emails into predefined categories.
- Adds labels to emails based on their category.
- Sends automated replies based on the email category.

## Note

- Gmail API enabled in Google Cloud Console

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:Subrata-2002/assignment_reachinbox.git
   cd assignment_reachinbox

2. Install dependencies:
   ```bash
   npm install

3. Create a .env file in the root directory and add your Google API credentials:   
    ```bash
    CLIENT_ID=your-client-id
    CLIENT_SECRET=your-client-secret

4. Start the server    
    ```bash
    npm start

    Open your browser and navigate to http://localhost:3000.
    Click on the /login route to authenticate with your Gmail account.
    After authentication, the app will process unread emails, categorize them, label them, and send automated replies.