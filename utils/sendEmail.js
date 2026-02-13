const nodemailer = require("nodemailer");
const transporter = require("./../config/nodemailer.config");

const sendEmail = async (message) => {
  const info = await transporter.sendMail(message);
  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
};

module.exports = sendEmail;