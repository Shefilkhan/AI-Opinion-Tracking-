"""One-off admin helper: set a user's subscription plan by email."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal
from app.db.models import Plan, User
from app.services.plan_service import get_plan_config, load_plans

VALID_PLANS = frozenset({"starter", "pro", "enterprise"})


def main() -> None:
    parser = argparse.ArgumentParser(description="Set a user's plan by email")
    parser.add_argument("email", help="User email address")
    parser.add_argument(
        "--plan",
        default="pro",
        choices=sorted(VALID_PLANS),
        help="Plan to assign (default: pro)",
    )
    args = parser.parse_args()

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == args.email.strip().lower()).first()
        if not user:
            user = db.query(User).filter(User.email == args.email.strip()).first()
        if not user:
            print(f"ERROR: No user found for {args.email!r}")
            raise SystemExit(1)

        if not db.get(Plan, args.plan):
            print(f"ERROR: Plan {args.plan!r} is not configured in the database")
            raise SystemExit(1)

        user.plan_id = args.plan
        user.plan_status = "active"
        user.plan_started_at = datetime.now(timezone.utc)
        user.plan_renews_at = datetime.now(timezone.utc) + timedelta(days=365)
        db.commit()
        load_plans(db)

        cfg = get_plan_config(args.plan)
        print(f"Updated {user.email} (id={user.id}) -> {cfg['name']} ({args.plan})")
        print(f"Status: {user.plan_status}, renews: {user.plan_renews_at}")


if __name__ == "__main__":
    main()
