const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendNotificationEmail(formData, fileInfo) {
  let fileDetails = "";
  if (fileInfo.fileName) {
    fileDetails = `
      <h2>Uploaded File Details:</h2>
      <p><strong>File Name:</strong> ${fileInfo.fileName}</p>
      <p><strong>File Size:</strong> ${(
        fileInfo.fileSize /
        (1024 * 1024)
      ).toFixed(2)} MB</p>
      <p><strong>File Type:</strong> ${fileInfo.mimeType}</p>
      <p><strong>Google Drive Link:</strong> <a href="${
        fileInfo.webViewLink
      }">${fileInfo.webViewLink}</a></p>
    `;
  } else if (fileInfo.videoLink) {
    fileDetails = `
      <h2>Submitted Video Link:</h2>
      <p><strong>Video Link:</strong> <a href="${fileInfo.videoLink}">${fileInfo.videoLink}</a></p>
    `;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "New Submission Notification",
    html: `
      <h1>New Submission</h1>
      <p><strong>Name:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      ${fileDetails}
    `,
    // To modify the email format:
    // 1. Edit the HTML structure above
    // 2. Add or remove fields as needed
    // 3. Adjust styling using inline CSS
    // Example: <p style="color: #333; font-size: 16px;">...</p>
    // 4. You can also use a separate HTML template file for more complex layouts
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Notification email sent successfully");
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
}

// Example of current email output:
/*
Subject: New Submission Notification

<h1>New Submission</h1>
<p><strong>Name:</strong> John Doe</p>
<p><strong>Email:</strong> johndoe@example.com</p>
<h2>Uploaded File Details:</h2>
<p><strong>File Name:</strong> example.pdf</p>
<p><strong>File Size:</strong> 2.50 MB</p>
<p><strong>File Type:</strong> application/pdf</p>
<p><strong>Google Drive Link:</strong> <a href="https://drive.google.com/file/d/...">https://drive.google.com/file/d/...</a></p>

// Or, if a video link is provided:
<h2>Submitted Video Link:</h2>
<p><strong>Video Link:</strong> <a href="https://www.youtube.com/watch?v=...">https://www.youtube.com/watch?v=...</a></p>
*/

module.exports = { sendNotificationEmail };
