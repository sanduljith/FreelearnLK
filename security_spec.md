# Security Specification - StreamStudy LMS

## Data Invariants
- A Video cannot exist without a valid Course ID.
- Students can only view videos if they have an active Enrollment for that course.
- Only Admins can modify courses, videos, and enrollments.
- Users cannot change their own role (privilege escalation protection).

## The Dirty Dozen Payloads (Target: Access Denied)

1. **Role Escalation**: Student attempts to update their own profile to `role: 'admin'`.
2. **Orphaned Video**: Student attempts to create a video without a parent course.
3. **Identity Spoofing**: User A attempts to create a profile with `uid` of User B.
4. **Unauthorized Read**: Student attempts to `get` a video in a course they are NOT enrolled in.
5. **Admin Spoofing**: Student attempts to create a Course (requires `isAdmin`).
6. **Cross-Enrollment Deletion**: Student attempts to delete someone else's enrollment.
7. **Malicious ID**: Attempting to create a course with a 2MB string as ID.
8. **Shadow Field**: Adding `isVerified: true` to a course update (blocked by `hasOnly`).
9. **Creation Timestamp Spoofing**: Sending a manual `createdAt` string instead of `request.time`.
10. **Course Hijacking**: Admin B attempts to update Admin A's course (blocked by `instructorId` check).
11. **Bulk Scrape**: Student attempts to `list` all enrollments in the system.
12. **PII Leak**: Non-admin attempts to `get` another user's profile.

## Red Team Audit Results
- [x] Identity Spoofing blocked.
- [x] Privilege Escalation blocked.
- [x] Resource poisoning blocked by `isValidId` and size checks.
- [x] Relational integrity enforced by `hasEnrollment` check.
