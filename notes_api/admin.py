from django.contrib import admin
from .models import Tag, Folder, Note, Flashcard, FlashcardStat, DailyFlashcardStat

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

@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ('user', 'question', 'answer', 'folder', 'created_at', 'updated_at')
    list_filter = ('user', 'folder', 'created_at', 'updated_at', 'tags')
    search_fields = ('question', 'user')
    raw_id_fields = ('folder',)
    filter_horizontal = ('tags',)


@admin.register(FlashcardStat)
class FlashcardStatAdmin(admin.ModelAdmin):
    list_display = ('user', 'flashcard', 'date', 'result', 'created_at')
    list_filter = ('user', 'flashcard', 'date', 'result')
    search_fields = ('date', 'user')
    raw_id_fields = ('flashcard',)


@admin.register(DailyFlashcardStat)
class DailyFlashcardStatAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'solved_count')
    list_filter = ('user', 'date', 'solved_count')

