from django.urls import path, include
from rest_framework.routers import DefaultRouter, SimpleRouter
from .views import (
    TagViewSet, FolderViewSet, NoteViewSet,
    FolderStructureView, SidebarView, NoteShareViewSet
)

router = DefaultRouter()
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'folders', FolderViewSet, basename='folder')
router.register(r'notes', NoteViewSet, basename='note')

# Вложенный роутер для NoteShare
notes_router = SimpleRouter()
notes_router.register(r'shares', NoteShareViewSet, basename='note-share')

urlpatterns = [
    path('', include(router.urls)),
    path('structure/', FolderStructureView.as_view(), name='folder-structure'),
    path('sidebar/', SidebarView.as_view(), name='sidebar'),
    path('notes/<int:note_pk>/', include(notes_router.urls)),
] 