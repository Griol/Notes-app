from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TagViewSet, FolderViewSet, NoteViewSet,
    FolderStructureView, SidebarView, UserProfileView
)

router = DefaultRouter()
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'folders', FolderViewSet, basename='folder')
router.register(r'notes', NoteViewSet, basename='note')

urlpatterns = [
    path('', include(router.urls)),
    path('structure/', FolderStructureView.as_view(), name='folder-structure'),
    path('sidebar/', SidebarView.as_view(), name='sidebar'),
    path('users/profile/', UserProfileView.as_view(), name='user-profile'),
] 