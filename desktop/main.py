"""Desktop entry point — boots a pywebview window around the frontend/ HTML/CSS/JS app."""
import ctypes
import json
import random
import sys
import winreg
from ctypes import wintypes
from pathlib import Path

import webview
from supabase import AuthApiError, create_client

APP_VERSION = "1.0.6"

SUPABASE_URL = "https://nzuobxttcvdqqzsmcgmv.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6"
    "Im56dW9ieHR0Y3ZkcXF6c21jZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MjI0"
    "MTUsImV4cCI6MjEwNjE5ODQxNX0.o8MnYYpa4y5fWxBOGc6hC6yDbmxu5IIO4MlErXuiuA4"
)
# Safe to embed: Row Level Security on every table (auth.uid() = user_id) is what
# actually protects data, not secrecy of this key. Never embed the service_role key here.
supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Supabase Auth is email-based; we want username+password instead. Each username
# maps to a synthetic, never-emailed address in this fixed fake domain, so no
# real mailbox is ever involved. Requires "Confirm email" to be OFF in the
# Supabase project (Authentication -> Providers -> Email), since a confirmation
# link sent to a synthetic address can never be received.
USERNAME_EMAIL_DOMAIN = "roadready.local"


def _username_to_email(username):
    normalized = (username or "").strip().lower()
    return f"{normalized}@{USERNAME_EMAIL_DOMAIN}"


def _fetch_own_profile():
    try:
        user = supabase.auth.get_user()
        if not user or not user.user:
            return None
        res = supabase.table("profiles").select("*").eq("id", user.user.id).single().execute()
        return res.data
    except Exception:
        return None

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
DATA_DIR = ROOT_DIR / "data"

SIMULATION_SIZE = 30

VEHICLE_LABELS = {
    "auto": "Αυτοκίνητο",
    "moto": "Μοτοσικλέτα",
    "truck": "Φορτηγό",
    "bus": "Λεωφορείο",
    "peiforthgo": "ΠΕΙ Φορτηγό",
}

