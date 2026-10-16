"""Browser smoke test (Playwright/Chromium). Needs the stack on :5000 and the built frontend served on :5173."""
import sys, uuid, requests
from playwright.sync_api import sync_playwright

URL, API = "http://127.0.0.1:5173", "http://127.0.0.1:5000/api/v1"
email = f"ui{uuid.uuid4().hex[:6]}@example.com"
r = requests.post(API + "/auth/register", json={"name": "UI Tester", "email": email, "password": "Passw0rd!",
                  "role": "JOB_SEEKER", "skills": ["AWS", "Docker", "Python"], "desired_role": "Cloud Engineer"})
assert r.status_code == 201, r.text
errors, ok = [], 0


def noise(t):
    return any(s in t for s in ("ERR_TUNNEL", "fonts.g", "favicon", "Failed to load resource"))


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" and not noise(m.text) else None)
    bad = []
    pg.on("response", lambda res: bad.append(f"{res.status} {res.url}") if res.url.startswith(API) and res.status >= 400 else None)

    pg.goto(URL + "/login"); pg.wait_for_timeout(1200)
    pg.fill("input[type=email]", email); pg.fill("input[type=password]", "Passw0rd!")
    pg.click("button[type=submit]"); pg.wait_for_timeout(2500)
    print("after login:", pg.url)

    pg.goto(URL + "/discover"); pg.wait_for_timeout(2500)
    pg.screenshot(path="/tmp/shots/discover.png")
    txt = pg.inner_text("body")
    print("discover shows competition:", "competition" in txt.lower(), "| applicants:", "applicant" in txt.lower())

    pg.goto(URL + "/dashboard"); pg.wait_for_timeout(3500)
    pg.screenshot(path="/tmp/shots/dashboard.png", full_page=True)
    txt = pg.inner_text("body")
    print("dashboard:", all(k in txt for k in ("Application funnel", "Skill gap", "Hiring trends", "Resume performance")))

    pg.goto(URL + "/notifications/preferences"); pg.wait_for_timeout(2000)
    pg.screenshot(path="/tmp/shots/prefs.png", full_page=True)
    pg.click("#pref-instant_job"); pg.click("#btn-save-prefs"); pg.wait_for_timeout(1500)
    saved = requests.get(API + "/notifications/preferences", headers={"Authorization": "Bearer " + requests.post(
        API + "/auth/login", json={"email": email, "password": "Passw0rd!"}).json()["access_token"]}).json()
    print("pref saved via UI:", saved["preferences"]["instant_job"])

    pg.goto(URL + "/applications"); pg.wait_for_timeout(2000)
    pg.screenshot(path="/tmp/shots/applications.png")
    b.close()
print("API errors:", bad[:6] or "none")
print("JS errors:", errors[:6] or "none")
sys.exit(1 if errors or bad else 0)
