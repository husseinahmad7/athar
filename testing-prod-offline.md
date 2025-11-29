 Testing Steps
Clear old caches (in browser console):
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
Rebuild and serve:
    npm run build
    npm run preview

Test online:
Open http://localhost:4173
Verify all resources load (check Network tab)
Check Application → Cache Storage → dhikr-runtime-v3
Test offline:
DevTools → Network → Check "Offline"
Refresh page (F5)
Expected: App loads perfectly! ✅
Test on mobile with ngrok:
    npm run preview
    # In another terminal:
    ngrok http 4173

Open ngrok URL on mobile
Install PWA
Turn off internet
Open PWA → Should work offline! ✅