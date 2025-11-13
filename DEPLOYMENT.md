# Deployment Guide for Discord Role Guardian Bot

This guide explains how to deploy your bot to Railway.app and monitor it with UptimeRobot for 24/7 uptime.

## Prerequisites

- GitHub account
- Railway.app account (free tier available)
- UptimeRobot account (free tier available)
- Your Discord bot token and client ID

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your code
git commit -m "Initial commit: Discord Role Guardian Bot"

# Add your GitHub repository
git remote add origin https://github.com/nayandas69/discord-role-guardian.git

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Railway.app

Railway.app provides free hosting with automatic deployments from GitHub.

### Setup Railway:

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `discord-role-guardian` repository
5. Railway will automatically detect Node.js and deploy

### Add Environment Variables:

1. In Railway dashboard, click on your project
2. Go to "Variables" tab
3. Add these environment variables:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `CLIENT_ID`: Your Discord bot client ID
   - `PORT`: Leave empty (Railway auto-assigns)

4. Click "Deploy" to restart with new variables

### Get Your Railway URL:

1. Go to "Settings" tab in Railway
2. Scroll to "Domains"
3. Click "Generate Domain"
4. Copy the URL (example: `discord-role-guardian-production.up.railway.app`)

Your bot is now live 24/7 on Railway!

## Step 3: Monitor with UptimeRobot

UptimeRobot will ping your bot every 5 minutes to ensure it stays online.

### Setup UptimeRobot:

1. Go to https://uptimerobot.com and create a free account
2. Click "Add New Monitor"
3. Configure monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Discord Role Guardian Bot
   - **URL**: `https://your-railway-url.railway.app/health`
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Your email

4. Click "Create Monitor"

UptimeRobot will now:
- Ping your bot every 5 minutes
- Keep it awake 24/7
- Email you if the bot goes down
- Provide uptime statistics

## Step 4: Verify Deployment

Test your health check endpoint:

```bash
curl https://your-railway-url.railway.app/health
```

You should see:
```json
{
  "status": "online",
  "bot": "YourBotName#1234",
  "uptime": 12345,
  "servers": 1,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Automatic Deployments

Railway automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Updated features"
git push origin main
```

Railway will automatically:
1. Pull latest code from GitHub
2. Build and deploy
3. Restart the bot with zero downtime

## Troubleshooting

### Bot Not Starting

Check Railway logs:
1. Go to Railway dashboard
2. Click on your project
3. View "Deployments" tab
4. Check logs for errors

### Environment Variables Missing

Verify in Railway:
1. Go to "Variables" tab
2. Ensure `DISCORD_TOKEN` and `CLIENT_ID` are set
3. Redeploy if you added variables

### Health Check Failing

Test locally first:
```bash
npm start
# In another terminal:
curl http://localhost:3000/health
```

## Cost

Railway Free Tier includes:
- $5 worth of usage per month
- About 500 hours of runtime
- Perfect for one Discord bot running 24/7

UptimeRobot Free Tier includes:
- 50 monitors
- 5-minute check intervals
- Email alerts

Both are completely free for this bot!

## Alternative: Deploy to Heroku, Render, or DigitalOcean

This bot works on any platform that supports Node.js:
- Heroku: Similar to Railway
- Render: Free tier available
- DigitalOcean: $4/month droplet
- Your own VPS: Full control

Just make sure to:
1. Set environment variables
2. Keep the bot process running
3. Configure the health check endpoint

Your Discord bot is now running 24/7!
