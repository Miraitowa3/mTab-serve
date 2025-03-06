const nodemailer = require('nodemailer');
const { emailConfig } = require('./config');
class SendEmail {
    constructor(config) {
        this.transporter = nodemailer.createTransport(config);
    }
    sendSimpleEmail(mailOptions) {
        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    resolve([false, error]);
                } else {
                    resolve([true, info]);
                }
            });
        });
    }
}

module.exports = new SendEmail(emailConfig);
