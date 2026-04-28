# 🚀 Vanigan WhatsApp Bot & Web Platform

Welcome to **Vanigan**, a comprehensive platform designed to empower professional communities at the district level. This repository contains the source code for both the **WhatsApp Bot** (built with Node.js and Meta Cloud API) and the **Vanigan Frontend** (built with React + Vite).

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v18+-61DAFB.svg)](https://reactjs.org/)

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Environment Variables](#-environment-variables)
- [Quick Start](#-quick-start)
- [Deployment](#-deployment)
- [Future Upgrades & Contribution](#-future-upgrades--contribution)

---

## 🌟 Project Overview

**Vanigan** is a networking and discovery platform that enables users to connect with businesses, organizers, and members within their district. It provides two main points of entry:
1.  **WhatsApp Bot**: An interactive chatbot for quick discovery, navigation, and business registration directly within WhatsApp.
2.  **Web Portal**: A responsive frontend for viewing richer content and a broader scope of the community.

Visit the live platform: [https://vanigan-whats-app.vercel.app/](https://vanigan-whats-app.vercel.app/)

---

## ✨ Key Features

### 🤖 WhatsApp Bot
- **Interactive Menus**: Uses WhatsApp List and Button interactive messages for a seamless UX.
- **Business Directory**: Browse businesses by category (Retail, Manufacturing, Services, etc.).
- **Organizer & Member Search**: Find and connect with community leads and members.
- **Digital Business Registration**: Register businesses directly through the bot via a guided state machine.
- **Local News**: Stay updated with the latest events in your district.
- **Dynamic Session Management**: Keeps track of user navigation state for a smooth back/forth experience.

### 🌐 Web Portal (Frontend)
- **Responsive Dashboard**: Fully responsive design for all screen sizes.
- **Comprehensive Listings**: Detailed views of businesses and members.
- **Community Analytics**: Insights into district-wide growth and performance.

---

## 🏗️ Architecture

The project is structured as a monorepo consisting of:

- `index.js`: The main entry point for the WhatsApp Bot (Express backend).
- `vanigan-frontend/`: A React application serving the web portal.
- `render.yaml`: Configuration for deploying the bot on Render.

### 🔄 How it Works (WhatsApp Bot)
The bot uses a **State Machine** architecture to handle navigation. Each user has a session (in-memory) that tracks their `state` and navigation `history`.
1.  **Webhook**: Receives message payloads from Meta’s WhatsApp Cloud API.
2.  **Controller**: Parses the payload (text, button_reply, list_reply, location, image).
3.  **State Machine**: Determines the appropriate response based on the current state.
4.  **Meta API**: Sends back formatted interactive or text responses to the user.

---

## 🛠️ Tech Stack

### Backend & Bot
- **Environment**: Node.js
- **Framework**: Express.js
- **API**: Meta WhatsApp Cloud API (v18.0)
- **HTTP Client**: Axios (for sending messages back to WhatsApp)

### Frontend
- **Framework**: React.js
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Modern design patterns)
- **Deployment**: Vercel

---

## 🛠️ End-to-End Setup Guide

### 💻 Local Development Setup

To run the Vanigan platform on your local machine, follow these steps:

#### 1. Prerequisites
- **Node.js (v14+)** installed.
- **npm** or **yarn** installed.
- **ngrok** installed (crucial for receiving Meta's Webhooks locally).
- A **Meta Developer Account** with a WhatsApp App created.

#### 2. Project Installation
```bash
# Clone the repository
git clone https://github.com/tmisgowthaamand/Vanigan-WhatsApp.git
cd vanigan-whatsapp-bot

# Install Bot (Backend) dependencies
npm install

# Install Web Portal (Frontend) dependencies
cd vanigan-frontend
npm install
cd ..
```

#### 3. Environment Configuration
Create a `.env` file in the root directory and fill in your Meta credentials:
```env
PORT=3000
WHATSAPP_VERIFY_TOKEN=vanigan_secret_token
WHATSAPP_API_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
FRONTEND_URL=http://localhost:5173
```

#### 4. Expose Localhost for Webhooks
Since Meta cannot send messages to `localhost`, use **ngrok**:
```bash
# In a new terminal window
ngrok http 3000
```
- Copy the **Forwarding URL** (e.g., `https://a1b2-c3d4.ngrok-free.app`).

#### 5. Configure Meta Developer Dashboard
- Go to **WhatsApp > Configuration**.
- **Callback URL**: Paste your Ngrok URL followed by `/webhook` (e.g., `https://...app/webhook`).
- **Verify Token**: Must match `WHATSAPP_VERIFY_TOKEN` in your `.env`.
- Under **Webhook Fields**, subscribe to `messages`.

#### 6. Start the Platform
```bash
# Start the Bot (Terminal 1)
node index.js

# Start the Web Portal (Terminal 2)
cd vanigan-frontend
npm run dev
```

---

## 🚀 Production Deployment

### 1. Deploying the Bot (Backend) to Render
The project is pre-configured with `render.yaml` for a "Web Service" deployment.
1. Create a new **Web Service** on [Render](https://dashboard.render.com/).
2. Connect this GitHub repository.
3. **Environment Variables**: Add all variables from your `.env`.
4. **Build Command**: `npm install`
5. **Start Command**: `node index.js`
6. Once deployed, copy your Render URL (e.g., `https://vanigan-bot.onrender.com`).
7. **Crucial**: Go back to your Meta Developer Dashboard and update the **Callback URL** to your Render URL: `https://vanigan-bot.onrender.com/webhook`.

### 2. Deploying the Web Portal (Frontend) to Vercel
1. Create a new project on [Vercel](https://vercel.com/).
2. Select the `vanigan-frontend` folder from this repository.
3. Vercel will auto-detect **Vite** as the framework.
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Deploy and copy your production URL (e.g., `https://vanigan-whats-app.vercel.app`).
7. **Update Bot Env Var**: On Render, update `FRONTEND_URL` to your new Vercel URL so the bot links correctly to the website.

---

## 📈 Future Upgrades & Maintenance

If you plan to upgrade this project, here are the key areas to focus on:

1.  **Persistent Storage**: Replace the in-memory `sessions` object (in `index.js`) with a database like **Redis** or **MongoDB** for persistent user states.
2.  **Database Integration**: Currently, the business and member lists are hardcoded in `index.js`. Connect these to an API or Database to make them dynamic.
3.  **Media Uploads**: Finalize the implementation for `ADD_BUSINESS_PHOTO` to handle image uploads to a cloud storage service (e.g., AWS S3 or Cloudinary).
4.  **Authentication**: Add user authentication for the "Manage Your Presence" sections.
5.  **Multi-Language Support**: Implement i18n for wider district reach.

---

## 👥 Contributors

This platform is developed to foster community growth. Feel free to open issues or pull requests to improve the platform.

**License**: ISC
