from django.shortcuts import render
from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import RestrictedError, Q
from django.contrib.auth.models import User
from .models import Tag, Folder, Note, NoteShare
from .serializers import (
    TagSerializer, FolderSerializer, NoteSerializer,
    FolderStructureSerializer, SidebarSerializer,
    NoteShareSerializer
)
from .filters import NoteFilter


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user).order_by('name')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Folder.objects.filter(user=self.request.user).order_by('name')
        parent = self.request.query_params.get('parent')
        if parent:
            if parent == 'null':
                queryset = queryset.filter(parent=None)
            else:
                queryset = queryset.filter(parent=parent)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
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
        queryset = Note.objects.filter(
            Q(user=self.request.user) |
            Q(shares__shared_with=self.request.user)
        ).distinct()

        # Фильтрация по папке
        folder = self.request.query_params.get('folder', None)
        if folder == 'null':
            queryset = queryset.filter(folder__isnull=True)
        elif folder:
            queryset = queryset.filter(folder_id=folder)

        # Фильтрация по тегам
        tags = self.request.query_params.get('tags', None)
        if tags:
            tag_list = tags.split(',')
            for tag in tag_list:
                queryset = queryset.filter(tags__name=tag)

        return queryset.prefetch_related('tags', 'shares').select_related('folder')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        note = self.get_object()
        if note.user != request.user:
            return Response(
                {"detail": "You don't have permission to share this note."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = NoteShareSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(note=note)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def shares(self, request, pk=None):
        note = self.get_object()
        if note.user != request.user:
            return Response(
                {"detail": "You don't have permission to view shares."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        shares = note.shares.all()
        serializer = NoteShareSerializer(shares, many=True)
        return Response(serializer.data)


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


class NoteShareViewSet(viewsets.ModelViewSet):
    serializer_class = NoteShareSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NoteShare.objects.filter(
            note__user=self.request.user
        ).select_related('shared_with', 'note')
    
    def perform_create(self, serializer):
        note_id = self.kwargs.get('note_pk')
        note = Note.objects.get(id=note_id, user=self.request.user)
        serializer.save(note=note)
    
    @action(detail=True, methods=['post'])
    def remove_access(self, request, pk=None, note_pk=None):
        share = self.get_object()
        share.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
