#!/usr/bin/env python3
"""
Smart Agro - Unified Navbar & Mobile Navigation Generator
Synchronizes identical, pixel-perfect top header navbar and floating bottom mobile navbar across all 7 pages.
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
  <header class="sticky top-0 z-50 glass-header px-4 py-3 md:px-8 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
      
      <!-- Logo & Branding -->
      <a href="/" class="flex items-center space-x-2.5 md:space-x-3 cursor-pointer group shrink-0">
        <div class="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-xl md:text-2xl shadow-md group-hover:scale-105 transition-transform border border-white/40">
          🌾
        </div>
        <div>
          <div class="flex items-center gap-1.5 md:gap-2">
            <span class="text-lg md:text-xl font-black text-slate-900 tracking-tight">স্মার্ট এগ্রো</span>
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
            return 'bg-emerald-600 text-white font-black shadow-md'
        return 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 font-bold'

    return f'''  <!-- ====================================================================
       Floating Glass Bottom Mobile Navigation Bar (Unified across all pages)
       ==================================================================== -->
  <nav class="md:hidden fixed bottom-3 left-3 right-3 z-50 glass-header bg-white/95 backdrop-blur-md border border-emerald-200 rounded-2xl p-1.5 shadow-xl">
    <div class="grid grid-cols-6 gap-1 text-center">
      <a href="/" data-nav-page="home" class="flex flex-col items-center justify-center py-1.5 rounded-xl text-xs transition-all {m_class('home')}">
        <span class="text-base">🏠</span>
        <span class="text-[9px] mt-0.5 font-bold">হোম</span>
      </a>

      <a href="/scan" data-nav-page="scanner" class="flex flex-col items-center justify-center py-1.5 rounded-xl text-xs transition-all {m_class('scanner')}">
        <span class="text-base">📷</span>
        <span class="text-[9px] mt-0.5 font-bold">স্ক্যানার</span>
      </a>

      <a href="/roadmap" data-nav-page="roadmap" class="flex flex-col items-center justify-center py-1.5 rounded-xl text-xs transition-all {m_class('roadmap')}">
        <span class="text-base">🌾</span>
        <span class="text-[9px] mt-0.5 font-bold">গাইড</span>
      </a>

      <a href="/calculator" data-nav-page="calculator" class="flex flex-col items-center justify-center py-1.5 rounded-xl text-xs transition-all {m_class('calculator')}">
        <span class="text-base">⚖️</span>
        <span class="text-[9px] mt-0.5 font-bold">সার</span>
      </a>

      <a href="/grafting" data-nav-page="grafting" class="flex flex-col items-center justify-center py-1.5 rounded-xl text-xs transition-all {m_class('grafting')}">
        <span class="text-base">🌱</span>
        <span class="text-[9px] mt-0.5 font-bold">কলম</span>
      </a>

      <a href="/history" data-nav-page="history" class="flex flex-col items-center justify-center py-1.5 rounded-xl text-xs transition-all {m_class('history')}">
        <span class="text-base">📜</span>
        <span class="text-[9px] mt-0.5 font-bold">ইতিহাস</span>
      </a>
    </div>
  </nav>'''

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
    
    # Check if a bottom mobile nav already exists
    mobile_nav_pattern = re.compile(r'<!--\s*=*\s*4\.\s*Floating Glass Bottom Mobile.*?-->\s*<nav class="md:hidden fixed bottom-.*?</nav>|<!--.*?Mobile Bottom Navigation.*?-->\s*<nav class="md:hidden fixed bottom-.*?</nav>|<nav class="md:hidden fixed bottom-.*?</nav>', re.DOTALL)

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
    print("🎉 All 7 pages now share a unified, consistent navbar!")

