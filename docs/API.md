# Boat Academy - API Reference

## Vue d'ensemble

L'API est exposee via Supabase Edge Functions (Option A).
Les apps frontend utilisent `@boatacademy/api-client` pour appeler l'API.

## Edge Functions

### checkout-create-session

Cree une session Stripe Checkout.

**Endpoint**: `POST /functions/v1/checkout-create-session`

**Auth**: Bearer token (JWT Supabase)

**Body**:
```json
{
  "product_id": "uuid"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

---

### stripe-webhook

Recoit les webhooks Stripe (paiement complete, etc.)

**Endpoint**: `POST /functions/v1/stripe-webhook`

**Auth**: Signature Stripe (header `stripe-signature`)

**Events traites**:
- `checkout.session.completed` : Marque commande payee, cree entitlement

---

### sessions-assign-student

Inscrit un stagiaire a une session.

**Endpoint**: `POST /functions/v1/sessions-assign-student`

**Auth**: Bearer token (role admin/manager)

**Body**:
```json
{
  "session_id": "uuid",
  "student_user_id": "uuid"
}
```

**Validations**:
- Verification role admin/manager
- Verification acces au site
- OEDIPP requis pour sessions pratiques
- Verification capacite session

**Response**:
```json
{
  "ok": true
}
```

---

### documents-validate

Valide ou rejette un document stagiaire.

**Endpoint**: `POST /functions/v1/documents-validate`

**Auth**: Bearer token (role admin/manager)

**Body**:
```json
{
  "student_document_id": "uuid",
  "status": "approved" | "rejected",
  "rejected_reason": "string (optional)"
}
```

**Response**:
```json
{
  "ok": true
}
```

---

### messages-send

Envoie un message dans une conversation.

**Endpoint**: `POST /functions/v1/messages-send`

**Auth**: Bearer token

**Body**:
```json
{
  "conversation_id": "uuid",
  "body": "string"
}
```

**Side effects**:
- Cree notifications in-app pour les destinataires
- (Futur) Declenche push notification

**Response**:
```json
{
  "ok": true,
  "message": {
    "id": "uuid",
    "created_at": "timestamp"
  }
}
```

---

### push-register-token

Enregistre un token push (Expo) pour un utilisateur.

**Endpoint**: `POST /functions/v1/push-register-token`

**Auth**: Bearer token

**Body**:
```json
{
  "platform": "ios" | "android",
  "expo_push_token": "ExponentPushToken[...]"
}
```

**Response**:
```json
{
  "ok": true
}
```

---

### push-send

Envoie une push notification a un utilisateur.

**Endpoint**: `POST /functions/v1/push-send`

**Auth**: Service role (internal)

**Body**:
```json
{
  "user_id": "uuid",
  "title": "string",
  "body": "string",
  "data": {}
}
```

**Response**:
```json
{
  "ok": true,
  "result": { ... }
}
```

---

## API Client Usage

```typescript
import { createApiClient } from '@boatacademy/api-client';
import { supabase } from './lib/supabase';

const api = createApiClient(supabase);

// Checkout
const { url } = await api.checkout.createSession(productId);

// Sessions
await api.sessions.assignStudent(sessionId, studentUserId);

// Documents
await api.documents.validate(docId, 'approved');
await api.documents.validate(docId, 'rejected', 'Photo floue');

// Messages
await api.messages.send(conversationId, 'Bonjour !');
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Token invalide ou manquant |
| `FORBIDDEN` | Role insuffisant |
| `FORBIDDEN_SITE` | Pas d'acces au site |
| `PRODUCT_NOT_FOUND` | Produit inexistant |
| `SESSION_NOT_FOUND` | Session inexistante |
| `SESSION_FULL` | Session complete |
| `OEDIPP_REQUIRED` | Numero OEDIPP requis pour pratique |
| `DOC_NOT_FOUND` | Document inexistant |
| `CONVO_NOT_FOUND` | Conversation inexistante |
