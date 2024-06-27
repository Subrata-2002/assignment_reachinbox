import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URL = 'http://localhost:3000/oauth2callback';


// setting up the google Oauth2

const oAuth2Client = new OAuth2Client(
    CLIENT_ID, 
    CLIENT_SECRET, 
    REDIRECT_URL
);



// here authUrl generates the URL that users visit to authorize the app to access their Gmail.
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify']
});


app.get("/",(req,res)=>{
    res.send("<h1>Hello</h1>")
})



app.get('/login', (req, res) => {
    res.redirect(authUrl);
});



app.get('/oauth2callback', async (req, res) => {

    try {
         const code = req.query.code; //here i extracts the authorization code from the query string.
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // console.log("mygmail is "+JSON.stringify(gmail));

        const unreadEmails = await getUnreadEmails(gmail);
        await categorizeAndRespond(gmail, unreadEmails);

        res.send("Responded to unread emails are done... :)");

    }
     catch (error) {
        console.error("Error in OAuth2 callback: ", error);
        res.status(500).send("An error occurred");
    }
});


const getUnreadEmails = async (gmail) => {
    try {
        //here i call the gmail api to get the all unread message list 

        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 1, // you can adjust how many result you want to see
            q: 'is:unread' // use for unread mail
        });

        const messages = res.data.messages;

        if (!messages || messages.length === 0) {
            console.log("There was no unread messages.To get it dont click any mail that you received");
            return [];
        }

        const emailDetails = [];

        for (let message of messages) {

            console.log("\n message id is "+message.id)

            const mdata = await gmail.users.messages.get({
                userId: 'me',
                id: message.id
            });

            console.log("\n mdata are "+mdata);

            // got this from google 
            const headers = mdata.data.payload.headers;
            const sender = headers.find(header => header.name === 'From').value;
            const subject = headers.find(header => header.name === 'Subject').value;

            const bodyData = mdata.data.payload.parts.find(part => part.mimeType === 'text/plain')?.body?.data || '';
            const body = Buffer.from(bodyData, 'base64').toString('utf-8');

            console.log('Message details: ', mdata.data);
            console.log('Sender name is : ', sender);
            console.log('Subject of the unread mail is : ', subject);

            console.log("body data is ", body);

            emailDetails.push({
                id: message.id,
                threadId: message.threadId,
                sender: sender,
                subject: subject,
                body: body
            });
        }
        // console.log("all emaildetaisl are"+emailDetails);

        return emailDetails;

    } catch (error) {
        console.error('Error fetching unread emails: ', error);
        return [];
    }
};



const categorizeAndRespond = async (gmail, emails) => {
    
    for (let email of emails) {
        
        // console.log("\n email from emialdetails "+email);

        const category = categorizeEmail();
        console.log(`Email classified as: ${category}`);

        const labelId = await getOrCreateLabel(gmail, category);
        await labelEmail(gmail, email.id, labelId);

        const replyText = generateReply(email.body, category);
        await sendReply(gmail, email, replyText);

        console.log(`Replied to email from ${email.sender} with category ${category}`);
    }
};

// Simulating categorization of the email
const categorizeEmail = () => {
    const categories = ['Interested', 'Not Interested', 'More Information'];
    // Mock categorization logic
    return categories[Math.floor(Math.random() * categories.length)];
};


//here this function  interacts with the Gmail API to either retrieve an existing 
// label or create a new one if it doesn't already exist

const getOrCreateLabel = async (gmail, labelName) => {
    try {
        const res = await gmail.users.labels.list({ userId: 'me' });// here gmail api list all the label of the user

        //Suppose here are the list of all lebel with id  [
        //     { id: '1', name: 'Work' },
        //     { id: '2', name: 'Personal' },
        //     { id: '3', name: 'Archive' }
        // ]

        let labelId = res.data.labels.find(label => label.name === labelName)?.id;
        // now here what happens is (suppose i assume "Important" as lebel)
        // now it findswith this lebel name , is not in the list, labelId will be undefined.
        //or if already in there then it returns the id.


        //if dont get then it create one
        if (!labelId) {
            const res = await gmail.users.labels.create({
                userId: 'me',
                requestBody: { name: labelName }
            });
            // { id: '4', name: 'Important' }

            labelId = res.data.id;
        }

        return labelId;
    } catch (error) {
        console.error('Error creating or retrieving label:', error);
        return null;
    }
};


// function labels a specific email in a Gmail account and removes unread level

const labelEmail = async (gmail, emailId, labelId) => {
    try {
        await gmail.users.messages.modify({
            userId: 'me',
            id: emailId,
            requestBody: {
                addLabelIds: [labelId],//The Gmail API adds the label with ID 67890 to the email with ID 12345.
                removeLabelIds: ['UNREAD']
            }
        });
    } catch (error) {
        console.log("wait!! got error in labelEmail fun :)", error);
    }
};


// Simulating generation of a reply based on the category
const generateReply = (emailBody, category) => {
    const replies = {
        'Interested': 'Thank you for your interest! We will get back to you shortly.',
        'Not Interested': 'Thank you for reaching out. We respect your decision.',
        'More Information': 'Could you please specify the information you need? We are here to help!'
    };
    return replies[category];
};


const sendReply = async (gmail, email, replyText) => {
    try {
        const encodedMessage = Buffer.from(
            `To: ${email.sender}\n` +
            `Subject: Re: ${email.subject}\n` +
            `Content-Type: text/plain; charset=UTF-8\n\n` +
            `${replyText}`,
            'utf-8'
        ).toString('base64');

        // The function sends the email using the Gmail API
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
                threadId: email.threadId
            }
        });
    } catch (error) {
        console.error('Error sending reply:', error);
    }
};


app.listen(port, () => {
    console.log("Server is running...");
});