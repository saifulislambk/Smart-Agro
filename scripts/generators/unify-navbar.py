#!/usr/bin/env python3
"""
Smart Agro - Unified Navbar & Mobile Navigation Generator
Synchronizes identical, pixel-perfect top header navbar and floating bottom mobile navbar across all 7 pages.
Features an ergonomic 5-tab responsive bottom bar with elevated AI Scanner and smooth slide-up Quick Menu drawer.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, '..', '..')
PUBLIC_DIR = os.path.join(PROJECT_ROOT, 'public')

# Load the exact 64-district selector & auth widget block from public/index.html
with open(os.path.join(PUBLIC_DIR, 'index.html'), 'r', encoding='utf-8') as f:
    index_html = f.read()

right_sec_start = index_html.find('<!-- 64 District Selector, GPS Button & Auth -->')
right_sec_end = index_html.find('</header>')
RIGHT_SECTION_CONTENT = index_html[right_sec_start:right_sec_end].strip()

PAGES = [
    ('public/index.html', 'home'),
    ('public/scan.html', 'scanner'),
    ('public/roadmap.html', 'roadmap'),
    ('public/calculator.html', 'calculator'),
    ('public/crop-detail.html', 'roadmap'),
    ('public/grafting.html', 'grafting'),
    ('public/history.html', 'history'),
]

def make_header(active_key):
    # Desktop nav link helper
    def d_class(key):
        if key == active_key:
            return 'px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs'
        return 'px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors'

    return f'''  <!-- ====================================================================
       1. Top Fixed Navigation Header (Unified across all pages)
       ==================================================================== -->
  <header class="sticky top-0 z-50 glass-header px-2.5 sm:px-4 py-2.5 md:px-8 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 md:gap-4">
      
      <!-- Logo & Branding -->
      <a href="/" class="flex items-center space-x-2 md:space-x-3 cursor-pointer group shrink-0">
        <div class="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-lg md:text-2xl shadow-md group-hover:scale-105 transition-transform border border-white/40">
          🌾
        </div>
        <div>
          <div class="flex items-center gap-1.5 md:gap-2">
            <span class="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">স্মার্ট এগ্রো</span>
            <span class="text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 hidden sm:inline-block">এআই কৃষি সহকারী</span>
          </div>
          <p class="text-[11px] text-slate-500 font-medium hidden lg:block">ডিজিটাল কৃষি তথ্য ও রোগ নির্ণয় সেবা</p>
        </div>
      </a>

      <!-- Desktop Navigation Menu -->
      <nav class="hidden md:flex items-center space-x-1">
        <a href="/" class="{d_class('home')}">হোম</a>
        <a href="/scan" class="{d_class('scanner')}">এআই স্ক্যানার</a>
        <a href="/roadmap" class="{d_class('roadmap')}">ফসলের গাইড</a>
        <a href="/calculator" class="{d_class('calculator')}">সার ক্যালকুলেটর</a>
        <a href="/grafting" class="{d_class('grafting')}">কলম পদ্ধতি</a>
        <a href="/history" class="{d_class('history')}">স্ক্যান ইতিহাস</a>
      </nav>

      {RIGHT_SECTION_CONTENT}
  </header>'''

def make_mobile_nav(active_key):
    def m_class(key):
        if key == active_key:
            return 'bg-emerald-600 text-white font-black shadow-xs py-1'
        return 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 font-bold py-1'

    scanner_active = (active_key == 'scanner')
    scanner_btn_class = 'scale-105 ring-2 ring-emerald-400 shadow-emerald-600/40' if scanner_active else 'hover:scale-105 ring-1 ring-emerald-500/20'
    scanner_label_class = 'text-emerald-700 font-black' if scanner_active else 'text-slate-600 font-bold'

    # 3rd button: Menu is highlighted if user is on any sub-page accessed via Menu
    is_menu_active = active_key in ['roadmap', 'calculator', 'grafting', 'history']
    menu_btn_class = 'bg-emerald-600 text-white font-black shadow-xs py-1' if is_menu_active else 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 font-bold py-1'

    # Status badges and styles for drawer items
    def badge_for(key):
        return '<span class="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">সক্রিয়</span>' if active_key == key else ''

    def card_style(key):
        return 'bg-emerald-50/90 border-emerald-500 shadow-xs' if active_key == key else 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200/80'

    return f'''  <!-- START: Unified Mobile Navigation & Drawer -->
  <!-- ====================================================================
       Floating Glass Bottom Mobile Navigation Bar (Clean 3-Item Layout: Home, Scan, Menu)
       ==================================================================== -->
  <nav class="md:hidden fixed bottom-2.5 left-4 right-4 z-40 glass-header bg-white/95 backdrop-blur-md border border-emerald-200/90 rounded-2xl px-3 py-1 shadow-xl max-w-xs mx-auto">
    <div class="flex items-center justify-between text-center relative">
      
      <!-- 1. Home -->
      <a href="/" data-nav-page="home" class="flex-1 flex flex-col items-center justify-center rounded-xl transition-all {m_class('home')}">
        <span class="text-base sm:text-lg">🏠</span>
        <span class="text-[10px] font-bold tracking-tight">হোম</span>
      </a>

      <!-- 2. Center Elevated AI Scanner Hero Button -->
      <div class="flex-1 flex flex-col items-center justify-center -mt-3.5">
        <a href="/scan" data-nav-page="scanner" class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-lg shadow-lg border-2 border-white transition-all active:scale-95 {scanner_btn_class}" title="এআই রোগ নির্ণয় স্ক্যানার">
          📷
        </a>
        <span class="text-[10px] mt-0.5 tracking-tight {scanner_label_class}">স্ক্যানার</span>
      </div>

      <!-- 3. Menu Trigger (Opens all other options) -->
      <button id="mobile-menu-trigger-btn" type="button" onclick="toggleSmartAgroMobileMenu()" class="flex-1 flex flex-col items-center justify-center rounded-xl transition-all {menu_btn_class}" title="মেনু ও অন্যান্য সকল সেবা">
        <span class="text-base sm:text-lg">☰</span>
        <span class="text-[10px] font-bold tracking-tight">মেনু</span>
      </button>

    </div>
  </nav>

  <!-- ====================================================================
       Smart Agro Mobile Drawer / Slide-Up Sheet (All Other Services & Navigation)
       ==================================================================== -->
  <div id="smart-agro-mobile-drawer" class="fixed inset-0 z-50 hidden transition-opacity duration-300">
    <!-- Dark Backdrop -->
    <div id="smart-agro-drawer-backdrop" onclick="toggleSmartAgroMobileMenu(false)" class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"></div>
    
    <!-- Sheet Panel -->
    <div class="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl border-t border-emerald-200 p-4 pb-20 overflow-y-auto animate-slide-up font-bengali">
      
      <!-- Top Drag Bar & Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base font-bold">🌾</div>
          <div>
            <h4 class="text-sm font-black text-slate-800">স্মার্ট এগ্রো মেনু</h4>
            <p class="text-[10px] text-slate-500 font-medium">সকল সেবা ও গুরুত্বপূর্ণ লিঙ্কসমূহ</p>
          </div>
        </div>
        <button type="button" onclick="toggleSmartAgroMobileMenu(false)" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold active:scale-95">
          ✕
        </button>
      </div>

      <!-- Navigation & Services Grid -->
      <div class="grid grid-cols-2 gap-2.5 mt-3.5">
        
        <!-- Crop Guides / Roadmap -->
        <a href="/roadmap" class="p-3 rounded-2xl border transition-all flex flex-col justify-between {card_style('roadmap')}">
          <div class="flex items-center justify-between">
            <span class="text-2xl">🌾</span>
            {badge_for('roadmap')}
          </div>
          <div class="mt-2">
            <div class="text-xs font-black text-slate-800">ফসলের গাইড</div>
            <div class="text-[10px] text-slate-500 line-clamp-1">৪০+ ফসলের পূর্ণাঙ্গ চাষাবাদ</div>
          </div>
        </a>

        <!-- Fertilizer Calculator -->
        <a href="/calculator" class="p-3 rounded-2xl border transition-all flex flex-col justify-between {card_style('calculator')}">
          <div class="flex items-center justify-between">
            <span class="text-2xl">⚖️</span>
            {badge_for('calculator')}
          </div>
          <div class="mt-2">
            <div class="text-xs font-black text-slate-800">সার ক্যালকুলেটর</div>
            <div class="text-[10px] text-slate-500 line-clamp-1">সুষম সারের সঠিক হিসাব</div>
          </div>
        </a>

        <!-- Grafting / Nursery -->
        <a href="/grafting" class="p-3 rounded-2xl border transition-all flex flex-col justify-between {card_style('grafting')}">
          <div class="flex items-center justify-between">
            <span class="text-2xl">🌱</span>
            {badge_for('grafting')}
          </div>
          <div class="mt-2">
            <div class="text-xs font-black text-slate-800">কলম পদ্ধতি</div>
            <div class="text-[10px] text-slate-500 line-clamp-1">গ্রাফটিং ও গুটি কলম গাইড</div>
          </div>
        </a>

        <!-- History -->
        <a href="/history" class="p-3 rounded-2xl border transition-all flex flex-col justify-between {card_style('history')}">
          <div class="flex items-center justify-between">
            <span class="text-2xl">📜</span>
            {badge_for('history')}
          </div>
          <div class="mt-2">
            <div class="text-xs font-black text-slate-800">স্ক্যান ইতিহাস</div>
            <div class="text-[10px] text-slate-500 line-clamp-1">পূর্বের সকল পরীক্ষার রেকর্ড</div>
          </div>
        </a>

      </div>

      <!-- Account Settings & Linking Card -->
      <div onclick="SmartAgroAuth.openAccountSettingsModal(); toggleSmartAgroMobileMenu(false);" class="mt-3 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-300/80 cursor-pointer transition-all flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-xs">👤</div>
          <div>
            <div class="text-xs font-black text-slate-800">অ্যাকাউন্ট সেটিংস ও যোগাযোগ</div>
            <div class="text-[10px] text-slate-600">মোবাইল নম্বর ও ইমেইল যুক্ত করুন</div>
          </div>
        </div>
        <span class="text-xs text-emerald-700 font-black">খুলুন ➔</span>
      </div>

      <!-- Quick Emergency Helpline Card -->
      <div class="mt-2.5 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-300/50 rounded-2xl p-3 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-xs">📞</div>
          <div>
            <div class="text-xs font-black text-slate-800">কৃষি কল সেন্টার (৩৩৩১)</div>
            <div class="text-[10px] text-slate-600">সরকারি কৃষি বিশেষজ্ঞের সাথে ফ্রি পরামর্শ</div>
          </div>
        </div>
        <a href="tel:3331" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95">কল করুন</a>
      </div>

    </div>
  </div>

  <script>
    function toggleSmartAgroMobileMenu(forceState) {{
      var drawer = document.getElementById('smart-agro-mobile-drawer');
      if (!drawer) return;
      if (typeof forceState === 'boolean') {{
        if (forceState) {{
          drawer.classList.remove('hidden');
        }} else {{
          drawer.classList.add('hidden');
        }}
      }} else {{
        drawer.classList.toggle('hidden');
      }}
    }}
  </script>
  <!-- END: Unified Mobile Navigation & Drawer -->'''

def process_file(rel_path, active_key):
    full_path = os.path.join(PROJECT_ROOT, rel_path)
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace <header>...</header>
    new_header = make_header(active_key)
    header_pattern = re.compile(r'<!--\s*=*\s*1\.\s*Top.*?-->\s*<header.*?</header>|<header.*?</header>', re.DOTALL)
    
    if not header_pattern.search(content):
        print(f"❌ Could not match <header> in {rel_path}")
        return

    content = header_pattern.sub(new_header, content, count=1)

    # 2. Replace or insert mobile navigation
    new_mobile_nav = make_mobile_nav(active_key)
    
    mobile_nav_pattern = re.compile(
        r'<!-- START: Unified Mobile Navigation & Drawer -->.*?<!-- END: Unified Mobile Navigation & Drawer -->'
        r'|<!--\s*=*\s*Floating Glass Bottom Mobile.*?-->\s*<nav class="md:hidden fixed bottom-.*?</nav>'
        r'|<!--\s*=*\s*4\.\s*Floating Glass Bottom Mobile.*?-->\s*<nav class="md:hidden fixed bottom-.*?</nav>'
        r'|<!--.*?Mobile Bottom Navigation.*?-->\s*<nav class="md:hidden fixed bottom-.*?</nav>'
        r'|<nav class="md:hidden fixed bottom-.*?</nav>',
        re.DOTALL
    )

    if mobile_nav_pattern.search(content):
        content = mobile_nav_pattern.sub(new_mobile_nav, content, count=1)
    else:
        # Insert before closing </body> or before final script tags
        script_idx = content.rfind('<!-- Scripts')
        if script_idx != -1:
            content = content[:script_idx] + new_mobile_nav + '\n\n  ' + content[script_idx:]
        else:
            body_idx = content.rfind('</body>')
            if body_idx != -1:
                content = content[:body_idx] + new_mobile_nav + '\n\n' + content[body_idx:]
            else:
                content += '\n' + new_mobile_nav

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Successfully unified navbar and mobile nav in {rel_path} (active: {active_key})")

if __name__ == '__main__':
    for rel_p, key in PAGES:
        process_file(rel_p, key)
    print("🎉 All 7 pages now share a unified, consistent, overflow-free mobile navigation bar!")
