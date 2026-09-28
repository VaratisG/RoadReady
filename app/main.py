"""Desktop entry point — boots a pywebview window around the frontend/ HTML/CSS/JS app."""
import ctypes
import json
import os
import random
import sqlite3
import sys
import winreg
from ctypes import wintypes
from datetime import datetime, timezone
from pathlib import Path

import webview

_dwmapi = ctypes.windll.dwmapi
_dwmapi.DwmSetWindowAttribute.argtypes = [wintypes.HWND, wintypes.DWORD, ctypes.c_void_p, wintypes.DWORD]
_dwmapi.DwmSetWindowAttribute.restype = wintypes.LONG

DWMWA_USE_IMMERSIVE_DARK_MODE = 20
DWMWA_CAPTION_COLOR = 35
DWMWA_TEXT_COLOR = 36

# Kept in sync with tokens.css --bg/--ink so the native title bar matches the app theme.
TITLEBAR_LIGHT_BG = "#F0EFEA"
TITLEBAR_LIGHT_TEXT = "#23262B"
TITLEBAR_DARK_BG = "#15171A"
TITLEBAR_DARK_TEXT = "#F1F1ED"


def _colorref(hex_color):
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
    return r | (g << 8) | (b << 16)


def _detect_system_dark_mode():
    # Best-effort guess for the initial window background before the page loads
    # and can tell us the user's actual in-app theme choice (localStorage isn't
    # reachable from Python yet at this point). Avoids a light-colored flash on
    # an otherwise-dark system while the WebView2 surface repaints.
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize")
        value, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
        winreg.CloseKey(key)
        return value == 0
    except OSError:
        return False

# When PyInstaller bundles this into an exe, bundled files are extracted to a
# temp folder at sys._MEIPASS instead of living next to this script.
if getattr(sys, "frozen", False):
    ROOT_DIR = Path(sys._MEIPASS)
else:
    ROOT_DIR = Path(__file__).resolve().parent.parent

FRONTEND_DIR = ROOT_DIR / "frontend"
DATA_DIR = ROOT_DIR / "app" / "data"

# Progress history lives outside the bundled app (ROOT_DIR points at a temp
# extraction folder when frozen, wiped on exit) so it survives closing the
# app, rebooting, or replacing the .exe with a newer build.
APP_DATA_DIR = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "RoadReady"
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = APP_DATA_DIR / "roadready.db"


