# 🚨 QUICK FIX - TYPESCRIPT ERROR

## ❌ ERROR:
```
Cannot find module 'figma:asset/...' or its corresponding type declarations.
```

---

## ✅ FIXED! (Type declarations added)

---

## 🚀 DO THIS (3 STEPS):

### **1. RESTART TYPESCRIPT IN VSCODE:**
```
Ctrl+Shift+P  (Windows/Linux)
Cmd+Shift+P   (Mac)

Type: "TypeScript: Restart TS Server"
Press Enter
```

### **2. RESTART DEV SERVER:**
```bash
Ctrl+C
rm -rf node_modules/.vite
npm run dev
```

**Windows:**
```powershell
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

### **3. HARD REFRESH BROWSER:**
```
Ctrl+Shift+R (20 times!)
```

---

## ✅ RESULT:

**VSCode:**
- ✅ No red squiggly lines
- ✅ No TypeScript errors

**Browser:**
- ✅ Images show (Islamic SVG designs)
- ✅ No grey backgrounds

---

## 🔧 STILL ERROR IN VSCODE?

```bash
# Close VSCode
# Then:
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# Reopen VSCode
# Press: Ctrl+Shift+P
# Type: "TypeScript: Restart TS Server"
```

---

## 📁 FILES ADDED:

- ✅ `/src/vite-env.d.ts` (Type declarations)
- ✅ `/src/types/figma-asset.d.ts` (Backup declarations)

---

## ⏱️ TOTAL TIME: 1 MINUTE

1. Restart TS Server (10 seconds)
2. Clear cache (10 seconds)
3. Restart dev server (20 seconds)
4. Hard refresh browser (20 seconds)

**DONE!** ✅

---

**Read full details:** `/TYPESCRIPT-ERROR-FIXED.md`
