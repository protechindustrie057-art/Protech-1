#define MyAppName "SK Parfumerie"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "SK Parfumerie"
#define MyAppExeName "run-app.bat"

[Setup]
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL=https://sk-parfumerie-cosmetique.vercel.app
AppSupportURL=https://sk-parfumerie-cosmetique.vercel.app
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputDir=.
OutputBaseFilename=SK_Parfumerie_Setup
Compression=lzma
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
CreateAppDir=yes
DisableProgramGroupPage=no
WizardStyle=modern

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "release\run-app.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\server.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\package-lock.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\next.config.mjs"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\.env.local.example"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\.next\*"; DestDir: "{app}\.next"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "release\public\*"; DestDir: "{app}\public"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Créer un raccourci sur le Bureau"; GroupDescription: "Tâches additionnelles:"; Flags: unchecked

[Run]
Filename: "cmd.exe"; Parameters: "/C cd /d \"{app}\" && npm install --production"; WorkingDir: "{app}"; StatusMsg: "Installation des dépendances Node.js..."; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "Lancer SK Parfumerie"; Flags: nowait postinstall skipifsilent