VEHICLE_LABELS_EN = {
    "auto": "Car",
    "moto": "Motorcycle",
    "truck": "Truck",
    "bus": "Bus",
    "peiforthgo": "Professional Truck Driver",
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

# English translations of every category name used across all vehicles above
# (a handful of names repeat across vehicles, e.g. "Αλκοόλ" — one shared entry
# covers every reuse). Used to localize section/category labels in the UI.
CATEGORY_LABELS_EN = {
    "Αλκοόλ": "Alcohol",
    "Αποστάσεις": "Distances",
    "Ατύχημα": "Accident",
    "Αυτοκινητόδρομος": "Motorway",
    "Διαδρομή": "Route",
    "Διασταυρώσεις - Γενικά": "Intersections - General",
    "Διασταυρώσεις - Δεξιά προτεραιότητα": "Intersections - Priority to the Right",
    "Διασταυρώσεις - Πινακίδες": "Intersections - Signs",
    "Διασταυρώσεις - Σιδηρόδρομος": "Intersections - Railway Crossing",
    "Διασταυρώσεις - Τροχονόμος": "Intersections - Traffic Officer",
    "Είσοδος": "Entry",
    "Έκτακτα": "Emergencies",
    "Κανόνες": "Rules",
    "Οδηγός": "Driver",
    "Οδηγός - Βουνό-κούραση": "Driver - Mountain Driving & Fatigue",
    "Οδόστρωμα": "Road Surface",
    "Οικολογία": "Ecology",
    "Ορατότητα": "Visibility",
    "Όργανα": "Instruments",
    "Περιβάλλον": "Environment",
    "Προσπέραση": "Overtaking",
    "Πρόσφυση": "Traction",
    "Σήμανση - Απαγόρευσης": "Signs - Prohibition",
    "Σήμανση - Αυτοκινητοδρόμου": "Signs - Motorway",
    "Σήμανση - Διαγραμμίσεις": "Signs - Road Markings",
    "Σήμανση - Κατευθύνσεων": "Signs - Direction",
    "Σήμανση - Κινδύνου": "Signs - Danger",
    "Σήμανση - Πληροφοριακές": "Signs - Informational",
    "Σήμανση - Πρόσθετες": "Signs - Additional",
    "Σήμανση - Προτεραιότητας": "Signs - Priority",
    "Σήμανση - Σηματοδότης": "Signs - Traffic Light",
    "Σήμανση - Σιδηρόδρομος": "Signs - Railway Crossing",
    "Σήμανση - Τροχονόμος": "Signs - Traffic Officer",
    "Σήμανση - Υποχρέωσης": "Signs - Mandatory",
    "Στάση-Στάθμευση": "Stopping & Parking",
    "Στάση-Στάθμευση - Πρόσθετες": "Stopping & Parking - Additional",
    "Στροφές": "Turns",
    "Στροφές - Πρόσθετες": "Turns - Additional",
    "Συντήρηση": "Maintenance",
    "Συνύπαρξη": "Sharing the Road",
    "Ταχύτητα": "Speed",
    "Ασφάλεια": "Safety",
    "Εξαρτήματα": "Components",
    "Εξοπλισμός": "Equipment",
    "Ετοιμότητα": "Readiness",
    "Οδήγηση": "Driving",
    "Ταχύτητα-Αποστάσεις": "Speed & Distances",
    "Προσπέραση - Ολισθηρότητα": "Overtaking - Slipperiness",
    "Θέση - Όρια Ταχύτητας": "Position - Speed Limits",
    "Διαστάσεις - Βάρη": "Dimensions & Weights",
    "Μηχανολογία": "Mechanics",
    "Τεχνικά": "Technical",
    "Διαστάσεις": "Dimensions",
    "Κυρώσεις": "Penalties",
    "Ταχογράφοι": "Tachographs",
    "Εισαγωγή": "Introduction",
    "Ορθολογική Οδήγηση - Τυπολογία Φορτηγών": "Rational Driving - Truck Types",
    "Ορθολογική Οδήγηση - Μηχανολογικά": "Rational Driving - Mechanics",
    "Ορθολογική Οδήγηση - Δυναμική Οχήματος": "Rational Driving - Vehicle Dynamics",
    "Ορθολογική Οδήγηση - Κατανάλωση Καυσίμου": "Rational Driving - Fuel Consumption",
    "Ορθολογική Οδήγηση - Ασφάλιση Φορτίου": "Rational Driving - Load Securing",
    "Κανονιστικές Ρυθμίσεις - Κανονισμοί": "Regulations - Rules",
    "Κανονιστικές Ρυθμίσεις - Υποχρεώσεις Οδηγού": "Regulations - Driver Obligations",
    "Πρόληψη Κινδύνων": "Risk Prevention",
    "Πρόληψη Κινδύνων - Φυσικοί Κίνδυνοι": "Risk Prevention - Natural Hazards",
    "Πρόληψη Κινδύνων - Ατυχήματα": "Risk Prevention - Accidents",
    "Καταστάσεις Έκτακτης Ανάγκης": "Emergency Situations",
    "Αρχές Υγιεινής": "Health & Hygiene Principles",
    "Οικονομικό Περιβάλλον": "Economic Environment",
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

    def get_app_version(self):
        return APP_VERSION

    def check_for_update(self):
        try:
            res = (
                supabase.table("app_version")
                .select("latest_version, download_url")
                .eq("id", 1)
                .single()
                .execute()
            )
            return {
                "ok": True,
                "currentVersion": APP_VERSION,
                "latestVersion": res.data["latest_version"],
                "downloadUrl": res.data["download_url"],
            }
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def start_update(self, download_url):
        try:
            import subprocess
            import tempfile
            import urllib.request
            from pathlib import Path as _Path

            installer_path = _Path(tempfile.gettempdir()) / "RoadReadySetup.exe"
            urllib.request.urlretrieve(download_url, installer_path)
            subprocess.Popen([str(installer_path)], close_fds=True)
            if self._window:
                self._window.destroy()
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def sign_in(self, username, password):
        try:
            res = supabase.auth.sign_in_with_password({
                "email": _username_to_email(username),
                "password": password,
            })
            profile = _fetch_own_profile()
            return {
                "ok": True,
                "username": res.user.user_metadata.get("username", username),
                "role": profile.get("role") if profile else "user",
            }
        except AuthApiError as e:
            if e.code == "invalid_credentials":
                return {"ok": False, "error": "invalid_credentials"}
            return {"ok": False, "error": str(e)}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def sign_out(self):
        try:
            supabase.auth.sign_out()
        except Exception:
            pass
        return True

    def change_password(self, new_password):
        try:
            supabase.auth.update_user({"password": new_password})
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def list_users(self):
        # RLS scopes this automatically: admins see everyone, supervisors see
        # their own team plus themselves, regular users see only themselves.
        res = supabase.table("profiles").select("id, username, role, supervisor_id").execute()
        by_id = {p["id"]: p["username"] for p in res.data}
        return [
            {
                "id": p["id"],
                "username": p["username"],
                "role": p["role"],
                "supervisorId": p["supervisor_id"],
                "supervisorUsername": by_id.get(p["supervisor_id"]),
            }
            for p in res.data
        ]

    def get_admin_analytics(self):
        # RLS-gated: an admin gets everyone's rows, a supervisor gets their own
        # users' attempts (plus their own), anyone else just their own.
        profiles = supabase.table("profiles").select("id, username, role, supervisor_id").execute().data
        attempts = (
            supabase.table("attempts")
            .select("user_id, vehicle, correct, total, completed_at")
            .order("completed_at", desc=True)
            .execute()
            .data
        )

        me = _fetch_own_profile()
        caller_role = me["role"] if me else "user"
        student_ids = {p["id"] for p in profiles if p["role"] == "user"}
        if caller_role == "supervisor":
            # A supervisor's statistics are about their users, not their own practice.
            attempts = [a for a in attempts if a["user_id"] in student_ids]

        students = []
        for p in profiles:
            if p["role"] != "user":
                continue
            own = [a for a in attempts if a["user_id"] == p["id"]]
            correct = sum(a["correct"] for a in own)
            total = sum(a["total"] for a in own)
            students.append({
                "id": p["id"],
                "username": p["username"],
                "attemptCount": len(own),
                "avgPercent": round((correct / total) * 100) if total else None,
                "lastActivity": own[0]["completed_at"] if own else None,
            })

        profile_by_id = {p["id"]: p for p in profiles}
        role_counts = {"admin": 0, "supervisor": 0, "user": 0}
        for p in profiles:
            role_counts[p["role"]] = role_counts.get(p["role"], 0) + 1

        total_correct = sum(a["correct"] for a in attempts)
        total_questions = sum(a["total"] for a in attempts)
        overall_percent = round((total_correct / total_questions) * 100) if total_questions else None

        per_vehicle_totals = {}
        for a in attempts:
            agg = per_vehicle_totals.setdefault(a["vehicle"], {"count": 0, "correct": 0, "total": 0})
            agg["count"] += 1
            agg["correct"] += a["correct"]
            agg["total"] += a["total"]
        by_vehicle = [
            {
                "vehicle": vehicle,
                "label": VEHICLE_LABELS.get(vehicle, vehicle),
                "attemptCount": agg["count"],
                "avgPercent": round((agg["correct"] / agg["total"]) * 100) if agg["total"] else None,
            }
            for vehicle, agg in per_vehicle_totals.items()
        ]

        def team_stats(user_ids):
            team_attempts = [a for a in attempts if a["user_id"] in user_ids]
            correct = sum(a["correct"] for a in team_attempts)
            total = sum(a["total"] for a in team_attempts)
            return {
                "userCount": len(user_ids),
                "attemptCount": len(team_attempts),
                "avgPercent": round((correct / total) * 100) if total else None,
            }

        by_supervisor = []
        for sup in [p for p in profiles if p["role"] == "supervisor"]:
            team_ids = {p["id"] for p in profiles if p["supervisor_id"] == sup["id"]}
            stats = team_stats(team_ids)
            stats["id"] = sup["id"]
            stats["username"] = sup["username"]
            by_supervisor.append(stats)

        direct_user_ids = {p["id"] for p in profiles if p["role"] == "user" and not p["supervisor_id"]}
        direct_users = team_stats(direct_user_ids)

        recent = []
        for a in attempts[:20]:
            p = profile_by_id.get(a["user_id"])
            recent.append({
                "username": p["username"] if p else "—",
                "vehicle": VEHICLE_LABELS.get(a["vehicle"], a["vehicle"]),
                "correct": a["correct"],
                "total": a["total"],
                "completedAt": a["completed_at"],
            })

        return {
            "role": caller_role,
            "students": students,
            "userCounts": role_counts,
            "attemptCount": len(attempts),
            "overallPercent": overall_percent,
            "byVehicle": by_vehicle,
            "bySupervisor": by_supervisor,
            "directUsers": direct_users,
            "recent": recent,
        }

    def create_user(self, username, password, role=None, supervisor_id=None):
        try:
            res = supabase.functions.invoke("manage-users", {
                "responseType": "json",
                "body": {
                    "action": "create",
                    "username": username,
                    "password": password,
                    "role": role,
                    "supervisorId": supervisor_id,
                },
            })
            return res
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def delete_user(self, user_id):
        try:
            res = supabase.functions.invoke("manage-users", {
                "responseType": "json",
                "body": {"action": "delete", "userId": user_id},
            })
            return res
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def update_user(self, user_id, username, password=None):
        try:
            res = supabase.functions.invoke("manage-users", {
                "responseType": "json",
                "body": {
                    "action": "update",
                    "userId": user_id,
                    "username": username,
                    "password": password,
                },
            })
            return res
        except Exception as e:
            return {"ok": False, "error": str(e)}

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
        return [
            {"id": vehicle_id, "label": label, "labelEn": VEHICLE_LABELS_EN.get(vehicle_id, label)}
            for vehicle_id, label in VEHICLE_LABELS.items()
        ]

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
        sections = [{
            "id": "all",
            "label": "Προσομοίωση Εξέτασης",
            "labelEn": "Exam Simulation",
            "count": simulation_size,
            "icon": None,
        }]
        for category in order:
            sections.append({
                "id": category,
                "label": category,
                "labelEn": CATEGORY_LABELS_EN.get(category, category),
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
        supabase.table("attempts").insert({
            "vehicle": vehicle,
            "section_id": section_id,
            "section_label": section_label,
            "correct": correct,
            "total": total,
        }).execute()

    def get_user_history(self, user_id, limit=200):
        # RLS decides who may read this: a supervisor only gets their own
        # users' attempts, an admin anyone's, everyone else only their own.
        res = (
            supabase.table("attempts")
            .select("id, vehicle, section_id, section_label, correct, total, completed_at")
            .eq("user_id", user_id)
            .order("completed_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [
            {
                "id": r["id"],
                "vehicle": r["vehicle"],
                "sectionLabel": r["section_label"],
                "correct": r["correct"],
                "total": r["total"],
                "completedAt": r["completed_at"],
            }
            for r in res.data
        ]

    def get_user_wrong_questions(self, user_id):
        # The questions this user is currently still getting wrong (same RLS
        # rules as get_user_history), resolved to full question objects.
        res = (
            supabase.table("wrong_questions")
            .select("vehicle, question_id, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        banks = {}
        result = []
        for r in res.data:
            if r["vehicle"] not in banks:
                banks[r["vehicle"]] = {q["id"]: q for q in self._load_questions(r["vehicle"])}
            q = banks[r["vehicle"]].get(r["question_id"])
            if q:
                result.append({"vehicle": r["vehicle"], "since": r["created_at"], "question": q})
        return result

    def get_history(self, limit=20):
        res = (
            supabase.table("attempts")
            .select("vehicle, section_id, section_label, correct, total, completed_at")
            .order("id", desc=True)
            .limit(limit)
            .execute()
        )
        return [
            {
                "vehicle": r["vehicle"],
                "sectionId": r["section_id"],
                "sectionLabel": r["section_label"],
                "correct": r["correct"],
                "total": r["total"],
                "completedAt": r["completed_at"],
            }
            for r in res.data
        ]

    def get_stats(self):
        res = supabase.table("attempts").select("vehicle, correct, total").execute()
        rows = res.data

        attempt_count = len(rows)
        correct_sum = sum(r["correct"] for r in rows)
        total_sum = sum(r["total"] for r in rows)
        avg_percent = round((correct_sum / total_sum) * 100) if total_sum else None

        per_vehicle_totals = {}
        for r in rows:
            agg = per_vehicle_totals.setdefault(r["vehicle"], {"count": 0, "correct": 0, "total": 0})
            agg["count"] += 1
            agg["correct"] += r["correct"]
            agg["total"] += r["total"]

        per_vehicle = [
            {
                "vehicle": vehicle,
                "attemptCount": agg["count"],
                "avgPercent": round((agg["correct"] / agg["total"]) * 100) if agg["total"] else None,
            }
            for vehicle, agg in per_vehicle_totals.items()
        ]

        return {
            "attemptCount": attempt_count,
            "avgPercent": avg_percent,
            "perVehicle": per_vehicle,
        }

    def record_quiz_results(self, vehicle, results):
        for r in results:
            if r.get("correct"):
                (
                    supabase.table("wrong_questions")
                    .delete()
                    .eq("vehicle", vehicle)
                    .eq("question_id", r["id"])
                    .execute()
                )
            else:
                supabase.table("wrong_questions").upsert(
                    {"vehicle": vehicle, "question_id": r["id"], "category": r.get("category", "")},
                    on_conflict="user_id,vehicle,question_id",
                    ignore_duplicates=True,
                ).execute()

    def get_wrong_count(self, vehicle):
        res = supabase.table("wrong_questions").select("id", count="exact").eq("vehicle", vehicle).execute()
        return res.count or 0

    def get_wrong_questions(self, vehicle):
        res = (
            supabase.table("wrong_questions")
            .select("question_id")
            .eq("vehicle", vehicle)
            .order("id", desc=True)
            .execute()
        )
        by_id = {q["id"]: q for q in self._load_questions(vehicle)}
        return [by_id[r["question_id"]] for r in res.data if r["question_id"] in by_id]

    def save_question(self, vehicle, question_id, category):
        supabase.table("saved_questions").upsert(
            {"vehicle": vehicle, "question_id": question_id, "category": category},
            on_conflict="user_id,vehicle,question_id",
            ignore_duplicates=True,
        ).execute()

    def unsave_question(self, vehicle, question_id):
        (
            supabase.table("saved_questions")
            .delete()
            .eq("vehicle", vehicle)
            .eq("question_id", question_id)
            .execute()
        )

    def get_saved_questions(self, vehicle):
        res = (
            supabase.table("saved_questions")
            .select("question_id")
            .eq("vehicle", vehicle)
            .order("id", desc=True)
            .execute()
        )
        by_id = {q["id"]: q for q in self._load_questions(vehicle)}
        return [by_id[r["question_id"]] for r in res.data if r["question_id"] in by_id]


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
