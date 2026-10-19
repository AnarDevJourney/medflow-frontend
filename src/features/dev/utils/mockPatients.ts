import { AppointmentStatus } from "@models/enums";

export interface MockPatient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: "M" | "F";
  phone: string;
  department: string;
  doctor: string;
  status: AppointmentStatus;
  lastVisit: string; // ISO
  balance: number; // AZN
  insurance: string;
}

const FIRST = [
  "Aysel",
  "Rəşad",
  "Günay",
  "Elvin",
  "Nərmin",
  "Tural",
  "Ləman",
  "Orxan",
  "Səbinə",
  "Kamran",
  "Fidan",
  "Ülvi",
];
const LAST = [
  "Məmmədova",
  "Əliyev",
  "Hüseynova",
  "Quliyev",
  "İsmayılova",
  "Həsənov",
  "Abbasova",
  "Rzayev",
  "Kərimova",
  "Nəbiyev",
];
const DEPARTMENTS = [
  "Kardiologiya",
  "Nevrologiya",
  "Pediatriya",
  "Terapiya",
  "Ortopediya",
];
const DOCTORS = [
  "Dr. Leyla Əhmədova",
  "Dr. Fərid Səfərov",
  "Dr. Zaur Məlikov",
  "Dr. Aynur Babayeva",
];
const STATUSES = Object.values(AppointmentStatus);

// Deterministic pseudo-random numbers → the same 57 patients on every load
function random(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const MOCK_PATIENTS: MockPatient[] = Array.from({ length: 57 }, (_, i) => {
  const r = (n: number) => random(i * 13 + n);
  const female = r(1) > 0.5;
  const first = FIRST[Math.floor(r(2) * FIRST.length)];
  const last = LAST[Math.floor(r(3) * LAST.length)];
  return {
    id: `p-${i + 1}`,
    mrn: `MRN-${String(240000 + i * 37).padStart(7, "0")}`,
    firstName: first,
    lastName: female ? last : last.replace(/ova$/, "ov").replace(/yeva$/, "yev"),
    age: 1 + Math.floor(r(4) * 88),
    sex: female ? "F" : "M",
    phone: `+994 ${["50", "51", "55", "70", "77"][Math.floor(r(5) * 5)]} ${100 + Math.floor(r(6) * 899)} ${10 + Math.floor(r(7) * 89)} ${10 + Math.floor(r(8) * 89)}`,
    department: DEPARTMENTS[Math.floor(r(9) * DEPARTMENTS.length)],
    doctor: DOCTORS[Math.floor(r(10) * DOCTORS.length)],
    status: STATUSES[Math.floor(r(11) * STATUSES.length)],
    lastVisit: new Date(
      Date.UTC(2026, 9, 19) - Math.floor(r(12) * 200) * 86400000,
    ).toISOString(),
    balance: Math.round(r(14) * 900 * 100) / 100,
    insurance: `AZ-${Math.floor(r(15) * 1e8)}`,
  };
});
