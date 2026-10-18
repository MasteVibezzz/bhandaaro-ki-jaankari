from alembic import context
from backend.app.database import Base, engine
from backend.app import models  # register model metadata

target_metadata = Base.metadata

if context.is_offline_mode():
    from backend.app.config import settings
    context.configure(url=settings.database_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
