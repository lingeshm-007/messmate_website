# MessMate — Simple Food & Mess Management System

> **Tagline:** Simple Food & Mess Management for Home-Style Mess Owners

MessMate is a modern, responsive web application designed for a woman running a home-style mess for college students living outside their hostel. It completely replaces physical notebook record-keeping with an intuitive, mobile-first digital workflow.

---

## 🌟 Key Features

1. **Dual Roles & Instant Switcher**:
   - **Admin (Mess Owner / Aunty)**: Full management of students, meal plans, mobile-first attendance, pricing, settings, reports, manual deductions, and payments.
   - **Student Portal**: Students (like Lingesh) can view their profile, selected meals, today's menu, billing statement, payment timeline, and submit leave/skip-meal requests.

2. **Continuous Dynamic Search**:
   - Single prominent search bar searching across Student Name, Phone Number, Address, Student ID, Meal Plan, and Status.
   - Preserves cursor focus without interruption while typing, with a one-click `(×)` clear button.

3. **Individual Billing Cycles (Joining Date Schedule)**:
   - Billing is **not** forced to calendar month boundaries.
   - Example: Lingesh joined on `18/07/2026` $\rightarrow$ Cycle 1 is `18/07/2026 → 17/08/2026`. Next cycle is `18/08/2026 → 17/09/2026`.

4. **Strict Manual Deductions (Zero Automatic ₹50 Deductions)**:
   - Tracks ate vs. missed meals accurately with per-meal breakdown.
   - Leaves deduction amounts and decisions completely in the hands of the mess owner.

5. **Carry-Forward Balances**:
   - Accurately computes:
     $$\text{Current Outstanding} = \text{Previous Outstanding} + \text{Base Bill} - \text{Deductions} - \text{Payments}$$
   - Seamlessly rolls over outstanding dues across cycle renewals without data loss.

6. **Mobile-First Daily Attendance**:
   - Designed for one-handed operation on a smartphone while serving food.
   - Large tap buttons for `ATE` and `MISSED` with instant optimistic updates.
   - Filters attendance items so only selected meals appear for each student.

7. **🤖 AI Meal Demand Forecasting**:
   - Analyzes historical attendance patterns by day-of-week, student meal plans, and approved leaves.
   - Forecasts tomorrow's expected headcounts for Breakfast, Lunch, and Dinner.
   - Recommends raw grocery preparation amounts (Rice, Batter, Veggies, Dal) to reduce kitchen waste by ~10–15%.

8. **Soft Discontinuation**:
   - Marking a student as discontinued moves them to `Inactive` status while preserving 100% of their attendance, payment, and deduction history.

9. **Digital Receipt Vouchers**:
   - Generates official payment receipts with receipt numbers, transaction methods (UPI, Cash), and printable layouts.

---

## 🎯 Verified Lingesh Demo Scenario

- **Joined:** 18/07/2026
- **Meals Selected:** Breakfast + Lunch + Dinner (₹4,000 / month)
- **Cycle 1:** 18/07/2026 → 17/08/2026
- **Payment 1:** ₹2,000 paid on 19/07/2026 (UPI)
- **Missed Meals:** 6 meals missed in Cycle 1
- **Manual Deduction:** ₹300 deduction applied on 10/08/2026
- **Cycle 1 Summary:** Base ₹4,000 − ₹300 Deduction − ₹2,000 Paid = **₹1,700 Pending**
- **Cycle 2:** 18/08/2026 → 17/09/2026 with **₹1,700 Previous Pending carried forward**! Total charge = ₹5,700.

---

## 🚀 Quick Start

### 1. Run the Application
```bash
python3 run.py
```
Open **http://localhost:8000** in your browser.

### 2. Run Automated Verification Tests
```bash
python3 -m unittest discover -s . -p "test_*.py"
```
All 11 business logic and API tests will execute and report verification status.
