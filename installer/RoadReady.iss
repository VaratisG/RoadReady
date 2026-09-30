; Inno Setup script for RoadReady.
; Builds a per-user installer (no admin rights needed) wrapping dist\RoadReady.exe.
;
; Build with the Inno Setup Compiler:
;   ISCC.exe installer\RoadReady.iss
; Output: installer\Output\RoadReadySetup.exe
;
; Keep MyAppVersion in sync with APP_VERSION in app/main.py and the
; `app_version` row in Supabase (see supabase/schema.sql) whenever you cut a
; new release.

#define MyAppName "RoadReady"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "George Varatis"
#define MyAppExeName "RoadReady.exe"

[Setup]
AppId={{8F2B6B2E-6E2C-4B7B-9C7B-ROADREADYAPP}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\Programs\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=Output
OutputBaseFilename=RoadReadySetup
Compression=lzma2
SolidCompression=yes
SetupIconFile=..\design\app-icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
WizardStyle=modern

[Tasks]
Name: "desktopicon"; Description: "Δημιουργία εικονιδίου στην Επιφάνεια εργασίας"; GroupDescription: "Πρόσθετες συντομεύσεις:"

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{group}\Απεγκατάσταση {#MyAppName}"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Εκκίνηση {#MyAppName}"; Flags: nowait postinstall skipifsilent
