# Aequitas • NIST Beacon 2.0 Verifiable Public Randomizer

[![Deploy to GitHub Pages](https://github.com/PisumSat/aequitas/actions/workflows/deploy.yml/badge.svg)](https://github.com/PisumSat/aequitas/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live_Site-pisumsat.github.io%2Faequitas-14b8a6?style=flat&logo=github)](https://pisumsat.github.io/aequitas/)
[![NIST Randomness Beacon 2.0](https://img.shields.io/badge/Randomness_Source-NIST_Beacon_2.0-0d9488)](https://csrc.nist.gov/Projects/interoperable-randomness-beacons/beacon-20)
[![Zero-Trust](https://img.shields.io/badge/Security-Zero--Trust_Pre--Commitment-6366f1)](#-the-cryptographic-protocol)
[![Client-Side Privacy](https://img.shields.io/badge/Privacy-100%25_Client--Side-10b981)](#-privacy--zero-backend)

> **Zero-trust, mathematically verifiable public randomization for medical student rotations, night shift schedules, and collaborative cohorts—powered by the U.S. National Institute of Standards and Technology (NIST) Randomness Beacon 2.0.**

---

## 🩺 The Problem & Motivation

In clinical rotations and medical school life, peers are frequently tasked with assigning high-stakes, undesirable duties—such as weekend night shifts, emergency triage on-call, or viva examination sequences.

Traditionally, one student is nominated to run a random number generator and share a screenshot. Even with honest intentions, this model requires blind trust and is vulnerable to manipulation (e.g., repeatedly generating results until a favorable schedule emerges).

### The Solution: Public Cryptographic Beacons
Comparable to public lottery drawings where everyone trusts the result because no human can predict or tamper with it, **Aequitas** uses the **U.S. NIST Randomness Beacon 2.0**.
- NIST emits an unguessable 512-bit random pulse every 60 seconds derived from quantum-photonic entropy.
- The organizer sets the randomization time strictly in the **future** (e.g., in 15 minutes).
- The parameters are cryptographically locked in a shareable URL before the pulse exists.
- At the target minute, the app queries NIST, derives the deterministic seed, and renders the fair outcome.

---

## ✨ Features & Allocation Modes

- **🌙 Night Shifts & Hospital Rota**:
  - Circadian recovery protection: Automatically avoids back-to-back night shifts and post-call day duties.
  - Workload balance: Equalizes total assignments and weekend (Sat/Sun) duties.
  - 3 view modes: **Daily Cards**, **Monthly Calendar Grid**, and **Workload Audit Table**.
  - Student focus drill-down: Click any student to view their personal schedule and download a personal `.ics` calendar file!
  - 1-click **CSV**, **iCal (`.ics`)**, and **Print-Ready Bulletin Board** export.
- **👥 Clinical Teams & Ward Distribution**:
  - Unbiased split across clinical departments (e.g. Surgery, Internal Medicine, Pediatrics, OB-GYN) or dissection tables.
- **🔢 Presentation & Viva Order**:
  - Unbiased speaking queue with customizable start time and time slots (e.g. 15-min intervals).
- **🏆 Duty Lottery / Pick $K$**:
  - Fair lottery for elective opportunities or holiday duty coverage.
- **🎲 Number Range**:
  - Memory-safe integer sampling for ranges up to billions.

---

## 🔒 The Cryptographic Protocol

```
1. Configuration -> Canonical JSON -> SHA-256 Parameter Hash (H_params)
2. Shareable URL -> #commit=LZStringCompress(Payload + TargetTimestamp)
3. Countdown     -> Live verification lock until target pulse minute
4. Pulse Release -> Fetch 512-bit output from beacon.nist.gov
5. Seed Derivation:
   Seed = SHA-256("NIST-BEACON-2.0:" + PulseHex + ":PARAMS:" + H_params)
6. Deterministic PRNG -> Reproducible Fisher-Yates allocation
```

Neither the organizer, the peers, nor NIST can alter or predetermine the outcome.

### Independent Verification
Every result includes a dedicated **Audit & Verify Math** panel with:
- Direct links to the official NIST CSRC record (`beacon.nist.gov`).
- In-browser 3-step automated verification.
- Runnable zero-dependency **Node.js** and **Python** terminal scripts.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or pnpm

### Local Development
```bash
# Clone the repository
git clone https://github.com/PisumSat/aequitas.git
cd aequitas

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
```bash
npm run build
```
The compiled static assets will be in the `dist/` directory.

---

## 🌐 Deploying to GitHub Pages

This repository includes an automated GitHub Actions workflow (`.github/workflows/deploy.yml`).

1. Push this repository to GitHub.
2. Go to your repository **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
4. The site will automatically build and deploy to:
   ```
   https://pisumsat.github.io/aequitas/
   ```

---

## 👥 Credits & Attribution

- **Crafted by**: Pisum
- **Heavily inspired by**: keenthekeen
- **Entropy Source**: [U.S. National Institute of Standards and Technology (NIST) Randomness Beacon 2.0](https://csrc.nist.gov/Projects/interoperable-randomness-beacons/beacon-20)

---

## 📄 License

MIT License. Free for medical students, academic institutions, and open-source communities.
