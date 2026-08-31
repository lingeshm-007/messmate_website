"""
REST API & Web Server for MessMate.
Uses Python standard library http.server for ultra-fast, zero-dependency hosting.
"""
import http.server
import socketserver
import json
import urllib.parse
import os
import mimetypes
from datetime import datetime, timedelta
import uuid

from .db import get_db_connection, init_db, seed_demo_data
from .billing_engine import (
    compute_cycle_dates,
    get_student_active_cycle,
    get_cycle_financials,
    get_student_billing_summary,
    create_next_billing_cycle,
    get_overall_financial_summary
)
from .ai_prediction import predict_meal_demand

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
STATIC_DIR = PUBLIC_DIR if os.path.exists(PUBLIC_DIR) else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")

class MessMateRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow CORS for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        response_bytes = json.dumps(data, default=str).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def send_error_json(self, message, status=400):
        self.send_json({"error": message, "success": False}, status=status)

    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode('utf-8')
        return json.loads(body)

    # -------------------------------------------------------------
    # ROUTE DISPATCHER
    # -------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Static Assets
        if not path.startswith('/api/'):
            return self.serve_static(path)

        try:
            # 1. Health
            if path == '/api/health':
                return self.send_json({"status": "ok", "app": "MessMate", "version": "1.0.0"})

            # 2. Settings
            elif path == '/api/settings':
                return self.handle_get_settings()

            # 3. Dashboard summary
            elif path == '/api/dashboard':
                date_str = query.get('date', [datetime.now().strftime('%Y-%m-%d')])[0]
                return self.handle_get_dashboard(date_str)

            # 4. Students
            elif path == '/api/students':
                search = query.get('search', [None])[0]
                status = query.get('status', [None])[0]
                meal_plan = query.get('meal_plan', [None])[0]
                payment_filter = query.get('payment_filter', [None])[0]
                return self.handle_get_students(search, status, meal_plan, payment_filter)

            elif path.startswith('/api/students/'):
                student_id = int(path.split('/')[3])
                return self.handle_get_student_profile(student_id)

            # 5. Daily Attendance
            elif path == '/api/attendance':
                date_str = query.get('date', [datetime.now().strftime('%Y-%m-%d')])[0]
                return self.handle_get_attendance(date_str)

            # 6. Billing summary for student
            elif path.startswith('/api/billing/student/'):
                student_id = int(path.split('/')[4])
                return self.handle_get_student_billing(student_id)

            # 7. Deductions
            elif path == '/api/deductions':
                student_id = query.get('student_id', [None])[0]
                return self.handle_get_deductions(student_id)

            # 8. Payments
            elif path == '/api/payments':
                student_id = query.get('student_id', [None])[0]
                return self.handle_get_payments(student_id)

            elif path.startswith('/api/payments/') and path.endswith('/receipt'):
                payment_id = int(path.split('/')[3])
                return self.handle_get_payment_receipt(payment_id)

            # 9. Weekly Menu
            elif path == '/api/menu':
                return self.handle_get_menu()

            # 10. Leave Requests
            elif path == '/api/leave-requests':
                student_id = query.get('student_id', [None])[0]
                return self.handle_get_leave_requests(student_id)

            # 11. Reports
            elif path == '/api/reports':
                start_date = query.get('start_date', [None])[0]
                end_date = query.get('end_date', [None])[0]
                return self.handle_get_reports(start_date, end_date)

            # 12. AI Meal Prediction
            elif path == '/api/ai/prediction':
                target_date = query.get('date', [None])[0]
                return self.send_json(predict_meal_demand(target_date))

            else:
                return self.send_error_json("API endpoint not found", 404)

        except Exception as e:
            return self.send_error_json(str(e), 500)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            body = self.read_json_body()

            if path == '/api/students':
                return self.handle_create_student(body)

            elif path.startswith('/api/students/') and path.endswith('/status'):
                student_id = int(path.split('/')[3])
                return self.handle_update_student_status(student_id, body)

            elif path == '/api/attendance':
                return self.handle_mark_attendance(body)

            elif path == '/api/attendance/bulk':
                return self.handle_bulk_attendance(body)

            elif path == '/api/deductions':
                return self.handle_create_deduction(body)

            elif path == '/api/payments':
                return self.handle_create_payment(body)

            elif path.startswith('/api/billing/student/') and path.endswith('/next-cycle'):
                student_id = int(path.split('/')[4])
                return self.handle_start_next_cycle(student_id)

            elif path == '/api/leave-requests':
                return self.handle_create_leave_request(body)

            elif path == '/api/reset-demo':
                seed_demo_data(force=True)
                return self.send_json({"success": True, "message": "Demo data reset successfully!"})

            else:
                return self.send_error_json("API endpoint not found", 404)

        except Exception as e:
            return self.send_error_json(str(e), 500)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            body = self.read_json_body()

            if path == '/api/settings':
                return self.handle_update_settings(body)

            elif path.startswith('/api/students/'):
                student_id = int(path.split('/')[3])
                return self.handle_update_student(student_id, body)

            elif path == '/api/menu':
                return self.handle_update_menu(body)

            elif path.startswith('/api/leave-requests/') and path.endswith('/status'):
                request_id = int(path.split('/')[3])
                return self.handle_update_leave_status(request_id, body)

            else:
                return self.send_error_json("API endpoint not found", 404)

        except Exception as e:
            return self.send_error_json(str(e), 500)

    # -------------------------------------------------------------
    # HANDLERS
    # -------------------------------------------------------------
    def handle_get_settings(self):
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM mess_settings WHERE id = 1").fetchone()
        conn.close()
        return self.send_json(dict(row) if row else {})

    def handle_update_settings(self, body):
        conn = get_db_connection()
        conn.execute("""
        UPDATE mess_settings SET
            mess_name = ?,
            owner_name = ?,
            phone = ?,
            address = ?,
            capacity = ?,
            price_three_meals = ?,
            price_two_meals = ?,
            price_one_meal = ?,
            price_breakfast = ?,
            price_lunch = ?,
            price_dinner = ?,
            enable_breakfast = ?,
            enable_lunch = ?,
            enable_dinner = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        """, (
            body.get("mess_name", "Annapoorna Home Mess"),
            body.get("owner_name", "Lakshmi Amma"),
            body.get("phone", "9845012345"),
            body.get("address", "Coimbatore"),
            int(body.get("capacity", 20)),
            int(body.get("price_three_meals", 4000)),
            int(body.get("price_two_meals", 3000)),
            int(body.get("price_one_meal", 1800)),
            int(body.get("price_breakfast", 1200)),
            int(body.get("price_lunch", 1800)),
            int(body.get("price_dinner", 1800)),
            1 if body.get("enable_breakfast", True) else 0,
            1 if body.get("enable_lunch", True) else 0,
            1 if body.get("enable_dinner", True) else 0
        ))
        conn.commit()
        row = conn.execute("SELECT * FROM mess_settings WHERE id = 1").fetchone()
        conn.close()
        return self.send_json(dict(row))

    def handle_get_dashboard(self, date_str):
        conn = get_db_connection()
        settings = dict(conn.execute("SELECT * FROM mess_settings WHERE id = 1").fetchone())
        
        # Student status counts
        cursor = conn.cursor()
        cursor.execute("SELECT status, COUNT(*) as cnt FROM students GROUP BY status")
        status_map = {r["status"]: r["cnt"] for r in cursor.fetchall()}
        active_count = status_map.get("active", 0)
        paused_count = status_map.get("paused", 0)
        inactive_count = status_map.get("inactive", 0)

        # Today's attendance counts
        cursor.execute("""
        SELECT 
            SUM(CASE WHEN meal_type = 'breakfast' AND status = 'ate' THEN 1 ELSE 0 END) as b_ate,
            SUM(CASE WHEN meal_type = 'lunch' AND status = 'ate' THEN 1 ELSE 0 END) as l_ate,
            SUM(CASE WHEN meal_type = 'dinner' AND status = 'ate' THEN 1 ELSE 0 END) as d_ate,
            SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as meals_missed,
            SUM(CASE WHEN status = 'ate' THEN 1 ELSE 0 END) as meals_ate
        FROM meal_attendance
        WHERE date = ?
        """, (date_str,))
        att_row = cursor.fetchone()
        
        # Expected meals for today based on active students' meal selections
        cursor.execute("SELECT meal_selection FROM students WHERE status = 'active'")
        active_students = cursor.fetchall()
        expected_b = 0
        expected_l = 0
        expected_d = 0
        for s in active_students:
            meals = json.loads(s["meal_selection"]) if s["meal_selection"] else []
            if "breakfast" in meals: expected_b += 1
            if "lunch" in meals: expected_l += 1
            if "dinner" in meals: expected_d += 1

        total_expected_meals = expected_b + expected_l + expected_d

        # Financial summary
        fin_summary = get_overall_financial_summary(conn=conn)

        # AI Prediction insight for quick banner
        ai_insight = predict_meal_demand(conn=conn)

        conn.close()

        return self.send_json({
            "date": date_str,
            "mess_settings": settings,
            "students": {
                "active": active_count,
                "paused": paused_count,
                "inactive": inactive_count,
                "capacity": settings["capacity"],
                "occupancy_rate": round((active_count / settings["capacity"]) * 100, 1) if settings["capacity"] > 0 else 0
            },
            "today_attendance": {
                "breakfast_count": att_row["b_ate"] or 0,
                "lunch_count": att_row["l_ate"] or 0,
                "dinner_count": att_row["d_ate"] or 0,
                "meals_missed": att_row["meals_missed"] or 0,
                "meals_ate": att_row["meals_ate"] or 0,
                "expected_breakfast": expected_b,
                "expected_lunch": expected_l,
                "expected_dinner": expected_d,
                "total_expected": total_expected_meals
            },
            "financial_summary": fin_summary,
            "ai_insight": ai_insight
        })

    def handle_get_students(self, search, status, meal_plan, payment_filter):
        conn = get_db_connection()
        query = "SELECT * FROM students WHERE 1=1"
        params = []

        if status and status != 'all':
            query += " AND status = ?"
            params.append(status)

        if search:
            clean_search = search.strip()
            # Strip prefixes like "ID:", "#", etc. if searching by ID
            id_candidate = clean_search.lstrip('#').lower().replace('id', '').strip()
            
            if id_candidate.isdigit():
                query += " AND (id = ? OR name LIKE ? OR phone LIKE ? OR address LIKE ? OR notes LIKE ? OR meal_selection LIKE ? OR status LIKE ?)"
                term = f"%{clean_search}%"
                params.extend([int(id_candidate), term, term, term, term, term, term])
            else:
                query += " AND (name LIKE ? OR phone LIKE ? OR address LIKE ? OR notes LIKE ? OR meal_selection LIKE ? OR status LIKE ?)"
                term = f"%{clean_search}%"
                params.extend([term, term, term, term, term, term])

        query += " ORDER BY CASE status WHEN 'active' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END, name ASC"
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

        results = []
        for r in rows:
            s_dict = dict(r)
            s_dict["meal_selection"] = json.loads(s_dict["meal_selection"]) if s_dict["meal_selection"] else []
            
            # Attach active cycle summary
            active_cycle = get_student_active_cycle(s_dict["id"], conn=conn)
            if active_cycle:
                fin = get_cycle_financials(active_cycle["id"], conn=conn)
                s_dict["billing"] = fin
            else:
                s_dict["billing"] = None

            # Filter by meal plan if specified
            if meal_plan and meal_plan != 'all':
                meals = s_dict["meal_selection"]
                if meal_plan == 'three_meals' and len(meals) != 3:
                    continue
                elif meal_plan == 'two_meals' and len(meals) != 2:
                    continue
                elif meal_plan == 'one_meal' and len(meals) != 1:
                    continue

            # Filter by payment filter
            if payment_filter and payment_filter != 'all' and s_dict["billing"]:
                if payment_filter == 'pending' and s_dict["billing"]["current_pending"] <= 0:
                    continue
                elif payment_filter == 'paid' and s_dict["billing"]["current_pending"] > 0:
                    continue

            results.append(s_dict)

        conn.close()
        return self.send_json(results)

    def handle_get_student_profile(self, student_id):
        conn = get_db_connection()
        summary = get_student_billing_summary(student_id, conn=conn)
        if not summary:
            conn.close()
            return self.send_error_json("Student not found", 404)

        # Parse meal selection
        summary["student"]["meal_selection"] = json.loads(summary["student"]["meal_selection"]) if summary["student"]["meal_selection"] else []

        # Fetch recent attendance records (last 45 days)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT date, meal_type, status, recorded_at
        FROM meal_attendance
        WHERE student_id = ?
        ORDER BY date DESC, meal_type ASC
        LIMIT 90
        """, (student_id,))
        summary["recent_attendance"] = [dict(r) for r in cursor.fetchall()]

        # Fetch all payments
        cursor.execute("""
        SELECT p.*, bc.cycle_number, bc.start_date as cycle_start, bc.end_date as cycle_end
        FROM payments p
        LEFT JOIN billing_cycles bc ON p.billing_cycle_id = bc.id
        WHERE p.student_id = ?
        ORDER BY p.payment_date DESC, p.id DESC
        """, (student_id,))
        summary["payments"] = [dict(r) for r in cursor.fetchall()]

        # Fetch all deductions
        cursor.execute("""
        SELECT d.*, bc.cycle_number, bc.start_date as cycle_start, bc.end_date as cycle_end
        FROM deductions d
        LEFT JOIN billing_cycles bc ON d.billing_cycle_id = bc.id
        WHERE d.student_id = ?
        ORDER BY d.deduction_date DESC, d.id DESC
        """, (student_id,))
        summary["deductions"] = [dict(r) for r in cursor.fetchall()]

        # Fetch leave requests
        cursor.execute("""
        SELECT * FROM leave_requests
        WHERE student_id = ?
        ORDER BY start_date DESC
        """, (student_id,))
        leaves = []
        for l in cursor.fetchall():
            l_dict = dict(l)
            l_dict["meals_skipped"] = json.loads(l_dict["meals_skipped"]) if l_dict["meals_skipped"] else []
            leaves.append(l_dict)
        summary["leave_requests"] = leaves

        conn.close()
        return self.send_json(summary)

    def handle_create_student(self, body):
        name = body.get("name", "").strip()
        phone = body.get("phone", "").strip()
        address = body.get("address", "").strip()
        joining_date = body.get("joining_date", datetime.now().strftime("%Y-%m-%d")).strip()
        photo_url = body.get("photo_url", "default_avatar")
        meal_selection = body.get("meal_selection", ["breakfast", "lunch", "dinner"])
        notes = body.get("notes", "")

        if not name:
            return self.send_error_json("Student name is required")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check capacity
        cursor.execute("SELECT capacity, price_three_meals, price_two_meals, price_one_meal FROM mess_settings WHERE id = 1")
        settings = cursor.fetchone()
        capacity = settings["capacity"]

        cursor.execute("SELECT COUNT(*) FROM students WHERE status = 'active'")
        active_count = cursor.fetchone()[0]

        if active_count >= capacity:
            # We still allow adding if owner wants, but notify or respect setting
            pass

        # Calculate monthly fee if not explicitly passed
        if "monthly_fee" in body and body["monthly_fee"] is not None:
            monthly_fee = int(body["monthly_fee"])
        else:
            num_meals = len(meal_selection)
            if num_meals >= 3:
                monthly_fee = settings["price_three_meals"]
            elif num_meals == 2:
                monthly_fee = settings["price_two_meals"]
            else:
                monthly_fee = settings["price_one_meal"]

        cursor.execute("""
        INSERT INTO students (name, phone, address, photo_url, joining_date, meal_selection, monthly_fee, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
        """, (name, phone, address, photo_url, joining_date, json.dumps(meal_selection), monthly_fee, notes))
        
        student_id = cursor.lastrowid

        # Automatically create initial billing cycle for student starting on joining_date
        start_date, end_date, _ = compute_cycle_dates(joining_date)
        cursor.execute("""
        INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
        VALUES (?, 1, ?, ?, ?, 0, 'active', 'Initial billing cycle')
        """, (student_id, start_date, end_date, monthly_fee))

        conn.commit()
        conn.close()

        return self.handle_get_student_profile(student_id)

    def handle_update_student(self, student_id, body):
        conn = get_db_connection()
        cursor = conn.cursor()

        meal_selection_json = json.dumps(body.get("meal_selection", ["breakfast", "lunch", "dinner"]))
        
        cursor.execute("""
        UPDATE students SET
            name = ?,
            phone = ?,
            address = ?,
            photo_url = ?,
            joining_date = ?,
            meal_selection = ?,
            monthly_fee = ?,
            notes = ?
        WHERE id = ?
        """, (
            body.get("name"),
            body.get("phone"),
            body.get("address"),
            body.get("photo_url"),
            body.get("joining_date"),
            meal_selection_json,
            int(body.get("monthly_fee", 4000)),
            body.get("notes"),
            student_id
        ))

        # Also update active billing cycle base amount if modified
        active_cycle = get_student_active_cycle(student_id, conn=conn)
        if active_cycle and "monthly_fee" in body:
            cursor.execute("UPDATE billing_cycles SET base_amount = ? WHERE id = ?", (int(body["monthly_fee"]), active_cycle["id"]))

        conn.commit()
        conn.close()

        return self.handle_get_student_profile(student_id)

    def handle_update_student_status(self, student_id, body):
        new_status = body.get("status", "active")
        discontinue_date = body.get("discontinue_date")
        discontinue_reason = body.get("discontinue_reason")

        conn = get_db_connection()
        cursor = conn.cursor()

        if new_status == 'inactive':
            if not discontinue_date:
                discontinue_date = datetime.now().strftime("%Y-%m-%d")
            cursor.execute("""
            UPDATE students SET
                status = 'inactive',
                discontinue_date = ?,
                discontinue_reason = ?
            WHERE id = ?
            """, (discontinue_date, discontinue_reason, student_id))
        else:
            cursor.execute("""
            UPDATE students SET
                status = ?,
                discontinue_date = NULL,
                discontinue_reason = NULL
            WHERE id = ?
            """, (new_status, student_id))

        conn.commit()
        conn.close()

        return self.handle_get_student_profile(student_id)

    def handle_get_attendance(self, date_str):
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all active and paused students
        cursor.execute("""
        SELECT * FROM students
        WHERE status IN ('active', 'paused') OR (status = 'inactive' AND discontinue_date >= ?)
        ORDER BY name ASC
        """, (date_str,))
        students = cursor.fetchall()

        # Get attendance records for this date
        cursor.execute("SELECT * FROM meal_attendance WHERE date = ?", (date_str,))
        att_map = {}
        for row in cursor.fetchall():
            att_map[(row["student_id"], row["meal_type"])] = row["status"]

        result = []
        for s in students:
            s_dict = dict(s)
            meals = json.loads(s_dict["meal_selection"]) if s_dict["meal_selection"] else []
            s_dict["meal_selection"] = meals

            attendance = {}
            for m in ["breakfast", "lunch", "dinner"]:
                if m in meals:
                    # If recorded, return recorded status; else default to 'ate' if in active status or None
                    status = att_map.get((s_dict["id"], m))
                    attendance[m] = status
                else:
                    attendance[m] = "not_selected"

            s_dict["attendance"] = attendance
            result.append(s_dict)

        conn.close()
        return self.send_json({"date": date_str, "students": result})

    def handle_mark_attendance(self, body):
        student_id = int(body["student_id"])
        date_str = body["date"]
        meal_type = body["meal_type"]
        status = body["status"] # 'ate' or 'missed'

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO meal_attendance (student_id, date, meal_type, status, recorded_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, date, meal_type) DO UPDATE SET
            status = excluded.status,
            recorded_at = CURRENT_TIMESTAMP
        """, (student_id, date_str, meal_type, status))
        conn.commit()
        conn.close()

        return self.send_json({"success": True, "student_id": student_id, "date": date_str, "meal_type": meal_type, "status": status})

    def handle_bulk_attendance(self, body):
        """Allows marking all active students as 'ate' for a specific meal or whole day."""
        date_str = body["date"]
        meal_type = body.get("meal_type") # 'breakfast', 'lunch', 'dinner', or None for all
        status = body.get("status", "ate")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id, meal_selection FROM students WHERE status = 'active'")
        active_students = cursor.fetchall()

        for s in active_students:
            s_id = s["id"]
            meals = json.loads(s["meal_selection"]) if s["meal_selection"] else []
            target_meals = [meal_type] if meal_type else meals
            for m in target_meals:
                if m in meals:
                    cursor.execute("""
                    INSERT INTO meal_attendance (student_id, date, meal_type, status, recorded_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(student_id, date, meal_type) DO UPDATE SET
                        status = excluded.status,
                        recorded_at = CURRENT_TIMESTAMP
                    """, (s_id, date_str, m, status))

        conn.commit()
        conn.close()
        return self.send_json({"success": True, "message": "Bulk attendance updated successfully"})

    def handle_get_student_billing(self, student_id):
        conn = get_db_connection()
        summary = get_student_billing_summary(student_id, conn=conn)
        conn.close()
        if not summary:
            return self.send_error_json("Student not found", 404)
        return self.send_json(summary)

    def handle_start_next_cycle(self, student_id):
        conn = get_db_connection()
        new_cycle = create_next_billing_cycle(student_id, conn=conn)
        conn.close()
        return self.send_json({"success": True, "new_cycle": new_cycle})

    def handle_create_deduction(self, body):
        student_id = int(body["student_id"])
        billing_cycle_id = body.get("billing_cycle_id")
        amount = int(body["amount"])
        deduction_date = body.get("deduction_date", datetime.now().strftime("%Y-%m-%d"))
        reason = body.get("reason", "Missed meals deduction").strip()
        missed_meal_count = int(body.get("missed_meal_count", 0))
        notes = body.get("notes", "").strip()

        if amount <= 0:
            return self.send_error_json("Deduction amount must be greater than 0")

        conn = get_db_connection()
        cursor = conn.cursor()

        if not billing_cycle_id:
            active_cycle = get_student_active_cycle(student_id, conn=conn)
            if not active_cycle:
                conn.close()
                return self.send_error_json("No billing cycle found for this student")
            billing_cycle_id = active_cycle["id"]

        cursor.execute("""
        INSERT INTO deductions (student_id, billing_cycle_id, amount, deduction_date, reason, missed_meal_count, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (student_id, billing_cycle_id, amount, deduction_date, reason, missed_meal_count, notes))
        deduction_id = cursor.lastrowid
        conn.commit()

        fin = get_cycle_financials(billing_cycle_id, conn=conn)
        conn.close()

        return self.send_json({
            "success": True,
            "deduction_id": deduction_id,
            "message": f"Deduction of ₹{amount:,} applied successfully",
            "cycle_financials": fin
        })

    def handle_get_deductions(self, student_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        if student_id:
            cursor.execute("""
            SELECT d.*, s.name as student_name, s.photo_url, bc.cycle_number, bc.start_date as cycle_start, bc.end_date as cycle_end
            FROM deductions d
            JOIN students s ON d.student_id = s.id
            JOIN billing_cycles bc ON d.billing_cycle_id = bc.id
            WHERE d.student_id = ?
            ORDER BY d.deduction_date DESC, d.id DESC
            """, (student_id,))
        else:
            cursor.execute("""
            SELECT d.*, s.name as student_name, s.photo_url, bc.cycle_number, bc.start_date as cycle_start, bc.end_date as cycle_end
            FROM deductions d
            JOIN students s ON d.student_id = s.id
            JOIN billing_cycles bc ON d.billing_cycle_id = bc.id
            ORDER BY d.deduction_date DESC, d.id DESC
            """)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return self.send_json(rows)

    def handle_create_payment(self, body):
        student_id = int(body["student_id"])
        billing_cycle_id = body.get("billing_cycle_id")
        amount = int(body["amount"])
        payment_date = body.get("payment_date", datetime.now().strftime("%Y-%m-%d"))
        payment_method = body.get("payment_method", "UPI")
        notes = body.get("notes", "").strip()

        if amount <= 0:
            return self.send_error_json("Payment amount must be greater than 0")

        conn = get_db_connection()
        cursor = conn.cursor()

        if not billing_cycle_id:
            active_cycle = get_student_active_cycle(student_id, conn=conn)
            if not active_cycle:
                conn.close()
                return self.send_error_json("No billing cycle found for this student")
            billing_cycle_id = active_cycle["id"]

        receipt_number = f"REC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        cursor.execute("""
        INSERT INTO payments (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (student_id, billing_cycle_id, amount, payment_date, payment_method, receipt_number, notes))
        payment_id = cursor.lastrowid
        conn.commit()

        fin = get_cycle_financials(billing_cycle_id, conn=conn)
        conn.close()

        return self.send_json({
            "success": True,
            "payment_id": payment_id,
            "receipt_number": receipt_number,
            "message": f"Payment of ₹{amount:,} recorded successfully",
            "cycle_financials": fin
        })

    def handle_get_payments(self, student_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        if student_id:
            cursor.execute("""
            SELECT p.*, s.name as student_name, s.photo_url, bc.cycle_number, bc.start_date as cycle_start, bc.end_date as cycle_end
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN billing_cycles bc ON p.billing_cycle_id = bc.id
            WHERE p.student_id = ?
            ORDER BY p.payment_date DESC, p.id DESC
            """, (student_id,))
        else:
            cursor.execute("""
            SELECT p.*, s.name as student_name, s.photo_url, bc.cycle_number, bc.start_date as cycle_start, bc.end_date as cycle_end
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN billing_cycles bc ON p.billing_cycle_id = bc.id
            ORDER BY p.payment_date DESC, p.id DESC
            """)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return self.send_json(rows)

    def handle_get_payment_receipt(self, payment_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT p.*, s.name as student_name, s.phone as student_phone, s.address as student_address, s.meal_selection,
               bc.cycle_number, bc.start_date as cycle_start, bc.end_date as cycle_end, bc.base_amount, bc.previous_pending,
               ms.mess_name, ms.owner_name, ms.phone as mess_phone, ms.address as mess_address
        FROM payments p
        JOIN students s ON p.student_id = s.id
        JOIN billing_cycles bc ON p.billing_cycle_id = bc.id
        CROSS JOIN mess_settings ms ON ms.id = 1
        WHERE p.id = ?
        """, (payment_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return self.send_error_json("Payment receipt not found", 404)
        
        receipt_data = dict(row)
        receipt_data["meal_selection"] = json.loads(receipt_data["meal_selection"]) if receipt_data["meal_selection"] else []
        
        # Also compute cycle current balance
        fin = get_cycle_financials(receipt_data["billing_cycle_id"], conn=conn)
        receipt_data["cycle_summary"] = fin

        conn.close()
        return self.send_json(receipt_data)

    def handle_get_menu(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM weekly_menu ORDER BY day_order ASC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return self.send_json(rows)

    def handle_update_menu(self, body):
        conn = get_db_connection()
        cursor = conn.cursor()
        # body can be array of days or single day object
        days = body if isinstance(body, list) else [body]
        for d in days:
            cursor.execute("""
            UPDATE weekly_menu SET
                breakfast_items = ?,
                lunch_items = ?,
                dinner_items = ?,
                special_note = ?
            WHERE day_of_week = ?
            """, (
                d.get("breakfast_items", ""),
                d.get("lunch_items", ""),
                d.get("dinner_items", ""),
                d.get("special_note", ""),
                d["day_of_week"]
            ))
        conn.commit()
        cursor.execute("SELECT * FROM weekly_menu ORDER BY day_order ASC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return self.send_json(rows)

    def handle_get_leave_requests(self, student_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        if student_id:
            cursor.execute("""
            SELECT lr.*, s.name as student_name, s.photo_url
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            WHERE lr.student_id = ?
            ORDER BY lr.start_date DESC
            """, (student_id,))
        else:
            cursor.execute("""
            SELECT lr.*, s.name as student_name, s.photo_url
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            ORDER BY lr.start_date DESC
            """)
        rows = []
        for r in cursor.fetchall():
            d = dict(r)
            d["meals_skipped"] = json.loads(d["meals_skipped"]) if d["meals_skipped"] else []
            rows.append(d)
        conn.close()
        return self.send_json(rows)

    def handle_create_leave_request(self, body):
        student_id = int(body["student_id"])
        start_date = body["start_date"]
        end_date = body["end_date"]
        meals_skipped = json.dumps(body.get("meals_skipped", ["breakfast", "lunch", "dinner"]))
        reason = body.get("reason", "Going home").strip()
        status = body.get("status", "approved") # Auto-approve for home-mess or pending

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO leave_requests (student_id, start_date, end_date, meals_skipped, reason, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (student_id, start_date, end_date, meals_skipped, reason, status))
        req_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return self.send_json({"success": True, "leave_request_id": req_id, "message": "Leave request submitted successfully"})

    def handle_update_leave_status(self, request_id, body):
        status = body.get("status", "approved")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE leave_requests SET status = ? WHERE id = ?", (status, request_id))
        conn.commit()
        conn.close()
        return self.send_json({"success": True, "request_id": request_id, "status": status})

    def handle_get_reports(self, start_date, end_date):
        conn = get_db_connection()
        cursor = conn.cursor()

        # Student status summary
        cursor.execute("SELECT status, COUNT(*) as cnt FROM students GROUP BY status")
        status_map = {r["status"]: r["cnt"] for r in cursor.fetchall()}

        # Financial totals
        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM payments")
        total_collected = cursor.fetchone()[0]

        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM deductions")
        total_deductions = cursor.fetchone()[0]

        cursor.execute("SELECT COALESCE(SUM(base_amount), 0) FROM billing_cycles")
        total_billed = cursor.fetchone()[0]

        fin_overall = get_overall_financial_summary(conn=conn)

        # Meal totals
        cursor.execute("""
        SELECT 
            SUM(CASE WHEN meal_type = 'breakfast' AND status = 'ate' THEN 1 ELSE 0 END) as b_ate,
            SUM(CASE WHEN meal_type = 'lunch' AND status = 'ate' THEN 1 ELSE 0 END) as l_ate,
            SUM(CASE WHEN meal_type = 'dinner' AND status = 'ate' THEN 1 ELSE 0 END) as d_ate,
            SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as total_missed,
            SUM(CASE WHEN status = 'ate' THEN 1 ELSE 0 END) as total_ate
        FROM meal_attendance
        """)
        meal_totals = dict(cursor.fetchone())

        # Daily meal breakdown for chart/tables (last 14 days)
        cursor.execute("""
        SELECT 
            date,
            SUM(CASE WHEN meal_type = 'breakfast' AND status = 'ate' THEN 1 ELSE 0 END) as breakfast,
            SUM(CASE WHEN meal_type = 'lunch' AND status = 'ate' THEN 1 ELSE 0 END) as lunch,
            SUM(CASE WHEN meal_type = 'dinner' AND status = 'ate' THEN 1 ELSE 0 END) as dinner,
            SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
        FROM meal_attendance
        GROUP BY date
        ORDER BY date DESC
        LIMIT 14
        """)
        daily_trends = [dict(r) for r in cursor.fetchall()]
        daily_trends.reverse()

        conn.close()

        return self.send_json({
            "student_stats": {
                "active": status_map.get("active", 0),
                "paused": status_map.get("paused", 0),
                "inactive": status_map.get("inactive", 0),
                "total": sum(status_map.values())
            },
            "financial_stats": {
                "total_billed": total_billed,
                "total_collected": total_collected,
                "total_deductions": total_deductions,
                "current_pending": fin_overall["total_pending"],
                "expected_current_month": fin_overall["expected_collection"]
            },
            "meal_stats": meal_totals,
            "daily_trends": daily_trends
        })

    # -------------------------------------------------------------
    # STATIC FILE SERVING
    # -------------------------------------------------------------
    def serve_static(self, path):
        if path == '/' or path == '':
            file_path = os.path.join(STATIC_DIR, 'index.html')
        else:
            rel_path = path.lstrip('/')
            file_path = os.path.join(STATIC_DIR, rel_path)

        if not os.path.exists(file_path) or os.path.isdir(file_path):
            # Fallback to index.html for SPA routing
            file_path = os.path.join(STATIC_DIR, 'index.html')

        if not os.path.exists(file_path):
            self.send_error(404, "File not found")
            return

        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            if file_path.endswith('.js'): mime_type = 'application/javascript'
            elif file_path.endswith('.css'): mime_type = 'text/css'
            elif file_path.endswith('.html'): mime_type = 'text/html'
            else: mime_type = 'application/octet-stream'

        try:
            with open(file_path, 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, str(e))

def run_server(port=8000):
    init_db()
    seed_demo_data(force=False)
    server_address = ('', port)
    
    # Enable address reuse to prevent "Address already in use" errors during quick restarts
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(server_address, MessMateRequestHandler)
    print(f"MessMate Server running at http://localhost:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
