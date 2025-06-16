from django.shortcuts import render
from rest_framework import viewsets, generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import RestrictedError
from django.contrib.auth import get_user_model
from .models import Tag, Folder, Note, Flashcard, FlashcardStat, DailyFlashcardStat, NoteAttachment, NoteImage
from .serializers import (
    TagSerializer, FolderSerializer, NoteSerializer,
    FolderStructureSerializer, SidebarSerializer, UserProfileSerializer,
    FlashcardSerializer, FlashcardStatSerializer, DailyFlashcardStatSerializer,
    NoteAttachmentSerializer, NoteImageSerializer
)
from .filters import NoteFilter

User = get_user_model()

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


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
        
        # If parent parameter is provided, filter by parent
        parent = self.request.query_params.get('parent')
        if parent is not None:
            if parent == 'null':
                queryset = queryset.filter(parent=None)
            else:
                queryset = queryset.filter(parent=parent)
        
        return queryset.select_related('parent').prefetch_related('children')
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Get all children recursively
        def get_all_children(folder):
            children = Folder.objects.filter(parent=folder, user=request.user)
            result = []
            for child in children:
                child_data = self.get_serializer(child).data
                child_data['children'] = get_all_children(child)
                result.append(child_data)
            return result
        
        serializer = self.get_serializer(instance)
        data = serializer.data
        data['children'] = get_all_children(instance)
        return Response(data)
    
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


class FlashcardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Flashcard.objects.filter(user=self.request.user).prefetch_related('tags').select_related('folder')


class FlashcardStatViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardStatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FlashcardStat.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        # Обновляем/создаём DailyFlashcardStat
        daily_stat, created = DailyFlashcardStat.objects.get_or_create(
            user=self.request.user,
            date=instance.date
        )
        daily_stat.solved_count = FlashcardStat.objects.filter(user=self.request.user, date=instance.date).count()
        daily_stat.save()


class DailyFlashcardStatViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DailyFlashcardStatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DailyFlashcardStat.objects.filter(user=self.request.user)


class NoteAttachmentViewSet(viewsets.ModelViewSet):
    queryset = NoteAttachment.objects.all()
    serializer_class = NoteAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Показывать только вложения заметок пользователя
        return NoteAttachment.objects.filter(note__user=self.request.user)

    def perform_create(self, serializer):
        # Проверить, что пользователь владеет заметкой
        note = serializer.validated_data['note']
        if note.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to add attachments to this note.')
        serializer.save()


class NoteImageViewSet(viewsets.ModelViewSet):
    queryset = NoteImage.objects.all()
    serializer_class = NoteImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NoteImage.objects.filter(note__user=self.request.user)

    def perform_create(self, serializer):
        note = serializer.validated_data['note']
        if note.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to add images to this note.')
        serializer.save()
