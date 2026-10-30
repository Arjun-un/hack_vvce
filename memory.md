# OpsLoop - Project Memory & Architecture Guide

> **AI-Powered Local Business Automation & Graduate Employment Platform**  
> *Tagline:* "Automate repetitive business work, empower local graduates, and make everyday customer interactions simpler through a single scan."

---

## 1. Project Overview & Vision
**OpsLoop** is a technology-enabled business automation platform that helps small and local businesses automate repetitive operations using AI and workflow automation.

The platform bridges three groups:
1. **Small Businesses (MVP: Clinics):** Need affordable, hands-off automation for administrative tasks like appointments and enquiries.
2. **Graduates:** Trained individuals who configure, monitor, and handle exceptions in business automation workflows while earning.
3. **Customers:** General public who interact with businesses via simple QR-code-based mobile web pages without installing any mobile app.

---

## 2. Key Architecture Decisions

| Original Concept | Final Decision & Reason |
| :--- | :--- |
| **OpenAI API** | **Google Gemini API (`@google/genai`)**: Offers a generous **free tier** via Google AI Studio (zero upfront cost, no credit card required to start, fast inference with Gemini 1.5/2.0 Flash). |
| **n8n Automation Engine** | **Native MERN Automation Services**: Replace external n8n with native Express services (`workflowService`, `geminiService`, and Mongoose triggers). Eliminates Docker/server overhead, minimizes latency, keeps everything in one codebase, and integrates directly with DB models and task queues. |

---

## 3. The 4 Interfaces

```
                               ┌──────────────────────────────────┐
                               │       Central Admin Dashboard    │
                               │ (OpsLoop Team - Manage Platform) │
                               └────────────────┬─────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
  ┌──────────────────────────────┐                             ┌──────────────────────────────┐
  │      Graduate Dashboard      │                             │   Business Owner Dashboard   │
  │ (Manage Businesses, Tasks,   │◄────── Assign & Support ───►│ (View Enquiries, Schedules,  │
  │  Exceptions & Earnings)      │                             │  Approvals, Reports)         │
  └──────────────┬───────────────┘                             └──────────────┬───────────────┘
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
                               ┌──────────────────────────────────┐
                               │     Customer QR Experience       │
                               │ (Scan QR -> Mobile Web Form      │
                               │  -> Instant Booking & Enquiry)   │
                               └──────────────────────────────────┘
```

### A. Central Admin Dashboard
* Register & manage businesses (Clinics)
* Register & manage graduates
* Assign businesses to graduates
* Monitor system-wide health, subscriptions, and platform earnings
* System escalation management

### B. Graduate Dashboard
* Workspace for assigned businesses
* Configure clinic profile, doctor schedules, and services
* Generate clinic QR codes
* **Task & Exception Queue:** Review and resolve failed or uncertain AI classifications
* Track performance and graduate earnings

### C. Business Owner Dashboard (Clinic Owner)
* View real-time customer enquiries and appointments
* Manage operational hours, doctors, and available slots
* View daily automated activity reports
* Direct communication line to assigned graduate

### D. Customer QR Web Experience (No-App Interface)
* Scans clinic-specific QR code
* Opens lightweight, responsive web page (`/qr/:businessSlug`)
* Book appointments (pick service, doctor, preferred date/time)
* Submit general/service enquiries
* Track request status & view instant confirmation

---

## 4. First Target MVP: Clinic Operations

* **Scope Boundaries:** Administrative operations only (appointments, general enquiries, clinic timings, fees). **No clinical advice or medical diagnosis.**

### Key MVP Features:
1. **Clinic QR Generator:** Generates unique QR code linked to the clinic's public booking portal.
2. **Customer Appointment Booking & Enquiry Submission:** Clean web interface for patients.
3. **Automated AI Request Processing (Gemini):**
   * Classify request intent (Appointment vs. General Enquiry vs. Emergency/Escalation).
   * Extract structured metadata (patient name, phone, preferred doctor/department, requested time).
4. **Availability & Safe Booking Engine:** Validates doctor availability against MongoDB records (prevents AI hallucination of fake slots).
5. **Graduate Exception Queue (Human-in-the-Loop):** If request is ambiguous, conflicting, or out of schedule, it creates a `GraduateTask` for human review.
6. **Owner Activity Dashboard:** Live feed of confirmed bookings and pending requests.

---

## 5. Technology Stack

* **Frontend:** React.js (Vite), Tailwind CSS, React Router DOM, Axios, Lucide Icons, `qrcode.react`
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (Mongoose ODM)
* **AI Engine:** Google Gemini API (`@google/genai`) - Free Tier
* **Authentication:** JWT + Role-Based Access Control (`admin`, `graduate`, `business_owner`)
* **Automation Layer:** Native Node.js services (`automationService.js`, `geminiService.js`)
* **Version Control:** Git & GitHub (`https://github.com/Arjun-un/hack_vvce.git`)

---

## 6. Native MERN Workflow Pipeline (Replacing n8n)

```
[Customer Scans QR] 
        ↓
[Submits Form] 
        ↓
[POST /api/customer/request]
        ↓
[Backend Validates & Saves Enquiry to MongoDB]
        ↓
[geminiService: Classify Intent & Extract Entities]
        ↓
   ┌────────────────────┬────────────────────┐
   │ Appointment Intent │   General Enquiry  │
   ▼                    ▼                    ▼
[Check Clinic Slot]   [Generate Answer]    [Ambiguous / Conflict]
   │                    │                    │
   ├─ Available? ──Yes─►[Auto-Confirm]       │
   │                                         │
   └─ Unavailable / Conflict ───────────────►▼
                                      [Create GraduateTask]
                                      (Status: PENDING)
                                             ↓
                                      [Graduate Reviews & Resolves]
```

---

## 7. Core Database Schema Concept

1. **`User`**: `name`, `email`, `password`, `role` (`admin` | `graduate` | `business_owner`), `phone`, `status`
2. **`Business` (Clinic)**: `name`, `slug`, `ownerId`, `assignedGraduateId`, `category`, `address`, `phone`, `operatingHours`, `qrCodeUrl`, `services`
3. **`Doctor` / `Staff`**: `businessId`, `name`, `speciality`, `availableDays`, `timeSlots`
4. **`Appointment`**: `businessId`, `customerId`, `customerName`, `customerPhone`, `doctorId`, `date`, `timeSlot`, `status` (`confirmed`, `pending_graduate_review`, `cancelled`, `completed`)
5. **`Enquiry`**: `businessId`, `customerName`, `customerPhone`, `rawMessage`, `aiClassification`, `aiConfidence`, `status` (`auto_resolved`, `assigned_to_graduate`, `closed`)
6. **`GraduateTask`**: `graduateId`, `businessId`, `type` (`appointment_conflict`, `unclear_enquiry`, `onboarding`), `priority`, `status` (`pending`, `in_progress`, `resolved`), `relatedId`

---

## 8. Development Roadmap

- [x] Repository initialization & Git setup
- [x] Express backend structure & MongoDB Atlas connected
- [x] React Vite frontend structure created
- [x] `@google/genai` installed & configured
- [x] Project architecture blueprint documented in `memory.md`
- [ ] Backend data models (`User`, `Business`, `Appointment`, `Enquiry`, `GraduateTask`)
- [ ] JWT Authentication & Role-based middleware
- [ ] Gemini AI classification & entity extraction service
- [ ] Appointment booking & availability check logic
- [ ] Graduate task queue endpoints & resolution workflow
- [ ] Frontend: Customer QR portal & Booking form
- [ ] Frontend: Dashboards (Admin, Graduate, Business Owner)
