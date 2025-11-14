Hair Studio: AI Hairstyle Try-On Platform

`Hair Studio is a full-stack, cross-platform application that leverages AI image generation to allow users to virtually try on new hairstyles.
This repository contains the complete codebase, showcasing a production-ready system that integrates secure monetization, a robust Node.js API, and a unified React codebase deployed to both the web and native mobile platforms (iOS/Android) via Capacitor.`


This guide assumes you have Node.js (v18+) and npm installed.
1. Backend Setup
    1. Navigate to the API directory (e.g., server/).
    2. Install dependencies:
       npm install
       
    3. Create a .env file in the root of the API directory and add your environment variables (e.g., MONGO_URI, JWT_SECRET, REVENUECAT_WEBHOOK_TOKEN, AI_API_KEY).
       # Example .env structure
       MONGO_URI="mongodb://localhost:27017/hairstudio_db"
       JWT_SECRET="YOUR_STRONG_SECRET"
       # ... other keys (Google OAuth, AI service credentials)
       
    4. Start the API server:
       npm run dev
       
2. Frontend Setup
    1. Navigate to the client directory (e.g., client/ or src/).
    2. Install dependencies:
       npm install
       
    3. Start the React development server:
       npm start # or npm run dev
       
3. Mobile Deployment (Capacitor)
    1. Install the Capacitor CLI globally:
       npm install -g @capacitor/cli
       
    2. Build the web application:
       npm run build
       
    3. Copy web assets to native projects:
       npx cap copy
       
    4. Open the native IDE (e.g., Android Studio or Xcode):
       npx cap open ios # or npx cap open android
       
       Note: This step requires a full build setup for the respective platforms.


