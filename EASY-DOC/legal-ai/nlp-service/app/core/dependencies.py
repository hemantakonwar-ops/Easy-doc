from fastapi import Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.connection import get_db


async def get_database() -> AsyncIOMotorDatabase:
    """Dependency to get database instance."""
    return get_db()


class CommonDependencies:
    """Common dependencies for routes."""
    
    @staticmethod
    def get_db_dep():
        return Depends(get_database)


def get_common_deps():
    return CommonDependencies()