def _db_connect():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle TEXT NOT NULL,
            section_id TEXT NOT NULL,
            section_label TEXT NOT NULL,
            correct INTEGER NOT NULL,
            total INTEGER NOT NULL,
            completed_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS wrong_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle TEXT NOT NULL,
            question_id TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(vehicle, question_id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS saved_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle TEXT NOT NULL,
            question_id TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(vehicle, question_id)
        )
    """)
    return conn


SIMULATION_SIZE = 30

VEHICLE_LABELS = {
    "auto": "Αυτοκίνητο",
    "moto": "Μοτοσικλέτα",
    "truck": "Φορτηγό",
    "bus": "Λεωφορείο",
    "peiforthgo": "ΠΕΙ Φορτηγό",
}

QUESTIONS_PATHS = {
    "auto": DATA_DIR / "questions_auto.seed.json",
    "moto": DATA_DIR / "questions_moto.seed.json",
    "truck": DATA_DIR / "questions_truck.seed.json",
    "bus": DATA_DIR / "questions_bus.seed.json",
    "peiforthgo": DATA_DIR / "questions_peiforthgo.seed.json",
}

# Row index (0-based, 40px tall each) into frontend/assets/icons/category_sprite.png,
# matching the icon set used by the source material's own category menu. A few
# of our categories are finer-grained subcategory splits that don't have their
# own icon on the source, so they reuse their closest parent/sibling's icon.
CATEGORY_ICONS_AUTO = {
    "Αλκοόλ": 0,
    "Αποστάσεις": 1,
    "Ατύχημα": 2,
    "Αυτοκινητόδρομος": 3,
    "Διαδρομή": 4,
    "Διασταυρώσεις - Γενικά": 5,
    "Διασταυρώσεις - Δεξιά προτεραιότητα": 6,
    "Διασταυρώσεις - Πινακίδες": 7,
    "Διασταυρώσεις - Σιδηρόδρομος": 8,
    "Διασταυρώσεις - Τροχονόμος": 9,
    "Είσοδος": 10,
    "Έκτακτα": 11,
    "Κανόνες": 12,
    "Οδηγός": 13,
    "Οδηγός - Βουνό-κούραση": 13,
    "Οδόστρωμα": 14,
    "Οικολογία": 15,
    "Ορατότητα": 16,
    "Όργανα": 17,
    "Περιβάλλον": 18,
    "Προσπέραση": 19,
    "Πρόσφυση": 20,
    "Σήμανση - Απαγόρευσης": 21,
    "Σήμανση - Αυτοκινητοδρόμου": 22,
    "Σήμανση - Διαγραμμίσεις": 23,
    "Σήμανση - Κατευθύνσεων": 24,
    "Σήμανση - Κινδύνου": 25,
    "Σήμανση - Πληροφοριακές": 26,
    "Σήμανση - Πρόσθετες": 27,
    "Σήμανση - Προτεραιότητας": 28,
    "Σήμανση - Σηματοδότης": 29,
    "Σήμανση - Σιδηρόδρομος": 8,
    "Σήμανση - Τροχονόμος": 9,
    "Σήμανση - Υποχρέωσης": 30,
    "Στάση-Στάθμευση": 31,
    "Στάση-Στάθμευση - Πρόσθετες": 31,
    "Στροφές": 32,
    "Στροφές - Πρόσθετες": 32,
    "Συντήρηση": 33,
    "Συνύπαρξη": 34,
    "Ταχύτητα": 35,
}

# Row index into frontend/assets/icons/category_sprite_moto.png.
CATEGORY_ICONS_MOTO = {
    "Ασφάλεια": 0,
    "Εξαρτήματα": 1,
    "Εξοπλισμός": 2,
    "Ετοιμότητα": 3,
    "Κανόνες": 4,
    "Οδήγηση": 5,
    "Συντήρηση": 6,
    "Ταχύτητα-Αποστάσεις": 7,
}

# Row index into frontend/assets/icons/category_sprite_truck.png. The source
# site's own sprite only has 9 rows (0-8) — its 10th category ("Τεχνικά") has
# no dedicated icon there either, so it reuses the maintenance icon (8).
CATEGORY_ICONS_TRUCK = {
    "Αλκοόλ": 0,
    "Προσπέραση - Ολισθηρότητα": 1,
    "Θέση - Όρια Ταχύτητας": 2,
    "Διαστάσεις - Βάρη": 3,
    "Εξοπλισμός": 4,
    "Μηχανολογία": 5,
    "Σήμανση - Απαγόρευσης": 6,
    "Σήμανση - Αυτοκινητοδρόμου": 7,
    "Σήμανση - Διαγραμμίσεις": 7,
    "Σήμανση - Κατευθύνσεων": 7,
    "Σήμανση - Πληροφοριακές": 7,
    "Σήμανση - Πρόσθετες": 7,
    "Συντήρηση": 8,
    "Τεχνικά": 8,
}


# Row index into frontend/assets/icons/category_sprite_bus.png.
CATEGORY_ICONS_BUS = {
    "Διαστάσεις": 0,
    "Κανόνες": 1,
    "Κυρώσεις": 2,
    "Μηχανολογία": 3,
    "Οδήγηση": 4,
    "Σήμανση - Απαγόρευσης": 5,
    "Σήμανση - Αυτοκινητοδρόμου": 5,
    "Σήμανση - Κατευθύνσεων": 5,
    "Σήμανση - Κινδύνου": 5,
    "Σήμανση - Προτεραιότητας": 5,
    "Σήμανση - Υποχρέωσης": 5,
    "Σήμανση - Πληροφοριακές": 6,
    "Συντήρηση": 7,
    "Ταχογράφοι": 8,
    "Ταχύτητα": 9,
}


# Row index into frontend/assets/icons/category_sprite_peiforthgo.png.
CATEGORY_ICONS_PEIFORTHGO = {
    "Εισαγωγή": 0,
    "Ορθολογική Οδήγηση - Τυπολογία Φορτηγών": 1,
    "Ορθολογική Οδήγηση - Μηχανολογικά": 2,
    "Ορθολογική Οδήγηση - Δυναμική Οχήματος": 3,
    "Ορθολογική Οδήγηση - Κατανάλωση Καυσίμου": 4,
    "Ορθολογική Οδήγηση - Ασφάλιση Φορτίου": 5,
    "Κανονιστικές Ρυθμίσεις - Κανονισμοί": 6,
    "Κανονιστικές Ρυθμίσεις - Υποχρεώσεις Οδηγού": 7,
    "Πρόληψη Κινδύνων": 8,
    "Πρόληψη Κινδύνων - Φυσικοί Κίνδυνοι": 9,
    "Πρόληψη Κινδύνων - Ατυχήματα": 10,
    "Καταστάσεις Έκτακτης Ανάγκης": 11,
    "Αρχές Υγιεινής": 12,
    "Οικονομικό Περιβάλλον": 13,
}

CATEGORY_ICONS = {
    "auto": CATEGORY_ICONS_AUTO,
    "moto": CATEGORY_ICONS_MOTO,
    "truck": CATEGORY_ICONS_TRUCK,
    "bus": CATEGORY_ICONS_BUS,
    "peiforthgo": CATEGORY_ICONS_PEIFORTHGO,
}


class Api:
    def __init__(self):
        self._window = None
        self._titlebar_is_dark = None

    def close_app(self):
        if self._window:
            self._window.destroy()

    def toggle_fullscreen(self):
        if self._window:
            self._window.toggle_fullscreen()

    def set_titlebar_theme(self, is_dark):
        if self._titlebar_is_dark == is_dark:
            return
        if not self._window or not getattr(self._window, "native", None):
            return
        try:
            hwnd = self._window.native.Handle.ToInt32()
        except Exception:
            return
        bg = TITLEBAR_DARK_BG if is_dark else TITLEBAR_LIGHT_BG
        text = TITLEBAR_DARK_TEXT if is_dark else TITLEBAR_LIGHT_TEXT
        dark_flag = ctypes.c_int(1 if is_dark else 0)
        caption = ctypes.c_int(_colorref(bg))
        caption_text = ctypes.c_int(_colorref(text))
        try:
            _dwmapi.DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, ctypes.byref(dark_flag), ctypes.sizeof(dark_flag))
            _dwmapi.DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, ctypes.byref(caption), ctypes.sizeof(caption))
            _dwmapi.DwmSetWindowAttribute(hwnd, DWMWA_TEXT_COLOR, ctypes.byref(caption_text), ctypes.sizeof(caption_text))
            self._titlebar_is_dark = is_dark
        except OSError:
            pass

    def get_vehicles(self):
        return [{"id": vehicle_id, "label": label} for vehicle_id, label in VEHICLE_LABELS.items()]

    def get_sections(self, vehicle):
        questions = self._load_questions(vehicle)
        icons = CATEGORY_ICONS.get(vehicle, {})
        counts = {}
        order = []
        for q in questions:
            category = q["category"]
            if category not in counts:
                counts[category] = 0
                order.append(category)
            counts[category] += 1

        simulation_size = min(SIMULATION_SIZE, len(questions))
        sections = [{"id": "all", "label": "Προσομοίωση Εξέτασης", "count": simulation_size, "icon": None}]
        for category in order:
            sections.append({
                "id": category,
                "label": category,
                "count": counts[category],
                "icon": icons.get(category),
            })
        return sections

    def get_questions(self, vehicle, section_id, count=None):
        questions = self._load_questions(vehicle)
        if section_id == "all":
            sample_size = min(count or SIMULATION_SIZE, len(questions))
            return random.sample(questions, sample_size)
        return [q for q in questions if q["category"] == section_id]

    @staticmethod
    def _load_questions(vehicle):
        path = QUESTIONS_PATHS.get(vehicle)
        if not path:
            return []
        return json.loads(path.read_text(encoding="utf-8"))

    def save_attempt(self, vehicle, section_id, section_label, correct, total):
        conn = _db_connect()
        with conn:
            conn.execute(
                "INSERT INTO attempts (vehicle, section_id, section_label, correct, total, completed_at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (vehicle, section_id, section_label, correct, total, datetime.now(timezone.utc).isoformat()),
            )
        conn.close()

    def get_history(self, limit=20):
        conn = _db_connect()
        rows = conn.execute(
            "SELECT vehicle, section_id, section_label, correct, total, completed_at "
            "FROM attempts ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        conn.close()
        return [
            {
                "vehicle": r[0],
                "sectionId": r[1],
                "sectionLabel": r[2],
                "correct": r[3],
                "total": r[4],
                "completedAt": r[5],
            }
            for r in rows
        ]

    def get_stats(self):
        conn = _db_connect()
        overall = conn.execute("SELECT COUNT(*), SUM(correct), SUM(total) FROM attempts").fetchone()
        per_vehicle_rows = conn.execute(
            "SELECT vehicle, COUNT(*), SUM(correct), SUM(total) FROM attempts GROUP BY vehicle"
        ).fetchall()
        conn.close()

        attempt_count, correct_sum, total_sum = overall
        attempt_count = attempt_count or 0
        correct_sum = correct_sum or 0
        total_sum = total_sum or 0
        avg_percent = round((correct_sum / total_sum) * 100) if total_sum else None

        per_vehicle = []
        for vehicle, count, v_correct, v_total in per_vehicle_rows:
            v_correct = v_correct or 0
            v_total = v_total or 0
            per_vehicle.append({
                "vehicle": vehicle,
                "attemptCount": count,
                "avgPercent": round((v_correct / v_total) * 100) if v_total else None,
            })

        return {
            "attemptCount": attempt_count,
            "avgPercent": avg_percent,
            "perVehicle": per_vehicle,
        }

    def record_quiz_results(self, vehicle, results):
        conn = _db_connect()
        with conn:
            for r in results:
                if r.get("correct"):
                    conn.execute(
                        "DELETE FROM wrong_questions WHERE vehicle = ? AND question_id = ?",
                        (vehicle, r["id"]),
                    )
                else:
                    conn.execute(
                        "INSERT OR IGNORE INTO wrong_questions (vehicle, question_id, category, created_at) "
                        "VALUES (?, ?, ?, ?)",
                        (vehicle, r["id"], r.get("category", ""), datetime.now(timezone.utc).isoformat()),
                    )
        conn.close()

    def get_wrong_count(self, vehicle):
        conn = _db_connect()
        count = conn.execute(
            "SELECT COUNT(*) FROM wrong_questions WHERE vehicle = ?", (vehicle,)
        ).fetchone()[0]
        conn.close()
        return count

    def get_wrong_questions(self, vehicle):
        conn = _db_connect()
        rows = conn.execute(
            "SELECT question_id FROM wrong_questions WHERE vehicle = ? ORDER BY id DESC", (vehicle,)
        ).fetchall()
        conn.close()
        by_id = {q["id"]: q for q in self._load_questions(vehicle)}
        return [by_id[r[0]] for r in rows if r[0] in by_id]

    def save_question(self, vehicle, question_id, category):
        conn = _db_connect()
        with conn:
            conn.execute(
                "INSERT OR IGNORE INTO saved_questions (vehicle, question_id, category, created_at) "
                "VALUES (?, ?, ?, ?)",
                (vehicle, question_id, category, datetime.now(timezone.utc).isoformat()),
            )
        conn.close()

    def unsave_question(self, vehicle, question_id):
        conn = _db_connect()
        with conn:
            conn.execute(
                "DELETE FROM saved_questions WHERE vehicle = ? AND question_id = ?",
                (vehicle, question_id),
            )
        conn.close()

    def get_saved_questions(self, vehicle):
        conn = _db_connect()
        rows = conn.execute(
            "SELECT question_id FROM saved_questions WHERE vehicle = ? ORDER BY id DESC", (vehicle,)
        ).fetchall()
        conn.close()
        by_id = {q["id"]: q for q in self._load_questions(vehicle)}
        return [by_id[r[0]] for r in rows if r[0] in by_id]


def _close_splash():
    try:
        import pyi_splash

        pyi_splash.close()
    except ImportError:
        pass


def main():
    api = Api()
    initial_bg = TITLEBAR_DARK_BG if _detect_system_dark_mode() else TITLEBAR_LIGHT_BG
    window = webview.create_window(
        "RoadReady",
        str(FRONTEND_DIR / "index.html"),
        js_api=api,
        width=1280,
        height=800,
        min_size=(960, 640),
        resizable=True,
        maximized=True,
        background_color=initial_bg,
    )
    api._window = window
    window.events.shown += _close_splash
    webview.start()


if __name__ == "__main__":
    main()
