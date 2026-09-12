import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gamesApi } from "../api/games.api";
import { useAuth } from "./use-auth";
import type { GameSessionCreate, GameSession } from "../types/api";

export function useGames(customPatientId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const patientId = customPatientId || user?.id;

  const gameTypesQuery = useQuery({
    queryKey: ["games", "types"],
    queryFn: () => gamesApi.getGameTypes(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const summaryQuery = useQuery({
    queryKey: ["games", "summary", patientId],
    queryFn: () => (patientId ? gamesApi.getGameSummary(patientId) : Promise.resolve(null)),
    enabled: !!patientId,
  });

  const sessionsQuery = useQuery({
    queryKey: ["games", "sessions", patientId],
    queryFn: () => (patientId ? gamesApi.getPatientGameSessions(patientId) : Promise.resolve([])),
    enabled: !!patientId,
  });

  const submitSessionMutation = useMutation({
    mutationFn: (data: GameSessionCreate) =>
      gamesApi.submitGameSession({
        ...data,
        patient_id: data.patient_id || patientId || "p1",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games", "summary", patientId] });
      queryClient.invalidateQueries({ queryKey: ["games", "sessions", patientId] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  return {
    gameTypes: gameTypesQuery.data || [],
    summary: summaryQuery.data,
    sessions: sessionsQuery.data || [],
    isLoading: gameTypesQuery.isLoading || summaryQuery.isLoading,
    isSubmitting: submitSessionMutation.isPending,
    submitSession: submitSessionMutation.mutateAsync,
    refetch: () => {
      summaryQuery.refetch();
      sessionsQuery.refetch();
    },
  };
}
