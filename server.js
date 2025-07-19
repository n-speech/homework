require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.post('/send-homework', upload.single('file'), async (req, res) => {
  const { name } = req.body;
  const file = req.file;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"Форма с сайта" <${process.env.SMTP_USER}>`,
    to: process.env.TO_EMAIL,
    subject: `Домашняя работа от ${name}`,
    text: `Ученик ${name} отправил файл.`,
    attachments: [
      {
        filename: file.originalname,
        path: file.path
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Письмо отправлено!' });
  } catch (error) {
    console.error('Ошибка при отправке:', error);
    res.status(500).json({ success: false, message: 'Не удалось отправить письмо' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Сервер запущен на порту ${port}`));
