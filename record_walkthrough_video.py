import os
import sys
import time
import shutil
import urllib.request
import json
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Sono\.gemini\antigravity\brain\b7b4377c-5298-4479-859a-1a8b9373b851"
TEMP_VIDEO_DIR = os.path.join(ARTIFACT_DIR, "video_temp")
OUTPUT_VIDEO_FILE = os.path.join(ARTIFACT_DIR, "app_walkthrough_demo.webm")

# Reset database file
DB_FILE = r"D:\github repos\Nasr\server\data\db.json"

def reset_database():
    try:
        req = urllib.request.Request("http://localhost:5000/api/admin/reset", data=b'{}', headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            print("Successfully reset server database:", response.read().decode())
    except Exception as e:
        print(f"Error resetting db via HTTP: {e}")

def record_demo():
    reset_database()
    shutil.rmtree(TEMP_VIDEO_DIR, ignore_errors=True)
    os.makedirs(TEMP_VIDEO_DIR, exist_ok=True)
    
    print("==================================================")
    print("STARTING VIDEO RECORDING: ALL 3 ROLES")
    print("==================================================")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--start-maximized", "--no-sandbox"]
        )
        
        # 1366x768 high definition viewport
        context = browser.new_context(
            viewport={"width": 1366, "height": 768},
            record_video_dir=TEMP_VIDEO_DIR,
            record_video_size={"width": 1366, "height": 768}
        )
        
        page = context.new_page()
        
        # -------------------------------------------------------------
        # STEP 1: LOGIN PAGE OVERVIEW & LANGUAGE TOGGLE
        # -------------------------------------------------------------
        print("--> 1. Opening Login Screen...")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(2000)
        
        # -------------------------------------------------------------
        # STEP 2: CUSTOMER ROLE - BOOKING A RIDE (Amrsono)
        # -------------------------------------------------------------
        print("--> 2. Customer Amrsono Logging In...")
        page.fill('input[type="email"]', "amrsono@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "customer123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3000)
        
        print("--> 3. Customer Selecting Destination on Map...")
        # Select popular spot preset
        presets = page.locator("button:has-text('سيتي ستارز'), button:has-text('Citystars'), button:has-text('مطار القاهرة'), button:has-text('Airport')")
        if presets.count() > 0:
            presets.first.click()
            page.wait_for_timeout(2000)
            
        # Add trip notes
        textarea = page.locator("textarea")
        if textarea.is_visible():
            textarea.fill("I am waiting outside the main entrance. Please call when nearby.")
            page.wait_for_timeout(1500)
            
        # Request Ride
        print("--> 4. Customer Requesting Ride...")
        request_btn = page.locator("button[type='submit']:has-text('طلب الرحلة'), button[type='submit']:has-text('Request Ride')").first
        page.wait_for_timeout(1000)
        request_btn.click()
        page.wait_for_timeout(4000)
        
        # -------------------------------------------------------------
        # STEP 3: DRIVER ROLE - ACCEPT & COMPLETE TRIP (Driver 1 - Ahmed)
        # -------------------------------------------------------------
        print("--> 5. Switching to Driver 1...")
        page.evaluate("() => localStorage.clear()")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "driver1@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "driver123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3000)
        
        # Driver Radar Queue Check
        print("--> 6. Driver Sees Ride in Queue & Accepts...")
        page.wait_for_selector("button:has-text('قبول الرحلة'), button:has-text('Accept Ride')", timeout=8000)
        accept_btn = page.locator("button:has-text('قبول الرحلة'), button:has-text('Accept Ride')").first
        accept_btn.click()
        page.wait_for_timeout(3500)
        
        # Step 1: Customer Picked Up
        print("--> 7. Driver Flags 'Customer Picked Up'...")
        pickup_btn = page.locator("button:has-text('Customer Picked Up'), button:has-text('تم ركوب العميل')").first
        pickup_btn.click()
        page.wait_for_timeout(3500)
        
        # Step 2: Customer Dropped Off & Payment Entry
        print("--> 8. Driver Flags 'Customer Dropped Off' & Enters Payment...")
        dropoff_btn = page.locator("button:has-text('Customer Dropped Off'), button:has-text('تم إنزال العميل')").first
        dropoff_btn.click()
        page.wait_for_timeout(2500)
        
        # Modal: Confirm Payment
        confirm_btn = page.locator("button:has-text('تأكيد الدفع'), button:has-text('Confirm Payment')").first
        confirm_btn.click()
        page.wait_for_timeout(4000) # Confetti celebration
        
        # Driver Profile Edit Modal Demo
        print("--> 9. Driver Opens Profile & Vehicle Edit Modal...")
        edit_profile_btn = page.locator("button:has-text('تعديل الملف'), button:has-text('Edit Profile')").first
        if edit_profile_btn.is_visible():
            edit_profile_btn.click()
            page.wait_for_timeout(2500)
            
            # Switch avatar preset
            avatar_btns = page.locator("button:has(img[alt='preset'])")
            if avatar_btns.count() > 2:
                avatar_btns.nth(2).click()
                page.wait_for_timeout(1200)
                
            cancel_btn = page.locator("button:has-text('إلغاء'), button:has-text('Cancel')").first
            cancel_btn.click()
            page.wait_for_timeout(1500)
            
        # -------------------------------------------------------------
        # STEP 4: OWNER / ADMIN ROLE (Owner Admin)
        # -------------------------------------------------------------
        print("--> 10. Logging Out Driver & Logging In as Owner / Admin...")
        page.evaluate("() => localStorage.clear()")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "admin@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "admin123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3500)
        
        print("--> 11. Admin Exploring Live Fleet Map & KPI Revenue Cards...")
        page.wait_for_timeout(3000)
        
        # Admin Tab 2: Trips Management Log
        print("--> 12. Admin Inspecting All Trips Log...")
        trips_tab = page.locator("button:has-text('كل الرحلات'), button:has-text('All Trips')").first
        if trips_tab.is_visible():
            trips_tab.click()
            page.wait_for_timeout(3000)
            
        # Admin Tab 3: Driver Fleet Performance
        print("--> 13. Admin Inspecting Driver Fleet & Earnings...")
        drivers_tab = page.locator("button:has-text('أسطول السائقين'), button:has-text('Driver Fleet'), button:has-text('Drivers')").first
        if drivers_tab.is_visible():
            drivers_tab.click()
            page.wait_for_timeout(3000)
            
        # Admin Tab 4: System & Google Maps API Configuration
        print("--> 14. Admin Inspecting System Settings & Google Maps...")
        settings_tab = page.locator("button:has-text('الإعدادات'), button:has-text('Settings')").first
        if settings_tab.is_visible():
            settings_tab.click()
            page.wait_for_timeout(3000)
            
        # -------------------------------------------------------------
        # STEP 5: FINAL CUSTOMER RATING
        # -------------------------------------------------------------
        print("--> 15. Customer Amrsono Rating the Completed Trip...")
        page.evaluate("() => localStorage.clear()")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "amrsono@nasr.com")
        page.wait_for_timeout(600)
        page.fill('input[type="password"]', "customer123")
        page.wait_for_timeout(600)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3000)
        
        submit_rating_btn = page.locator("button:has-text('إرسال التقييم'), button:has-text('Submit Rating')").first
        if submit_rating_btn.is_visible():
            submit_rating_btn.click()
            page.wait_for_timeout(3500)
            
        print("--> 16. Finishing video recording...")
        context.close()
        browser.close()
        
    # Copy output video file
    video_files = [f for f in os.listdir(TEMP_VIDEO_DIR) if f.endswith(".webm")]
    if video_files:
        src = os.path.join(TEMP_VIDEO_DIR, video_files[-1])
        shutil.copyfile(src, OUTPUT_VIDEO_FILE)
        size_mb = os.path.getsize(OUTPUT_VIDEO_FILE) / (1024 * 1024)
        print("==================================================")
        print(f"VIDEO RECORDING COMPLETED SUCCESSFULLY!")
        print(f"Path: {OUTPUT_VIDEO_FILE}")
        print(f"Size: {size_mb:.2f} MB")
        print("==================================================")
        return OUTPUT_VIDEO_FILE
    else:
        print("Error: No video found in temp dir")
        return None

if __name__ == "__main__":
    record_demo()
