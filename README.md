# Smart Emergency Navigation System
Cloud-based Smart Emergency Vehicle Navigation System with real-time traffic simulation, dynamic routing, and AWS EC2 deployment using Node.js.

---

# Features

* Real-time traffic simulation
* Dynamic route optimization for emergency vehicles
* Congestion-aware navigation
* Interactive web interface
* Cloud deployment using AWS EC2
* Remote server management through SSH
* Node.js backend support

---

# Project Overview

This project simulates a smart traffic management system where emergency vehicles are provided with optimized routes to reach their destination faster.

The system continuously analyzes traffic conditions and dynamically updates routes whenever congestion or delays are detected. The application is hosted on an AWS EC2 server, demonstrating practical cloud deployment and remote server management.

The project showcases:

* Cloud Computing
* Traffic optimization concepts
* Real-time data handling
* AWS deployment
* Web application hosting

---

# How the System Works

1. The user starts the application through the web interface.
2. Traffic data is simulated in real-time.
3. The backend processes traffic conditions and calculates the best possible route.
4. If congestion is detected, the system reroutes the emergency vehicle dynamically.
5. The frontend updates the route and traffic information visually.
6. The application runs continuously on an AWS EC2 server.

---

# Tech Stack

## Frontend

* HTML
* CSS
* JavaScript

## Backend

* Node.js
* Express.js

## Cloud & Deployment

* AWS EC2
* SSH
* Linux Server Environment

## Tools & Technologies

* npm
* Git & GitHub
* Command Prompt / Terminal

---

# Project Architecture

User Browser → Frontend UI → Node.js Server → Traffic Processing Logic → Dynamic Route Response

The application is deployed on an AWS EC2 instance and accessed remotely using SSH.

---

# Installation & Setup

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git
* AWS Account (for cloud deployment)
* SSH client / Command Prompt

---

# Running the Project Locally

## Step 1: Clone the Repository

```bash
git clone <YOUR_GITHUB_REPO_LINK>
cd <PROJECT_FOLDER_NAME>
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Start the Application

```bash
npm start
```

## Step 4: Open in Browser

Visit:

```text
http://localhost:3000
```

(Replace the port if your project uses a different one.)

---

# Deploying & Running on AWS EC2

## Step 1: Launch an EC2 Instance

* Open AWS Console
* Navigate to EC2 Dashboard
* Launch a new Ubuntu/Linux instance
* Configure security groups:

  * Allow SSH (Port 22)
  * Allow HTTP (Port 80)
  * Allow application port (example: 3000)

---

## Step 2: Connect to EC2 using SSH

Using Command Prompt / Terminal:

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

---

## Step 3: Install Node.js and npm on EC2

```bash
sudo apt update
sudo apt install nodejs npm -y
```

Verify installation:

```bash
node -v
npm -v
```

---

## Step 4: Clone the Repository inside EC2

```bash
git clone <YOUR_GITHUB_REPO_LINK>
cd <PROJECT_FOLDER_NAME>
```

---

## Step 5: Install Dependencies

```bash
npm install
```

---

## Step 6: Run the Application

```bash
npm start
```

The server will start running on the EC2 instance.

---

## Step 7: Access the Application

Open your browser and visit:

```text
http://<EC2_PUBLIC_IP>:3000
```

---

# Example Commands Used During Deployment

```bash
ssh -i my-key.pem ubuntu@ec2-public-ip
cd Smart-Emergency-Vehicle-System
npm install
npm start
```

---

# Future Improvements

* Integration with real-time maps APIs
* Machine Learning-based traffic prediction
* Live GPS tracking
* Traffic signal automation
* Docker container deployment
* CI/CD pipeline integration

---

# Learning Outcomes

This project helped in understanding:

* Cloud deployment using AWS EC2
* SSH-based remote server management
* Hosting Node.js applications on cloud servers
* Real-time traffic simulation concepts
* Backend and frontend integration
* npm package management

---

# Screenshots

Add screenshots of:

* Home Page
* Traffic Simulation
* Route Optimization
* AWS EC2 Deployment
* Running Terminal Commands

---

# Author

Aashay D
Divyansh Nagar

---

