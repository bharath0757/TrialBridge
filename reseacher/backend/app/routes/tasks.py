from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role, find_record, require_study_access
from app.models.task import TaskResponse, TaskCreate
from app.repositories import tasks as task_repo

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
def get_tasks(assignee_id: str = None, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if assignee_id and assignee_id != current_user['id']:
        if current_user['role'] != 'PLATFORM_ADMIN':
            raise HTTPException(status_code=403, detail='Not authorized to view another user task list')
        return task_repo.list_by_assignee(db, assignee_id)
    return task_repo.list_by_assignee(db, current_user["id"])

@router.post("/", response_model=TaskResponse)
def create_task(t_in: TaskCreate, db = Depends(get_db), current_user: dict = Depends(require_role('PLATFORM_ADMIN', 'ORGANIZATION', 'PRINCIPAL_INVESTIGATOR', 'RESEARCH_COORDINATOR'))):
    require_study_access(current_user, t_in.study_id, db)
    t_data = t_in.model_dump()
    t_data["created_by"] = current_user["id"]
    return task_repo.create(db, t_data)

@router.put("/{id}")
def update_task_status(id: str, status: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    task = find_record(db.tasks, id)
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')
    if current_user['role'] != 'PLATFORM_ADMIN' and str(current_user['id']) not in {str(task.get('assignee_id')), str(task.get('created_by'))}:
        raise HTTPException(status_code=403, detail='Not authorized to update this task')
    success = task_repo.update_status(db, id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success"}
