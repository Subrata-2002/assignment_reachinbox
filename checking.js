import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import  OpenAi  from 'openai';
import dotenv from "dotenv";
dotenv.config();

const app = express();

const ClientId = process.env.CLIENT_ID;
const ClientSecret = process.env.CLIENT_SECRET;
const redirecturl = 'http://localhost:3000/oauth2callback';

const oAuth2Client = new OAuth2Client(ClientId, ClientSecret, redirecturl);

const openai = new OpenAi({
    apiKey: process.env.OPENAI_API_KEY,
});

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify']
});

app.get('/login', (req, res) => {
    res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
    try {
        const code = req.query.code;
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const unreadEmails = await getUnreadEmails(gmail);
        await categorizeAndRespond(gmail, unreadEmails);

        res.send("Categorized and responded to unread emails.");
    } catch (error) {
        console.error("Error in OAuth2 callback: ", error);
        res.status(500).send("An error occurred");
    }
});

app.listen(3000, () => {
    console.log('Running at Port 3000');
});

const getUnreadEmails = async (gmail) => {
    try {
        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 2,
            q: 'is:unread'
        });

        const messages = res.data.messages;
        if (!messages || messages.length === 0) {
            console.log("No unread messages found.");
            return [];
        }

        const emailDetails = [];

        for (let message of messages) {
            const mdata = await gmail.users.messages.get({
                userId: 'me',
                id: message.id
            });

            const headers = mdata.data.payload.headers;
            const sender = headers.find(header => header.name === 'From').value;
            const subject = headers.find(header => header.name === 'Subject').value;

            const bodyData = mdata.data.payload.parts.find(part => part.mimeType === 'text/plain')?.body?.data || '';
            const body = Buffer.from(bodyData, 'base64').toString('utf-8');

            console.log("Message details: ", mdata.data);
            console.log("Sender: ", sender);
            console.log("Subject: ", subject);

            emailDetails.push({
                id: message.id,
                threadId: message.threadId,
                sender: sender,
                subject: subject,
                body: body
            });
        }

        return emailDetails;
    } catch (error) {
        console.error("Error fetching unread emails: ", error);
        return [];
    }
};

const categorizeAndRespond = async (gmail, emails) => {
    for (let email of emails) {
        const category = await categorizeEmail(email.body);
        console.log(`Email classified as: ${category}`);

        const labelId = await getOrCreateLabel(gmail, category);
        await labelEmail(gmail, email.id, labelId);

    

        console.log(labelId);
    }
};

const categorizeEmail = async (emailBody) => {
    const response = await openai.completions.create({
        model: "gpt-3.5-turbo",
        prompt: `Classify the following email into one of these categories: Interested, Not Interested, More Information.\n\nEmail:\n\n${emailBody}`,
        max_tokens: 50
    });

    return response.data.choices[0].text.trim();
};

const getOrCreateLabel = async (gmail, labelName) => {
    const res = await gmail.users.labels.list({ userId: 'me' });
    let labelId = res.data.labels.find(label => label.name === labelName)?.id;

    if (!labelId) {
        const res = await gmail.users.labels.create({
            userId: 'me',
            requestBody: { name: labelName }
        });
        labelId = res.data.id;
    }

    return labelId;
};

const labelEmail = async (gmail, emailId, labelId) => {
    await gmail.users.messages.modify({
        userId: 'me',
        id: emailId,
        requestBody: {
            addLabelIds: [labelId],
            removeLabelIds: ['UNREAD']
        }
    });
};

