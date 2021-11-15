"""empty message

Revision ID: 798c0d1152f6
Revises: 712f7e302ff7
Create Date: 2021-11-13 02:23:39.058518

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '798c0d1152f6'
down_revision = '712f7e302ff7'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('revision_task_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=True),
    sa.Column('user_task_id', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['task_id'], ['revision_tasks.id'], ),
    sa.ForeignKeyConstraint(['user_task_id'], ['user_tasks.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('revision_task_items')
    # ### end Alembic commands ###
