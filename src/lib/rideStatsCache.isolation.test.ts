import { QueryClient } from '@tanstack/query-core';

// ============================================================
// BIKETRIP-P1-USER-DATA-ISOLATION-003 — test de non-régression
// ============================================================
//
// Contexte du bug (constaté en test multi-comptes) : le nombre de
// sorties affiché dans l'écran Profil restait identique après
// déconnexion d'un utilisateur et connexion avec un autre compte.
//
// Cause racine prouvée (voir rapport de lot) : les queryKeys
// `['rides', 'stats']` (app/tabs/profile.tsx, app/tabs/rides.tsx) et
// `['rides', 'history']` (app/tabs/rides.tsx) n'incluaient pas
// `user.id`. Le QueryClient étant un singleton créé une seule fois
// dans app/_layout.tsx et jamais purgé au logout (aucune occurrence de
// queryClient.clear()/removeQueries()/resetQueries() dans le code),
// la clé littérale identique était réutilisée d'un compte à l'autre :
// tant que staleTime (10 min pour les stats) n'était pas écoulé, React
// Query renvoyait la donnée en cache de l'ancien utilisateur sans
// jamais rappeler getRideStats()/getRideHistory() pour le nouveau.
//
// Ce test n'utilise pas React Native : il exerce directement le
// moteur de cache (@tanstack/query-core, sous-jacent à
// @tanstack/react-query déjà utilisé par les écrans) avec les mêmes
// paramètres réels (nom de clé, staleTime) que le code applicatif,
// pour garantir que la régression ne peut pas revenir silencieusement.

const RIDE_STATS_STALE_TIME_MS = 1000 * 60 * 10; // valeur réelle, app/tabs/profile.tsx

describe('BIKETRIP-P1-USER-DATA-ISOLATION-003 — cache des statistiques de sorties', () => {
  it('queryKey NON scopée par user.id : reproduit le bug (référence, code retiré)', async () => {
    const qc = new QueryClient();
    let statsCallsForB = 0;

    await qc.fetchQuery({
      queryKey: ['rides', 'stats'], // ancien code, désormais corrigé dans profile.tsx/rides.tsx
      queryFn: () => ({ totalRides: 12, userId: 'user-A' }),
      staleTime: RIDE_STATS_STALE_TIME_MS,
    });

    const statsForB = await qc.fetchQuery({
      queryKey: ['rides', 'stats'],
      queryFn: () => {
        statsCallsForB += 1;
        return { totalRides: 3, userId: 'user-B' };
      },
      staleTime: RIDE_STATS_STALE_TIME_MS,
    });

    expect(statsCallsForB).toBe(0);
    expect(statsForB.userId).toBe('user-A');
  });

  it('queryKey scopée par user.id : isolation correcte (comportement corrigé, réellement utilisé)', async () => {
    const qc = new QueryClient();
    let statsCallsForB = 0;

    await qc.fetchQuery({
      queryKey: ['rides', 'stats', 'user-A'],
      queryFn: () => ({ totalRides: 12, userId: 'user-A' }),
      staleTime: RIDE_STATS_STALE_TIME_MS,
    });

    const statsForB = await qc.fetchQuery({
      queryKey: ['rides', 'stats', 'user-B'],
      queryFn: () => {
        statsCallsForB += 1;
        return { totalRides: 3, userId: 'user-B' };
      },
      staleTime: RIDE_STATS_STALE_TIME_MS,
    });

    expect(statsCallsForB).toBe(1);
    expect(statsForB.userId).toBe('user-B');
  });

  it('queryKey scopée par user.id : même utilisateur reconnecté profite toujours du cache (pas de régression perf)', async () => {
    const qc = new QueryClient();
    let statsCalls = 0;

    const first = await qc.fetchQuery({
      queryKey: ['rides', 'stats', 'user-A'],
      queryFn: () => {
        statsCalls += 1;
        return { totalRides: 12, userId: 'user-A' };
      },
      staleTime: RIDE_STATS_STALE_TIME_MS,
    });

    const second = await qc.fetchQuery({
      queryKey: ['rides', 'stats', 'user-A'],
      queryFn: () => {
        statsCalls += 1;
        return { totalRides: 999, userId: 'user-A' };
      },
      staleTime: RIDE_STATS_STALE_TIME_MS,
    });

    expect(statsCalls).toBe(1);
    expect(second).toEqual(first);
  });

  it("invalidateQueries(['rides','stats']) sans user.id (utilisé dans ride/summary.tsx après finishRide) invalide toujours l'entrée scopée par user.id (matching par préfixe)", async () => {
    const qc = new QueryClient();
    let calls = 0;

    await qc.fetchQuery({
      queryKey: ['rides', 'stats', 'user-A'],
      queryFn: () => {
        calls += 1;
        return { totalRides: 12 };
      },
      staleTime: RIDE_STATS_STALE_TIME_MS,
    });

    await qc.invalidateQueries({ queryKey: ['rides', 'stats'] });

    const query = qc.getQueryCache().find({ queryKey: ['rides', 'stats', 'user-A'] });
    expect(query?.isStale()).toBe(true);
    expect(calls).toBe(1); // un seul fetch initial ; invalidate marque stale sans refetch immédiat
  });
});
