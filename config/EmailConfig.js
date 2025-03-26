const nodemailer = require('nodemailer');

// Cấu hình transporter cho Gmail (bạn có thể thay đổi SMTP khác)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Sử dụng biến môi trường
    pass: process.env.EMAIL_PASS  // Sử dụng mật khẩu ứng dụng
  }
});

// Hàm gửi email xác nhận
const sendConfirmationEmail = async (to, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: 'EcoShipper xác nhận thông tin liên hệ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Xác nhận thông tin liên hệ</h2>
          <p>Xin chào ${name},</p>
          <p>Chúng tôi đã nhận được thông tin liên hệ của bạn. Cảm ơn bạn đã gửi quan tâm và liên hệ với hệ thống của chúng tôi. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Hàm gửi email phản hồi
const sendResponseEmail = async (to, name, responseMessage) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: 'Phản hồi thông tin liên hệ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Phản hồi thông tin liên hệ</h2>
          <p>Xin chào ${name},</p>
          <p>Chúng tôi đã xem xét thông tin liên hệ của bạn. Dưới đây là phản hồi của chúng tôi:</p>
          <p>${responseMessage}</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Response email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending response email:', error);
    return false;
  }
};

module.exports = { sendConfirmationEmail, sendResponseEmail };