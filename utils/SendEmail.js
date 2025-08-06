"use strict";
const nodemailer = require("nodemailer");

/**
 * @description Sends an email using Gmail's SMTP service.
 * @param {*} auth - eg. {user : "abc", pass : "xyz"} Authentication credentials for Gmail SMTP
 * @param {string} from - The sender's email address
 * @param {string|string[]} email - The recipient's email address(es)
 * @param {string} subject - The subject of the email
 * @param {string} text - The plain text content of the email
 * @param {string} html - The HTML content of the email
 * @param {string|string[]} [cc=[]] - CC recipients of the email
 * @param {string|string[]} [bcc=[]] - BCC recipients of the email
 * @returns the response from the email service
 * @throws {Error} If authentication credentials are missing or email sending fails
 */
async function sendEmail(auth, from, email, subject, text, html, cc = [], bcc = []) {
    if (!auth || !auth.user || !auth.pass) {
        throw new Error("Authentication credentials are required.");
    }
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: auth
    });

    const options = {
        from: from || auth.user,
        to: Array.isArray(email) ? email.join(",") : email,
        cc: Array.isArray(cc) ? cc.join(",") : cc,
        bcc: Array.isArray(bcc) ? bcc.join(",") : bcc,
        subject: subject,
        text: text,
        html: html
    };

    try {
        const info = await transporter.sendMail(options);
        return info.response;
    } catch (err) {
        throw err;
    }
}

module.exports = { sendEmail };
