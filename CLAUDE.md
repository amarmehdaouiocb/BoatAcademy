# Instructions pour Claude Code - Boat Academy

## Principe fondamental : Qualité et pérennité

**TOUJOURS privilégier la solution la plus propre, recommandée et pérenne ("best practice").**

Ne JAMAIS aller à la solution de facilité qui masque un problème sans le résoudre. Exemples :
- `skipLibCheck: true` pour masquer des erreurs de compatibilité de packages
- `as any` pour contourner des problèmes de types
- Désactiver des règles ESLint pour éviter de corriger le code
- Workarounds temporaires qui deviennent permanents

À la place, toujours :
1. Identifier la cause racine du problème
2. Chercher la solution recommandée par les mainteneurs (docs officielles, GitHub issues)
3. Appliquer le fix propre même si cela prend plus de temps
4. Documenter pourquoi cette approche a été choisie si ce n'est pas évident

## Stack technique

- **Monorepo** : pnpm workspaces + Turborepo
- **Frontend admin** : Next.js 15 (App Router) + Tailwind CSS
- **Mobile** : Expo (React Native)
- **Backend** : Supabase (Postgres + RLS + Edge Functions)
- **Types** : Toujours utiliser les types générés par Supabase CLI

## Commandes utiles

```powershell
# Vérifier les types
pnpm -C apps/admin-web exec tsc --noEmit

# Régénérer les types Supabase
supabase gen types typescript --local > apps/admin-web/src/lib/supabase/database.types.ts

# Lister les versions des packages
pnpm -C apps/admin-web list @supabase/ssr @supabase/supabase-js
```

## Conventions

- Toujours typer explicitement les requêtes Supabase avec les types générés
- Utiliser le fichier local `database.types.ts` dans chaque app (pas d'import cross-package pour les types DB)
- Les types helper sont dans `src/lib/supabase/types.ts`
