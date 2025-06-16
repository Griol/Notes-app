from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Tag(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tags')

    class Meta:
        unique_together = ['name', 'user']
        ordering = ['name']

    def __str__(self):
        return self.name


class Folder(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Note(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='notes')
    tags = models.ManyToManyField(Tag, blank=True, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class Flashcard(models.Model):
    question = models.TextField()
    answer = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcards')
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='flashcards')
    tags = models.ManyToManyField(Tag, blank=True, related_name='flashcards')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.question[:50]


class FlashcardStat(models.Model):
    RESULT_CHOICES = [
        ('know', 'Знаю'),
        ('repeat', 'Нужно повторить'),
        ('dont_know', 'Не знаю'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcard_stats')
    flashcard = models.ForeignKey(Flashcard, on_delete=models.CASCADE, related_name='stats')
    date = models.DateField(auto_now_add=True)
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class DailyFlashcardStat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_flashcard_stats')
    date = models.DateField()
    solved_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.solved_count}"


class NoteAttachment(models.Model):
    note = models.ForeignKey('Note', related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)


class NoteImage(models.Model):
    note = models.ForeignKey('Note', related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='note_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
