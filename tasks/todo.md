# Anti-Ads Fixes & Improvements

## Progress Tracker
- [x] Fix dashboard terminal scrolling and fixed size <!-- id: 0 -->
- [x] Investigate and fix screen recording permission notification loop <!-- id: 1 -->
- [x] Implement Swapping Side-Load Dashboard Redesign <!-- id: 2 -->
- [x] High-Precision Auto-Click Logic (X-only) <!-- id: 3 -->

## Implementation Plan

### 1. Dashboard Redesign (Tri-Column)
- **Problem**: Header and Footer were consuming too much space; iPhone feed was not pixel-perfect.
- **Solution**:
    - **Tri-Column Layout**: Left Sidebar (Configs), Center (Feeds/Terminal), Right Sidebar (Metrics).
    - **Swapping Logic**: Preserved dynamic swapping of Terminal and Monitoring panel based on mode.
    - **iPhone Precision**: Implemented physical aspect ratio (9:19.5) mirroring with zero-margin scaling to match the native Mirroring app.

### 2. High-Precision Auto-Click
- **Problem**: Engine was "clicking in random places".
- **Solution**:
    - **Strict Targeting**: Refined keywords to specifically trigger on "(X)", "Skip", "Close", and "View More".
    - **Blacklist**: Added an explicit banned keyword list ("Play", "Install", "Okay") to prevent accidental marketing clicks.
    - **Template Priority**: Forced the engine to check Icon Templates (Pixel-perfect matches) before falling back to OCR text analysis.
    - **Threshold Buffer**: Increased default detection threshold to ensure only high-confidence matches are acted upon.

### 3. Screen Recording & Permission Fix
- **Solution**: Native Quartz integration avoids the `screencapture` process loop, ensuring macOS permissions are handled within the single app context.
