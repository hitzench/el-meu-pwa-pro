@echo off
echo --- 1. Arreglant permisos i Identitat... ---
git config --global --add safe.directory D:/Projectes/el-meu-pwa-pro
git config --global user.email "marcgutierreza@gmail.com"
git config --global user.name "hitzench"

echo.
echo --- 2. Compilant i Pujant Versio (Fent la magia)... ---
:: Això crea l'EXE i canvia el package.json (ex: 1.0.0 -> 1.0.1)
call npm run dist

echo.
echo --- 3. Connectant amb GitHub... ---
git remote remove origin
git remote add origin https://github.com/hitzench/el-meu-pwa-pro.git
git branch -M main

echo.
echo --- 4. Preparant arxius (amb la NOVA versio)... ---
git add .

echo.
echo --- 5. Guardant canvis... ---
git commit -m "Actualització Automàtica (EXE creat) 🚀"

echo.
echo --- 6. Pujant al GitHub... ---
git push -u origin main --force

echo.
echo --- ✅ ARA SI! VERSIO NOVA PUJADA I SINCRONITZADA ---
pause