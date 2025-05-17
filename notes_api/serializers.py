from rest_framework import serializers
from .models import Tag, Folder, Note, NoteShare
from django.contrib.auth.models import User


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
    class Meta:
        model = Folder
        fields = ['id', 'name', 'parent', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Associate with current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class NoteShareSerializer(serializers.ModelSerializer):
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)
    
    class Meta:
        model = NoteShare
        fields = ['id', 'shared_with', 'shared_with_username', 'can_edit', 'created_at']
        read_only_fields = ['created_at']


class NoteSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(write_only=True, required=False)
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    shares = NoteShareSerializer(many=True, read_only=True)
    is_shared = serializers.SerializerMethodField()
    version = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'updated_at', 
                 'tags', 'tag_names', 'folder', 'folder_name', 'shares', 
                 'is_shared', 'version']
        read_only_fields = ['created_at', 'updated_at', 'version']
    
    def get_is_shared(self, obj):
        return obj.shares.exists()
    
    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        note = Note.objects.create(**validated_data)
        
        # Create tags
        for tag_name in tag_names:
            tag, created = Tag.objects.get_or_create(
                name=tag_name,
                user=self.context['request'].user
            )
            note.tags.add(tag)
        
        return note
    
    def update(self, instance, validated_data):
        # Проверяем версию
        current_version = instance.version
        if 'version' in self.context.get('request').data:
            client_version = self.context['request'].data['version']
            if client_version != current_version:
                raise serializers.ValidationError({
                    'version': f'Note has been modified. Current version is {current_version}'
                })
        
        tag_names = validated_data.pop('tag_names', [])
        
        # Update the note
        note = super().update(instance, validated_data)
        
        # Update tags if provided
        if tag_names:
            note.tags.clear()
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