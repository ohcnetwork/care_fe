# File Structure and Organization

## Directory Structure
```
cypress/
├── docs/
│   ├── README.md
│   ├── file-structure.md
│   ├── patterns.md
│   └── best-practices.md
├── e2e/                    # Test files grouped by modules
│   ├── patient/           
│   ├── facility/          
│   └── user/             
├── fixtures/              
├── pageObject/           
└── support/              
```

## Module Organization
Each module (patient, facility, user, etc.) should have:
- Test files in `e2e/<module-name>/`
- Page Object in `pageObject/<module-name>/`
- Fixtures in `fixtures/<module-name>/`

## File Naming Conventions
- Test files: `feature-name.cy.ts`
- Page Object: `FeatureNamePage.ts`
- Custom Commands: `feature-name.ts`
- Fixtures: `feature-name-data.json`

## Support Files
- `commands.ts`: Custom Cypress commands
- `e2e.ts`: e2e configurations
- `index.ts`: Main support file

## Storage Management
- Use cy.saveLocalStorage() and cy.restoreLocalStorage()
- Manage test data cleanup 