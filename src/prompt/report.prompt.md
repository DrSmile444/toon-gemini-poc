## Goal

Generate a human-friendly incident report from structured rows.

## Inputs

### User request

{{user_request}}

### Incident table

Use only the rows in the table.
{{data_block}}

## Output requirements

- Title
- Executive summary (3-5 bullets)
- Impact (who/what)
- Timeline (key moments)
- Root cause (if known)
- Mitigations performed
- Follow-ups (owners + due date suggestions)

## Constraints

- Do not fabricate incidents not present
- If something is unknown, mark it as unknown
