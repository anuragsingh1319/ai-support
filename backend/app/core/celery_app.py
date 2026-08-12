from celery import Celery
import os

# Create Celery app
celery_app = Celery(
    "worker",
    broker=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

celery_app.conf.task_routes = {
    "app.worker.process_document_task": "main-queue"
}
