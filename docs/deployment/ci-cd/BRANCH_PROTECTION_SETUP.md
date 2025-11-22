# Branch Protection and PR Quality Gates Setup

This guide explains how to configure branch protection rules and quality gates for the Cloud Secrets Manager project to ensure code quality and security.

---

## Overview

Branch protection rules enforce code review requirements, status checks, and other policies before code can be merged into protected branches.

---

## Branch Protection Rules

### Protected Branches

The following branches should have protection rules enabled:

1. **`main`** - Production-ready code
2. **`develop`** - Development integration branch

---

## Setting Up Branch Protection

### Via GitHub Web UI

1. **Navigate to Settings**
   - Go to your GitHub repository
   - Click **Settings**
   - In the left sidebar, click **Branches**

2. **Add Branch Protection Rule**
   - Click **Add branch protection rule**
   - Enter the branch name pattern (e.g., `main` or `develop`)

3. **Configure Protection Rules**

#### For `main` Branch

Configure the following settings:

**Protect matching branches:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1** (at least one reviewer - can be yourself for solo dev)
  - ⬜ Dismiss stale pull request approvals when new commits are pushed (optional for solo dev)
  - ⬜ Require review from Code Owners (not needed for solo dev)
  - ⬜ Restrict who can dismiss pull request reviews (not applicable for solo dev)
  - ⬜ Allow specified actors to bypass required pull requests (not needed for solo dev)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `Build and Test`
    - `Trivy Code Security Scan`
    - `Build, Scan and Push Docker Images`
    - `Deploy to Staging Environment` (optional, if staging is required before prod)

- ✅ **Require conversation resolution before merging**
  - All PR comments must be resolved

- ✅ **Require signed commits** (recommended for security)
  - Commits must be signed with GPG/SSH keys

- ✅ **Require linear history** (optional, enforces rebase/squash merges)
  - Prevents merge commits, keeps history clean

- ✅ **Include administrators**
  - Enforce rules for repository administrators

- ⬜ **Allow force pushes** - Keep disabled
  - Force pushes are dangerous on main branch

- ⬜ **Allow deletions** - Keep disabled
  - Prevent accidental branch deletion

**Rules applied to everyone including administrators:**
- ✅ **Restrict pushes that create matching branches**
  - Only specific users/teams can create branches matching this pattern

#### For `develop` Branch

Configure similar settings with slightly relaxed requirements:

**Protect matching branches:**
- ⬜ **Require a pull request before merging** (optional for solo dev - can push directly to develop)
  - ⬜ Require approvals: **0-1** (optional for solo dev)
  - ⬜ Dismiss stale pull request approvals when new commits are pushed
  - ⬜ Require review from Code Owners (not needed for solo dev)
  
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `Build and Test`
    - `Trivy Code Security Scan`

- ✅ **Require conversation resolution before merging**

- ⬜ **Require signed commits** (optional for develop)

- ⬜ **Require linear history** (optional)

- ⬜ **Include administrators** (optional, allows admins to bypass)

- ⬜ **Allow force pushes** - Keep disabled

- ⬜ **Allow deletions** - Keep disabled

---

## Code Owners Configuration

### Solo Developer Note

**CODEOWNERS is not required for solo developers.** This file is designed for teams to automatically assign reviewers. As a solo developer:
- You don't need the `.github/CODEOWNERS` file
- You can review and approve your own PRs (if you enable PRs)
- Focus on the automated CI checks instead of manual reviews

If you expand to a team in the future, you can add CODEOWNERS back.

---

## GitHub Environments Setup

Configure deployment environments with protection rules:

### 1. Development Environment

**Navigate to:** Repository Settings → Environments → New environment

**Environment name:** `dev`

**Protection rules:**
- ⬜ Required reviewers: None (auto-deploy on develop branch)
- ✅ Wait timer: 0 minutes
- ✅ Deployment branches: Only `develop` branch

### 2. Staging Environment

**Environment name:** `staging`

**Protection rules:**
- ⬜ Required reviewers: 0-1 reviewer (optional for solo dev - you can auto-deploy or require self-approval)
- ✅ Wait timer: 0 minutes (or 2-5 minutes if you want a pause to review)
- ✅ Deployment branches: Only `main` branch

**Environment secrets:**
- Configure staging-specific secrets if needed

### 3. Production Environment

**Environment name:** `production`

**Protection rules:**
- ✅ Required reviewers: 1 reviewer (yourself - manual approval gate as a safety check)
- ✅ Wait timer: 5-10 minutes (allows time for verification and cancellation)
- ✅ Deployment branches: Only `main` branch
- ⬜ Prevent self-review (not applicable for solo dev)

**Environment secrets:**
- Configure production-specific secrets

---

## Status Checks Configuration

### Required Status Checks

The following CI jobs must pass before merging:

#### For All Branches
1. **Build and Test** - Builds both services and runs all tests
2. **Trivy Code Security Scan** - Scans code for vulnerabilities

#### For Protected Branches (main/develop)
3. **Build, Scan and Push Docker Images** - Builds, scans, and pushes images
4. **Deploy to Dev Environment** (for develop branch)
5. **Deploy to Staging Environment** (for main branch)

