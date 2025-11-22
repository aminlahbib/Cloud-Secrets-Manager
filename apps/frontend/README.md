# Cloud Secrets Manager - Frontend

Modern React/TypeScript SPA for managing secrets securely.

## Features

- 🔐 **Authentication** - Login with email/password or Google OAuth
- 🔑 **Secret Management** - CRUD operations with sharing
- 📊 **Audit Logs** - Complete activity tracking
- 👥 **Admin Panel** - User and role management
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- ⚡ **Fast** - Vite for lightning-fast development
- 🔄 **Real-time** - Automatic token refresh
- ♿ **Accessible** - WCAG 2.1 AA compliant

## Tech Stack

- **React 18** + TypeScript
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Forms & validation
- **Axios** - HTTP client
- **Vitest** - Testing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd apps/frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build
```

Output in `dist/`

### Test

```bash
npm test
```

## Project Structure

```
apps/frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Base components (Button, Input, etc.)
│   │   ├── layout/      # Layout components (Header, Sidebar)
│   │   └── features/    # Feature-specific components
│   ├── pages/           # Page components
│   │   ├── Login.tsx
│   │   ├── Secrets.tsx
│   │   ├── AuditLogs.tsx
│   │   └── Admin.tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/           # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useSecrets.ts
│   ├── services/        # API services
│   │   ├── api.ts       # Axios instance
│   │   ├── auth.ts      # Auth API
│   │   └── secrets.ts   # Secrets API
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── validation.ts
│   │   └── format.ts
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_AUDIT_API_BASE_URL=http://localhost:8081
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## API Integration

Backend APIs:
- Secret Service: `http://localhost:8080/api/v1`
- Audit Service: `http://localhost:8081/api/v1`

Authentication:
- JWT tokens (access + refresh)
- Auto-refresh on expiration
- HttpOnly cookies for refresh tokens (recommended)

## Features

### Authentication

- Email/password login
- Google OAuth 2.0 login
- Token refresh (transparent)
- Auto-logout on expiration
- Protected routes

### Secret Management

- List secrets (paginated, searchable)
- View secret details
- Create/edit/delete secrets
- Secret sharing with permissions
- Secret rotation
- Bulk operations

### Audit Logs

- View all actions
- Filter by action, user, date
- Export to CSV
- Real-time updates (optional)

### Admin Panel

- User management
- Role assignment
- Permission management
- Admin audit trail

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests (Future)

```bash
npm run test:e2e
```

## Deployment

### Docker

```bash
# Build image
docker build -t cloud-secrets-frontend .

# Run container
docker run -p 80:80 cloud-secrets-frontend
```

### Production Build

```bash
npm run build
```

Serve `dist/` with nginx, Apache, or any static file server.

## Security

- No secrets in localStorage
- HTTPS only in production
- Content Security Policy (CSP)
- CSRF protection
- XSS protection (React escapes by default)
- Auto-logout on inactivity (optional)

## Performance

- Code splitting by route
- Lazy loading components
- Image optimization
- TanStack Query caching
- Bundle size < 300KB gzipped

## Accessibility

- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus indicators
- High contrast
- Semantic HTML

## License

MIT

## Support

For issues or questions, contact the development team.
