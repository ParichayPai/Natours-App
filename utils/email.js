const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email{
    constructor(user, url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Parichay Pai <${process.env.EMAIL_FROM}>`
    }

    createNewTransport(){
        if(process.env.NODE_ENV === 'production'){
            // SendGrid
            console.log("Hello There");
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                }
            })
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Send the actual Email
    async send(template, subject){
        // 1] Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2] Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
        }

        // 3] Create transport and send mail
        await this.createNewTransport().sendMail(mailOptions);
    }

    async sendWelcome(){
        await this.send('welcome','Hello There! Welcome to the Natours site!')
    }

    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token is only valid for 10 mins')
    }
}
