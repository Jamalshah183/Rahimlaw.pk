# Implementation Plan - Fix Build Errors

## Problem
The build fails due to two missing module imports in `src/App.tsx`:
1. `./components/Hero`: The main `Hero` component file is missing.
2. `./data/insightsData`: The insights data file containing publication posts and categories is missing.

## Proposed Changes

### 1. Create `src/components/Hero.tsx`
- Compose the main `Hero` component combining `HeroNavigation`, `HeroBackground`, and `HeroContent`.
- Export `Hero` component properly for `src/App.tsx`.

### 2. Create `src/data/insightsData.ts`
- Define `InsightPost` interface and categories (`INSIGHT_CATEGORIES`).
- Populate `INSIGHTS_DATA` with professional legal publications, articles, and insights matching the firm's practice areas (Corporate & Commercial, Litigation & Dispute Resolution, Property & Real Estate, Family & Private Client, International & Cross-Border, Immigration & International Law).

### 3. Verification
- Run `compile_applet` to verify clean build without errors.
