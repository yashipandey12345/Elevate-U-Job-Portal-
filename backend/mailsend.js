import nodemailer from 'nodemailer'
const transpoter= nodemailer.createTransport({
    secure:true,
    host:"smtp.gmail.com",
    port:465,
    auth:{
        user:'singlaanmol23@gmail.com',
        pass:'nukyzusflzfvzlyf'
    }
})

function sendMail(to,sub,msg){
    transpoter.sendMail({
        to:to,
        subject:sub,
        html:msg
    });
     
}

sendMail("singlaanmol23@gmail.com","Haan bhai","Kiase ho");