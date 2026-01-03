param([string]$version)

git add .
git commit -m "release: v$version"
git tag -a "v$version" -m "Release v$version"
git push origin main
git push origin "v$version"

Write-Host "✅ Versão v$version publicada!" -ForegroundColor Green
