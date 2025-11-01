# 🚀 VPS Deployment Guide - Quantum Labs Bot

## ✅ Quick Start (3 Steps)

### **Step 1: Upload Files to VPS**

Upload all files to your VPS in a directory (e.g., `/home/user/quantum-labs/`)

### **Step 2: Install Dependencies**

```bash
cd /home/user/quantum-labs
npm install --production
```

### **Step 3: Start Bot with PM2**

```bash
pm2 start index.js --name "Quantum-Labs"
```

**Done!** Your bot is now running 24/7! 🎉

---

## 📋 Alternative: Use Startup Script

If you want an automated setup:

```bash
chmod +x start.sh
./start.sh
```

This will:
- ✅ Install dependencies
- ✅ Install PM2 (if not installed)
- ✅ Start the bot
- ✅ Save PM2 process list

---

## 🔧 PM2 Commands

### **View Bot Status**
```bash
pm2 status
```

### **View Live Logs**
```bash
pm2 logs Quantum-Labs
```

### **Restart Bot**
```bash
pm2 restart Quantum-Labs
```

### **Stop Bot**
```bash
pm2 stop Quantum-Labs
```

### **Monitor Bot (Real-time)**
```bash
pm2 monit
```

### **Auto-Start on Server Reboot**
```bash
pm2 startup
pm2 save
```

---

## 📁 Required Files

Make sure these files are uploaded to your VPS:

### **Core Files:**
- ✅ `index.js` - Main bot file
- ✅ `config.json` - Configuration (with your bot token)
- ✅ `package.json` - Dependencies list
- ✅ `ecosystem.config.js` - PM2 configuration (optional)
- ✅ `start.sh` - Startup script (optional)

### **Folders:**
- ✅ `commands/` - All command files
- ✅ `events/` - All event handlers
- ✅ `handlers/` - Command/event loaders
- ✅ `utils/` - Database utilities

---

## 🔑 Configuration

Your bot is already configured with:

- ✅ **Token:** `MTQyMjU5NjIxMzk3MDA0MjkwMA.GbhjES.fOySRyOZY4aFz4JzSFKokOM9uFv_j_ARxWD2Ug`
- ✅ **Client ID:** `1422596213970042900`
- ✅ **Guild ID:** `1416057641515618409`
- ✅ **Supabase URL:** `https://jlljtrzztnhygzuxlrlu.supabase.co`

All settings are in `config.json` - no need to edit anything!

---

## 🐛 Troubleshooting

### **Bot won't start:**
```bash
# Check logs
pm2 logs Quantum-Labs

# Check if port is already in use
pm2 delete Quantum-Labs
pm2 start index.js --name "Quantum-Labs"
```

### **Dependencies missing:**
```bash
npm install --production
```

### **PM2 not installed:**
```bash
npm install -g pm2
```

### **Permission denied on start.sh:**
```bash
chmod +x start.sh
```

---

## 📊 What You'll See

### **On Startup:**
```
📁 Configuration loaded from config.json
   - TOKEN: ✅ Set
   - CLIENT_ID: ✅ Set
   - SUPABASE_URL: ✅ Set
[COMMAND] Loaded: 8ball
[COMMAND] Loaded: clear
[COMMAND] Loaded: kick
... (19 commands total)
[EVENT] Loaded: interactionCreate
[EVENT] Loaded: guildMemberAdd
[EVENT] Loaded: messageCreate
[EVENT] Loaded: clientReady
[EVENT] Loaded: voiceStateUpdate
🔄 Testing database connection...
✅ Database connected successfully!
🔑 Token detected: MTQyMjU5Nj...RxWD2Ug
🔄 Logging in to Discord...
⏳ Attempting connection to Discord Gateway...
[DEBUG] Preparing to connect to the gateway...
[DEBUG] [WS => Shard 0] Identifying
✅ Ready! Logged in as Quantum Labs#1169
📊 Serving 1 servers
```

### **PM2 Status:**
```
┌─────┬──────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ mode    │ ↺       │ status  │ cpu      │
├─────┼──────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ Quantum-Labs │ fork    │ 0       │ online  │ 0%       │
└─────┴──────────────┴─────────┴─────────┴─────────┴──────────┘
```

---

## 🎯 Quick Commands Reference

```bash
# Start bot
pm2 start index.js --name "Quantum-Labs"

# Or use ecosystem file
pm2 start ecosystem.config.js

# View logs
pm2 logs Quantum-Labs

# Restart
pm2 restart Quantum-Labs

# Stop
pm2 stop Quantum-Labs

# Delete from PM2
pm2 delete Quantum-Labs

# Auto-start on reboot
pm2 startup
pm2 save
```

---

## ✅ Features Working

- ✅ **Welcome System** - Auto-role and welcome messages
- ✅ **Ticket System** - Create, claim, close tickets
- ✅ **Reaction Roles** - Self-assignable roles
- ✅ **Legit Votes** - Voting system
- ✅ **Applications** - Application system
- ✅ **FAQ System** - Automated FAQ responses
- ✅ **VC Support** - Voice channel support system
- ✅ **All Slash Commands** - 19 commands total

---

## 🔒 Security Notes

- ⚠️ **Never share your `config.json` file** - It contains your bot token!
- ⚠️ **Add `config.json` to `.gitignore`** if using Git
- ⚠️ **Keep backups** of your configuration

---

## 📞 Support

If you encounter any issues:

1. Check logs: `pm2 logs Quantum-Labs`
2. Restart bot: `pm2 restart Quantum-Labs`
3. Check if all files are uploaded
4. Verify `config.json` has correct token

---

**Your bot is ready to deploy! Just upload and run `pm2 start index.js --name "Quantum-Labs"`** 🚀

