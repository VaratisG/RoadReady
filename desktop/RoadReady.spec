# -*- mode: python ; coding: utf-8 -*-
# Build from the repo root:  pyinstaller desktop\RoadReady.spec
import os

ROOT = os.path.dirname(SPECPATH)  # repo root; SPECPATH is this file's folder


def p(*parts):
    return os.path.join(ROOT, *parts)


a = Analysis(
    [p('desktop', 'main.py')],
    pathex=[],
    binaries=[],
    datas=[(p('frontend'), 'frontend'), (p('data'), 'data')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

splash = Splash(
    p('design', 'splash.png'),
    binaries=a.binaries,
    datas=a.datas,
    text_pos=None,
    text_size=12,
    minify_script=True,
    always_on_top=True,
)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    splash,
    splash.binaries,
    [],
    name='RoadReady',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=p('design', 'app-icon.ico'),
)
