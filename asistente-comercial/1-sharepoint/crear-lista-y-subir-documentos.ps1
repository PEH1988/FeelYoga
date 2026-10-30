<#
  Aprovisiona la parte de SharePoint de la demo:
   1. Crea la carpeta "Comercial" en la biblioteca de documentos y sube los .docx.
   2. Crea la lista "ConsultasComerciales" con sus columnas.

  Requisitos:
   - PowerShell 7.4+ y PnP.PowerShell:  Install-Module PnP.PowerShell -Scope CurrentUser
   - Desde 2024 PnP exige un registro de app propio en Entra ID. Una sola vez:
       Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP Demo" -Tenant <tutenant>.onmicrosoft.com -Interactive
     y usá el ClientId que devuelve.
   - El sitio ya existe: crealo creando el equipo "Comercial FeelYoga" en Teams
     (eso genera el sitio de SharePoint asociado).

  Uso:
   ./build-docs.sh   (genera los .docx)
   pwsh ./crear-lista-y-subir-documentos.ps1 -SiteUrl https://<tenant>.sharepoint.com/sites/ComercialFeelYoga -ClientId <guid>
#>
param(
  [Parameter(Mandatory)] [string] $SiteUrl,
  [Parameter(Mandatory)] [string] $ClientId,
  [string] $ListName = "ConsultasComerciales"
)
$ErrorActionPreference = "Stop"

Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Interactive

# 1. Documentos ---------------------------------------------------------------
# "Shared Documents" es el nombre interno de "Documentos" aunque el sitio esté en español.
$folder = Resolve-PnPFolder -SiteRelativePath "Shared Documents/Comercial"
Get-ChildItem -Path (Join-Path $PSScriptRoot "documentos/docx") -Filter *.docx | ForEach-Object {
  Add-PnPFile -Path $_.FullName -Folder "Shared Documents/Comercial" | Out-Null
  Write-Host "Subido: $($_.Name)"
}

# 2. Lista --------------------------------------------------------------------
if (-not (Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue)) {
  New-PnPList -Title $ListName -Template GenericList -OnQuickLaunch | Out-Null
  Write-Host "Lista creada: $ListName"
}

function Add-Field($params) {
  if (-not (Get-PnPField -List $ListName -Identity $params.InternalName -ErrorAction SilentlyContinue)) {
    Add-PnPField -List $ListName -AddToDefaultView @params | Out-Null
    Write-Host "  + $($params.DisplayName)"
  }
}

Add-Field @{ DisplayName = "Pregunta";                 InternalName = "Pregunta";            Type = "Note" }
Add-Field @{ DisplayName = "Tipo de consulta";         InternalName = "TipoConsulta";        Type = "Choice"; Choices = "Informativa","Descuento","Sin respuesta en documentos" }
Add-Field @{ DisplayName = "Cliente";                  InternalName = "Cliente";             Type = "Text" }
Add-Field @{ DisplayName = "Precio de lista (ARS)";    InternalName = "MontoBase";           Type = "Number" }
Add-Field @{ DisplayName = "Descuento solicitado (%)"; InternalName = "DescuentoSolicitado"; Type = "Number" }
Add-Field @{ DisplayName = "Justificación";            InternalName = "Justificacion";       Type = "Note" }
Add-Field @{ DisplayName = "Email vendedor";           InternalName = "VendedorEmail";       Type = "Text" }
Add-Field @{ DisplayName = "Estado";                   InternalName = "Estado";              Type = "Choice"; Choices = "Registrada","Aprobada automáticamente","Pendiente de aprobación","Aprobada","Rechazada","Vencida" }
Add-Field @{ DisplayName = "Aprobador";                InternalName = "Aprobador";           Type = "Text" }
Add-Field @{ DisplayName = "Comentario del aprobador"; InternalName = "ComentarioAprobador"; Type = "Note" }
Add-Field @{ DisplayName = "Fecha de resolución";      InternalName = "FechaResolucion";     Type = "DateTime" }

Write-Host "Listo. Revisá la lista en $SiteUrl/Lists/$ListName"
