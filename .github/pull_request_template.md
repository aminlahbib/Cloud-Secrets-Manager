# Pull Request

## Description
<!-- Provide a clear and detailed description of your changes -->

## Type of Change
<!-- Mark with 'x' the type of change this PR introduces -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔧 Infrastructure/DevOps change
- [ ] ♻️ Refactoring (no functional changes)
- [ ] 🎨 UI/UX improvements
- [ ] ⚡ Performance improvements
- [ ] 🔒 Security fix

## Related Issues
<!-- Link related issues using keywords like "Fixes", "Closes", "Resolves" -->
Fixes #
Closes #
Related to #

## Changes Made
<!-- List the main changes introduced by this PR -->
- 
- 
- 

## Testing
<!-- Describe the tests you ran to verify your changes -->

### Test Configuration
- **Java Version:** 21
- **Maven Version:** 
- **Database:** 
- **Environment:** 

### Tests Performed
- [ ] Unit tests pass (`mvn test`)
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Security scan passed (Trivy)
- [ ] Docker build successful
- [ ] Deployment tested locally

### Test Evidence
<!-- Add logs, screenshots, or test results if applicable -->

## Deployment Notes
<!-- Any special considerations for deployment? -->
- [ ] Database migrations required
- [ ] Configuration changes needed
- [ ] Environment variables added/changed
- [ ] Secrets need to be updated
- [ ] Helm values updated
- [ ] Requires Terraform changes
- [ ] Documentation updated

## Rollback Plan
<!-- How can this change be rolled back if issues arise? -->

## Checklist
<!-- Ensure all items are completed before requesting review -->

### Code Quality
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have removed any debugging code or console logs
- [ ] My code generates no new warnings or errors
- [ ] I have handled errors appropriately

### Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested edge cases and error scenarios
- [ ] I have verified backward compatibility

### Documentation
- [ ] I have made corresponding changes to the documentation
- [ ] I have updated the README.md if needed
- [ ] I have added/updated code comments
- [ ] I have updated API documentation if applicable
- [ ] I have added entries to CHANGELOG (if applicable)

### Security
- [ ] I have reviewed my changes for security vulnerabilities
- [ ] I have not exposed any secrets or sensitive data
- [ ] I have validated all user inputs
- [ ] I have followed secure coding practices

### Dependencies
- [ ] Any dependent changes have been merged and published
- [ ] I have updated dependency versions if needed
- [ ] I have checked for vulnerable dependencies

## Performance Impact
<!-- Describe any performance implications -->
- [ ] No performance impact
- [ ] Performance improved
- [ ] Performance may be affected (explain below)

**Details:**

## Breaking Changes
<!-- If this is a breaking change, describe the impact and migration path -->
- [ ] No breaking changes
- [ ] Contains breaking changes (describe below)

**Migration Path:**

## Screenshots / Videos
<!-- Add screenshots or videos to help explain your changes, especially for UI changes -->

## Additional Notes
<!-- Any additional information that reviewers should know -->

## Reviewer Guidelines
<!-- Help reviewers understand what to focus on -->
**Please pay special attention to:**
- 
- 

**Areas that need extra review:**
- 
- 

---

## For Reviewers

### Review Checklist
- [ ] Code follows project conventions and best practices
- [ ] Changes are well-tested with appropriate coverage
- [ ] Documentation is clear and complete
- [ ] Security considerations have been addressed
- [ ] Performance implications are acceptable
- [ ] Breaking changes are properly documented
- [ ] PR title is clear and follows conventions

### Approval Criteria
- [ ] All required status checks pass
- [ ] Code review completed
- [ ] All conversations resolved
- [ ] Changes approved by code owners (if applicable)

---

**Note to reviewers:** Please ensure all CI/CD checks pass before approving. For production deployments, verify that staging deployment is successful.

