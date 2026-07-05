# tarpon

## Project board automation

Project board: **https://github.com/users/hfleitas/projects/2**

This repository now has issue-to-project automation via:

- `.github/workflows/project-board-automation.yml`
- `.github/ISSUE_TEMPLATE/scenario-fix.yml`

### How it works

1. New and updated issues are automatically added to the project board.
2. Board **Status** is updated from issue state and labels:
   - `closed` -> `Done`
   - label `in-progress` or `doing` -> `In Progress`
   - otherwise -> `Todo`
3. Board **Scenario** is extracted from the issue's `### Scenario context` section (or `scenario:*` label).
4. Board **Fix Progress** is computed from markdown task checklist completion in the issue body.

### Required secret

Add a repository secret named `PROJECT_AUTOMATION_TOKEN` with scopes:

- `repo`
- `project`

The workflow falls back to `GITHUB_TOKEN`, but the explicit project-scoped token is recommended for reliable project updates.