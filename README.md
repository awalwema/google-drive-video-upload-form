# Google Video Upload Service

[![Video Demo](https://img.youtube.com/vi/ZLFszmoKKTc/0.jpg)](https://www.youtube.com/watch?v=ZLFszmoKKTc)

## Description

This project is a web application that allows users to upload videos or provide video links for translation services. It integrates with Google Drive for file storage and uses email notifications for new submissions.

## Features

- Customizable email notifications
  - Easily modify the email format in `emailService.js`
  - Add or remove fields, adjust styling, or use a separate HTML template for complex layouts

## Setup Instructions

2. Setting up the Local Environment:

a. Create a Google Cloud Project:

- Go to the [Google Cloud Console](https://console.cloud.google.com/)
- Click on "Select a project" at the top and then "New Project"
- Name your project (e.g., "Video Translation Uploads") and create it

b. Enable the Google Drive API:

- In the Google Cloud Console, go to "APIs & Services" > "Library"
- Search for "Google Drive API" and enable it

c. Create a Service Account:

- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" and select "Service Account"
- Fill in the details and create the account
- Once created, click on the service account to view its details
- Under "Keys", add a new key and select JSON format
- This will download a JSON file - keep this safe as you'll need it later

d. Set up Google Drive folder:

- In Google Drive, create a folder for the uploads
- Right-click the folder and click "Share"
- Add the email address of the service account (found in the JSON file) and give it "Editor" access
- Note down the folder ID from the URL (it's the long string after /folders/ in the URL)

### 2. Email Setup (for Gmail)

a. Create an App Password:

- Go to your [Google Account](https://myaccount.google.com/)
- Select "Security" on the left
- Under "Signing in to Google," select "2-Step Verification" - you may need to turn this on
- At the bottom of the page, select "App passwords"
- Select "Mail" and "Other (Custom name)" from the dropdowns
- Enter a name for the app (e.g., "Video Upload Notifier")
- Google will generate a 16-character password - copy this

b. Note down the following:

- Your Gmail address
- The generated App Password

### 3. Heroku Setup

a. Create a Heroku account if you don't have one: https://signup.heroku.com/

b. Install the Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

c. Login to Heroku CLI:

```
heroku login
```

d. Create a new Heroku app:

```
heroku create your-app-name
```

e. Set up environment variables:

```
heroku config:set GOOGLE_APPLICATION_CREDENTIALS="$(cat path/to/your/credentials.json)" --app your-app-name
heroku config:set PORT=3000 --app your-app-name
heroku config:set EMAIL_USER=your-gmail@gmail.com --app your-app-name
heroku config:set EMAIL_PASS="your-app-password" --app your-app-name
heroku config:set SHARED_FOLDER_ID=your-google-drive-folder-id --app your-app-name
```

### 4. Local Development Setup

a. Clone the repository:

```
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

b. Install dependencies:

```
npm install
```

c. Create a `.env` file in the root directory with the following content:

```
GOOGLE_APPLICATION_CREDENTIALS=./path-to-your-credentials.json
PORT=3000
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS="your-app-password"
SHARED_FOLDER_ID=your-google-drive-folder-id
```

d. Place your Google Cloud credentials JSON file in the root directory

e. Start the app locally:

```
npm start
```

f. Visit http://localhost:3000 to test the app

### 5. Deployment

a. Commit your changes:

```
git add .
git commit -m "Your commit message"
```

b. Deploy to Heroku:

```
git push heroku main
```

c. Open the app in your browser:

```
heroku open
```

### 6. Customization

- Modify the HTML in `public/index.html` to change the page content and structure
- Update the CSS in `public/styles.css` to adjust the styling
- Edit the JavaScript in `public/script.js` to modify client-side functionality
- Adjust server-side logic in `server.js` and `emailService.js` as needed

### Important Notes

- Never commit or share your `.env` file or Google Cloud credentials JSON file publicly
- For significant code changes or feature updates, thoroughly test locally before deploying
- Regularly update your dependencies to ensure security and performance

For any questions or assistance, please don't hesitate to reach out at gratatouille23@gmail.com.
