# Deployment Instructions for cPanel/Shared Hosting

This guide helps you deploy the Meal-Box app to your production server (`mealbox.magnusideas.com`).

## Current Issue

Your production server shows:
```json
{"success":false,"message":"Frontend not available. Running in API-only mode."}
```

**Root Cause:** The `frontend-next` directory is not present on the production server.

---

## Solution: Deploy Static Frontend (Updated for Static Export)

Since your Next.js app uses `output: 'export'` for static generation, follow these updated steps:

### Step 1: Build the static export locally
```bash
cd frontend-next
npm run build
```
This creates an `out/` directory with static HTML/CSS/JS files.

### Step 2: Upload to cPanel (Static Files Only)

1. Go to cPanel → File Manager
2. Navigate to `/home/magnusideas/mealbox.magnusideas.com/`
3. **Delete** any existing `frontend-next` folder if it exists
4. Upload the **entire** `out/` directory contents directly to the root domain folder:
   - Copy all files from `frontend-next/out/` → upload to `/home/magnusideas/mealbox.magnusideas.com/`
   - This includes: `index.html`, `_next/`, `product/`, `admin/`, etc.
   - **Important:** Also upload the `.htaccess` file from `out/` directory

### Step 3: Verify Files
Your domain root should now contain:
```
/home/magnusideas/mealbox.magnusideas.com/
├── index.html
├── .htaccess  ← This handles routing!
├── _next/
├── product/
│   └── [id]/
│       └── index.html
├── admin/
└── ...other static files
```

### Step 4: No Node.js Restart Needed
Since this is static files, no Node.js application restart is required. The Apache server will serve the files directly.

---

## Troubleshooting

### Still seeing 404 on refresh?

**Root Cause:** Static export needs server-side routing configuration.

**Solution:** Ensure `.htaccess` file is uploaded with this content:
```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### Still seeing "Frontend not available"?

Check these in cPanel SSH/Terminal:

```bash
# Navigate to app root
cd /home/magnusideas/mealbox.magnusideas.com

# Check if static files exist
ls -la index.html
ls -la .htaccess
ls -la _next/
ls -la product/

# Check Apache error logs
tail -50 /usr/local/apache/logs/error_log
```

### Common Issues:

| Issue | Solution |
|-------|----------|
| 404 on page refresh | Upload `.htaccess` file with rewrite rules |
| Static files not found | Upload `out/` directory contents to domain root, not a subfolder |
| No routing | Ensure Apache mod_rewrite is enabled in cPanel |
| "Module not found" errors | Run `npm install` in frontend-next folder |
| Server won't restart | Check Node version compatibility (v18+), restart from cPanel |

---

## Deployment Checklist

- [ ] Build frontend locally: `npm run build` in `frontend-next/`
- [ ] Upload `frontend-next/` folder to `/home/magnusideas/mealbox.magnusideas.com/`
- [ ] Verify `.next/` folder exists on server
- [ ] Restart Node app from cPanel
- [ ] Test: Open `https://mealbox.magnusideas.com/` in browser
- [ ] Verify you see the home page (not JSON 404 message)

---

## Notes

- **API endpoints** will continue working even if frontend isn't available
- **Production mode** requires the `.next` build; development mode needs `pages/` or `app/` folder
- If you rebuild the frontend, always **restart the Node app** in cPanel afterward
- Keep a backup of your `.next` build locally before deployment

---

## Support

If frontend still won't load after following these steps:
1. Check cPanel error logs
2. Verify Node version in cPanel matches local (v18+)
3. Ensure `npm install` dependencies were installed if using Option 2
4. Contact your hosting provider's support for permission issues
