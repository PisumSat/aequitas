import { ShiftDefinition } from '../types';

export const SAMPLE_STUDENTS = [
  'Alice Chen',
  'Somchai Prasert',
  'David Kim',
  'Elena Rostova',
  'Fatima Al-Hassan',
  'Hiroshi Tanaka',
  'Ingrid Lindqvist',
  'Jamal Washington',
  'Kanya Ratanaporn',
  'Lucas Silva',
  'Maya Patel',
  'Noor Al-Zahrani'
];

export const SAMPLE_SHIFTS: ShiftDefinition[] = [
  {
    id: 'night-med',
    name: 'Internal Med Night Duty',
    code: 'IM-NIGHT',
    color: '#6366f1', // indigo
    category: 'night',
    weight: 1.5,
    slotsPerDay: 1,
  },
  {
    id: 'er-triage',
    name: 'Emergency Dept Floor Duty',
    code: 'ED-FLOOR',
    color: '#ef4444', // red
    category: 'er',
    weight: 1.2,
    slotsPerDay: 1,
  },
  {
    id: 'icu-day',
    name: 'ICU Step-down On-Call',
    code: 'ICU-CALL',
    color: '#0ea5e9', // sky
    category: 'icu',
    weight: 1.0,
    slotsPerDay: 1,
  },
];

export const SAMPLE_GROUPS = [
  'Team A: General Surgery',
  'Team B: Internal Medicine',
  'Team C: Pediatrics & Neonatal',
  'Team D: Obstetrics & Gynecology'
];

export const SAMPLE_TOPICS = [
  'PBL Case 1: Acute Coronary Syndromes (Alice Chen)',
  'PBL Case 2: Sepsis & Septic Shock in ICU (Somchai Prasert)',
  'PBL Case 3: Diabetic Ketoacidosis Management (David Kim)',
  'PBL Case 4: Pediatric Status Epilepticus (Elena Rostova)',
  'PBL Case 5: Acute Appendicitis & Peritonitis (Fatima Al-Hassan)',
  'PBL Case 6: Community-Acquired Pneumonia (Hiroshi Tanaka)',
  'PBL Case 7: Preeclampsia & Eclampsia (Ingrid Lindqvist)',
  'PBL Case 8: Acute Kidney Injury Workup (Jamal Washington)'
];
