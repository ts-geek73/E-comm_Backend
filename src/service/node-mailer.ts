import dotenv from "dotenv";
import nodemailer from 'nodemailer';
dotenv.config();

export const mailSender = async (email: string, title: string, body: string) => {
  try {
    // Create a Transporter to send emails
    if(!email){
      console.log("email not found"); 
      return
    }
    // console.log(email , title);
    

    if(!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD){
      throw new Error("Email Cread is not Founds");
    }
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // ✅ Corrected
      port: 465,               // ✅ Added port
      secure: true,   
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      }
    });

    // console.log(transporter);
    

    let info = await transporter.sendMail({
      from: 'E-commerce Otp recovering MAil',
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email info: ", info);
    return info;
  } catch (error : any) {
    console.log("error in send mail", error.message);
  }
};