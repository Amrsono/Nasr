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
TEMP_VIDEO_DIR = os.path.join(ARTIFACT_DIR, "video_temp_pure_ar")
OUTPUT_WEBM = os.path.join(ARTIFACT_DIR, "app_walkthrough_arabic.webm")
OUTPUT_MP4 = os.path.join(ARTIFACT_DIR, "app_walkthrough_arabic.mp4")
PROJECT_ROOT_MP4 = r"d:\github repos\Nasr\app_walkthrough_arabic.mp4"

def record_arabic_demo():
    shutil.rmtree(TEMP_VIDEO_DIR, ignore_errors=True)
    os.makedirs(TEMP_VIDEO_DIR, exist_ok=True)
    
    print("==================================================")
    print("🎬 STARTING 100% PURE ARABIC VIDEO RECORDING")
    print("==================================================")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--start-maximized", "--no-sandbox"]
        )
        
        # Arabic Locale & 1366x768 Viewport
        context = browser.new_context(
            locale="ar-EG",
            timezone_id="Africa/Cairo",
            viewport={"width": 1366, "height": 768},
            record_video_dir=TEMP_VIDEO_DIR,
            record_video_size={"width": 1366, "height": 768}
        )
        
        page = context.new_page()
        
        # Set Arabic language in localStorage immediately
        page.goto("http://localhost:5000", wait_until="commit")
        page.evaluate("() => { localStorage.setItem('nasr_lang', 'ar'); localStorage.removeItem('nasr_token'); }")
        
        # -------------------------------------------------------------
        # STEP 1: OPEN APP DIRECTLY IN ARABIC (RTL)
        # -------------------------------------------------------------
        print("--> 1. Opening app directly in Arabic (RTL)...")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(2500)
        
        # -------------------------------------------------------------
        # STEP 2: CUSTOMER REGISTRATION FLOW (إنشاء حساب عميل جديد)
        # -------------------------------------------------------------
        print("--> 2. Navigating to Register Tab (إنشاء حساب جديد)...")
        register_tab = page.locator("button:has-text('إنشاء حساب'), button:has-text('حساب')").first
        register_tab.click()
        page.wait_for_timeout(2000)
        
        print("--> 3. Filling New Customer Registration Details (كريم الشناوي)...")
        # Full Name
        name_input = page.locator("input[placeholder*='اسم'], input[placeholder*='Amr'], input[required]").first
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
        submit_btn = page.locator("button[type='submit']:has-text('إنشاء حساب'), button[type='submit']:has-text('حساب')").first
        submit_btn.click()
        page.wait_for_timeout(4000)
        
        # -------------------------------------------------------------
        # STEP 3: CUSTOMER BOOKING IN ARABIC (حجز رحلة جديدة)
        # -------------------------------------------------------------
        print("--> 5. Customer Selecting Destination on Cairo Map (سيتي ستارز مول)...")
        page.wait_for_timeout(2000)
        
        # Select popular spot preset in Arabic (سيتي ستارز مدينة نصر)
        preset_btn = page.locator("button:has-text('سيتي ستارز'), button:has-text('مدينة نصر')").first
        if preset_btn.is_visible():
            preset_btn.click()
            page.wait_for_timeout(2000)
            
        # Add Arabic trip notes
        textarea = page.locator("textarea").first
        if textarea.is_visible():
            textarea.fill("أنا بانتظارك أمام البوابة الرئيسية ومعي حقيبتان. برجاء الاتصال عند الوصول.")
            page.wait_for_timeout(2000)
            
        # Submit Ride Request using form button
        print("--> 6. Customer Requesting Ride (طلب الرحلة)...")
        req_btn = page.locator("form button[type='submit']").first
        req_btn.click()
        page.wait_for_timeout(4500)
        
        # -------------------------------------------------------------
        # STEP 4: DRIVER 1 IN ARABIC (السائق أحمد)
        # -------------------------------------------------------------
        print("--> 7. Logging in as Driver 1 (السائق أحمد)...")
        page.evaluate("() => { localStorage.removeItem('nasr_token'); localStorage.setItem('nasr_lang', 'ar'); }")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "driver1@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "driver123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3500)
        
        # Accept ride from queue (قبول الرحلة)
        print("--> 8. Driver Sees Ride in Radar Queue & Accepts (قبول الرحلة)...")
        page.wait_for_selector("button:has-text('قبول الرحلة')", timeout=8000)
        accept_btn = page.locator("button:has-text('قبول الرحلة')").first
        accept_btn.click()
        page.wait_for_timeout(3500)
        
        # Step 1: تم ركوب العميل (Customer Picked Up)
        print("--> 9. Driver Flags: تم ركوب العميل...")
        pickup_btn = page.locator("button:has-text('تم ركوب العميل')").first
        pickup_btn.click()
        page.wait_for_timeout(3500)
        
        # Step 2: تم إنزال العميل (Customer Dropped Off)
        print("--> 10. Driver Flags: تم إنزال العميل...")
        dropoff_btn = page.locator("button:has-text('تم إنزال العميل')").first
        dropoff_btn.click()
        page.wait_for_timeout(2500)
        
        # Confirm Payment Modal (تأكيد الدفع)
        print("--> 11. Driver Confirms Payment in Arabic Modal (تأكيد الدفع)...")
        confirm_pay_btn = page.locator("button:has-text('تأكيد الدفع')").first
        confirm_pay_btn.click()
        page.wait_for_timeout(4000) # Confetti celebration
        
        # Driver Profile Edit Modal (تعديل الملف الشخصي وبيانات السيارة)
        print("--> 12. Driver Opens Vehicle & Profile Edit Modal...")
        edit_profile_btn = page.locator("button:has-text('تعديل الملف')").first
        if edit_profile_btn.is_visible():
            edit_profile_btn.click()
            page.wait_for_timeout(2500)
            
            # Switch avatar preset
            avatar_presets = page.locator("button:has(img[alt='preset'])")
            if avatar_presets.count() > 2:
                avatar_presets.nth(2).click()
                page.wait_for_timeout(1200)
                
            cancel_btn = page.locator("button:has-text('إلغاء')").first
            cancel_btn.click()
            page.wait_for_timeout(1500)
            
        # -------------------------------------------------------------
        # STEP 5: OWNER / ADMIN IN ARABIC (المالك / مركز العمليات)
        # -------------------------------------------------------------
        print("--> 13. Logging in as Owner / Admin (المالك - الإدارة)...")
        page.evaluate("() => { localStorage.removeItem('nasr_token'); localStorage.setItem('nasr_lang', 'ar'); }")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "admin@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "admin123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3500)
        
        print("--> 14. Admin Reviewing Live KPI Cards (إجمالي الإيرادات ج.م) & Live Map...")
        page.wait_for_timeout(3000)
        
        # Tab 2: All Trips Log (كل الرحلات)
        print("--> 15. Admin Inspecting All Trips Log (كل الرحلات)...")
        trips_tab = page.locator("button:has-text('كل الرحلات')").first
        if trips_tab.is_visible():
            trips_tab.click()
            page.wait_for_timeout(3000)
            
        # Tab 3: Drivers Fleet (أسطول السائقين)
        print("--> 16. Admin Inspecting Driver Fleet & Ratings (أسطول السائقين)...")
        drivers_tab = page.locator("button:has-text('أسطول السائقين')").first
        if drivers_tab.is_visible():
            drivers_tab.click()
            page.wait_for_timeout(3000)
            
        # Tab 4: System Settings (الإعدادات)
        print("--> 17. Admin Inspecting System Settings & Google Maps Key (الإعدادات)...")
        settings_tab = page.locator("button:has-text('الإعدادات')").first
        if settings_tab.is_visible():
            settings_tab.click()
            page.wait_for_timeout(3000)
            
        # -------------------------------------------------------------
        # STEP 6: CUSTOMER RATING IN ARABIC (تقييم الرحلة)
        # -------------------------------------------------------------
        print("--> 18. Customer Rating Completed Trip (تقييم الرحلة والاحتفال)...")
        page.evaluate("() => { localStorage.removeItem('nasr_token'); localStorage.setItem('nasr_lang', 'ar'); }")
        page.goto("http://localhost:5000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.fill('input[type="email"]', "karim@nasr.com")
        page.wait_for_timeout(800)
        page.fill('input[type="password"]', "karim123")
        page.wait_for_timeout(800)
        page.click('button[type="submit"]')
        page.wait_for_timeout(3000)
        
        submit_rate_btn = page.locator("button:has-text('إرسال التقييم')").first
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
        
        # Convert to standard MP4 using imageio
        print("Converting to standard MP4...")
        reader = imageio.get_reader(OUTPUT_WEBM)
        fps = reader.get_meta_data().get('fps', 25)
        writer = imageio.get_writer(OUTPUT_MP4, fps=fps, codec='libx264')
        for frame in reader:
            writer.append_data(frame)
        writer.close()
        
        shutil.copyfile(OUTPUT_MP4, PROJECT_ROOT_MP4)
        print("==================================================")
        print("✅ 100% PURE ARABIC VIDEO RECORDED SUCCESSFULLY!")
        print(f"📁 MP4 File: {PROJECT_ROOT_MP4}")
        print(f"📊 Size: {os.path.getsize(OUTPUT_MP4)/(1024*1024):.2f} MB")
        print("==================================================")
        return PROJECT_ROOT_MP4
    else:
        print("❌ Error: No video found in temp dir")
        return None

if __name__ == "__main__":
    record_arabic_demo()
