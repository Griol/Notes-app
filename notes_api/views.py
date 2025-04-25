from django.shortcuts import render
from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import RestrictedError
from .models import Tag, Folder, Note
from .serializers import (
    TagSerializer, FolderSerializer, NoteSerializer,
    FolderStructureSerializer, SidebarSerializer
)
from .filters import NoteFilter


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)


class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Folder.objects.filter(user=self.request.user)
        parent = self.request.query_params.get('parent')
        if parent:
            if parent == 'null':
                queryset = queryset.filter(parent=None)
            else:
                queryset = queryset.filter(parent=parent)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        folder = self.get_object()
        
        # Check if folder has children or notes
        if folder.children.exists() or folder.notes.exists():
            return Response(
                {"detail": "Cannot delete folder that contains notes or subfolders."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = NoteFilter
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'title']
    
    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).prefetch_related('tags').select_related('folder')
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        instance = self.get_object()
        
        # Если обновляется только папка, обрабатываем специальным образом
        if len(request.data) == 1 and 'folder' in request.data:
            serializer = self.get_serializer(
                instance, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        
        return super().partial_update(request, *args, **kwargs)


class FolderStructureView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get all top-level folders for the user (where parent is None)
        root_folders = Folder.objects.filter(user=request.user, parent=None)
        serializer = FolderStructureSerializer(root_folders, many=True, context={'request': request})
        return Response(serializer.data)


class SidebarView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = SidebarSerializer(request.user, context={'request': request})
        return Response(serializer.data)
