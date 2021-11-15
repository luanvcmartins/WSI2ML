"""empty message

Revision ID: 712f7e302ff7
Revises: 5ff69fcd2507
Create Date: 2021-11-13 01:14:42.706994

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '712f7e302ff7'
down_revision = '5ff69fcd2507'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('revision_tasks', sa.Column('name', sa.Integer(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('revision_tasks', 'name')
    # ### end Alembic commands ###