### Configuring Status Checks

1. **In Branch Protection Rules**
   - Enable "Require status checks to pass before merging"
   - Search for and select each required job name
   - Enable "Require branches to be up to date before merging"

2. **Verify Status Checks**
   - Create a test PR
   - Verify all required checks appear and run
   - Verify PR is blocked until checks pass

---

## Pull Request Templates

Create `.github/pull_request_template.md` to ensure consistent PR descriptions:

```markdown
## Description
<!-- Describe your changes in detail -->

## Type of Change
<!-- Mark with 'x' -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Infrastructure/DevOps change

## Related Issues
<!-- Link related issues here -->
Fixes #

## Testing
<!-- Describe the tests you ran and how to reproduce -->
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

## Additional Notes
<!-- Any additional information -->
```

---

## Quality Gates Summary

### Merge to `develop` (Solo Dev)
1. ✅ Build and Test pass
2. ✅ Security scan passes
3. ⬜ PR approval (optional - can push directly)

### Merge to `main` (Solo Dev)
1. ✅ Build and Test pass
2. ✅ Security scan passes
3. ✅ Docker images built and scanned successfully
4. ✅ Branch is up to date
5. ⬜ PR approval (optional - automated checks are the main gate)

### Deploy to Staging (Solo Dev)
1. ✅ All main branch requirements met
2. ⬜ Manual approval (optional - can be automated or require self-approval)
3. ✅ Automated smoke tests pass

### Deploy to Production (Solo Dev)
1. ✅ Staging deployment successful
2. ✅ Manual self-approval (safety checkpoint)
3. ✅ 5-10 minute wait timer (gives you time to cancel if needed)
4. ✅ Smoke tests pass

---

## Enforcement

### Direct Push Prevention

With branch protection enabled:
- ❌ Direct commits to `main` or `develop` are blocked
- ❌ Force pushes are disabled
- ❌ Branch deletion is disabled
- ✅ All changes must go through pull requests

### Emergency Procedures

For critical production hotfixes:

1. **Option 1: Emergency Branch Protection Bypass**
   - Designated administrators can be allowed to bypass protection
   - Must be documented and reviewed afterward

2. **Option 2: Fast-Track PR Process** (Recommended)
   - Create hotfix branch from main
   - Create PR with `[HOTFIX]` prefix
   - Get expedited reviews from on-call team
   - Merge after minimum required approvals
   - Deploy with manual approval

---

## Verification Steps

### Test Branch Protection

```bash
# Try to push directly to main (should fail)
git checkout main
git commit --allow-empty -m "Test commit"
git push origin main
# Expected: Error - protected branch

# Create a PR (correct way)
git checkout -b feature/test-branch-protection
git commit --allow-empty -m "Test PR"
git push origin feature/test-branch-protection
# Create PR via GitHub UI - should require approvals
```

### Test Code Owners

```bash
# Create PR modifying infrastructure
git checkout -b test/codeowners
echo "# Test" >> infrastructure/terraform/README.md
git add infrastructure/terraform/README.md
git commit -m "Test CODEOWNERS"
git push origin test/codeowners
# Create PR - should auto-request @devops-team and @platform-team
```

### Test Required Status Checks

```bash
# Create PR with failing tests
git checkout -b test/failing-checks
# Make a change that breaks tests
git push origin test/failing-checks
# Create PR - should be blocked from merging until tests pass
```

---

## Monitoring and Compliance

### Regular Audits

Conduct quarterly reviews:
- ✅ Verify branch protection rules are still in effect
- ✅ Review and update Code Owners
- ✅ Check that required status checks are running
- ✅ Audit bypass events (if any)
- ✅ Review team memberships

### Metrics to Track

- Number of PRs requiring multiple reviews
- Time from PR creation to merge
- Number of failed status checks
- Code Owner review participation
- Emergency bypasses (should be rare)

---

## Troubleshooting

### Issue: Status check not showing up

**Solution:**
- Ensure the workflow job name exactly matches the required check name
- Re-run the workflow to register the check
- Wait a few minutes and refresh the PR

### Issue: Unable to merge despite passing checks

**Possible causes:**
- Branch is not up to date - rebase or merge main
- Not enough approvals - request additional reviews
- Conversations not resolved - resolve all comments
- Required Code Owner approval missing - request from code owner

### Issue: Emergency deployment needed but blocked

**Solution:**
- Contact repository administrators
- Follow emergency procedures documented above
- Document the incident for post-mortem review

---

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Code Owners Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)

---

## Summary

✅ **Configured Protection for:**
- Main branch (production)
- Develop branch (development)
- Deployment environments (dev, staging, production)

✅ **Quality Gates in Place:**
- Required reviews
- Automated testing
- Security scanning
- Code owner approval
- Deployment approvals

✅ **Best Practices Enforced:**
- No direct pushes to protected branches
- All changes via pull requests
- Signed commits (optional)
- Linear history (optional)

---

**Last Updated:** November 22, 2025

