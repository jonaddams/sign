import { boolean, inet, integer, jsonb, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './auth-schema'; // Assuming the previous auth schema is in this file

// Enum definitions
export const documentStatus = pgEnum('document_status', ['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DECLINED']);

export const signatureStatus = pgEnum('signature_status', ['PENDING', 'SIGNED', 'DECLINED']);

export const documentAccessLevel = pgEnum('document_access_level', ['VIEWER', 'EDITOR', 'SIGNER']);

export const signatureType = pgEnum('signature_type', ['ELECTRONIC', 'DIGITAL']);

// Document Templates Table
export const documentTemplates = pgTable('document_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),

  creatorId: text('creator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  templateFilePath: text('template_file_path').notNull(),
  templateFileHash: text('template_file_hash'),
  size: integer('size'),
});

// Documents Table
export const documents = pgTable('documents', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),

  templateId: text('template_id').references(() => documentTemplates.id),

  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),

  documentFilePath: text('document_file_path').notNull(),
  documentFileHash: text('document_file_hash'),

  size: integer('size'),

  esignCompliant: boolean('esign_compliant').default(true),
});

// Document Participants Table
export const documentParticipants = pgTable(
  'document_participants',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    accessLevel: documentAccessLevel('access_level').notNull(),
    signingOrder: integer('signing_order').default(0),

    isRequired: boolean('is_required').default(true),
  },
  (table) => ({
    uniqDocUser: unique().on(table.documentId, table.userId),
  }),
);

// Signature Requests Table
export const signatureRequests = pgTable('signature_requests', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  participantId: text('participant_id')
    .notNull()
    .references(() => documentParticipants.id, { onDelete: 'cascade' }),

  signatureType: signatureType('signature_type').notNull().default('ELECTRONIC'),
  status: signatureStatus('status').default('PENDING'),

  requestedAt: timestamp('requested_at', { mode: 'date' }).defaultNow(),
  signedAt: timestamp('signed_at', { mode: 'date' }),

  digitalSignatureHash: text('digital_signature_hash'),
  signatureCertificatePath: text('signature_certificate_path'),
});

// Document Annotations Table
export const documentAnnotations = pgTable('document_annotations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  creatorId: text('creator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  annotationData: jsonb('annotation_data').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),

  isFinalized: boolean('is_finalized').default(false),
});

// Audit Log Table
export const documentAuditLog = pgTable('document_audit_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id),

  action: text('action').notNull(),
  details: jsonb('details'),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
});

// Notification Tracking Table
export const documentNotifications = pgTable('document_notifications', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  recipientEmail: text('recipient_email').notNull(),

  notificationType: text('notification_type'),
  sentAt: timestamp('sent_at', { mode: 'date' }).defaultNow(),

  isDelivered: boolean('is_delivered').default(false),
  deliveredAt: timestamp('delivered_at', { mode: 'date' }),
});
