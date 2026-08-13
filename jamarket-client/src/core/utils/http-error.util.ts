import { HttpErrorResponse } from '@angular/common/http';

/** Contexte d’affichage pour choisir un message utilisateur adapté. */
export type FormErrorContext = 'login' | 'register' | 'profile-update' | 'ad-form' | 'generic';

const USER_MESSAGES: Record<FormErrorContext, string> = {
  login: "L'email ou le mot de passe est incorrect.",
  register:
    'Impossible de créer le compte. Vérifiez vos informations et réessayez.',
  'profile-update':
    'Impossible d’enregistrer vos modifications. Réessayez dans un instant.',
  'ad-form':
    'Impossible d’enregistrer l’annonce. Vérifiez les champs et réessayez.',
  generic: 'Une erreur est survenue. Réessayez dans un instant.',
};

const NETWORK_MESSAGES: Record<FormErrorContext, string> = {
  login: 'Connexion impossible pour le moment. Réessayez plus tard.',
  register: 'Inscription impossible pour le moment. Réessayez plus tard.',
  'profile-update':
    'Enregistrement impossible pour le moment. Réessayez plus tard.',
  'ad-form':
    'Enregistrement impossible pour le moment. Réessayez plus tard.',
  generic: 'Service indisponible pour le moment. Réessayez plus tard.',
};

const TECHNICAL_MESSAGE_PATTERNS = [
  'failed to fetch',
  'http failure',
  'unknown error',
  'networkerror',
  'network error',
  'timeout',
  'err_connection',
  'typeerror',
  'progress',
  'load failed',
];

function isTechnicalMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) =>
    normalized.includes(pattern),
  );
}

function extractApiMessage(error: HttpErrorResponse): string | undefined {
  const body = error.error;
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const message = (body as { message?: string | string[] }).message;
  if (Array.isArray(message)) {
    return message.find((item) => typeof item === 'string' && item.trim())
      ?.trim();
  }

  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  return undefined;
}

function extractErrorMessage(error: unknown): string | undefined {
  if (error instanceof HttpErrorResponse) {
    const apiMessage = extractApiMessage(error);
    if (apiMessage) {
      return apiMessage;
    }
    if (error.message?.trim()) {
      return error.message.trim();
    }
    return undefined;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return undefined;
}

/**
 * Retourne un message simple en français pour l’utilisateur.
 * L’erreur technique complète est journalisée dans la console.
 */
export function resolveUserFacingError(
  error: unknown,
  context: FormErrorContext,
  logLabel?: string,
): string {
  console.error(logLabel ?? `[${context}]`, error);

  if (error instanceof HttpErrorResponse && error.status === 0) {
    return NETWORK_MESSAGES[context];
  }

  const rawMessage = extractErrorMessage(error);

  if (rawMessage && !isTechnicalMessage(rawMessage)) {
    if (context === 'login' && error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return USER_MESSAGES.login;
      }
    }
    return rawMessage;
  }

  if (context === 'login') {
    return USER_MESSAGES.login;
  }

  return USER_MESSAGES[context];
}

/** Journalise une erreur sans message utilisateur (chargement de données, etc.). */
export function logHttpError(error: unknown, logLabel: string): void {
  console.error(logLabel, error);
}
