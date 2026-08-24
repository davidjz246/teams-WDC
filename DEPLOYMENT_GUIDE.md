# Production Deployment Guide: Wadi Degla Clubs Attendance & Overtime System

This project is fully built and ready for production deployment. The compiled files are inside the `/dist` directory.

## What is inside `/dist`?
- `index.html` — The main entry point
- `assets/` — Bundled JavaScript (`app-bundle.js`), CSS (`index.css`), and images

---

## 1. How to Deploy to XAMPP (Local Web Server)
1. Open your XAMPP installation directory: `C:\xampp\htdocs\`
2. Create a new folder, for example `attendance`: `C:\xampp\htdocs\attendance`
3. Copy all files and folders from the `dist` directory into `C:\xampp\htdocs\attendance\`:
   - `C:\xampp\htdocs\attendance\index.html`
   - `C:\xampp\htdocs\attendance\assets\...`
4. Start Apache in the XAMPP Control Panel.
5. Open your browser and go to: `http://localhost/attendance/`

---

## 2. How to Deploy to cPanel / Shared Hosting (Apache)
1. Log in to your cPanel or File Manager.
2. Go to `public_html` (or a subfolder like `public_html/attendance`).
3. Upload the contents of the `dist` folder directly into `public_html`.
4. (Optional) Create a `.htaccess` file inside `public_html` for single-page application routing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 3. How to Deploy to Node.js / Linux Server / VPS
To run a standalone web server for this application:
```bash
npm install -g serve
serve -s dist -l 3000
```
Or run with PM2:
```bash
pm2 serve dist 3000 --name "wadi-degla-attendance" --spa
```

---

## 4. Re-building after Code Changes
Whenever you change the source code in `src/`, rebuild the `dist` folder:
```bash
npm run build
```
