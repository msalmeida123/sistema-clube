# Script para criar estrutura de módulos - SRP
param([string]$moduleName)

$basePath = "C:\Users\Marcelo da Silva Alm\sistema-clube\web\src\modules\$moduleName"

# Criar pastas
$folders = @("types", "repositories", "services", "hooks", "components")
foreach ($folder in $folders) {
    $path = Join-Path $basePath $folder
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force
        Write-Host "✅ Criado: $path" -ForegroundColor Green
    }
}

Write-Host "`n📁 Estrutura do módulo '$moduleName' criada!" -ForegroundColor Cyan
Write-Host "Agora crie os arquivos:" -ForegroundColor Yellow
Write-Host "  - types/index.ts"
Write-Host "  - repositories/$moduleName.repository.ts"
Write-Host "  - services/$moduleName.service.ts"
Write-Host "  - hooks/use$((Get-Culture).TextInfo.ToTitleCase($moduleName)).ts"
Write-Host "  - components/"
Write-Host "  - index.ts"
