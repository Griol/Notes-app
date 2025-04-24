from django.contrib import admin
from .models import Tag, Folder, Note

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    list_filter = ('user',)
    search_fields = ('name',)

@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'parent', 'created_at', 'updated_at')
    list_filter = ('user', 'created_at', 'updated_at')
    search_fields = ('name',)
    raw_id_fields = ('parent',)

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'folder', 'created_at', 'updated_at')
    list_filter = ('user', 'folder', 'created_at', 'updated_at', 'tags')
    search_fields = ('title', 'content')
    raw_id_fields = ('folder',)
    filter_horizontal = ('tags',)
