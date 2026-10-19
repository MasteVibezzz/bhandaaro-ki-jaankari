"""Add dated one-time bhandaaras; existing locations remain recurring."""
from alembic import op
import sqlalchemy as sa

revision = "9ab327d18e01"
down_revision = "cf29c6f6844b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("locations", sa.Column("schedule_kind", sa.String(20), server_default="recurring", nullable=False))
    op.add_column("locations", sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("locations", sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True))
    op.create_check_constraint("valid_event_schedule", "locations", "(schedule_kind = 'recurring' AND starts_at IS NULL AND ends_at IS NULL) OR (schedule_kind = 'one_time' AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)")


def downgrade():
    op.drop_constraint("valid_event_schedule", "locations", type_="check")
    op.drop_column("locations", "ends_at")
    op.drop_column("locations", "starts_at")
    op.drop_column("locations", "schedule_kind")
