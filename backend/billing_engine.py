"""
Billing Engine for MessMate.
Handles cycle date computations, carry-forward balances, missed meals tallying,
manual deductions, and financial reconciliation.
"""
from datetime import datetime, timedelta
import calendar
import json
from .db import get_db_connection

def add_one_month(sourcedate):
    """Accurately adds one month to a date object."""
    month = sourcedate.month - 1 + 1
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return datetime(year, month, day).date()

def compute_cycle_dates(start_date_str):
    """
    Given a cycle start date (YYYY-MM-DD), returns (start_date_str, end_date_str, next_cycle_start_str).
    Example: '2026-07-18' -> ('2026-07-18', '2026-08-17', '2026-08-18')
    """
    start = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    next_start = add_one_month(start)
    end = next_start - timedelta(days=1)
    return (start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"), next_start.strftime("%Y-%m-%d"))

def get_student_active_cycle(student_id, conn=None):
    """Returns the current active or most recent billing cycle for a student."""
    own_conn = False
    if conn is None:
        conn = get_db_connection()
        own_conn = True

    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM billing_cycles
    WHERE student_id = ? AND status = 'active'
    ORDER BY cycle_number DESC LIMIT 1
    """, (student_id,))
    row = cursor.fetchone()
    
    if not row:
        cursor.execute("""
        SELECT * FROM billing_cycles
        WHERE student_id = ?
        ORDER BY cycle_number DESC LIMIT 1
        """, (student_id,))
        row = cursor.fetchone()

    if own_conn:
        conn.close()
    return dict(row) if row else None

def get_cycle_financials(cycle_id, conn=None):
    """
    Computes exact financial summary for a specific billing cycle:
    - Base Bill
    - Previous Pending
    - Total Deductions
    - Total Payments
    - Adjusted Bill (Base Bill - Deductions)
    - Current Outstanding (Previous Pending + Base Bill - Deductions - Payments)
    - Missed Meals Count
    """
    own_conn = False
    if conn is None:
        conn = get_db_connection()
        own_conn = True

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM billing_cycles WHERE id = ?", (cycle_id,))
    cycle_row = cursor.fetchone()
    if not cycle_row:
        if own_conn:
            conn.close()
        return None

    cycle = dict(cycle_row)
    student_id = cycle["student_id"]
    start_date = cycle["start_date"]
    end_date = cycle["end_date"]
    base_amount = cycle["base_amount"]
    previous_pending = cycle["previous_pending"]

    # 1. Total Payments for this cycle
    cursor.execute("""
    SELECT COALESCE(SUM(amount), 0) as total_paid, COUNT(*) as payment_count
    FROM payments
    WHERE billing_cycle_id = ?
    """, (cycle_id,))
    pay_row = cursor.fetchone()
    total_paid = pay_row["total_paid"]
    payment_count = pay_row["payment_count"]

    # 2. Total Deductions for this cycle
    cursor.execute("""
    SELECT COALESCE(SUM(amount), 0) as total_deductions, COUNT(*) as deduction_count
    FROM deductions
    WHERE billing_cycle_id = ?
    """, (cycle_id,))
    ded_row = cursor.fetchone()
    total_deductions = ded_row["total_deductions"]
    deduction_count = ded_row["deduction_count"]

    # 3. Count Missed Meals within cycle dates
    cursor.execute("""
    SELECT 
        SUM(CASE WHEN meal_type = 'breakfast' AND status = 'missed' THEN 1 ELSE 0 END) as missed_breakfast,
        SUM(CASE WHEN meal_type = 'lunch' AND status = 'missed' THEN 1 ELSE 0 END) as missed_lunch,
        SUM(CASE WHEN meal_type = 'dinner' AND status = 'missed' THEN 1 ELSE 0 END) as missed_dinner,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as total_missed,
        SUM(CASE WHEN status = 'ate' THEN 1 ELSE 0 END) as total_ate
    FROM meal_attendance
    WHERE student_id = ? AND date >= ? AND date <= ?
    """, (student_id, start_date, end_date))
    att_row = cursor.fetchone()
    missed_stats = {
        "missed_breakfast": att_row["missed_breakfast"] or 0,
        "missed_lunch": att_row["missed_lunch"] or 0,
        "missed_dinner": att_row["missed_dinner"] or 0,
        "total_missed": att_row["total_missed"] or 0,
        "total_ate": att_row["total_ate"] or 0
    }

    # Calculations (never allow balance to drop below 0)
    adjusted_bill = max(0, base_amount - total_deductions)
    total_charge = previous_pending + adjusted_bill
    current_pending = max(0, total_charge - total_paid)
    is_paid = current_pending == 0

    result = {
        "cycle_id": cycle["id"],
        "student_id": student_id,
        "cycle_number": cycle["cycle_number"],
        "start_date": cycle["start_date"],
        "end_date": cycle["end_date"],
        "status": cycle["status"],
        "base_bill": base_amount,
        "previous_pending": previous_pending,
        "total_deductions": total_deductions,
        "deduction_count": deduction_count,
        "adjusted_bill": adjusted_bill,
        "total_charge": total_charge,
        "total_paid": total_paid,
        "payment_count": payment_count,
        "current_pending": current_pending,
        "is_paid": is_paid,
        "missed_stats": missed_stats
    }

    if own_conn:
        conn.close()
    return result

def get_student_billing_summary(student_id, conn=None):
    """Returns complete billing summary, active cycle, and all cycle histories for a student."""
    own_conn = False
    if conn is None:
        conn = get_db_connection()
        own_conn = True

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    student = cursor.fetchone()
    if not student:
        if own_conn:
            conn.close()
        return None

    cursor.execute("""
    SELECT id FROM billing_cycles
    WHERE student_id = ?
    ORDER BY cycle_number DESC
    """, (student_id,))
    cycles_rows = cursor.fetchall()
    cycles_list = []
    for r in cycles_rows:
        fin = get_cycle_financials(r["id"], conn=conn)
        if fin:
            cycles_list.append(fin)

    active_cycle = next((c for c in cycles_list if c["status"] == "active"), cycles_list[0] if cycles_list else None)

    # Lifetime stats
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_id = ?", (student_id,))
    lifetime_paid = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM deductions WHERE student_id = ?", (student_id,))
    lifetime_deductions = cursor.fetchone()[0]

    res = {
        "student": dict(student),
        "active_cycle": active_cycle,
        "cycles": cycles_list,
        "lifetime_paid": lifetime_paid,
        "lifetime_deductions": lifetime_deductions
    }

    if own_conn:
        conn.close()
    return res

def create_next_billing_cycle(student_id, conn=None):
    """
    Closes the current active cycle and rolls over any remaining balance as previous_pending
    into the next billing cycle according to the student's joining date schedule.
    """
    own_conn = False
    if conn is None:
        conn = get_db_connection()
        own_conn = True

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    student_row = cursor.fetchone()
    if not student_row:
        if own_conn:
            conn.close()
        raise ValueError("Student not found")

    student = dict(student_row)
    active_cycle_info = get_student_active_cycle(student_id, conn=conn)

    if active_cycle_info:
        fin = get_cycle_financials(active_cycle_info["id"], conn=conn)
        pending_to_carry = fin["current_pending"]
        
        # Mark active cycle as closed
        cursor.execute("UPDATE billing_cycles SET status = 'closed' WHERE id = ?", (active_cycle_info["id"],))
        
        # Determine next cycle start date
        _, _, next_start = compute_cycle_dates(active_cycle_info["start_date"])
        next_cycle_num = active_cycle_info["cycle_number"] + 1
    else:
        # First cycle starting from joining date
        next_start = student["joining_date"]
        next_cycle_num = 1
        pending_to_carry = 0

    start_date, end_date, _ = compute_cycle_dates(next_start)
    base_amount = student["monthly_fee"]

    cursor.execute("""
    INSERT INTO billing_cycles (student_id, cycle_number, start_date, end_date, base_amount, previous_pending, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    """, (student_id, next_cycle_num, start_date, end_date, base_amount, pending_to_carry, f"Billing cycle #{next_cycle_num}"))
    
    new_cycle_id = cursor.lastrowid
    conn.commit()

    new_cycle_fin = get_cycle_financials(new_cycle_id, conn=conn)

    if own_conn:
        conn.close()
    return new_cycle_fin

def get_overall_financial_summary(conn=None):
    """Computes overall financial summary across all active and paused students."""
    own_conn = False
    if conn is None:
        conn = get_db_connection()
        own_conn = True

    cursor = conn.cursor()
    cursor.execute("SELECT id, status FROM students WHERE status IN ('active', 'paused')")
    students = cursor.fetchall()

    expected_collection = 0
    total_collected = 0
    total_pending = 0
    total_deductions = 0
    pending_students_count = 0

    for s in students:
        s_id = s["id"]
        cycle = get_student_active_cycle(s_id, conn=conn)
        if cycle:
            fin = get_cycle_financials(cycle["id"], conn=conn)
            if fin:
                expected_collection += fin["total_charge"]
                total_collected += fin["total_paid"]
                total_pending += fin["current_pending"]
                total_deductions += fin["total_deductions"]
                if fin["current_pending"] > 0:
                    pending_students_count += 1

    result = {
        "expected_collection": expected_collection,
        "total_collected": total_collected,
        "total_pending": total_pending,
        "total_deductions": total_deductions,
        "pending_students_count": pending_students_count,
        "active_students_count": len([s for s in students if s["status"] == "active"]),
        "paused_students_count": len([s for s in students if s["status"] == "paused"])
    }

    if own_conn:
        conn.close()
    return result
