require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const { google } = require("googleapis");
const fs = require("fs");
const { sendNotificationEmail } = require("./emailService");

// Load Google Service Account credentials from environment variable
if (process.env.NODE_ENV === "production") {
  // In production, parse the credentials from the environment variable
  key = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else {
  // In development, read the credentials from the file
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  key = require(keyFilePath);
}

const jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, [
  "https://www.googleapis.com/auth/drive",
]);

const drive = google.drive({ version: "v3", auth: jwtClient });

// Authenticate at server startup
jwtClient.authorize((err) => {
  if (err) {
    console.error("Error authenticating with service account:", err);
    return;
  }
  console.log("Successfully authenticated with service account");
  // listFiles();
});

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB limit
});

// Function to verify the shared folder exists
async function verifySharedFolder() {
  try {
    const folderId = process.env.SHARED_FOLDER_ID;
    console.log(`Verifying shared folder with ID: ${folderId}`);
    const folder = await drive.files.get({
      fileId: folderId,
      fields: "id, name",
    });
    console.log(
      `Shared folder verified: ${folder.data.name} (${folder.data.id})`
    );
    return folder.data.id;
  } catch (error) {
    console.error("Error verifying shared folder:", error.message);
    console.error("Error details:", JSON.stringify(error, null, 2));
    console.error("Service account email:", key.client_email);
    console.error("Folder ID being accessed:", process.env.SHARED_FOLDER_ID);
    console.error("Current scopes:", jwtClient.scopes);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

// Add a new route to check authentication status
app.get("/auth/status", (req, res) => {
  res.json({ isAuthenticated: !!jwtClient });
});

app.get("/auth/check", (req, res) => {
  try {
    // Check if the JWT client has credentials
    res.json({ authRequired: !jwtClient });
  } catch (error) {
    console.error("Error in /auth/check:", error);
    res.status(500).json({ error: "Authentication check failed" });
  }
});

app.post("/submit-video", upload.single("fileUpload"), async (req, res) => {
  console.log("Received request to /submit-video");
  try {
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    const formData = req.body;
    const file = req.file;

    console.log("Form data:", formData);
    console.log("File:", file);

    let fileInfo = null;
    let uploadMessage = "";

    if (file) {
      console.log("Attempting to verify shared folder");
      const folderId = await verifySharedFolder();
      console.log("Shared folder verified, ID:", folderId);

      console.log("Uploading file to Drive");
      const response = await uploadFileToDrive(file, folderId);
      console.log("File uploaded to Drive, response:", response);

      fileInfo = {
        fileName: response.name,
        fileSize: file.size,
        mimeType: response.mimeType,
        webViewLink: response.webViewLink,
      };
      uploadMessage = "File uploaded to Google Drive successfully. ";
    } else if (formData.videoLink) {
      console.log("Processing video link");
      fileInfo = {
        videoLink: formData.videoLink,
      };
      uploadMessage = "Video link submitted successfully. ";
    }

    if (fileInfo) {
      console.log("Sending notification email");
      await sendNotificationEmail(formData, fileInfo);
      uploadMessage += "Notification email sent.";
    } else {
      uploadMessage =
        "Form submitted successfully (no file or video link provided).";
    }

    console.log("Sending response");
    res.json({
      message: uploadMessage,
      fileInfo: fileInfo,
    });
  } catch (error) {
    console.error("Error processing form:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the form" });
  }
});

async function listFiles() {
  try {
    const response = await drive.files.list({
      pageSize: 10,
      fields: "files(id, name)",
    });
    console.log("Files:", response.data.files);
  } catch (error) {
    console.error("Error listing files:", error);
  }
}

async function uploadFileToDrive(file, folderId) {
  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      mimeType: file.mimetype,
      parents: [folderId],
    },
    media: {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    },
    fields: "id, name, mimeType, webViewLink, parents",
  });

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  fs.unlinkSync(file.path);

  return response.data;
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Catch-all route to serve index.html for any unmatched routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
