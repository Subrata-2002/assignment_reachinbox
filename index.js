import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';



import express from 'express';
const app = express();



// require('dotenv').config();
import dotenv from "dotenv";
dotenv.config();

//all the secret items must be kept in env folder

const ClientId = process.env.CLIENT_ID;
const ClientSecret = process.env.CLIENT_SECRET;
const redirecturl = 'http://localhost:3000/oauth2callback';



//keeping secrets open just for testing purpose

// const redirecturl = 'http://localhost:3000/oauth2callback';


///STEP 1
//setting up the google outh2

const oAuth2Client = new OAuth2Client(
    ClientId,
    ClientSecret,
    redirecturl
);

//
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify']
});



app.get('/login', (req, res) => {
    res.redirect(authUrl);
});


// finally we get redirected here

app.get('/oauth2callback', async (req, res) => {

    const code = req.query.code;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const gmail = google.gmail(
        {
            version: 'v1',
            auth: oAuth2Client
        }
    );


    // this function will get the mail from the string which is generally of the format (Name <mail@gmail.com>)
    // so i need to extraxt the mail@gmail.com

    function getMail(str) {
        const mail = str
        let flag = false
        let receiverMail = ""
        for (let j = 0; j < mail.length; j++) {

            if (mail[j] === '>') {
                break;
            }
            if (flag) receiverMail += mail[j]

            if (mail[j] === '<') {
                flag = true
            }



        }
        //if the mail is directly given
        //can happen in some of the cases(some of the header payloads just gave the mail,found it out while trying)
        if (receiverMail.length === 0) {

            receiverMail = mail

        }

        return receiverMail
    }


    // Send reply to email
    async function send_Reply(email, receiverMail) {

        // this is the message object
        // for the enhancement purpose this this message could also be dyanamic/ taking the inputs an all 
        const message = {
            to: receiverMail,
            subject: 'Backend intern',
            text: 'Cannot talk right now, but I Think I can be the perfect fit for the intern you are looking for and join you after vacations'
        };

        // the message should be sent in encoded form
        // got this stuff through internet 
        const encodedMessage = Buffer.from(
            `To: ${message.to}\n` +
            `Subject: ${message.subject}\n` +
            `Content-Type: text/plain; charset=UTF-8\n` +
            `\n` +
            `${message.text}`,
            'utf-8'
        ).toString('base64');

        const response = await gmail.users.messages.send({
            userId: 'me',
            resource: {
                raw: encodedMessage
            },
            threadId: email.threadId
        });
        return response.data;
    }

    // this is the senders email whose emails we want to reply
    // this app works on the test users setted up by me only
    //there could have been methods for dyanamically setting it
    // 1st-could have taken a form input
    // 2nd-get it extracted from the oauth2(tried but could't figure it out (: 
    const sendersEmail = "rujnabin@gmail.com"



    // first time thread
    // as given in the challenge the replies must be sent to only those thread where reply is not sent earlier
    async function detectNewThread(email) {
        // got the thread by this
        const res = await gmail.users.threads.get({
            userId: 'me',
            id: email.threadId
        });
        const thread = res.data;
        const messages = thread.messages;
        // this is the reciever's email 
        let emailExtracted = "";

        for (let i = 0; i < messages.length; i++) {

            console.log(messages[i].payload.headers)
            // what this does is it will find if the thresd is replied already ever before
            const mailString = messages[i].payload.headers.find(header => header.name === 'From').value
            emailExtracted = getMail(mailString)
            console.log(emailExtracted);
            if (emailExtracted.includes(sendersEmail)) {
                return [false, "don't send the mail"];
            }
        }

      const  ls = [true, emailExtracted];

        // so an array is returned in order to avoid redundency
        // as if it is a new thread we need to send message to the specific email address from which the  email arrived
        // this could be accessed by the second element of the array 


        return ls;


    }

    // this function is to get the unreademails

    async function unreaded_mails() {
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread'
        });

        return res.data.messages;
    }

    
    async function addLabel(email) {

        const label = {
            name: 'Intern'
        };


        let flag = true;
        let labelId = "";

        // Call the Gmail API's users.labels.list method to get a list of labels
        // belonging to the authorized user
        gmail.users.labels.list({
            userId: 'me',
        }, (err, res) => {

            if (err) {
                console.error(err);
                console.log('mil gya error');
                return;
            }

            // Iterate 
            res.data.labels.forEach((ele) => {
                // If the label name matches "Intern", set labelId to the label's ID and
                // set flag to false to indicate that the label exists
                if (ele.name === "Intern") {
                    labelId = ele.id;
                    flag = false;
                }
            })


            if (flag) {
                gmail.users.labels.create({
                    userId: 'me',
                    resource: label
                }, (err, res) => {

                    if (err) {
                        console.error(err.errors[0].message);
                        console.log("kya error yaha hai??(1)")
                        return;
                    }
                    // Set labelId to the newly created label's ID
                    labelId = res.data.id;
                });
            }


            gmail.users.messages.get({
                userId: 'me',
                id: email.id
            }, (err, res) => {

                if (err) {
                    console.error(err);
                    console.log("kya error yaha hai??(2)")
                    return;
                }

                const message = res.data;
                // Define the newMessage object to specify the label to add and
                // the label to remove
                const removeLabel = 'UNREAD';
                const newMessage = {
                    addLabelIds: [labelId],
                    removeLabelIds: [removeLabel]
                };
                // Call the Gmail API's users.messages.modify method to apply the
                // newMessage object to the message
                gmail.users.messages.modify({
                    userId: 'me',
                    id: message.id,
                    resource: newMessage
                }, (err, res) => {

                    if (err) {
                        console.log("kya error yaha hai??(3)")
                        console.error(err.errors[0].message);
                        return;
                    }
                });
            });
        });

        // Return from the function
        // this was kindof difficult task
        // took a lot of debugging

        return;

    }






    // now this function is to generate ramdom time intervals
    function getRandomTimeInterval() {

        const randomSeconds = Math.floor(Math.random() * (120 - 45 + 1) + 45);


        const randomMilliseconds = randomSeconds * 1000;


        return randomMilliseconds;
    }

    // async function mainfunction(){
    //     const emails = await unreaded_mails();
    //     if (emails?.length > 0) {

    //         for (let i = 0; i < emails.length; i++) {

    // const email = emails[i];

    // const responsei = await detectNewThread(email)
    // // console.log(responsei);
    // // the responsie is a array whose first value tells if the emails should be sent or not
    // // and the second value tells if the email should be send then the reciver's address

    // const flag = responsei[0]

    // if (flag) {

    //     // const receiverMail = responsei[1]
    //     //here we can check before repling that if in case it has been replied earlier
    //     // the send_reply takes two arguments the second one is the recivers mails 
    //     await send_Reply(email, responsei[1]);
    //     // then add the label
    //     await addLabel(email);
    //             

    //             }
    //         }
    //     }

    // }


    // This keeps on running theprogram repeatedly after a delay of random intervals

    // setInterval(mainfunction , getRandomTimeInterval())





    setInterval(async () => {

        const emails = await unreaded_mails();
        console.log(emails);

        // here the question was a little unclear to me as it was written that 
        // only one email should be senyt to one email
        // if it means that only one email should be sent to one email thread
        //then this code works fine
        // or else
        //if it means that one response to one mail address
        // then in that case we can use SET DATA STRUCTURE here to check weather or not that email is previously replied or not  
        
        if (emails?.length !== 0) {

            for (let i = 0; i < emails.length; i++) {
                const email = emails[i];

                const responsei = await detectNewThread(email)

                // console.log(responsei);
                // the responsie is a array whose first value tells if the emails should be sent or not
                // and the second value tells if the email should be send then the reciver's address

                const flag = responsei[0]

                if (flag) {

                    // const receiverMail = responsei[1]
                    //here we can check before repling that if in case it has been replied earlier
                    // the send_reply takes two arguments the second one is the recivers mails 

                    await send_Reply(email, responsei[1]);

                    // then add the label

                    await addLabel(email);

                }
            }
        }
    }
        , 6000)


    res.send("Your messages are being replied");


});

app.listen(3000, () => {
    console.log('Running at Port 3000');
});
