# Accessibilité RGAA — Audit & actions documentées (Jamarket)

> Preuve pour le dossier de synthèse — **section 2.2** (compétence **C2.2.3**).  
> Date : 2026-07-18 — branche `feat/accessibilite`.  
> Référentiel retenu : **RGAA 4.1** (Référentiel Général d’Amélioration de l’Accessibilité).

---

## 1. Choix et justification du référentiel

| Option | Pourquoi retenu / écarté |
|--------|--------------------------|
| **RGAA 4.1** | Référentiel officiel français, aligné WCAG 2.1 AA, attendu en contexte académique / service numérique. Critères actionnables (HTML sémantique, navigation clavier, formulaires, contrastes, images). |
| WCAG seul | Base technique utile, mais moins « parlante » pour un jury FR que le RGAA. |
| Audit Axe / Lighthouse seul | Outils d’aide, pas un référentiel ; utilisés en complément, pas comme cadre. |

**Décision :** appliquer le RGAA en **échantillon ciblé** sur les parcours vitaux (accueil, catalogue, fiche annonce, auth, back-office), sans prétendre à une conformité 100 % (contrainte solo / RNCP).

---

## 2. Périmètre de l’audit (échantillon)

| Parcours | Pages / composants | Objectif |
|----------|-------------------|----------|
| Front public | Accueil, catalogue + filtres, fiche véhicule | Navigation, recherche, lecture d’annonce |
| Auth client | Login / inscription | Formulaires, erreurs |
| Back-office | Layout admin, login admin, listes | Landmarks, boutons icône, tableaux |

Méthode : revue manuelle du markup Angular (labels, `aria-*`, landmarks, focus) + contrôle des contrastes via la charte Tailwind / tokens thème Jamarket.

---

## 3. Actions déjà en place (constat positif)

| Thème RGAA (indicatif) | Preuve dans le code |
|------------------------|---------------------|
| Langue de la page | `lang="fr"` dans `jamarket-client/src/index.html` |
| Landmarks | `<main>`, `<nav aria-label="…">`, `<aside aria-label="…">`, `<header>` |
| Titres / sections | `aria-labelledby` (hero, catalogue, profil, specs fiche) |
| Formulaires | `<label for="…">` visibles ou `sr-only` (recherche header, filtres prix, tri) |
| Boutons icône | `aria-label` (menu mobile, profil, déconnexion, œil mot de passe admin) |
| États | `aria-expanded` / `aria-controls` (menu mobile, panneau filtres) |
| Images | `alt` descriptif sur images informatives ; `alt=""` + `aria-hidden` sur décoratives |
| Feedback erreurs | `role="alert"` / `aria-live` (login admin, formulaires) |
| Focus visible | `focus:ring-*` / `focus-visible:ring-*` sur liens et champs critiques |
| Icônes décoratives | `aria-hidden="true"` sur SVG Lucide |

---

## 4. Écarts identifiés & actions correctives

| Écart (critère RGAA approximatif) | Gravité | Action |
|-----------------------------------|---------|--------|
| Pas de lien d’évitement (« Passer au contenu ») | Moyenne | **Corrigé** : lien skip dans `app.html` + cible `#main-content` sur les `<main>` des parcours clés |
| Formulaires login front : erreurs non reliées via `aria-describedby` / `aria-invalid` (contrairement au login admin) | Faible | Planifié (voir §5) — non bloquant pour la démo |
| Boutons sociaux login (Google / Apple) non fonctionnels | Hors a11y | Hors scope accessibilité |
| Audit automatisé non industrialisé (Axe en CI) | Faible | Planifié (§5) |

### Correctif livré sur cette branche

- Lien « Passer au contenu » (visible au focus clavier).
- `id="main-content"` + `tabindex="-1"` sur les zones principales front et admin.

---

## 5. Limites assumées & plan d’amélioration

**Limites (transparentes pour le jury) :**

- Pas de déclaration de conformité RGAA complète (échantillon, pas audit exhaustif des ~100+ critères).
- Pas de tests utilisateurs avec technologies d’assistance (NVDA / VoiceOver) formalisés.
- Pas encore de gate CI axe-core / pa11y.

**Plan court (post-jury / itération) :**

1. Harmoniser `aria-invalid` + `aria-describedby` sur login / inscription front (aligné admin).
2. Vérifier contrastes AA sur variantes de boutons secondaires / états disabled.
3. Ajouter un check Axe ponctuel (script npm) sur 2–3 URLs de démo.
4. Documenter une déclaration d’accessibilité partielle sur une page `/accessibilite` si le produit est exposé publiquement.

---

## 6. Synthèse pour le dossier (section 2.2)

Jamarket intègre l’accessibilité dès la conception UI (spartan/ui + Tailwind, labels, ARIA, landmarks). Le **RGAA 4.1** est le cadre retenu. Un **audit échantillonné** a formalisé les actions déjà présentes, corrigé le lien d’évitement manquant, et listé les limites + suite. Cela valide l’exigence **C2.2.3** (logiciel développant avec un focus accessibilité), sans overkill de conformité totale.

| Livrable | Emplacement |
|----------|-------------|
| Ce rapport | `docs/accessibilite-rgaa.md` |
| Skip link | `jamarket-client/src/app/app.html` + `styles.css` |
| Cibles main | Pages front + `admin-layout` |

---

_Tâche Notion : `[Élim] Accessibilité RGAA — audit + actions documentées` — compétence **C2.2.3**._
