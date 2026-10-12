# Phase 4: Question Bank & UI Implementation

## Overview
Building the complete question bank system with Chapter, Topic, and Question management including advanced search, filtering, and a professional UI.

## Goals
1. Implement Chapter and Topic CRUD operations
2. Build comprehensive Question CRUD with type-specific validation
3. Create advanced search and filtering UI
4. Implement real-time dashboard statistics
5. Add seed data for development

## Implementation Tasks

### Backend Tasks

#### 1. Chapter Routes & Controller
- [x] Chapter model (already created)
- [ ] Chapter controller (CRUD operations)
- [ ] Chapter routes with authentication
- [ ] Validation schemas
- [ ] Ownership enforcement

#### 2. Topic Routes & Controller
- [x] Topic model (already created)
- [ ] Topic controller (CRUD operations)
- [ ] Topic routes with authentication
- [ ] Validation schemas
- [ ] Ownership enforcement via subject

#### 3. Question Routes & Controller
- [x] Question model (already created)
- [ ] Question controller (CRUD operations)
- [ ] Question routes with authentication
- [ ] Advanced search/filter logic
- [ ] Duplicate detection using hash
- [ ] Pagination and sorting
- [ ] Validation for each question type

#### 4. Dashboard Statistics
- [ ] Subject count by owner
- [ ] Question count by subject/difficulty/type
- [ ] Recent activity
- [ ] AI generation usage (when implemented)

#### 5. Seed Data Script
- [ ] Sample subjects
- [ ] Sample chapters and topics
- [ ] Sample questions of all types
- [ ] Development user accounts

### Frontend Tasks

#### 1. UI Components
- [ ] Card component
- [ ] Badge component
- [ ] Select/Dropdown component
- [ ] Textarea component
- [ ] Dialog/Modal component
- [ ] Tabs component
- [ ] Skeleton loaders
- [ ] Empty state component

#### 2. Subjects Feature (Enhancement)
- [ ] Subjects list page
- [ ] Create/Edit subject form
- [ ] Subject detail view with chapters/topics

#### 3. Chapters Feature
- [ ] Chapters list (per subject)
- [ ] Create/Edit chapter form
- [ ] Reordering chapters
- [ ] Chapter detail with topics

#### 4. Topics Feature
- [ ] Topics list (per chapter)
- [ ] Create/Edit topic form
- [ ] Reordering topics
- [ ] Topic detail with questions

#### 5. Question Bank Feature
- [ ] Questions list with filters
- [ ] Advanced search UI
- [ ] Filter by: subject, chapter, topic, type, difficulty, marks
- [ ] Sort by: date, difficulty, marks
- [ ] Create question form (type-specific)
- [ ] Edit question form
- [ ] Question preview/detail view
- [ ] Delete with confirmation
- [ ] Bulk operations (future)

#### 6. Dashboard Enhancement
- [ ] Real statistics cards
- [ ] Recent questions
- [ ] Subject breakdown
- [ ] Quick actions

#### 7. Navigation Enhancement
- [ ] Breadcrumbs
- [ ] Active state indicators
- [ ] Nested navigation for subjects

## File Structure

```
server/src/
├── controllers/
│   ├── chapter.controller.ts
│   ├── topic.controller.ts
│   └── question.controller.ts
├── routes/
│   ├── chapter.routes.ts
│   ├── topic.routes.ts
│   └── question.routes.ts
├── validators/
│   ├── chapter.validator.ts
│   ├── topic.validator.ts
│   └── question.validator.ts
└── services/
    ├── dashboard.service.ts
    └── seed.service.ts

client/src/
├── components/
│   └── ui/
│       ├── card.tsx
│       ├── badge.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       └── dialog.tsx
├── features/
│   ├── subjects/
│   │   ├── SubjectsList.tsx
│   │   ├── SubjectForm.tsx
│   │   └── SubjectDetail.tsx
│   ├── chapters/
│   │   ├── ChaptersList.tsx
│   │   └── ChapterForm.tsx
│   ├── topics/
│   │   ├── TopicsList.tsx
│   │   └── TopicForm.tsx
│   ├── questions/
│   │   ├── QuestionsList.tsx
│   │   ├── QuestionForm.tsx
│   │   ├── QuestionFilters.tsx
│   │   ├── QuestionPreview.tsx
│   │   └── components/
│   │       ├── MCQEditor.tsx
│   │       ├── TrueFalseEditor.tsx
│   │       └── DescriptiveEditor.tsx
│   └── dashboard/
│       ├── Dashboard.tsx
│       ├── StatisticsCards.tsx
│       └── RecentActivity.tsx
└── types/
    ├── subject.ts
    ├── chapter.ts
    ├── topic.ts
    └── question.ts
```

## Implementation Order

1. **Backend Foundation** (30 min)
   - Chapter controller & routes
   - Topic controller & routes
   - Basic CRUD for both

2. **Question Backend** (45 min)
   - Question controller with all types
   - Advanced search/filter logic
   - Validation for each type
   - Duplicate detection

3. **Dashboard Statistics** (15 min)
   - Service to fetch stats
   - Endpoint for dashboard data

4. **UI Components** (30 min)
   - Core shadcn components
   - Empty states
   - Loading skeletons

5. **Subject Management UI** (30 min)
   - List view
   - Create/edit forms
   - Detail view

6. **Chapter & Topic UI** (30 min)
   - Nested lists
   - Create/edit forms
   - Reordering

7. **Question Bank UI** (60 min)
   - List with filters
   - Search functionality
   - Type-specific forms
   - Preview/detail views

8. **Dashboard Enhancement** (20 min)
   - Real statistics
   - Recent activity
   - Quick actions

9. **Seed Data** (15 min)
   - Sample data script
   - Development setup

**Total Estimated Time: 4-5 hours**

## Starting Implementation Now...
