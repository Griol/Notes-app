from rest_framework import serializers
from .models import Tag, Folder, Note, Flashcard, FlashcardStat, DailyFlashcardStat, NoteAttachment
from django.contrib.auth import get_user_model

User = get_user_model()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
        read_only_fields = ['id']

    def create(self, validated_data):
        # Associate with current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FolderSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent = serializers.PrimaryKeyRelatedField(queryset=Folder.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Folder
        fields = ['id', 'name', 'parent', 'children', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_children(self, obj):
        # Get direct children of this folder
        children = Folder.objects.filter(parent=obj, user=obj.user)
        return FolderSerializer(children, many=True, context=self.context).data

    def create(self, validated_data):
        # Associate with current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class NoteAttachmentSerializer(serializers.ModelSerializer):
    note = serializers.PrimaryKeyRelatedField(queryset=Note.objects.all())
    class Meta:
        model = NoteAttachment
        fields = ['id', 'note', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class NoteSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, required=False, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=Tag.objects.all(), source='tags'
    )
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    attachments = NoteAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'folder', 'tags', 'tag_ids', 
            'tag_names', 'created_at', 'updated_at', 'attachments'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'attachments']

    def create(self, validated_data):
        # Handle tag names if provided
        tag_names = validated_data.pop('tag_names', [])
        
        # Associate with current user
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Create the note
        note = super().create(validated_data)
        
        # Create tags if they don't exist and add to note
        if tag_names:
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(
                    name=tag_name,
                    user=user
                )
                note.tags.add(tag)
                
        return note

    def update(self, instance, validated_data):
        # Handle tag names if provided
        tag_names = validated_data.pop('tag_names', [])
        
        # Проверяем, является ли это частичным обновлением только для поля folder
        is_only_folder_update = len(validated_data) == 1 and 'folder' in validated_data
        
        # Update the note
        note = super().update(instance, validated_data)
        
        # Create tags if they don't exist and add to note
        if tag_names:
            # Если это только обновление папки, не меняем теги
            if not is_only_folder_update:
                # Сначала очистим существующие теги, если это полное обновление
                note.tags.clear()
                
            # Добавляем новые теги
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(
                    name=tag_name,
                    user=self.context['request'].user
                )
                note.tags.add(tag)
        
        return note


class FolderStructureSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    notes = NoteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Folder
        fields = ['id', 'name', 'children', 'notes']
    
    def get_children(self, obj):
        # Recursively serialize children folders
        children = Folder.objects.filter(parent=obj)
        serializer = FolderStructureSerializer(children, many=True, context=self.context)
        return serializer.data


class SidebarSerializer(serializers.ModelSerializer):
    folders = serializers.SerializerMethodField()
    recent_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'folders', 'recent_notes']
    
    def get_folders(self, obj):
        # Get top-level folders
        folders = Folder.objects.filter(user=obj, parent=None)
        return FolderSerializer(folders, many=True).data
    
    def get_recent_notes(self, obj):
        # Get 5 most recent notes
        notes = Note.objects.filter(user=obj).order_by('-updated_at')[:5]
        return NoteSerializer(notes, many=True).data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class FlashcardSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, required=False, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=Tag.objects.all(), source='tags'
    )
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    folder = serializers.PrimaryKeyRelatedField(queryset=Folder.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Flashcard
        fields = [
            'id', 'question', 'answer', 'folder', 'tags', 'tag_ids',
            'tag_names', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        user = self.context['request'].user
        validated_data['user'] = user
        flashcard = super().create(validated_data)
        if tag_names:
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(
                    name=tag_name,
                    user=user
                )
                flashcard.tags.add(tag)
        return flashcard

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        flashcard = super().update(instance, validated_data)
        if tag_names:
            flashcard.tags.clear()
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(
                    name=tag_name,
                    user=self.context['request'].user
                )
                flashcard.tags.add(tag)
        return flashcard


class FlashcardStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashcardStat
        fields = ['id', 'flashcard', 'date', 'result', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class DailyFlashcardStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyFlashcardStat
        fields = ['id', 'date', 'solved_count']
        read_only_fields = ['id', 'date', 'solved_count'] 