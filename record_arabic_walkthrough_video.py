import os
import sys
import time
import shutil
import urllib.request
import json
import imageio
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Sono\.gemini\antigravity\brain\b7b4377c-5298-4479-859a-1a8b9373b851"
TEMP_VIDEO_DIR = os.path.join(ARTIFACT_DIR, "video_temp_ar")
OUTPUT_WEBM = os.path.join(ARTIFACT_DIR, "app_walkthrough_arabic.webm")
OUTPUT_MP4 = os.path.join(ARTIFACT_DIR, "app_walkthrough_arabic.mp4")
PROJECT_ROOT_MP4 = r"d:\github repos\Nasr\app_walkthrough_arabic.mp4"

def reset_database():
    try:
        req = urllib.request.Request(
            "http://localhost:5000/api/admin/reset",
            data=b'{}',
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            print("Reset server database:", response.read().decode())
    except Exception as e:
        print(f"Database reset note: {e}")

def record_arabic_demo():
    reset_database()
    shutil.rmtree(TEMP_VIDEO_DIR, ignore_errors=True)
    os.makedirs(TEMP_VIDEO_DIR, exist_ok=True)
    
    print("==================================================")
    print("🎬 STARTING ARABIC VIDEO RECORDING + REGISTRATION")
    print("==================================================")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--start-maximized", "--no-sandbox"]
        )
        
        # 1366x768 high-definition viewport
        context = browser.new_context(
            viewport={"width": 1366, "height": 768},
            record_video_dir=TEMP_VIDEO_DIR,
            record_video_size={"width": 1366, "height": 768}
        )
        
        page = context.new_page()
        
        # -------------------------------------------------------------
        # STEP 1: OPEN APP & SWITCH TO ARABIC
        # -------------------------------------------------------------
        print("--> 1. Opening app and switching language to Arabic...")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(2000)
        
        # Click language toggle button to switch to Arabic (العربية)
        lang_btn = page.locator("button:has-text('العربية'), button:has-text('English')").first
        if lang_btn.is_visible():
            lang_btn.click()
            page.wait_for_timeout(2000)
            
        # -------------------------------------------------------------
        # STEP 2: NEW CUSTOMER REGISTRATION FLOW (إنشاء حساب عميل جديد)
        # -------------------------------------------------------------
        print("--> 2. Navigating to Register Tab (إنشاء حساب)...")
        register_tab = page.locator("button:has-text('إنشاء حساب'), button:has-text('Register')").first
        if register_tab.is_visible():
            register_tab.click()
            page.wait_for_timeout(2000)
            
        print("--> 3. Filling New Customer Registration Form...")
        page.wait_for_timeout(1000)
        
        # Name
        name_input = page.locator("input[placeholder*='Amr'], input[placeholder*='اسم'], input[required]").first
        name_input.fill("كريم الشناوي")
        page.wait_for_timeout(1000)
        
        # Phone
        phone_input = page.locator("input[type='tel']").first
        phone_input.fill("+20 101 987 6543")
        page.wait_for_timeout(1000)
        
        # Email
        email_input = page.locator("input[type='email']").first
        email_input.fill("karim@nasr.com")
        page.wait_for_timeout(1000)
        
        # Password
        pw_input = page.locator("input[type='password']").first
        pw_input.fill("karim123")
        page.wait_for_timeout(1000)
        
        # Submit Registration
        print("--> 4. Submitting Customer Registration...")
        submit_btn = page.locator("button[type='submit']:has-text('إنشاء حساب'), button[type='submit']:has-text('Register'), button[type='submit']:has-text('حساب')").first
        submit_btn.click()
        page.wait_for_timeout(4000)
        
        # -------------------------------------------------------------
        # STEP 3: CUSTOMER BOOKING A RIDE (حجز رحلة جديدة)
        # -------------------------------------------------------------
        print("--> 5. Customer Selecting Destination on Interactive Map...")
        page.wait_for_timeout(2000)
        
        # Click on popular spot preset: Citystars or Airport
        preset_btn = page.locator("button:has-text('سيتي ستارز'), button:has-text('مطار القاهرة')").first
        if preset_btn.is_visible():
            preset_btn.click()
            page.wait_for_timeout(2000)
            
        # Add Arabic trip notes
        textarea = page.locator("textarea").first
        if textarea.is_visible():
            textarea.fill("أنا بانتظارك أمام البوابة الرئيسية ومعي حقيبتان. برجاء الاتصال عند الوصول.")
            page.wait_for_timeout(2000)
            
        # Submit Ride Request
        print("--> 6. Customer Requesting Ride (طلب الرحلة)...")
        req_btn = page.locator("button[type='submit']:has-text('طلب الرحلة'), button[type='submit']:has-text('Request Ride')").first
        req_btn.click()
        page.wait_for_timeout(4500)
        
        # -------------------------------------------------------------
        # STEP 4: DRIVER 1 ACCEPTANCE & EXECUTION (السائق أحمد)
        # -------------------------------------------------------------
        print("--> 7. Logging in as Driver 1 (السائق أحمد)...")
        page.evaluate("() => localStorage.clear()")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "driver1@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "driver123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3500)
        
        # Accept ride from queue (قبول الرحلة)
        print("--> 8. Driver Accepts Incoming Trip from Radar Queue (قبول الرحلة)...")
        page.wait_for_selector("button:has-text('قبول الرحلة'), button:has-text('Accept Ride')", timeout=8000)
        accept_btn = page.locator("button:has-text('قبول الرحلة'), button:has-text('Accept Ride')").first
        accept_btn.click()
        page.wait_for_timeout(3500)
        
        # Flag: تم ركوب العميل (Customer Picked Up)
        print("--> 9. Driver Flags: تم ركوب العميل (Customer Picked Up)...")
        pickup_btn = page.locator("button:has-text('تم ركوب العميل'), button:has-text('Customer Picked Up')").first
        pickup_btn.click()
        page.wait_for_timeout(3500)
        
        # Flag: تم إنزال العميل (Customer Dropped Off)
        print("--> 10. Driver Flags: تم إنزال العميل (Customer Dropped Off)...")
        dropoff_btn = page.locator("button:has-text('تم إنزال العميل'), button:has-text('Customer Dropped Off')").first
        dropoff_btn.click()
        page.wait_for_timeout(2500)
        
        # Confirm Payment Modal (تأكيد الدفع)
        print("--> 11. Driver Confirms Payment in Arabic Modal (تأكيد الدفع)...")
        confirm_pay_btn = page.locator("button:has-text('تأكيد الدفع'), button:has-text('Confirm Payment')").first
        confirm_pay_btn.click()
        page.wait_for_timeout(4000) # Confetti celebration
        
        # Driver Profile Edit Modal (تعديل الملف الشخصي وبيانات السيارة)
        print("--> 12. Driver Opens Vehicle & Profile Edit Modal...")
        edit_profile_btn = page.locator("button:has-text('تعديل الملف'), button:has-text('Edit Profile')").first
        if edit_profile_btn.is_visible():
            edit_profile_btn.click()
            page.wait_for_timeout(2500)
            
            # Switch avatar preset
            avatar_presets = page.locator("button:has(img[alt='preset'])")
            if avatar_presets.count() > 2:
                avatar_presets.nth(2).click()
                page.wait_for_timeout(1200)
                
            cancel_btn = page.locator("button:has-text('إلغاء'), button:has-text('Cancel')").first
            cancel_btn.click()
            page.wait_for_timeout(1500)
            
        # -------------------------------------------------------------
        # STEP 5: OWNER / ADMIN ROLE IN ARABIC (المالك / الإدارة)
        # -------------------------------------------------------------
        print("--> 13. Logging in as Owner / Admin (المالك - الإدارة)...")
        page.evaluate("() => localStorage.clear()")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "admin@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "admin123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3500)
        
        print("--> 14. Admin Reviewing KPI Cards & Live Fleet Map...")
        page.wait_for_timeout(3000)
        
        # Tab 2: All Trips Log (كل الرحلات)
        print("--> 15. Admin Inspecting All Trips Log (سجل الرحلات)...")
        trips_tab = page.locator("button:has-text('كل الرحلات'), button:has-text('All Trips')").first
        if trips_tab.is_visible():
            trips_tab.click()
            page.wait_for_timeout(3000)
            
        # Tab 3: Drivers Fleet (أسطول السائقين)
        print("--> 16. Admin Inspecting Driver Fleet & Ratings (أسطول السائقين)...")
        drivers_tab = page.locator("button:has-text('أسطول السائقين'), button:has-text('Driver Fleet'), button:has-text('Drivers')").first
        if drivers_tab.is_visible():
            drivers_tab.click()
            page.wait_for_timeout(3000)
            
        # Tab 4: System Settings (الإعدادات)
        print("--> 17. Admin Inspecting System Settings & Google Maps Key (الإعدادات)...")
        settings_tab = page.locator("button:has-text('الإعدادات'), button:has-text('Settings')").first
        if settings_tab.is_visible():
            settings_tab.click()
            page.wait_for_timeout(3000)
            
        # -------------------------------------------------------------
        # STEP 6: CUSTOMER RATING IN ARABIC (تقييم الرحلة)
        # -------------------------------------------------------------
        print("--> 18. Customer Rating Completed Trip (تقييم الرحلة والاحتفال)...")
        page.evaluate("() => localStorage.clear()")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "karim@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "karim123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3000)
        
        submit_rate_btn = page.locator("button:has-text('إرسال التقييم'), button:has-text('Submit Rating')").first
        if submit_rate_btn.is_visible():
            submit_rate_btn.click()
            page.wait_for_timeout(3500)
            
        print("--> 19. Finalizing video recording...")
        context.close()
        browser.close()
        
    # Process output video
    video_files = [f for f in os.listdir(TEMP_VIDEO_DIR) if f.endswith(".webm")]
    if video_files:
        src = os.path.join(TEMP_VIDEO_DIR, video_files[-1])
        shutil.copyfile(src, OUTPUT_WEBM)
        size_mb = os.path.getsize(OUTPUT_WEBM) / (1024 * 1024)
        print(f"Saved WebM to: {OUTPUT_WEBM} ({size_mb:.2f} MB)")
        
        # Convert to MP4 using imageio
        print("Converting to standard MP4...")
        reader = imageio.get_reader(OUTPUT_WEBM)
        fps = reader.get_meta_data().get('fps', 25)
        writer = imageio.get_writer(OUTPUT_MP4, fps=fps, codec='libx264')
        for frame in reader:
            writer.append_data(frame)
        writer.close()
        
        shutil.copyfile(OUTPUT_MP4, PROJECT_ROOT_MP4)
        print("==================================================")
        print("✅ ARABIC VIDEO RECORDING COMPLETED SUCCESSFULLY!")
        print(f"📁 MP4 File: {PROJECT_ROOT_MP4}")
        print(f"📊 Size: {os.path.getsize(OUTPUT_MP4)/(1024*1024):.2f} MB")
        print("==================================================")
        return PROJECT_ROOT_MP4
    else:
        print("❌ Error: No video found in temp dir")
        return None

if __name__ == "__main__":
    record_arabic_demo()
