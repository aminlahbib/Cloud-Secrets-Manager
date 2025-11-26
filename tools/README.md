# Tools & Utilities

This directory contains development tools, code generators, and utility scripts for Cloud Secrets Manager.

## Directory Structure

```
tools/
├── code-generators/   # Code generation tools and scripts
└── utilities/         # Utility scripts and helper tools
```

## Components

### 🔧 `code-generators/`
Code generation tools and scripts:
- API client generators
- DTO generators
- Database schema generators
- Configuration generators

**Purpose:** Automate repetitive code generation tasks and maintain consistency across the codebase.

### 🛠️ `utilities/`
Utility scripts and helper tools:
- Development helpers
- Data migration tools
- Configuration validators
- Format converters

**Purpose:** Provide helpful utilities for development, maintenance, and operations.

## Usage

### Code Generators

Code generators help automate the creation of:
- **API Clients** - Generate client libraries from OpenAPI specs
- **DTOs** - Data Transfer Objects from database schemas
- **Mappers** - MapStruct mappers between entities and DTOs
- **Configurations** - Kubernetes manifests from templates

**Example:**
```bash
# Generate API client from OpenAPI spec
./tools/code-generators/generate-api-client.sh
```

### Utilities

Utility scripts provide:
- **Data Migration** - Database migration helpers
- **Config Validation** - Validate configuration files
- **Format Conversion** - Convert between formats (YAML, JSON, etc.)
- **Development Helpers** - Common development tasks

**Example:**
```bash
# Validate Kubernetes manifests
./tools/utilities/validate-k8s-manifests.sh
```

## Adding New Tools

### Code Generators
1. Create generator script in `tools/code-generators/`
2. Document usage in this README
3. Add to CI/CD if needed

### Utilities
1. Create utility script in `tools/utilities/`
2. Make executable: `chmod +x tools/utilities/your-script.sh`
3. Document usage and examples

## Best Practices

### ✅ Do
- Keep tools focused and single-purpose
- Document usage and examples
- Make scripts executable
- Add error handling
- Use consistent naming conventions

### ❌ Don't
- Commit generated code (use .gitignore)
- Hardcode paths (use relative paths)
- Skip error handling
- Create overly complex tools

## Integration with CI/CD

Some tools may be integrated into CI/CD pipelines:
- **Code Generation** - Run before builds
- **Validation** - Run in pre-commit hooks
- **Formatting** - Run in formatting checks

## Maintenance

### Updating Tools
- Keep tools up-to-date with dependencies
- Test tools after updates
- Update documentation when tools change

### Deprecating Tools
- Mark deprecated tools clearly
- Provide migration path
- Remove after deprecation period

## Related Documentation

- **[Scripts README](../scripts/README.md)** - Deployment and operations scripts
- **[Development Guide](../../docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md)** - Local development setup

## Contributing

When adding new tools:
1. Create tool in appropriate subdirectory
2. Add usage documentation
3. Test thoroughly
4. Update this README
5. Consider adding to CI/CD if appropriate

---

**Last Updated:** December 2024

