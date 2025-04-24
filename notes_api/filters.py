import django_filters
from django.db.models import Q
from .models import Note, Tag

class NoteFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    tags = django_filters.CharFilter(method='filter_tags')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Note
        fields = ['folder', 'search', 'tags', 'created_after', 'created_before']

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(title__icontains=value) | Q(content__icontains=value)
        )

    def filter_tags(self, queryset, name, value):
        if not value:
            return queryset
        # Split comma-separated tag names
        tag_names = [tag.strip() for tag in value.split(',')]
        # Filter notes that have all the specified tags
        return queryset.filter(tags__name__in=tag_names).distinct() 