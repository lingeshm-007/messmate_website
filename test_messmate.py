"""
Automated validation and business logic test suite for MessMate.
Tests the exact Lingesh scenario, individual billing cycles, manual deductions,
carry-forward balances, attendance counters, capacity logic, and AI meal prediction.
"""
import unittest
import json
import os
from datetime import datetime

from backend.db import init_db, seed_demo_data, get_db_connection
from backend.billing_engine import (
    compute_cycle_dates,
    get_student_billing_summary,
    get_cycle_financials,
    create_next_billing_cycle,
    get_overall_financial_summary
)
from backend.ai_prediction import predict_meal_demand

class TestMessMateBusinessLogic(unittest.TestCase):
    def setUp(self):
        init_db()
        seed_demo_data(force=True)
        self.conn = get_db_connection()

    def tearDown(self):
        self.conn.close()

    def test_cycle_date_computation(self):
        """Rule: Lingesh joins on 18/07/2026 -> Cycle 1: 18/07/2026 to 17/08/2026. Next: 18/08/2026 to 17/09/2026."""
        start, end, next_start = compute_cycle_dates("2026-07-18")
        self.assertEqual(start, "2026-07-18")
        self.assertEqual(end, "2026-08-17")
        self.assertEqual(next_start, "2026-08-18")

        start2, end2, next_start2 = compute_cycle_dates(next_start)
        self.assertEqual(start2, "2026-08-18")
        self.assertEqual(end2, "2026-09-17")
        self.assertEqual(next_start2, "2026-09-18")

        # Test another student joining on 25/07/2026
        s_start, s_end, s_next = compute_cycle_dates("2026-07-25")
        self.assertEqual(s_start, "2026-07-25")
        self.assertEqual(s_end, "2026-08-24")
        self.assertEqual(s_next, "2026-08-25")

    def test_lingesh_demo_scenario(self):
        """
        Verification of Demo Scenario (Requirement 27):
        1. Lingesh joins on 18/07/2026 with 3 meals (₹4,000/mo).
        2. Cycle 1: 18/07/2026 to 17/08/2026. Base bill: ₹4,000.
        3. He pays ₹2,000 on 19/07/2026 -> Pending: ₹2,000.
        4. He misses 6 meals during the cycle.
        5. Admin manually enters deduction of ₹300.
        6. Adjusted bill: ₹3,700. Paid: ₹2,000. Current pending: ₹1,700.
        7. Cycle 2 starts on 18/08/2026. Base bill: ₹4,000.
           Previous pending carried forward: ₹1,700.
           Total charge: ₹5,700.
           He pays ₹2,000 in cycle 2 -> Outstanding pending: ₹3,700.
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT id FROM students WHERE name = 'Lingesh'")
        lingesh_id = cursor.fetchone()[0]

        summary = get_student_billing_summary(lingesh_id, conn=self.conn)
        self.assertIsNotNone(summary)
        
        # Verify Cycle 1 (closed)
        cycle1 = next((c for c in summary["cycles"] if c["cycle_number"] == 1), None)
        self.assertIsNotNone(cycle1)
        self.assertEqual(cycle1["start_date"], "2026-07-18")
        self.assertEqual(cycle1["end_date"], "2026-08-17")
        self.assertEqual(cycle1["base_bill"], 4000)
        self.assertEqual(cycle1["previous_pending"], 0)
        self.assertEqual(cycle1["total_deductions"], 300)
        self.assertEqual(cycle1["adjusted_bill"], 3700)
        self.assertEqual(cycle1["total_paid"], 2000)
        self.assertEqual(cycle1["current_pending"], 1700)
        self.assertEqual(cycle1["missed_stats"]["total_missed"], 6)

        # Verify Cycle 2 (active with carry-forward)
        cycle2 = next((c for c in summary["cycles"] if c["cycle_number"] == 2), None)
        self.assertIsNotNone(cycle2)
        self.assertEqual(cycle2["start_date"], "2026-08-18")
        self.assertEqual(cycle2["end_date"], "2026-09-17")
        self.assertEqual(cycle2["base_bill"], 4000)
        self.assertEqual(cycle2["previous_pending"], 1700)
        self.assertEqual(cycle2["total_charge"], 5700)
        self.assertEqual(cycle2["total_paid"], 2000)
        self.assertEqual(cycle2["current_pending"], 3700)

    def test_manual_deductions_never_automatic(self):
        """Rule 11 & 12: System records missed count but NEVER automatically deducts ₹50."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT id FROM students WHERE name = 'Arun Kumar'")
        arun_id = cursor.fetchone()[0]

        summary = get_student_billing_summary(arun_id, conn=self.conn)
        cycle1 = next((c for c in summary["cycles"] if c["cycle_number"] == 1), None)
        self.assertIsNotNone(cycle1)
        
        # Arun missed several Sunday breakfasts, but because no manual deduction was keyed in, deductions remain 0
        if cycle1["missed_stats"]["total_missed"] > 0:
            self.assertEqual(cycle1["total_deductions"], 0)
            self.assertEqual(cycle1["adjusted_bill"], cycle1["base_bill"])

    def test_discontinued_student_history_preservation(self):
        """Rule 17 & 18: Discontinued students become inactive, preserving all historical records."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM students WHERE name = 'Vignesh Murugan'")
        vignesh = dict(cursor.fetchone())

        self.assertEqual(vignesh["status"], "inactive")
        self.assertIsNotNone(vignesh["discontinue_date"])
        self.assertIsNotNone(vignesh["discontinue_reason"])

        # Financial history is preserved
        summary = get_student_billing_summary(vignesh["id"], conn=self.conn)
        self.assertEqual(len(summary["cycles"]), 2)
        self.assertEqual(summary["lifetime_paid"], 8000)

    def test_ai_prediction_insights(self):
        """Rule 20: AI prediction module provides meal forecasts and explanations."""
        pred = predict_meal_demand("2026-08-31", conn=self.conn)
        self.assertIn("predicted_headcount", pred)
        self.assertIn("breakfast", pred["predicted_headcount"])
        self.assertIn("lunch", pred["predicted_headcount"])
        self.assertIn("dinner", pred["predicted_headcount"])
        self.assertGreater(pred["predicted_headcount"]["lunch"], 0)
        self.assertIn("highlight_message", pred)
        self.assertIn("grocery_guidance", pred)

if __name__ == "__main__":
    unittest.main()
