# Notes App

A comprehensive note-taking application with features for organizing notes into folders, tagging, and searching.

## Features

- User authentication with JWT
- Create, read, update, and delete notes
- Organize notes into folders (with nested folders support)
- Tag notes for easy categorization
- Filter and search notes by various criteria
- Sidebar with quick access to folders and recent notes
- Folder structure view

## Tech Stack

### Backend
- Django
- Django Rest Framework
- Django Rest Framework SimpleJWT for authentication
- Django Filter for advanced filtering

### Frontend (planned)
- React 
- React Router
- Axios for API communication
- Material-UI or Ant Design for UI components

## API Endpoints

### Authentication
- Register: POST /api/auth/register/
- Login: POST /api/auth/login/
- Refresh Token: POST /api/auth/refresh/
- User Profile: GET/PUT /api/auth/profile/

### Notes
- List/Create: GET/POST /api/notes/
- Retrieve/Update/Delete: GET/PUT/DELETE /api/notes/{id}/
- Filter parameters: search, tags, folder, created_after, created_before

### Folders
- List/Create: GET/POST /api/folders/
- Retrieve/Update/Delete: GET/PUT/DELETE /api/folders/{id}/
- Filter by parent: GET /api/folders/?parent=1 or parent=null for top-level

### Tags
- List/Create: GET/POST /api/tags/
- Retrieve/Update/Delete: GET/PUT/DELETE /api/tags/{id}/

### Special Endpoints
- Folder Structure: GET /api/structure/
- Sidebar Data: GET /api/sidebar/

## Setup and Installation

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Apply migrations: `python manage.py migrate`
4. Create a superuser: `python manage.py createsuperuser`
5. Run the development server: `python manage.py runserver`

## Development

The project follows Django's standard app structure:
- `notes_api`: Main app for notes, folders, and tags
- `accounts`: User authentication and profiles 