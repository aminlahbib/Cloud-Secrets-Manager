# GitHub Security Tab - How It Works 

This document explains what makes the Security tab active in your GitHub repository and how to manage it.

---

## **What Makes the Security Tab Active?**

The Security tab in GitHub becomes active when **any** of these security features are enabled or detect issues:

### **1. Secret Scanning (Automatic)**  **ACTIVE IN YOUR REPO**

**What it is:**
- GitHub automatically scans all public repositories for exposed secrets
- Detects API keys, tokens, passwords, and other sensitive credentials
- Works automatically - no setup required for public repos

**What happened in your case:**
- GitHub detected your Google API key in `postman/get-token.js` and `postman/get-id-token.html`
- This triggered the Security tab to show alerts
- You received an email notification from Google about the leaked key

**How it works:**
```
GitHub scans your code
    
Finds patterns that look like secrets (API keys, tokens, etc.)
    
Matches against known secret formats (Google, AWS, etc.)
    
Creates a security alert
    
Security tab becomes active
```

---

### **2. Security Scanning in CI/CD**  **ACTIVE IN YOUR REPO**

**What it is:**
- Your `.github/workflows/ci-cd.yml` includes a `security-scan` job
- Uses **Trivy** to scan for vulnerabilities
- Uploads results to GitHub Security tab

**Your configuration:**
```yaml
security-scan:
  name: Security Scan
  runs-on: ubuntu-latest
  steps:
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy results to GitHub Security
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: 'trivy-results.sarif'
```

**What it does:**
- Scans your codebase for known vulnerabilities
- Checks dependencies for security issues
- Reports findings to the Security tab

---

### **3. Dependabot (Optional - Not Currently Enabled)**

**What it is:**
- Automatically checks your dependencies for vulnerabilities
- Creates pull requests to update vulnerable packages
- Can be enabled in repository settings

**How to enable:**
1. Go to your repository on GitHub
2. Click **Settings**  **Code security and analysis**
3. Enable **"Dependabot alerts"**
4. Enable **"Dependabot security updates"**

---

### **4. Code Scanning (Optional - Not Currently Enabled)**

**What it is:**
- Analyzes your code for security vulnerabilities
- Uses CodeQL or other scanning tools
- Can be enabled in repository settings

---

## **What You're Seeing in the Security Tab**

### **Current Alerts:**

1. **Secret Scanning Alert** 
   - **Type**: Exposed Google API Key
   - **Location**: `postman/get-token.js`, `postman/get-id-token.html`
   - **Status**: Should be resolved (you removed the key and regenerated it)

2. **Trivy Scan Results** (from CI/CD)
   - Vulnerability reports from your security-scan job
   - Dependency vulnerabilities
   - Code security issues

---

## **How to Manage Security Alerts**

### **View Security Alerts:**

1. Go to your repository on GitHub
2. Click the **Security** tab
3. You'll see:
   - **Secret scanning** alerts
   - **Dependabot** alerts (if enabled)
   - **Code scanning** alerts (if enabled)

### **Resolve Secret Scanning Alerts:**

