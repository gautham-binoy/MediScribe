"""add_clinical_summary_to_transcripts

Revision ID: e4b71fa3347b
Revises: 68e9ee6f5829
Create Date: 2026-09-23 20:26:08.103898

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4b71fa3347b'
down_revision: Union[str, None] = '68e9ee6f5829'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('transcripts', sa.Column('clinical_summary', sa.Text(), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_column('transcripts', 'clinical_summary')
    except Exception:
        pass
