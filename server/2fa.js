const config = require("./config");

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'verify.roomber@gmail.com',
        pass: config.notfunny
    }
});

function verifyEmail(username, address, callback) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    let message = `<center><img src='http://roomber-app.herokuapp.com/assets/roomberfull2.png' alt='Roomber' style='font-size: 2.5rem;color:black' height='200'></center><div style='border:4px solid #a7a7a7;border-radius:4px;width:80%;height:40%;background:#fff;width:50%;margin:0 auto;padding:10px;'><h1 style='color: black;'>Hi <p style='font-weight:700;padding:2px 4px;border-radius:4px;margin:0 5px 0 0;display:inline-block;background-color:rgba(0,0,0,.2)'>${username}</p>, welcome to Roomber!</h1><br>Thanks for creating a Roomber account! Unfortunately you have to confirm your email address before you start. But that's no problem, just copy n' paste this code to finish everything up!<br><p style='text-align:center;color:#000;font-size:4rem;font-family:Arial,Helvetica,sans-serif'>${code}</p></div>`
    const mailOptions = {
        from: 'Roomber Verification',
        to: address,
        subject: 'Verify your Roomber account',
        html: message
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            callback({ error: err });
        } else {
            callback(code);
        }
    })
}

module.exports = verifyEmail;
