// Import all your schemas
export * from "./auth-schema";
export * from "./document-signing-schema";

// You can also explicitly export tables if needed
export { 
  users, 
  accounts, 
  sessions, 
  verificationTokens, 
  authenticators 
} from "./auth-schema";

export { 
  documentTemplates, 
  documents, 
  // ... other document-related tables 
} from "./document-signing-schema";