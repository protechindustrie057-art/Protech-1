%define MyAppName "ProTech Touch"
%define MyAppVersion "0.1.0"
%define MyAppPublisher "ProTech Touch"
%define MyAppExeName "run-app.bat"

[Setup]
LicenseFile=LICENSE.txt
AppName={%MyAppName}
AppVersion={%MyAppVersion}
AppPublisher={%MyAppPublisher}
AppPublisherURL=https://protech-touch.vercel.app
AppSupportURL=https://protech-touch.vercel.app
DefaultDirName={pf}\{%MyAppName}
DefaultGroupName={%MyAppName}
OutputDir=.
OutputBaseFilename=ProTech_Touch_Setup
SetupIconFile=public\logo.ico
UninstallDisplayIcon={app}\public\logo.ico
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
Source: "release\.env.local"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\.next\*"; DestDir: "{app}\.next"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "release\public\*"; DestDir: "{app}\public"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "release\node\*"; DestDir: "{app}\node"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "release\node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{group}\{%MyAppName}"; Filename: "{app}\{%MyAppExeName}"; IconFilename: "{app}\public\logo.ico"
Name: "{commondesktop}\{%MyAppName}"; Filename: "{app}\{%MyAppExeName}"; IconFilename: "{app}\public\logo.ico"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Créer un raccourci sur le Bureau"; GroupDescription: "Tâches additionnelles:"; Flags: unchecked

[Run]
Filename: "{app}\{%MyAppExeName}"; Description: "Lancer ProTech Touch"; Flags: nowait postinstall skipifsilent
