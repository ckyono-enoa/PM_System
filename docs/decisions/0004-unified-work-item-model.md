# 0004. One items table for tickets, projects, and tasks

Status: Accepted
Date: 2026-10-29

## Context

Tickets, projects, and tasks share almost everything: a number, title, description, department, priority, assignees, watchers, tags, due dates, comments, attachments, a timeline, notifications, and visibility rules. A ticket must be convertible into a project without losing its number or history.

## Decision

Store all three in one `items` table with a `kind` column (`ticket`, `project`, `task`). Shared features (assignees, watchers, tags, comments, attachments, restricted access, notifications, audit) attach to `items`, so they work the same for every kind.

Kind-specific rules are enforced in the service layer and by database constraints:

- Tasks must have a `parent_id` pointing to a project. Tickets and projects must not have one.
- Tickets use ticket statuses. Projects use project statuses. A task's status comes from its board column.
- Converting a ticket changes its `kind` to `project` and records `converted_at` and `converted_by`. It cannot be converted back.

## Consequences

- Conversion is a single update, and the item keeps its number, comments, attachments, and history automatically.
- Comments, attachments, notifications, and visibility are written once.
- Lists like "My Work" can include tickets and tasks in one query.
- Some columns only apply to some kinds (for example `parent_id`, `board_column_id`, `start_date`). This is acceptable, and the constraints and service rules keep the data consistent.
- Code must always consider `kind` when applying status rules. Status logic lives in one service function per kind.

## Alternatives considered

- Separate `tickets`, `projects`, and `tasks` tables: cleaner columns, but every shared feature would need three versions or a polymorphic link, and conversion would mean copying rows and moving every related record.
- A project table linked to an original ticket (ticket stays a ticket): keeps tables pure, but splits history across two records and confuses the requester about which one to follow.
