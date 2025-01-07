# Renewly Task Management TODO

## Pending Features

### Backend

- [X] Integrate with Supabase
- [X] Implement Authentication

### Auth

- [X] Register and Verify with email
- [] Add more login providers (e.g. Google)
- [X] Password reset functionality
- [X] Clean up Auth file structure
- [X] Use server actions

### Task Management

- [X] Add correct fields for New Task
- [X] Create recurring tasks
- [X] Implement task reordering within the same column
- [ ] Add task filtering by assignee
- [ ] Add task search by description
- [X] Implement task deletion functionality
- [ ] Add task duplication feature
- [ ] Add batch actions for multiple tasks

### Team Management

- [ ] Add team member roles and permissions
- [ ] Implement team member invitation system
- [ ] Add team member activity logs
- [ ] Add team member availability status

### UI/UX Improvements

- [X] Add loading states for async operations
- [X] Implement error boundaries
- [X] Add toast notifications for actions
- [ ] Improve mobile responsiveness
- [X] Add dark/light theme toggle animations

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
