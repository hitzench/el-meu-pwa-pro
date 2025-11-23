@echo off
echo --- 1. Arreglant permisos i Identitat... ---
git config --global --add safe.directory D:/Projectes/el-meu-pwa-pro
:: AQUI POSA EL TEU CORREU REAL DE GITHUB SI VOLS (o deixa aquest fals, funcionara igual)
git config --global user.email "marc@exemple.com"
git config --global user.name "hitzench"

echo.
echo --- 2. Connectant amb GitHub... ---
:: Esborrem la connexio vella per si de cas i la posem de nou
git remote remove origin
git remote add origin https://github.com/hitzench/el-meu-pwa-pro.git
git branch -M main

echo.
echo --- 3. Preparant arxius... ---
git add .

echo.
echo --- 4. Guardant canvis... ---
git commit -m "Actualització Automàtica des del BAT 🚀"

echo.
echo --- 5. Pujant al GitHub... ---
:: Fem servir --force per assegurar que la teva versió local mana
git push -u origin main --force

echo.
echo --- ✅ ARA SI! TOT FET ---