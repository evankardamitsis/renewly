# Renewly Task Management TODO

## Pending Features

### Backend

- [x] Integrate with Supabase
- [x] Implement Authentication

### Auth

- [x] Register and Verify with email
- [] Add more login providers (e.g. Google)
- [x] Password reset functionality
- [x] Clean up Auth file structure
- [x] Use server actions

### Task Management

- [x] Add correct fields for New Task
- [x] Create recurring tasks
- [x] Implement task reordering within the same column
- [ ] Add task filtering by assignee
- [ ] Add task search by description
- [x] Implement task deletion functionality
- [ ] Add task duplication feature
- [ ] Add batch actions for multiple tasks

### Sounds & Notifications

- [] Create different sounds for specific notifications (create, overdue, etc)

### Team Management

- [ ] Add team member roles and permissions
- [ ] Implement team member invitation system
- [ ] Add team member activity logs
- [ ] Add team member availability status

### UI/UX Improvements

- [x] Add loading states for async operations
- [x] Implement error boundaries
- [x] Add toast notifications for actions
- [ ] Improve mobile responsiveness
- [x] Add dark/light theme toggle animations

## Known Bugs

### Task Board

- [ ] Dragging animation sometimes stutters on larger tasks
- [ ] Task progress bar doesn't update immediately after status change
- [ ] Task modal doesn't reset form on close

### Performance

- [ ] Optimize re-renders in TaskBoard component
- [ ] Reduce bundle size by code splitting
- [ ] Improve initial load time

### Accessibility

- [ ] Add keyboard navigation for task cards
- [ ] Improve screen reader compatibility
- [ ] Add ARIA labels for interactive elements
