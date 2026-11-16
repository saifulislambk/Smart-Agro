# 🚀 স্মার্ট এগ্রো - ক্লাউড ডেপ্লয়মেন্ট ও হোস্টিং পূর্ণাঙ্গ গাইড
**Smart Agro Production Cloud Deployment, Hosting & Operations Manual**
*ডকুমেন্ট কোড: SAG-DEP-2026 | ভার্সন: 2.5.0 Production Ready*

---

## 🌐 ১. সারসংক্ষেপ ও হোস্টিং অপশনসমূহ

স্মার্ট এগ্রো প্ল্যাটফর্মটি প্রোডাকশনে হোস্ট করার জন্য ৩টি অত্যন্ত কার্যকর ও স্থিতিশীল পদ্ধতি রয়েছে:
1. **Render.com / Railway** - ১-ক্লিক ফ্রি ও সহজতম ক্লাউড PaaS (প্রস্তাবিত)।
2. **Google Cloud Run** - সার্ভারলেস অটো-স্কেলিং ডকার কন্টেইনার।
3. **স্বয়ংসম্পূর্ণ লিনাক্স VPS** - Ubuntu 22.04/24.04 LTS + Nginx + PM2 + Free Let's Encrypt SSL।

---

## ⚙️ ২. এনভায়রনমেন্ট ভেরিয়েবলস (Environment Variables)

| ভেরিয়েবল নাম | প্রয়োজনীয়তা | ডিফল্ট মান | বিবরণ ও উদাহরণ |
|---|---|---|---|
| `PORT` | ঐচ্ছিক | `3000` | যে পোর্টে এক্সপ্রেস ওয়েব সার্ভারটি রান করবে। |
| `NODE_ENV` | **বাধ্যতামূলক** | `production` | পারফরম্যান্স অপ্টিমাইজেশন ও জিযিপ ক্যাশিং সক্রিয় করতে। |
| `DATABASE_URL` | প্রস্তাবিত | *ইন-মেমোরি* | PostgreSQL ডাটাবেসের ফুল কানেকশন স্ট্রিং। |
| `OPENWEATHER_API_KEY` | ঐচ্ছিক | *ফলব্যাক মডেল* | লাইভ আবহাওয়ার জন্য ওপেনওয়েদার এপিআই কি। |

---

## ☁️ ৩. অপশন ১: Render.com এ ১-ক্লিকে ডেপ্লয় (সবচেয়ে সহজ)

প্রজেক্টের রুটে পূর্ব থেকেই একটি প্রোডাকশন-রেডি ব্লুপ্রিন্ট `render.yaml` দেওয়া আছে।

### ধাপ ১: গিটহাবে কোড পুশ করুন
```bash
git init
git add .
git commit -m "Production release v2.5"
git remote add origin https://github.com/your-username/smart-agro.git
git push -u origin main
```

### ধাপ ২: Render ড্যাশবোর্ডে কানেক্ট করুন
1. [dashboard.render.com](https://dashboard.render.com) এ লগইন করুন।
2. **New > Blueprint** এ ক্লিক করে আপনার GitHub রিপোজিটরিটি সিলেক্ট করুন।
3. Render স্বয়ংক্রিয়ভাবে `render.yaml` রিড করে একটি Node.js ওয়েব সার্ভিস এবং একটি Managed PostgreSQL ডাটাবেস তৈরি করবে।

### ধাপ ৩: ডাটাবেস স্কিমা তৈরি করুন
Render PostgreSQL-এর Shell ট্যাবে গিয়ে প্রজেক্টের `schema.sql` ফাইলের কুয়েরি রান করলেই সকল টেবিল প্রস্তুত হয়ে যাবে।

---

## 🖥️ ৪. অপশন ২: উবুন্টু VPS ডেপ্লয়মেন্ট (Ubuntu 22.04 / 24.04 LTS)

সম্পূর্ণ নিয়ন্ত্রণ, সর্বোচ্চ গতি ও উচ্চ ট্রাফিক ব্যবস্থাপনার জন্য একটি লিনাক্স ভিপিএস ব্যবহার করুন:

### ক. সার্ভার আপডেট ও Node.js ইনস্টলেশন
```bash
sudo apt update && sudo apt upgrade -y
# Node.js 20 LTS ইনস্টল করুন
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx ufw
```

### খ. কোডবেস সেটআপ ও PM2 ক্লাস্টার স্টার্ট
```bash
# কোড ক্লোন ও ডিপেন্ডেন্সি ইনস্টল
git clone <your-repo-url> /var/www/smart-agro
cd /var/www/smart-agro
npm install --production

# গ্লোবাল প্রসেস ম্যানেজার PM2 ইনস্টল
sudo npm install -g pm2

# মাল্টি-কোর ক্লাস্টার মোডে সার্ভার স্টার্ট
pm2 start server.js -i max --name "smart-agro"
pm2 save
pm2 startup
```

### গ. Nginx রিভার্স প্রক্সি কনফিগারেশন (`/etc/nginx/sites-available/smart-agro`)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### ঘ. Nginx সক্রিয়করণ ও ফ্রি SSL সার্টিফিকেট (Let's Encrypt HTTPS)
```bash
sudo ln -s /etc/nginx/sites-available/smart-agro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Certbot দিয়ে লাইফটাইম ফ্রি অটো-রিনিউয়িং SSL নিন
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🌍 ৫. কাস্টম ডোমেন ও ডিএনএস সেটআপ (.com বা .com.bd)

ডোমেন প্রোভাইডার (BTCL, Namecheap, Cloudflare, ইত্যাদি)-এর DNS Management প্যানেলে নিচের রেকর্ডগুলো যুক্ত করুন:

| রেকর্ড টাইপ | হোস্ট / নেম | টার্গেট / ভ্যালু | TTL |
|---|---|---|---|
| **A Record** | `@` (রুট) | সার্ভারের পাবলিক আইপি (যেমন: `159.65.12.34`) | Auto / 300s |
| **CNAME** | `www` | `yourdomain.com.` | Auto / 300s |

---

## 💾 ৬. ডাটাবেস অটোমেটেড ব্যাকআপ ও রোটেশন

প্রতিদিন মধ্যরাত ২:০০ টায় কৃষকদের রোগ নির্ণয় ও হিস্ট্রি ডাটাবেস ব্যাকআপ নিতে ক্রনজব সেট করুন:
```bash
crontab -e
```
নিচের লাইনটি যুক্ত করুন:
```bash
0 2 * * * pg_dump -U postgres smart_agro > /var/backups/smart_agro_$(date +\%F).sql
```

---

## 🔄 ৭. জিরো-ডাউনটাইম আপডেট ও মনিটরিং

```bash
# ১. কোড আপডেট করতে
git pull origin main
npm install --production
pm2 reload all

# ২. রিয়েল-টাইম পারফরম্যান্স ট্র্যাকিং
pm2 monit
pm2 logs smart-agro --lines 50
```

---
*স্মার্ট এগ্রো (Smart Agro) • ক্লাউড ইনফ্রাস্ট্রাকচার ও ডেভঅপ্স টিম • ২০২৬*

