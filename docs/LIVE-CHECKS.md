# Checks before real enrolment

Use fictional people and non-sensitive test files. Record date, browser/device, tester and result for each check. This list has not yet been executed against your project.

1. Confirm both GitHub workflows succeed; the deployed function has execute permission for signed-in users only. Confirm hfprofiles, hfrecords and hfdocuments have no direct browser permissions.
2. Confirm owner sign-in works only with the chosen password. Verify the owner's email through the app. Confirm an unknown email cannot obtain administrator access.
3. Create two academies, a tutor per academy, two students in different academies, one IQA and one employer. Use controlled test inboxes. Confirm temporary-password change and email verification are enforced. Check recovery in a separate browser.
4. Sign in from two devices. Create evidence on one device; confirm an authorized tutor sees it on the other. Confirm a different student, unassigned tutor, employer and anonymous browser cannot retrieve the record or its file, including by substituting IDs in requests.
5. A tutor must not create accounts, alter roles, approve admin reviews or modify another academy's records. A student must not assess their own work. An assessor must not IQA their own decision.
6. Upload a small valid PDF, JPG and PNG. Reject renamed executables and oversized files. Confirm private bucket URLs alone do not grant access. Confirm antivirus/encryption settings actually apply under the plan.
7. Submit a practical record, assess it, and sample it as the IQA. Confirm original signed content cannot be overwritten through the public API. Submit further work as a new record where necessary.
8. Publish a centre-approved checklist and sign off a unit. Confirm sign-off is blocked without the checklist or achieved assessment. Check optional NVQ units and centre qualification requirements manually.
9. Record attendance, exam results and learning hours. Create a review and inspect its attendance snapshot. Student and assigned employer add their own feedback and signatures. Confirm approval is blocked until required signatures exist. Check a returned review leads to a new review.
10. Record photo permission refusal; confirm enrolment is still usable. Record changed choices and check both dated records remain visible to the student and admin. Approve the actual consent/guardian policy before using with 16–17-year-olds.
11. Disable a test account and confirm existing sessions cannot access records. Change a tutor's assignment and repeat cross-academy checks.
12. Open support before and after login. Confirm the button addresses the user's email application correctly and does not claim a message was sent. Check the named contacts and response arrangements with the centre.
13. Check Android, iPhone and Chromebook layouts, keyboard access, verification/reset redirects, and sign-out on shared devices. No private student content should remain visible after successful sign-out.
14. Establish backups including database rows and actual evidence bytes, plus a tested restore procedure. Confirm plan quotas/inactivity rules and the centre's privacy/retention arrangements.

Release decision: __________________ Date: __________________
Remaining issues and owner: __________________________________