1. **If the secret is still in your code:**
   - Remove the secret from the file
   - Regenerate the secret (if it's an API key/token)
   - Commit the changes
   - Mark the alert as resolved

2. **If the secret was already removed:**
   - The alert should auto-resolve after GitHub re-scans
   - Or manually mark it as resolved

3. **If it's a false positive:**
   - Mark it as a false positive
   - GitHub will learn from this

### **Clean Up Git History (If Secret Was Committed):**

If you committed a secret and then removed it, the secret is still in Git history:

```bash
# Option 1: Use git-filter-repo (recommended)
git filter-repo --path postman/get-token.js --invert-paths
git filter-repo --path postman/get-id-token.html --invert-paths

# Option 2: Use BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
bfg --replace-text passwords.txt

# Then force push ( WARNING: This rewrites history)
git push origin --force --all
```

** Important:** Force pushing rewrites history. Coordinate with your team first!

---

## **Enable Additional Security Features**

### **Enable Dependabot:**

1. Go to your repository
2. Click **Settings**  **Code security and analysis**
3. Enable:
   - **Dependabot alerts**
   - **Dependabot security updates**

This will:
- Automatically check your dependencies for vulnerabilities
- Create PRs to update vulnerable packages
- Show alerts in the Security tab

### **Enable Code Scanning:**

1. Go to **Settings**  **Code security and analysis**
2. Enable **"Code scanning"**
3. Choose a scanning tool (CodeQL is recommended)
4. Configure scanning rules

---

## **Best Practices**

### **Prevent Secret Leaks:**

1. **Use `.gitignore`**  (You already do this)
   - Add files with secrets to `.gitignore`
   - Example: `service-account.json`, `*.key`, `.env`

2. **Use Environment Variables**
   - Store secrets in environment variables
   - Never commit them to Git

3. **Use GitHub Secrets** (for CI/CD)
   - Store secrets in GitHub repository secrets
   - Access them in workflows: `${{ secrets.SECRET_NAME }}`

4. **Use Secret Management Tools**
   - HashiCorp Vault
   - AWS Secrets Manager
   - Google Secret Manager

5. **Pre-commit Hooks**
   - Use tools like `git-secrets` or `truffleHog`
   - Scan before committing

### **Your Current Setup:**

 **Good practices you're already using:**
- `.gitignore` includes `service-account.json`
- `.gitignore` includes `postman/firebase-config.js`
- Using environment variables for sensitive data
- Security scanning in CI/CD pipeline

 **What happened:**
- Files with API keys were committed before being added to `.gitignore`
- GitHub's secret scanning detected them
- You've now removed the keys and regenerated them

---

## **Check Your Security Status**

### **View Security Overview:**

1. Go to your repository
2. Click **Security** tab
3. You'll see:
   - **Security overview** - Summary of all security issues
   - **Secret scanning** - Exposed secrets
   - **Dependabot** - Dependency vulnerabilities
   - **Code scanning** - Code security issues

### **Check Security Settings:**

1. Go to **Settings**  **Code security and analysis**
2. Review enabled features:
   - Dependency graph (usually enabled by default)
   - Dependabot alerts (enable this!)
   - Dependabot security updates (enable this!)
   - Secret scanning (automatic for public repos)
   - Code scanning (optional, but recommended)

---

## **What to Do About Current Alerts**

### **For the Google API Key Alert:**

1. **Verify the key is removed:**
   ```bash
   # Check if the old key still exists in your code
   grep -r "AIzaSyBGjCJ8qOiucpMQr9lTwyccKpLnjyD_YDA" .
   # Should return nothing
   ```

2. **Verify the new key is not committed:**
   ```bash
   # Check if the new key is in Git
   git log --all --full-history -- "postman/get-token.js"
   git log --all --full-history -- "postman/get-id-token.html"
   ```

3. **Mark alert as resolved:**
   - Go to Security tab  Secret scanning
   - Find the alert
   - Click "Resolve" or "Dismiss"

4. **If the key is in Git history:**
   - Consider cleaning Git history (see above)
   - Or just regenerate the key and accept the risk

---

## **Additional Resources**

- **GitHub Secret Scanning**: https://docs.github.com/en/code-security/secret-scanning
- **Dependabot**: https://docs.github.com/en/code-security/dependabot
- **Code Scanning**: https://docs.github.com/en/code-security/code-scanning
- **GitHub Security Best Practices**: https://docs.github.com/en/code-security

---

## **Summary**

**What activated your Security tab:**
1. **Secret scanning** - Detected your exposed Google API key
2. **Security scanning in CI/CD** - Your Trivy scan job

**What you should do:**
1. Verify secrets are removed from code (done)
2. Regenerate exposed secrets (done)
3. Mark alerts as resolved in Security tab
4. Consider enabling Dependabot for dependency scanning
5. Consider cleaning Git history if secrets were committed

**Your security setup is good!** You're already:
- Using `.gitignore` properly
- Using environment variables
- Running security scans in CI/CD
- Following best practices

The Security tab is active because GitHub is protecting you by detecting issues. This is a **good thing**! 

---

**Last Updated:** November 21, 2025

